# core/views.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum, Avg, F, ExpressionWrapper, DurationField, Min
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
import random
from django.db import transaction
from django.db.models import Case, When, FloatField, Max, Prefetch
from .serializers import QuizAttemptSerializer, QuizSerializer, QuestionSerializer, LeaderboardSerializer, PracticeSessionSerializer, DiscussionSerializer, DiscussionCreateSerializer, BattleSerializer, CreateBattleSerializer, JoinBattleSerializer
from .models import *
import json



from .models import *
from .serializers import *

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        """Override to include counts in list view"""
        queryset = Category.objects.all()
        
        # Add counts for all list views
        if self.action == 'retrieve':
            queryset = queryset.annotate(
                # Count distinct active subjects
                subject_count=Count('subjects', 
                                filter=Q(subjects__is_active=True),
                                distinct=True),
                # Count distinct active questions through subjects
                question_count=Count('subjects__questions', 
                                filter=Q(subjects__questions__is_active=True),
                                distinct=True)
            )
        return queryset

    # NEW ENDPOINT: Get categories with detailed counts and subjects
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticatedOrReadOnly])
    def with_counts(self, request):
        """Get all categories with their total subjects and questions counts"""
        categories = Category.objects.all().annotate(
            subject_count=Count('subjects', filter=Q(subjects__is_active=True), distinct=True),
            question_count=Count('subjects__questions', filter=Q(subjects__questions__is_active=True), distinct=True)
        ).order_by('name')
        
        # Format response data
        categories_data = []
        for category in categories:
            category_data = {
                'id': category.id,
                'name': category.name,
                'description': category.description,
                'icon': category.icon,
                'color': category.color,
                'created_at': category.created_at,
                'subject_count': category.subject_count,
                'question_count': category.question_count,
                'subjects': []
            }
            
            # Get subjects for this category with their question counts
            subjects = category.subjects.filter(is_active=True).annotate(
                question_count=Count('questions', filter=Q(questions__is_active=True))
            )
            
            for subject in subjects:
                subject_data = {
                    'id': subject.id,
                    'name': subject.name,
                    'description': subject.description,
                    'priority': subject.priority,
                    'question_count': subject.question_count,
                    'difficulty_distribution': subject.difficulty_distribution
                }
                category_data['subjects'].append(subject_data)
            
            categories_data.append(category_data)
        return Response(categories_data)
    
    # NEW ENDPOINT: Get category statistics summary
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticatedOrReadOnly])
    def statistics(self, request):
        """Get overall statistics for all categories"""
        categories = Category.objects.all().annotate(
            subject_count=Count('subjects', filter=Q(subjects__is_active=True), distinct=True),
            question_count=Count('subjects__questions', filter=Q(subjects__questions__is_active=True), distinct=True)
        )
        
        total_categories = categories.count()
        total_subjects = sum(cat.subject_count for cat in categories)
        total_questions = sum(cat.question_count for cat in categories)
        
        # Get categories with the most questions
        top_categories = categories.order_by('-question_count')[:5]
        
        statistics_data = {
            'total_categories': total_categories,
            'total_subjects': total_subjects,
            'total_questions': total_questions,
            'top_categories': [
                {
                    'id': cat.id,
                    'name': cat.name,
                    'subject_count': cat.subject_count,
                    'question_count': cat.question_count
                }
                for cat in top_categories
            ]
        }
        print("Returning statistics:", statistics_data)
        return Response(statistics_data)

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.filter(is_active=True)
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'priority', 'created_at']
    ordering = ['priority', 'name']

    def get_queryset(self):
        """Always include annotations since we want total_questions in list view"""
        queryset = Subject.objects.filter(is_active=True)
        
        category_id = self.request.query_params.get('category_id')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
            
        return queryset


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['subject', 'difficulty', 'question_type', 'is_active']
    search_fields = ['question_text']
    ordering_fields = ['created_at', 'updated_at', 'difficulty', 'marks']
    ordering = ['-created_at']  # Default ordering
    
    def get_queryset(self):
        user = self.request.user
        is_admin = user and user.is_authenticated and (user.user_type == 'admin' or user.is_staff)
        if is_admin:
            queryset = Question.objects.all().select_related('subject')
        else:
            queryset = Question.objects.filter(is_active=True).select_related('subject')
            
        subject_id = self.request.query_params.get('subject_id')
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        return queryset
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        # Add attempt context for user answers
        attempt_id = self.request.query_params.get('attempt_id')
        if attempt_id:
            try:
                context['attempt'] = QuizAttempt.objects.get(id=attempt_id)
            except QuizAttempt.DoesNotExist:
                pass
        return context

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def explain(self, request, pk=None):
        """Generate/get AI-powered explanation for a question using Gemini"""
        question = self.get_object()
        
        force_regenerate = request.data.get('force', False)
        if question.explanation and not force_regenerate:
            return Response({
                'explanation': question.explanation,
                'cached': True
            })
            
        # Get options list and correct option
        options = question.options.all().order_by('order')
        options_list = [f"{chr(65+i)}. {opt.option_text}" for i, opt in enumerate(options)]
        
        correct_option_text = ""
        for i, opt in enumerate(options):
            if opt.is_correct:
                correct_option_text = f"{chr(65+i)}. {opt.option_text}"
                break
                
        # Call Gemini to generate explanation
        from .gemini import generate_ai_explanation
        explanation = generate_ai_explanation(
            question.question_text,
            options_list,
            correct_option_text
        )
        
        if explanation:
            question.explanation = explanation
            question.save()
            return Response({
                'explanation': explanation,
                'cached': False
            })
        else:
            return Response(
                {'error': 'Failed to generate explanation using Gemini API'},
                status=status.HTTP_502_BAD_GATEWAY
            )

class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_published']
    search_fields = ['title', 'description']
    ordering_fields = ['title', 'created_at', 'total_marks', 'time_limit']
    ordering = ['-created_at']  # Default ordering
    
    def get_queryset(self):
        user = self.request.user
        is_admin = user and user.is_authenticated and (user.user_type == 'admin' or user.is_staff)
        if is_admin:
            return Quiz.objects.all().prefetch_related('subjects')
        return Quiz.objects.filter(is_published=True).prefetch_related('subjects')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    # NEW ENDPOINT: Get available quizzes
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def available(self, request):
        """Get all available quizzes that user can attempt"""
        # Get all published quizzes
        available_quizzes = Quiz.objects.filter(is_published=True)
        
        # Get user's completed quiz attempts
        user_attempts = QuizAttempt.objects.filter(
            user=request.user,
            is_completed=True
        ).values_list('quiz_id', flat=True)
        
        # Add attempted flag to each quiz
        quizzes_data = []
        for quiz in available_quizzes:
            quiz_data = QuizSerializer(quiz, context={'request': request}).data
            quiz_data['attempted'] = quiz.id in user_attempts
            quizzes_data.append(quiz_data)
        
        return Response(quizzes_data)
    
    # NEW ENDPOINT: Start a quiz attempt
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def start(self, request):
        """Start a new quiz attempt"""
        quiz_id = request.data.get('quiz')
        
        if not quiz_id:
            return Response(
                {'error': 'Quiz ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            quiz = Quiz.objects.get(id=quiz_id, is_published=True)
        except Quiz.DoesNotExist:
            return Response(
                {'error': 'Quiz not found or not published'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check for existing incomplete attempt
        existing_attempt = QuizAttempt.objects.filter(
            user=request.user,
            quiz=quiz,
            is_completed=False
        ).first()
        
        if existing_attempt:
            serializer = QuizAttemptSerializer(existing_attempt)
            return Response({
                'quiz_attempt_id': existing_attempt.id,
                'message': 'Resuming existing attempt'
            })
        
        # Create new attempt
        attempt = QuizAttempt.objects.create(
            user=request.user,
            quiz=quiz
        )
        
        return Response({
            'quiz_attempt_id': attempt.id,
            'message': 'Quiz attempt started successfully'
        }, status=status.HTTP_201_CREATED)
    
    # EXISTING METHOD (keep this as well)
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def start_attempt(self, request, pk=None):
        quiz = self.get_object()
        
        # Check for existing incomplete attempt
        existing_attempt = QuizAttempt.objects.filter(
            user=request.user,
            quiz=quiz,
            is_completed=False
        ).first()
        
        if existing_attempt:
            serializer = QuizAttemptSerializer(existing_attempt)
            return Response(serializer.data)
        
        # Create new attempt
        attempt = QuizAttempt.objects.create(
            user=request.user,
            quiz=quiz
        )
        
        serializer = QuizAttemptSerializer(attempt)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def questions(self, request, pk=None):
        quiz = self.get_object()
        questions = quiz.questions.all()
        
        # Shuffle questions for random order
        question_list = list(questions)
        random.shuffle(question_list)
        
        serializer = QuestionSerializer(
            question_list, 
            many=True,
            context=self.get_serializer_context()
        )
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticatedOrReadOnly])
    def featured(self, request):
        """Get featured quizzes"""
        featured_quizzes = Quiz.objects.filter(
            is_published=True
        ).order_by('-created_at')[:6]  # Latest 6 quizzes
        
        serializer = self.get_serializer(featured_quizzes, many=True)
        return Response(serializer.data)


import logging

logger = logging.getLogger(__name__)

class QuizAttemptViewSet(viewsets.ModelViewSet):
    """
    Quiz Attempt ViewSet with comprehensive functionality
    Best Practices Implementation:
    - Secure object-level permissions
    - Optimized database queries
    - Comprehensive error handling
    - Multiple access patterns for frontend flexibility
    """
    serializer_class = QuizAttemptSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['started_at', 'completed_at', 'score']
    ordering = ['-started_at']
    filterset_fields = ['quiz', 'is_completed']
    
    def get_queryset(self):
        """
        Return only user's own attempts with optimized queries
        Uses select_related and prefetch_related for performance
        """
        return QuizAttempt.objects.filter(
            user=self.request.user
        ).select_related(
            'quiz'
        ).prefetch_related(
            Prefetch(
                'user_answers',
                queryset=UserAnswer.objects.select_related('question')
                .prefetch_related('selected_options')
            ),
            'quiz__subjects',
            'quiz__questions'
        )
    
    def get_object(self):
        """
        BEST PRACTICE: Secure object retrieval
        Users can only access their own attempts
        Overrides default get_object to ensure object-level permissions
        """
        # Get the filtered queryset
        queryset = self.filter_queryset(self.get_queryset())
        
        # Perform the lookup filtering
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        
        assert lookup_url_kwarg in self.kwargs, (
            'Expected view %s to be called with a URL keyword argument '
            'named "%s". Fix your URL conf, or set the `.lookup_field` '
            'attribute on the view correctly.' %
            (self.__class__.__name__, lookup_url_kwarg)
        )
        
        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        obj = get_object_or_404(queryset, **filter_kwargs)
        
        # Check object-level permission
        self.check_object_permissions(self.request, obj)
        
        return obj

    def list(self, request, *args, **kwargs):
        """
        List user's quiz attempts with pagination and filtering
        """
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error listing quiz attempts: {str(e)}")
            return Response(
                {'error': 'Unable to retrieve quiz attempts'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, *args, **kwargs):
        """
        Get specific quiz attempt with detailed information and performance stats
        Includes expand functionality for questions
        """
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            data = serializer.data
            
            # Calculate performance stats efficiently
            user_answers = instance.user_answers.all()
            total_answered = user_answers.count()
            correct_answers = user_answers.filter(is_correct=True).count()
            
            data['performance_stats'] = {
                'total_answered': total_answered,
                'correct_answers': correct_answers,
                'wrong_answers': total_answered - correct_answers,
                'accuracy': round(
                    (correct_answers / total_answered * 100) if total_answered > 0 else 0, 
                    2
                )
            }
            
            # Handle expand parameter for questions
            expand = request.query_params.get('expand', '')
            if 'questions' in expand:
                questions = instance.quiz.questions.filter(is_active=True)
                data['questions'] = QuestionSerializer(questions, many=True).data
            
            return Response(data)
            
        except Exception as e:
            logger.error(f"Error retrieving quiz attempt {kwargs.get('pk')}: {str(e)}")
            return Response(
                {'error': 'Unable to retrieve quiz attempt'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request, *args, **kwargs):
        """
        Create a new quiz attempt
        Automatically sets the user to the current user
        """
        try:
            # Add user to request data
            request.data['user'] = request.user.id
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error creating quiz attempt: {str(e)}")
            return Response(
                {'error': 'Unable to create quiz attempt'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        """
        Update quiz attempt - only allowed for incomplete attempts
        """
        try:
            instance = self.get_object()
            if instance.is_completed:
                return Response(
                    {'error': 'Cannot update completed attempt'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return super().update(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error updating quiz attempt: {str(e)}")
            return Response(
                {'error': 'Unable to update quiz attempt'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        """
        Delete quiz attempt - only allowed for incomplete attempts
        """
        try:
            instance = self.get_object()
            if instance.is_completed:
                return Response(
                    {'error': 'Cannot delete completed attempt'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error deleting quiz attempt: {str(e)}")
            return Response(
                {'error': 'Unable to delete quiz attempt'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # 🎯 CUSTOM ACTIONS - BEST PRACTICE ENDPOINTS

    @action(detail=False, methods=['get'])
    def by_quiz(self, request):
        """
        Get user's attempt for a specific quiz
        Usage: GET /api/attempts/by_quiz/?quiz_id=1
        Returns the latest completed attempt for the specified quiz
        """
        quiz_id = request.query_params.get('quiz_id')
        
        if not quiz_id:
            return Response(
                {'error': 'quiz_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get the latest completed attempt for this quiz
            attempt = self.get_queryset().filter(
                quiz_id=quiz_id, 
                is_completed=True
            ).order_by('-completed_at').first()
            
            if not attempt:
                return Response(
                    {
                        'error': 'No completed attempt found for this quiz',
                        'quiz_id': quiz_id,
                        'has_attempts': self.get_queryset().filter(quiz_id=quiz_id).exists()
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
            
            serializer = self.get_serializer(attempt)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error in by_quiz endpoint: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """
        Get latest completed attempts for all quizzes
        Usage: GET /api/attempts/latest/
        Returns the most recent completed attempt for each quiz
        """
        try:
            # Get unique quiz IDs that user has attempted
            quiz_ids = self.get_queryset().filter(
                is_completed=True
            ).values_list('quiz_id', flat=True).distinct()
            
            latest_attempts = []
            for quiz_id in quiz_ids:
                attempt = self.get_queryset().filter(
                    quiz_id=quiz_id,
                    is_completed=True
                ).order_by('-completed_at').first()
                
                if attempt:
                    latest_attempts.append(attempt)
            
            # Order by completion date (most recent first)
            latest_attempts.sort(key=lambda x: x.completed_at or x.started_at, reverse=True)
            
            serializer = self.get_serializer(latest_attempts, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error in latest endpoint: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get comprehensive attempt statistics for the user
        Usage: GET /api/attempts/statistics/
        """
        try:
            attempts = self.get_queryset()
            completed_attempts = attempts.filter(is_completed=True)
            
            # Basic statistics
            total_attempts = attempts.count()
            completed_count = completed_attempts.count()
            total_quizzes_attempted = attempts.values('quiz').distinct().count()
            
            # Score statistics
            score_stats = completed_attempts.aggregate(
                avg_score=Avg('score'),
                max_score=Max('score'),
                min_score=Min('score'),
                total_score=Sum('score')
            )
            
            # Time statistics
            time_stats = completed_attempts.aggregate(
                avg_time_taken=Avg('time_taken'),
                total_time_taken=Sum('time_taken')
            )
            
            # Recent activity (last 5 completed attempts)
            recent_activity = completed_attempts.order_by('-completed_at')[:5]
            
            # Quiz-specific statistics
            quiz_stats = []
            for quiz_id in attempts.values_list('quiz_id', flat=True).distinct():
                quiz_attempts = attempts.filter(quiz_id=quiz_id, is_completed=True)
                if quiz_attempts.exists():
                    quiz_data = quiz_attempts.aggregate(
                        attempts_count=Count('id'),
                        avg_score=Avg('score'),
                        best_score=Max('score')
                    )
                    quiz_stats.append({
                        'quiz_id': quiz_id,
                        'quiz_title': quiz_attempts.first().quiz.title,
                        **quiz_data
                    })
            
            return Response({
                'overview': {
                    'total_attempts': total_attempts,
                    'completed_attempts': completed_count,
                    'total_quizzes_attempted': total_quizzes_attempted,
                    'completion_rate': round(
                        (completed_count / total_attempts * 100) if total_attempts > 0 else 0, 
                        2
                    )
                },
                'scores': {
                    'average_score': float(score_stats['avg_score'] or 0),
                    'highest_score': float(score_stats['max_score'] or 0),
                    'lowest_score': float(score_stats['min_score'] or 0),
                    'total_score': float(score_stats['total_score'] or 0)
                },
                'time': {
                    'average_time_taken': time_stats['avg_time_taken'] or 0,
                    'total_time_taken': time_stats['total_time_taken'] or 0
                },
                'quiz_performance': quiz_stats,
                'recent_activity': QuizAttemptSerializer(recent_activity, many=True).data
            })
            
        except Exception as e:
            logger.error(f"Error in statistics endpoint: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def attempts(self, request):
        """
        Get user's completed quiz attempts with quiz details
        Usage: GET /api/attempts/attempts/
        Legacy endpoint for backward compatibility
        """
        try:
            attempts = self.get_queryset().filter(is_completed=True)
            
            # Apply ordering if specified
            ordering = request.query_params.get('ordering', '-completed_at')
            if ordering.lstrip('-') in self.ordering_fields:
                attempts = attempts.order_by(ordering)
            
            # Use serializer for consistent data format
            serializer = self.get_serializer(attempts, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error in attempts endpoint: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def submit_answer(self, request, pk=None):
        """
        Submit an answer for a question in the quiz attempt
        Usage: POST /api/attempts/{id}/submit_answer/
        """
        attempt = self.get_object()
        
        if attempt.is_completed:
            return Response(
                {'error': 'Cannot submit answers to a completed attempt'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        question_id = request.data.get('question_id')
        selected_option_ids = request.data.get('selected_options', [])
        
        if not question_id:
            return Response(
                {'error': 'question_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                question = Question.objects.get(id=question_id, is_active=True)
                selected_options = Option.objects.filter(
                    id__in=selected_option_ids, 
                    question=question
                )
                
                # Calculate if answer is correct
                correct_options = question.options.filter(is_correct=True)
                is_correct = set(selected_options) == set(correct_options)
                
                # Calculate marks
                marks_obtained = 0
                if is_correct:
                    marks_obtained = question.marks
                elif attempt.quiz.negative_marking:
                    marks_obtained = -float(question.negative_marks)
                
                # Save user answer
                user_answer, created = UserAnswer.objects.get_or_create(
                    attempt=attempt,
                    question=question
                )
                user_answer.selected_options.set(selected_options)
                user_answer.is_correct = is_correct
                user_answer.marks_obtained = marks_obtained
                user_answer.save()
                
                # Update user progress
                self.update_user_progress(request.user, question.subject, is_correct)
                
                return Response({
                    'is_correct': is_correct,
                    'marks_obtained': marks_obtained,
                    'correct_options': list(correct_options.values_list('id', flat=True)),
                    'explanation': question.explanation,
                    'user_answer_id': user_answer.id
                })
                
        except Question.DoesNotExist:
            return Response(
                {'error': 'Question not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error submitting answer: {str(e)}")
            return Response(
                {'error': 'Failed to submit answer'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def complete_attempt(self, request, pk=None):
        """
        Mark quiz attempt as completed and calculate final score
        Usage: POST /api/attempts/{id}/complete_attempt/
        """
        attempt = self.get_object()
        
        if attempt.is_completed:
            return Response(
                {'error': 'Attempt already completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Calculate total score efficiently
                total_marks = attempt.user_answers.aggregate(
                    total_marks=Sum('marks_obtained')
                )['total_marks'] or 0
                
                time_taken = (timezone.now() - attempt.started_at).total_seconds()
                
                attempt.score = total_marks
                attempt.total_marks = attempt.quiz.total_marks
                attempt.time_taken = time_taken
                attempt.completed_at = timezone.now()
                attempt.is_completed = True
                attempt.save()
                
                # Update user stats
                self.update_user_stats(request.user)
                
                # Return the completed attempt
                serializer = self.get_serializer(attempt)
                return Response({
                    'message': 'Quiz attempt completed successfully',
                    'attempt': serializer.data,
                    'summary': {
                        'score': float(total_marks),
                        'total_marks': attempt.quiz.total_marks,
                        'time_taken': time_taken,
                        'accuracy': self.calculate_attempt_accuracy(attempt)
                    }
                })
                
        except Exception as e:
            logger.error(f"Error completing attempt: {str(e)}")
            return Response(
                {'error': 'Failed to complete attempt'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """
        Get recent quiz attempts (last 5 completed)
        Usage: GET /api/attempts/recent/
        """
        try:
            recent_attempts = self.get_queryset().filter(
                is_completed=True
            ).order_by('-completed_at')[:5]
            
            serializer = self.get_serializer(recent_attempts, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error in recent endpoint: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """
        Get questions for a specific quiz attempt with user answers
        Usage: GET /api/attempts/{id}/questions/
        """
        try:
            attempt = self.get_object()
            
            # Prefetch user answers for efficiency
            user_answers = {
                ua.question_id: ua 
                for ua in attempt.user_answers.select_related('question')
                .prefetch_related('selected_options')
            }
            
            questions = attempt.quiz.questions.filter(is_active=True)
            questions_data = []
            
            for question in questions:
                question_data = QuestionSerializer(question).data
                user_answer = user_answers.get(question.id)
                
                question_data['user_answer'] = {
                    'selected_options': list(user_answer.selected_options.values_list('id', flat=True)) if user_answer else [],
                    'is_correct': user_answer.is_correct if user_answer else None,
                    'marks_obtained': float(user_answer.marks_obtained) if user_answer else 0,
                    'answered_at': user_answer.answered_at if user_answer else None
                } if user_answer else None
                
                questions_data.append(question_data)
            
            return Response({
                'attempt_id': attempt.id,
                'quiz_title': attempt.quiz.title,
                'total_questions': questions.count(),
                'questions_answered': len(user_answers),
                'questions': questions_data
            })
            
        except QuizAttempt.DoesNotExist:
            return Response(
                {'error': 'Quiz attempt not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error in questions endpoint: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # 🎯 UTILITY METHODS

    def update_user_progress(self, user, subject, is_correct):
        """
        Update user progress for a subject
        """
        try:
            progress, created = UserProgress.objects.get_or_create(
                user=user,
                subject=subject
            )
            
            progress.total_questions = subject.questions.count()
            progress.attempted_questions += 1
            if is_correct:
                progress.correct_answers += 1
            
            if progress.attempted_questions > 0:
                progress.accuracy = round(
                    (progress.correct_answers / progress.attempted_questions) * 100, 
                    2
                )
            
            progress.last_attempt = timezone.now()
            progress.save()
            
        except Exception as e:
            logger.error(f"Error updating user progress: {str(e)}")

    def update_user_stats(self, user):
        """
        Update user statistics including streak
        """
        try:
            today = timezone.now().date()
            yesterday = today - timedelta(days=1)
            
            last_activity = user.last_active.date() if user.last_active else None
            
            if last_activity == today:
                return  # Already updated today
            
            if last_activity == yesterday:
                user.streak += 1
            else:
                user.streak = 1
            
            user.last_active = timezone.now()
            user.save()
            
        except Exception as e:
            logger.error(f"Error updating user stats: {str(e)}")

    def calculate_attempt_accuracy(self, attempt):
        """
        Calculate accuracy for a quiz attempt
        """
        user_answers = attempt.user_answers.all()
        total_answered = user_answers.count()
        correct_answers = user_answers.filter(is_correct=True).count()
        
        return round(
            (correct_answers / total_answered * 100) if total_answered > 0 else 0, 
            2
        )

    def get_serializer_context(self):
        """
        Add request context to serializer
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    
    
class DiscussionViewSet(viewsets.ModelViewSet):
    queryset = Discussion.objects.filter(parent__isnull=True, is_active=True)
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter, DjangoFilterBackend]
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    search_fields = ['title', 'comment', 'user__username']
    filterset_fields = ['user']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return DiscussionCreateSerializer
        return DiscussionSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        serializer.save()
    
    # LIKE functionality
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """Like a discussion"""
        discussion = self.get_object()
        user = request.user
        
        with transaction.atomic():
            # If user already liked, remove like
            if discussion.likes.filter(id=user.id).exists():
                discussion.likes.remove(user)
                liked = False
            else:
                # Remove dislike if exists
                if discussion.dislikes.filter(id=user.id).exists():
                    discussion.dislikes.remove(user)
                # Add like
                discussion.likes.add(user)
                liked = True
            
            discussion.save()
        
        return Response({
            'status': 'success',
            'liked': liked,
            'likes_count': discussion.likes_count,
            'dislikes_count': discussion.dislikes_count
        })
    
    # DISLIKE functionality
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def dislike(self, request, pk=None):
        """Dislike a discussion"""
        discussion = self.get_object()
        user = request.user
        
        with transaction.atomic():
            # If user already disliked, remove dislike
            if discussion.dislikes.filter(id=user.id).exists():
                discussion.dislikes.remove(user)
                disliked = False
            else:
                # Remove like if exists
                if discussion.likes.filter(id=user.id).exists():
                    discussion.likes.remove(user)
                # Add dislike
                discussion.dislikes.add(user)
                disliked = True
            
            discussion.save()
        
        return Response({
            'status': 'success',
            'disliked': disliked,
            'likes_count': discussion.likes_count,
            'dislikes_count': discussion.dislikes_count
        })
    
    # BOOKMARK functionality
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def bookmark(self, request, pk=None):
        """Bookmark a discussion"""
        discussion = self.get_object()
        user = request.user
        
        with transaction.atomic():
            # Toggle bookmark
            if discussion.bookmarks.filter(id=user.id).exists():
                discussion.bookmarks.remove(user)
                bookmarked = False
            else:
                discussion.bookmarks.add(user)
                bookmarked = True
            
            discussion.save()
        
        return Response({
            'status': 'success',
            'bookmarked': bookmarked,
            'bookmarks_count': discussion.bookmarks_count
        })
    
    # REPLY functionality - FIXED
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reply(self, request, pk=None):
        """Add a reply to a discussion"""
        parent_discussion = self.get_object()
        
        print("Received reply request:", request.data)
        
        serializer = DiscussionCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            # Create the reply without question
            reply = serializer.save(
                parent=parent_discussion,
                user=request.user,
            )
            
            # Return the created reply
            reply_serializer = DiscussionSerializer(
                reply, 
                context={'request': request}
            )
            return Response(reply_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Get user's bookmarked discussions - FIXED
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def bookmarks(self, request):
        """Get user's bookmarked discussions"""
        bookmarked_discussions = Discussion.objects.filter(
            bookmarks=request.user,
            is_active=True
        ).select_related('user').prefetch_related('replies')
        
        page = self.paginate_queryset(bookmarked_discussions)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(bookmarked_discussions, many=True)
        return Response(serializer.data)
    
    # Get user's liked discussions - FIXED
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def liked(self, request):
        """Get user's liked discussions"""
        liked_discussions = Discussion.objects.filter(
            likes=request.user,
            is_active=True
        ).select_related('user').prefetch_related('replies')
        
        page = self.paginate_queryset(liked_discussions)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(liked_discussions, many=True)
        return Response(serializer.data)
    
    # Get popular discussions (most liked)
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticatedOrReadOnly])
    def popular(self, request):
        """Get popular discussions (most liked)"""
        # Use annotation to calculate counts as actual database fields
        popular_discussions = Discussion.objects.filter(
            is_active=True,
            parent__isnull=True
        ).annotate(
            # Use Count instead of property
            calculated_likes_count=Count('likes'),
            calculated_replies_count=Count('replies'),
            calculated_engagement_score=Count('likes') + Count('replies')
        ).order_by('-calculated_engagement_score', '-created_at')
        
        # Paginate the queryset
        page = self.paginate_queryset(popular_discussions)
        if page is not None:
            # Serialize the data
            serializer = DiscussionSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        # If no pagination, return all
        serializer = DiscussionSerializer(popular_discussions, many=True, context={'request': request})
        return Response(serializer.data)

class LeaderboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        # Weekly leaderboard
        week_ago = timezone.now() - timedelta(days=7)
        
        leaderboard_data = User.objects.filter(
            quiz_attempts__completed_at__gte=week_ago,
            quiz_attempts__is_completed=True
        ).annotate(
            total_score=Sum('quiz_attempts__score'),
            total_attempts=Count('quiz_attempts'),
            average_accuracy=Avg('progress__accuracy')
        ).filter(total_score__isnull=False).order_by('-total_score')
        
        serializer = LeaderboardSerializer(leaderboard_data, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def monthly(self, request):
        """Monthly leaderboard"""
        month_ago = timezone.now() - timedelta(days=30)
        
        leaderboard_data = User.objects.filter(
            quiz_attempts__completed_at__gte=month_ago,
            quiz_attempts__is_completed=True
        ).annotate(
            total_score=Sum('quiz_attempts__score'),
            total_attempts=Count('quiz_attempts'),
            average_accuracy=Avg('progress__accuracy')
        ).filter(total_score__isnull=False).order_by('-total_score')
        
        serializer = LeaderboardSerializer(leaderboard_data, many=True)
        return Response(serializer.data)

class PracticeSessionViewSet(viewsets.ModelViewSet):
    serializer_class = PracticeSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = PracticeSession.objects.filter(
            user=self.request.user
        ).select_related('user').prefetch_related(
            'subjects',
            'session_questions__question'
        )
        
        is_completed = self.request.query_params.get('is_completed')
        if is_completed is not None:
            queryset = queryset.filter(is_completed=is_completed)
            
        session_type = self.request.query_params.get('session_type')
        if session_type:
            queryset = queryset.filter(session_type=session_type)
            
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticatedOrReadOnly])
    def subjects(self, request):
        """Get all subjects for practice session"""
        subjects = Subject.objects.filter(is_active=True).select_related('category')
        
        serializer = SubjectSerializer(subjects, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def create_session(self, request):
        """Create a new practice session and store it in database"""
        print("Received create_session request:", request.data)
        
        subject_ids = request.data.get('subjects', [])
        difficulty = request.data.get('difficulty', 'all')
        question_count = request.data.get('question_count', 20)
        
        try:
            with transaction.atomic():
                print("Creating practice session...")
                
                # Create practice session
                session = PracticeSession.objects.create(
                    user=request.user,
                    session_type='practice',
                    total_questions=question_count,
                    difficulty=difficulty
                )
                
                print(f"Created session: {session.id}")
                
                # Add subjects
                subjects = Subject.objects.filter(id__in=subject_ids, is_active=True)
                session.subjects.set(subjects)
                print(f"Added {subjects.count()} subjects")
                
                # Get questions
                questions = Question.objects.filter(
                    subject_id__in=subject_ids,
                    is_active=True
                )
                
                if difficulty != 'all':
                    questions = questions.filter(difficulty=difficulty)
                
                questions = list(questions.order_by('?')[:question_count])
                print(f"Found {len(questions)} questions")
                
                if not questions:
                    return Response(
                        {'error': 'No questions found for the selected criteria'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Create session questions
                for idx, question in enumerate(questions):
                    PracticeSessionQuestion.objects.create(
                        session=session,
                        question=question,
                        sequence_order=idx
                    )
                
                # Update total questions count
                session.total_questions = len(questions)
                session.save()
                
                serializer = PracticeSessionSerializer(session)
                print("Session created successfully, returning data", serializer.data)
                return Response(serializer.data)
                
        except Exception as e:
            print(f"Error creating session: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return Response(
                {'error': f'Session creation failed: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def submit_answer(self, request, pk=None):
        """Submit answer for a question in practice session"""
        try:
            session = PracticeSession.objects.get(id=pk, user=request.user)
            question_id = request.data.get('question_id')
            selected_option_id = request.data.get('selected_option')
            time_taken = request.data.get('time_taken')  # in seconds
            
            with transaction.atomic():
                # Get the session question
                session_question = PracticeSessionQuestion.objects.get(
                    session=session,
                    question_id=question_id
                )
                
                # Get selected option and check correctness
                selected_option = Option.objects.get(id=selected_option_id)
                is_correct = selected_option.is_correct
                
                # Update session question
                session_question.user_answer = selected_option
                session_question.is_correct = is_correct
                if time_taken:
                    session_question.time_taken = timedelta(seconds=time_taken)
                session_question.save()
                
                # Update session statistics
                session.completed_questions += 1
                if is_correct:
                    session.correct_answers += 1
                else:
                    session.wrong_answers += 1
                session.save()
                
                # Update user progress
                self.update_user_progress(request.user, session_question.question, is_correct, time_taken)
                
                # Update daily stats
                self.update_daily_stats(request.user, is_correct, time_taken)
                
                return Response({
                    'is_correct': is_correct,
                    'session_stats': {
                        'completed_questions': session.completed_questions,
                        'correct_answers': session.correct_answers,
                        'wrong_answers': session.wrong_answers
                    }
                })
                
        except Exception as e:
            return Response(
                {'error': f'Answer submission failed: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def complete_session(self, request, pk=None):
        """Mark practice session as completed"""
        try:
            session = PracticeSession.objects.get(id=pk, user=request.user)
            
            with transaction.atomic():
                # Calculate total time taken
                time_taken = request.data.get('total_time_taken', 0)  # in seconds
                if time_taken:
                    session.time_taken = timedelta(seconds=time_taken)
                
                # Mark as completed
                session.mark_completed()
                
                # Update achievements
                self.check_achievements(request.user, session)
                
                serializer = PracticeSessionSerializer(session)
                return Response(serializer.data)
                
        except Exception as e:
            return Response(
                {'error': f'Session completion failed: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def update_user_progress(self, user, question, is_correct, time_taken=None):
        """Update user progress for a subject"""
        progress, created = UserProgress.objects.get_or_create(
            user=user,
            subject=question.subject
        )
        
        # Update overall statistics
        progress.attempted_questions += 1
        if is_correct:
            progress.correct_answers += 1
        
        # Update difficulty-wise statistics
        if question.difficulty == 'easy':
            progress.easy_attempted += 1
            if is_correct:
                progress.easy_correct += 1
        elif question.difficulty == 'medium':
            progress.medium_attempted += 1
            if is_correct:
                progress.medium_correct += 1
        elif question.difficulty == 'hard':
            progress.hard_attempted += 1
            if is_correct:
                progress.hard_correct += 1
        
        # Calculate accuracy
        progress.calculate_accuracy()
        
        # Update average time
        if time_taken:
            total_time = progress.average_time_per_question * (progress.attempted_questions - 1)
            progress.average_time_per_question = (total_time + time_taken) / progress.attempted_questions
            progress.total_time_spent += timedelta(seconds=time_taken)
        
        # Update streak
        progress.update_streak()
        
        progress.save()
    
    def update_daily_stats(self, user, is_correct, time_taken=None):
        """Update daily statistics"""
        today = timezone.now().date()
        stats, created = DailyStats.objects.get_or_create(
            user=user,
            date=today
        )
        
        stats.questions_attempted += 1
        if is_correct:
            stats.correct_answers += 1
        
        if time_taken:
            stats.time_spent += timedelta(seconds=time_taken)
        
        # Check if daily goal is met (e.g., 20 questions)
        if stats.questions_attempted >= 20:
            stats.daily_goal_met = True
        
        stats.save()
    
    def check_achievements(self, user, session):
        """Check and unlock achievements"""
        # First session achievement
        if PracticeSession.objects.filter(user=user).count() == 1:
            Achievement.objects.get_or_create(
                user=user,
                achievement_type='practice',
                name='First Steps',
                description='Complete your first practice session',
                icon='first-steps',
                is_unlocked=True
            )
        
        # High accuracy achievement
        if session.score >= 90:
            Achievement.objects.get_or_create(
                user=user,
                achievement_type='accuracy',
                name='Accuracy Master',
                description='Achieve 90% or higher accuracy in a session',
                icon='accuracy-master',
                is_unlocked=True
            )
        
        # Consistency achievement (5 sessions in a week)
        week_ago = timezone.now() - timedelta(days=7)
        recent_sessions = PracticeSession.objects.filter(
            user=user,
            started_at__gte=week_ago,
            is_completed=True
        ).count()
        
        if recent_sessions >= 5:
            Achievement.objects.get_or_create(
                user=user,
                achievement_type='consistency',
                name='Dedicated Learner',
                description='Complete 5 practice sessions in a week',
                icon='dedicated-learner',
                is_unlocked=True
            )
    
    @action(detail=False, methods=['get'])
    def user_sessions(self, request):
        """Get user's practice sessions"""
        sessions = PracticeSession.objects.filter(user=request.user).order_by('-started_at')
        serializer = PracticeSessionSerializer(sessions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def session_detail(self, request):
        """Get detailed session information"""
        session_id = request.query_params.get('session_id')
        try:
            session = PracticeSession.objects.get(id=session_id, user=request.user)
            serializer = PracticeSessionSerializer(session)
            return Response(serializer.data)
        except PracticeSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

# Enhanced Analytics ViewSet
class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Comprehensive analytics dashboard"""
        user = request.user
        
        # Overall statistics
        total_sessions = PracticeSession.objects.filter(user=user).count()
        completed_sessions = PracticeSession.objects.filter(user=user, is_completed=True).count()
        total_questions_attempted = UserProgress.objects.filter(user=user).aggregate(
            total=Sum('attempted_questions')
        )['total'] or 0
        
        # Accuracy over time (last 30 days)
        weekly_accuracy = DailyStats.objects.filter(
            user=user,
            date__gte=timezone.now() - timedelta(days=30)
        ).values('date').annotate(
            accuracy=Case(
                When(questions_attempted=0, then=0.0),
                default=(F('correct_answers') * 100.0 / F('questions_attempted')),
                output_field=FloatField()
            )
        ).order_by('date')
        
        # Subject performance
        subject_performance = UserProgress.objects.filter(
            user=user
        ).select_related('subject', 'subject__category').values(
            'subject__name',
            'subject__category__name',
            'attempted_questions',
            'correct_answers',
            'accuracy',
            'current_streak'
        ).order_by('-accuracy')
        
        # Streak information
        current_streak = UserProgress.objects.filter(
            user=user
        ).aggregate(
            max_streak=Max('current_streak')
        )['max_streak'] or 0
        
        # Recent achievements
        recent_achievements = Achievement.objects.filter(
            user=user, 
            is_unlocked=True
        ).order_by('-unlocked_at')[:5]
        
        return Response({
            'overview': {
                'total_sessions': total_sessions,
                'completed_sessions': completed_sessions,
                'total_questions_attempted': total_questions_attempted,
                'current_streak': current_streak,
            },
            'weekly_accuracy': list(weekly_accuracy),
            'subject_performance': list(subject_performance),
            'recent_achievements': AchievementSerializer(recent_achievements, many=True).data,
            'daily_goal_met': self.check_daily_goal(user)
        })
    
    def check_daily_goal(self, user):
        """Check if user met today's goal"""
        today = timezone.now().date()
        try:
            stats = DailyStats.objects.get(user=user, date=today)
            return stats.daily_goal_met
        except DailyStats.DoesNotExist:
            return False
    
    @action(detail=False, methods=['get'])
    def progress_details(self, request):
        """Get detailed progress by subject"""
        progress = UserProgress.objects.filter(user=request.user).select_related('subject')
        serializer = UserProgressSerializer(progress, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def daily_activity(self, request):
        """Get daily activity for last 7 days"""
        week_ago = timezone.now() - timedelta(days=7)
        stats = DailyStats.objects.filter(
            user=request.user,
            date__gte=week_ago.date()
        ).order_by('date')
        serializer = DailyStatsSerializer(stats, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def user_answers_analysis(self, request):
        """Optimized analysis using indexed fields"""
        user = request.user
        
        # Use indexed fields for filtering
        practice_sessions = PracticeSession.objects.filter(
            user=user,
            is_completed=True
        ).select_related('user').prefetch_related(
            'session_questions__question__subject',
            'session_questions__question__options'
        ).only(
            'id', 'session_type', 'completed_at', 'score'
        )
        
        # This will use the indexes we created
        session_questions = PracticeSessionQuestion.objects.filter(
            session__user=user,
            session__is_completed=True
        ).select_related(
            'session', 'question', 'question__subject'
        ).only(
            'session_id', 'question_id', 'user_answer_id', 
            'is_correct', 'time_taken'
        )
        
        # Process data...
        return Response({
            'total_sessions': practice_sessions.count(),
            'total_questions_answered': session_questions.count(),
        })

class UserProgressViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserProgressSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['accuracy', 'attempted_questions', 'last_attempt']
    ordering = ['-accuracy']  # Default ordering
    
    def get_queryset(self):
        return UserProgress.objects.filter(user=self.request.user).select_related(
            'subject', 'subject__category'
        )


# core/views.py
class QuizSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateQuizSessionSerializer
        return QuizSessionSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = QuizSession.objects.all()
        
        # Users can see public sessions, sessions they created, or sessions they're participating in
        if self.action == 'list':
            queryset = queryset.filter(
                Q(is_public=True) | 
                Q(creator=user) | 
                Q(participants__user=user)
            ).distinct()
        
        return queryset.select_related('creator', 'quiz').prefetch_related('participants')
    
    def perform_create(self, serializer):
        quiz_session = serializer.save(creator=self.request.user)
        
        # Auto-join creator as participant
        QuizParticipant.objects.create(
            session=quiz_session,
            user=self.request.user,
            status='joined'
        )
    
    @action(detail=False, methods=['post'])
    def create_session(self, request):
        """Create a new quiz session"""
        serializer = CreateQuizSessionSerializer(data=request.data)
        if serializer.is_valid():
            quiz_session = serializer.save(creator=request.user)
            
            # Auto-join creator
            QuizParticipant.objects.create(
                session=quiz_session,
                user=request.user,
                status='joined'
            )
            
            return Response(
                QuizSessionSerializer(quiz_session, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def join(self, request):
        """Join a quiz session using session code"""
        serializer = JoinQuizSessionSerializer(data=request.data)
        if serializer.is_valid():
            session_code = serializer.validated_data['session_code']
            
            try:
                quiz_session = QuizSession.objects.get(
                    session_code=session_code,
                    status__in=['created', 'scheduled']
                )
                
                # Check if user can join
                if not quiz_session.can_join:
                    return Response(
                        {'error': 'Cannot join this session. It may be full or already started.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Check if already joined
                if QuizParticipant.objects.filter(session=quiz_session, user=request.user).exists():
                    return Response(
                        {'error': 'You have already joined this session'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Join the session
                participant = QuizParticipant.objects.create(
                    session=quiz_session,
                    user=request.user,
                    status='joined',
                    joined_at=timezone.now()
                )
                
                return Response({
                    'message': 'Successfully joined the quiz session',
                    'session_id': quiz_session.id,
                    'session_title': quiz_session.title
                })
                
            except QuizSession.DoesNotExist:
                return Response(
                    {'error': 'Invalid session code or session not available'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def invite(self, request, pk=None):
        """Invite users to quiz session via email"""
        quiz_session = self.get_object()
        
        # Check if user is the creator
        if quiz_session.creator != request.user:
            return Response(
                {'error': 'Only the session creator can send invitations'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        emails = request.data.get('emails', [])
        if not emails:
            return Response(
                {'error': 'No emails provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        invited_users = []
        for email in emails:
            # Create invitation
            invitation, created = QuizInvitation.objects.get_or_create(
                session=quiz_session,
                email=email,
                defaults={'token': self.generate_invitation_token()}
            )
            
            if created:
                # Send email invitation (you'll implement this)
                self.send_invitation_email(invitation)
                invited_users.append(email)
        
        return Response({
            'message': f'Invitations sent to {len(invited_users)} users',
            'invited_users': invited_users
        })
    
    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        """Get all participants of a quiz session"""
        quiz_session = self.get_object()
        participants = quiz_session.participants.select_related('user')
        serializer = QuizParticipantSerializer(participants, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def start(self, request, pk=None):
        """Start a quiz session"""
        print(f"Start endpoint called for session {pk} by user {request.user.username}")  # Debug
        
        try:
            quiz_session = self.get_object()
            print(f"Session creator: {quiz_session.creator}, Request user: {request.user}")  # Debug
            
            # Check if user is the creator
            if quiz_session.creator != request.user:
                print("Permission denied: User is not the creator")  # Debug
                return Response(
                    {'error': 'Only the session creator can start the session'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if session can be started
            if quiz_session.status not in ['created', 'scheduled']:
                print(f"Session cannot be started. Current status: {quiz_session.status}")  # Debug
                return Response(
                    {'error': f'Session cannot be started in its current state ({quiz_session.status})'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Start the session
            quiz_session.status = 'active'
            quiz_session.started_at = timezone.now()
            quiz_session.save()
            
            print(f"Session {pk} started successfully")  # Debug
            
            return Response({
                'message': 'Quiz session started successfully',
                'session_id': quiz_session.id,
                'session_title': quiz_session.title,
                'status': quiz_session.status,
                'started_at': quiz_session.started_at
            })
            
        except QuizSession.DoesNotExist:
            print(f"Session {pk} not found")  # Debug
            return Response(
                {'error': 'Session not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error starting session: {str(e)}")  # Debug
            return Response(
                {'error': f'Failed to start session: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
        # core/views.py - Add to QuizSessionViewSet class
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def submit_answer(self, request, pk=None):
        """Submit answer for a question in quiz session exam"""
        try:
            quiz_session = self.get_object()
            
            # Check if user is participant
            participant = QuizParticipant.objects.filter(
                session=quiz_session, 
                user=request.user
            ).first()
            
            if not participant:
                return Response(
                    {'error': 'You are not a participant of this session'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if session is active
            if quiz_session.status != 'active':
                return Response(
                    {'error': 'Session is not active'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            question_id = request.data.get('question_id')
            selected_option_ids = request.data.get('selected_options', [])
            
            if not question_id:
                return Response(
                    {'error': 'Question ID is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get question and validate
            question = Question.objects.get(id=question_id)
            selected_options = Option.objects.filter(id__in=selected_option_ids)
            
            # Calculate if answer is correct
            correct_options = question.options.filter(is_correct=True)
            is_correct = set(selected_options) == set(correct_options)
            
            # Update participant status if this is their first answer
            if participant.status == 'joined':
                participant.status = 'in_progress'
                participant.save()
            
            # Here you would save the answer to your database
            # You might want to create a QuizSessionAnswer model similar to UserAnswer
            
            return Response({
                'is_correct': is_correct,
                'correct_options_count': correct_options.count(),
                'selected_options_count': len(selected_option_ids)
            })
            
        except Question.DoesNotExist:
            return Response(
                {'error': 'Question not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to submit answer: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
        # core/views.py - Add to QuizSessionViewSet class
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def questions(self, request, pk=None):
        """Get all questions for a quiz session exam"""
        try:
            quiz_session = self.get_object()
            print(f"Getting questions for session {pk} for user {request.user.username}")  # Debug
            
            # Check if user is participant or creator
            is_participant = QuizParticipant.objects.filter(
                session=quiz_session, 
                user=request.user
            ).exists()
            
            is_creator = quiz_session.creator == request.user
            
            if not (is_participant or is_creator):
                return Response(
                    {'error': 'You are not a participant of this session'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if session is active
            if quiz_session.status != 'active':
                return Response(
                    {'error': f'Session is not active. Current status: {quiz_session.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get questions from the linked quiz
            questions = quiz_session.quiz.questions.filter(is_active=True)
            
            if not questions.exists():
                return Response(
                    {'error': 'No questions found for this quiz session'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            print(f"Found {questions.count()} questions for session {pk}")  # Debug
            
            # Include options with each question (shuffle options for security)
            questions_data = []
            for question in questions:
                question_data = QuestionSerializer(question).data
                
                # Get and shuffle options
                options = list(question.options.all())
                random.shuffle(options)
                question_data['options'] = OptionSerializer(options, many=True).data
                
                # Remove correct answers for security during exam
                for option in question_data['options']:
                    option.pop('is_correct', None)
                
                questions_data.append(question_data)
            
            # Shuffle questions for random order
            random.shuffle(questions_data)
            
            return Response({
                'session_id': quiz_session.id,
                'session_title': quiz_session.title,
                'quiz_title': quiz_session.quiz.title,
                'total_questions': questions.count(),
                'time_limit': quiz_session.duration,  # in minutes
                'questions': questions_data
            })
            
        except QuizSession.DoesNotExist:
            return Response(
                {'error': 'Quiz session not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error getting questions: {str(e)}")  # Debug
            return Response(
                {'error': f'Failed to get questions: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
        # core/views.py - Add to QuizSessionViewSet class
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def complete_session(self, request, pk=None):
        """Mark quiz session as completed for participant"""
        try:
            quiz_session = self.get_object()
            
            # Check if user is participant
            participant = QuizParticipant.objects.filter(
                session=quiz_session, 
                user=request.user
            ).first()
            
            if not participant:
                return Response(
                    {'error': 'You are not a participant of this session'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Update participant status
            participant.status = 'completed'
            participant.completed_at = timezone.now()
            
            # Calculate score (you'll need to implement this based on saved answers)
            # For now, we'll set a placeholder
            participant.score = 0  # Calculate based on correct answers
            participant.time_taken = request.data.get('time_taken', 0)
            participant.save()
            
            return Response({
                'message': 'Quiz session completed successfully',
                'score': participant.score,
                'time_taken': participant.time_taken,
                'completed_at': participant.completed_at
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to complete session: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def generate_invitation_token(self):
        import secrets
        return secrets.token_urlsafe(32)
    
    def send_invitation_email(self, invitation):
        # Implement email sending logic here
        # You can use Django's send_mail or a service like SendGrid
        print(f"Would send invitation email to {invitation.email} for session {invitation.session.title}")
        pass

class QuizParticipantViewSet(viewsets.ModelViewSet):
    serializer_class = QuizParticipantSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return QuizParticipant.objects.filter(user=self.request.user).select_related('session', 'user')
    
    @action(detail=True, methods=['post'])
    def submit_answer(self, request, pk=None):
        """Submit answer for a question in quiz session"""
        participant = self.get_object()
        
        if participant.status != 'in_progress':
            return Response(
                {'error': 'You are not in an active quiz session'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Implement answer submission logic similar to regular quiz
        question_id = request.data.get('question_id')
        selected_option_ids = request.data.get('selected_options', [])
        
        # Your existing answer submission logic here
        # ...
        
        return Response({'message': 'Answer submitted successfully'})
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark quiz session as completed for participant"""
        participant = self.get_object()
        
        if participant.status != 'in_progress':
            return Response(
                {'error': 'Quiz is not in progress'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        participant.status = 'completed'
        participant.completed_at = timezone.now()
        
        # Calculate score and time taken from answers
        # Implement your scoring logic here
        
        participant.save()
        
        return Response({
            'message': 'Quiz completed successfully',
            'score': participant.score,
            'time_taken': participant.time_taken
        })
        

# core/extended_views.py

# core/extended_views.py - UPDATE RecommendationViewSet
class RecommendationViewSet(viewsets.ModelViewSet):
    serializer_class = LearningRecommendationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return LearningRecommendation.objects.filter(user=self.request.user)
    
    def generate_ai_recommendations(self, user):
        """Generate AI-powered learning recommendations using Gemini"""
        import logging
        logger = logging.getLogger(__name__)
        
        # 1. Gather user progress summary
        progress_data = UserProgress.objects.filter(user=user).select_related('subject')
        progress_summary = []
        for p in progress_data:
            progress_summary.append({
                'subject': p.subject.name,
                'attempted': p.attempted_questions,
                'correct': p.correct_answers,
                'accuracy': float(p.accuracy)
            })
            
        # 2. Gather available subjects
        subjects = Subject.objects.filter(is_active=True).values_list('name', flat=True)
        available_subjects = list(subjects)
        
        # 3. Call Gemini if progress exists
        if progress_summary:
            from .gemini import generate_ai_recommendations_data
            ai_data = generate_ai_recommendations_data(progress_summary, available_subjects)
            if ai_data:
                recommendations = []
                for item in ai_data:
                    try:
                        subject = Subject.objects.filter(name__iexact=item['subject']).first()
                        if subject:
                            rec_type = item.get('recommendation_type', 'weak_area')
                            if rec_type not in ['weak_area', 'revision', 'challenge', 'concept']:
                                rec_type = 'weak_area'
                            
                            recommendation = LearningRecommendation.objects.create(
                                user=user,
                                recommendation_type=rec_type,
                                subject=subject,
                                priority=int(item.get('priority', 5)),
                                confidence_score=float(item.get('confidence_score', 0.8)),
                                reason=item.get('reason', f"Recommending study for {subject.name}")
                            )
                            recommendations.append(recommendation)
                    except Exception as e:
                        logger.error(f"Error creating recommendation from AI item {item}: {e}")
                
                if recommendations:
                    return recommendations

        # Fallback to standard algorithmic logic if Gemini fails or if no progress exists
        logger.info("Falling back to programmatic recommendation logic")
        weak_areas = self.identify_weak_areas(user)
        recommendations = []
        
        # If no weak areas are identified, recommend top active subjects
        if not weak_areas:
            active_subjects = Subject.objects.filter(is_active=True)[:3]
            for i, subject in enumerate(active_subjects):
                recommendation = LearningRecommendation.objects.create(
                    user=user,
                    recommendation_type='concept',
                    subject=subject,
                    priority=8 - i,
                    confidence_score=0.7,
                    reason=f"আপনার প্রস্তুতি শুরু করতে {subject.name} বিষয়টি দিয়ে শুরু করতে পারেন।"
                )
                recommendations.append(recommendation)
            return recommendations
            
        for area in weak_areas[:3]:
            subject = Subject.objects.get(name=area['subject'])
            recommendation = LearningRecommendation.objects.create(
                user=user,
                recommendation_type='weak_area',
                subject=subject,
                priority=10 - len(recommendations),
                confidence_score=0.8,
                reason=f"আপনার {area['subject']} বিষয়ে দক্ষতা কম ({area['accuracy']:.1f}%)। দক্ষতা বৃদ্ধি করার জন্য এই বিষয়ের প্রশ্নগুলো প্র্যাকটিস করুন।"
            )
            recommendations.append(recommendation)
        
        return recommendations
    
    def generate_next_recommendation(self, user, completed_recommendation):
        """Generate next recommendation after completing one"""
        # Logic to generate next recommendation based on completed one
        pass
    
    def identify_weak_areas(self, user):
        """Identify user's weak areas"""
        progress_data = UserProgress.objects.filter(user=user)
        weak_areas = []
        
        for progress in progress_data:
            if progress.accuracy < 60:  # Threshold for weak area
                weak_areas.append({
                    'subject': progress.subject.name,
                    'accuracy': progress.accuracy,
                })
        
        return weak_areas
    
    @action(detail=False, methods=['get'])
    def generate_recommendations(self, request):
        """Generate new AI-powered recommendations"""
        user = request.user
        
        # Clear old recommendations
        LearningRecommendation.objects.filter(user=user).delete()
        
        # Generate new recommendations
        recommendations = self.generate_ai_recommendations(user)
        
        serializer = self.get_serializer(recommendations, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """Mark recommendation as completed"""
        recommendation = self.get_object()
        recommendation.is_completed = True
        recommendation.save()
        
        # Generate next recommendation
        self.generate_next_recommendation(request.user, recommendation)
        
        return Response({'status': 'completed'})

class SmartStudyPlanViewSet(viewsets.ModelViewSet):
    serializer_class = SmartStudyPlanSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SmartStudyPlan.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def create_daily_schedule(self, study_plan):
        """Create daily study schedule"""
        # Implement daily schedule creation logic
        schedule = {
            'monday': f"Practice {study_plan.daily_goal} questions",
            'tuesday': f"Review weak areas",
            'wednesday': f"Practice {study_plan.daily_goal} questions",
            'thursday': "Take a full-length test",
            'friday': f"Practice {study_plan.daily_goal} questions",
            'saturday': "Revision day",
            'sunday': "Rest day"
        }
        return schedule
    
    def calculate_weekly_goals(self, study_plan):
        """Calculate weekly goals"""
        return {
            'questions_target': study_plan.daily_goal * 7,
            'subjects_to_cover': study_plan.subjects.count(),
            'target_accuracy': 75  # Default target
        }
    
    def calculate_completion_percentage(self, study_plan):
        """Calculate study plan completion percentage"""
        from .utils import calculate_study_plan_progress
        return calculate_study_plan_progress(study_plan)
    
    def calculate_days_remaining(self, study_plan):
        """Calculate days remaining in study plan"""
        days_passed = (timezone.now().date() - study_plan.created_at.date()).days
        return max(0, study_plan.duration_days - days_passed)
    
    def get_daily_progress(self, study_plan):
        """Get daily progress data"""
        daily_stats = DailyStats.objects.filter(
            user=study_plan.user,
            date__gte=study_plan.created_at.date()
        ).order_by('date')
        
        progress_data = []
        for stat in daily_stats:
            progress_data.append({
                'date': stat.date,
                'questions_attempted': stat.questions_attempted,
                'accuracy': (stat.correct_answers / stat.questions_attempted * 100) if stat.questions_attempted > 0 else 0
            })
        
        return progress_data
    
    def get_upcoming_milestones(self, study_plan):
        """Get upcoming milestones"""
        return [
            f"Complete {study_plan.daily_goal * 7} questions this week",
            "Achieve 80% accuracy in all subjects",
            "Complete first revision cycle"
        ]
    
    @action(detail=True, methods=['post'])
    def generate_schedule(self, request, pk=None):
        """Generate daily study schedule"""
        study_plan = self.get_object()
        
        schedule = self.create_daily_schedule(study_plan)
        
        return Response({
            'study_plan': study_plan.name,
            'daily_schedule': schedule,
            'weekly_goals': self.calculate_weekly_goals(study_plan)
        })
    
    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        """Get study plan progress"""
        study_plan = self.get_object()
        
        progress_data = {
            'completion_percentage': self.calculate_completion_percentage(study_plan),
            'days_remaining': self.calculate_days_remaining(study_plan),
            'daily_progress': self.get_daily_progress(study_plan),
            'upcoming_milestones': self.get_upcoming_milestones(study_plan)
        }
        
        return Response(progress_data)


class GamificationViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_active_challenges(self, user):
        """Get active challenges for user"""
        challenges = Challenge.objects.filter(
            is_active=True,
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now()
        )
        
        active_challenges = []
        for challenge in challenges:
            user_challenge = UserChallenge.objects.filter(
                user=user,
                challenge=challenge
            ).first()
            
            active_challenges.append({
                'challenge': ChallengeSerializer(challenge).data,
                'user_progress': UserChallengeSerializer(user_challenge).data if user_challenge else None
            })
        
        return active_challenges
    
    def get_leaderboard_position(self, user):
        """Get user's leaderboard position"""
        # Simplified leaderboard calculation
        user_progress = UserProgress.objects.filter(user=user).aggregate(
            avg_accuracy=Avg('accuracy')
        )['avg_accuracy'] or 0
        
        # This would be more complex in reality
        return {
            'position': 42,  # Placeholder
            'total_users': 1000,  # Placeholder
            'percentile': 95  # Placeholder
        }
    
    def calculate_points(self, user):
        """Calculate user's points"""
        # Simple points calculation based on achievements and progress
        base_points = UserProgress.objects.filter(user=user).aggregate(
            total_questions=Sum('attempted_questions')
        )['total_questions'] or 0
        
        achievement_points = Achievement.objects.filter(
            user=user, 
            is_unlocked=True
        ).count() * 100
        
        return base_points + achievement_points
    
    def get_next_milestones(self, user):
        """Get user's next milestones"""
        return [
            "Reach 1000 total questions",
            "Achieve 7-day streak",
            "Unlock 5 achievements",
            "Reach 80% overall accuracy"
        ]
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get gamification dashboard"""
        user = request.user
        
        return Response({
            'badges': UserBadgeSerializer(
                UserBadge.objects.filter(user=user), 
                many=True
            ).data,
            'current_challenges': self.get_active_challenges(user),
            'leaderboard_position': self.get_leaderboard_position(user),
            'points_balance': self.calculate_points(user),
            'next_milestones': self.get_next_milestones(user)
        })
    
    @action(detail=False, methods=['get'])
    def challenges(self, request):
        """Get available challenges"""
        challenges = Challenge.objects.filter(
            is_active=True,
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now()
        )
        
        challenges_data = []
        for challenge in challenges:
            user_challenge = UserChallenge.objects.filter(
                user=request.user,
                challenge=challenge
            ).first()
            
            challenges_data.append({
                'challenge': ChallengeSerializer(challenge).data,
                'user_progress': UserChallengeSerializer(user_challenge).data if user_challenge else None,
                'time_remaining': challenge.end_date - timezone.now()
            })
        
        return Response(challenges_data)

class StudyGroupViewSet(viewsets.ModelViewSet):
    serializer_class = StudyGroupSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return StudyGroup.objects.filter(
            Q(is_public=True) | 
            Q(groupmember__user=self.request.user)
        ).distinct()
    
    def perform_create(self, serializer):
        study_group = serializer.save(creator=self.request.user)
        
        # Auto-add creator as admin
        GroupMember.objects.create(
            group=study_group,
            user=self.request.user,
            role='admin'
        )
    
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Join a study group"""
        study_group = self.get_object()
        
        if GroupMember.objects.filter(group=study_group, user=request.user).exists():
            return Response(
                {'error': 'Already a member'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if study_group.groupmember_set.count() >= study_group.max_members:
            return Response(
                {'error': 'Group is full'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        GroupMember.objects.create(
            group=study_group,
            user=request.user,
            role='member'
        )
        
        return Response({'message': 'Successfully joined group'})
    
    @action(detail=True, methods=['get'])
    def activities(self, request, pk=None):
        """Get group activities"""
        study_group = self.get_object()
        
        # Check if user is member
        if not study_group.groupmember_set.filter(user=request.user).exists():
            return Response(
                {'error': 'Not a group member'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        activities = GroupActivity.objects.filter(
            group=study_group
        ).order_by('-created_at')[:50]
        
        return Response(GroupActivitySerializer(activities, many=True).data)


class ExamSimulationViewSet(viewsets.ModelViewSet):
    serializer_class = ExamSimulationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ExamSimulation.objects.filter(user=self.request.user).prefetch_related('subjects', 'questions')
    
    def create(self, request, *args, **kwargs):
        print("🎯 === EXAM SIMULATION CREATE REQUEST ===")
        print(f"User: {request.user}")
        print(f"Request data: {request.data}")
        
        try:
            # Process the data for the serializer
            data = request.data.copy()
            
            # Ensure subjects is a list of integers
            subjects_data = data.get('subjects', [])
            print(f"Original subjects data: {subjects_data}, type: {type(subjects_data)}")
            
            # Handle different subject data formats
            if isinstance(subjects_data, str):
                try:
                    subjects_data = json.loads(subjects_data)
                except json.JSONDecodeError:
                    subjects_data = [int(subjects_data)] if subjects_data.isdigit() else []
            
            if not isinstance(subjects_data, list):
                subjects_data = [subjects_data]
            
            # Convert all to integers
            try:
                subjects_data = [int(subject_id) for subject_id in subjects_data if subject_id]
            except (ValueError, TypeError) as e:
                return Response(
                    {'error': f'Invalid subject IDs format: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            data['subjects'] = subjects_data
            print(f"Processed subjects: {subjects_data}")
            
            # Validate that subjects exist
            if subjects_data:
                existing_subjects = Subject.objects.filter(id__in=subjects_data)
                existing_ids = set(existing_subjects.values_list('id', flat=True))
                missing_ids = set(subjects_data) - existing_ids
                
                if missing_ids:
                    return Response(
                        {'error': f'Subject IDs not found: {missing_ids}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                return Response(
                    {'error': 'At least one subject is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create the serializer with processed data
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            
            # Perform creation
            exam_simulation = self.perform_create(serializer)
            
            # Generate questions for the exam
            self.generate_exam_questions(exam_simulation, data.get('question_breakdown', {}))
            
            print("✅ Exam simulation created successfully with questions!")
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except serializers.ValidationError as e:
            print(f"❌ Validation error: {e.detail}")
            return Response(
                {'error': 'Validation failed', 'details': e.detail},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(f"❌ Create error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def perform_create(self, serializer):
        return serializer.save(user=self.request.user)
    
    def generate_exam_questions(self, exam_simulation, question_breakdown):
        """Generate questions for the exam based on subjects and difficulty breakdown"""
        print(f"🔧 Generating questions for exam {exam_simulation.id}")
        
        # Get subject IDs
        subject_ids = list(exam_simulation.subjects.values_list('id', flat=True))
        print(f"Subjects for question generation: {subject_ids}")
        
        # Debug: Check if questions exist for these subjects
        total_available = Question.objects.filter(
            subject_id__in=subject_ids,
            is_active=True
        ).count()
        print(f"📊 Total questions available for subjects {subject_ids}: {total_available}")
        
        total_questions = exam_simulation.total_questions
        questions_added = 0
        
        print(f"🎯 Target total questions: {total_questions}")
        print(f"📊 Question breakdown: {question_breakdown}")
        
        # Handle different breakdown formats
        if not question_breakdown:
            # Default percentage breakdown
            question_breakdown = {'easy': 0.3, 'medium': 0.5, 'hard': 0.2}
            difficulty_counts = {}
            for difficulty, percentage in question_breakdown.items():
                difficulty_counts[difficulty] = int(total_questions * percentage)
        else:
            # Check if breakdown is in counts or percentages
            if all(isinstance(v, (int, float)) and v <= 1 for v in question_breakdown.values()):
                # Percentages (values are between 0 and 1)
                difficulty_counts = {}
                for difficulty, percentage in question_breakdown.items():
                    difficulty_counts[difficulty] = int(total_questions * percentage)
            else:
                # Counts (values are actual numbers)
                difficulty_counts = question_breakdown
        
        print(f"🔢 Final difficulty counts: {difficulty_counts}")
        
        # Generate questions for each difficulty level
        for difficulty, count in difficulty_counts.items():
            if count == 0:
                continue
                
            print(f"🔍 Fetching {count} {difficulty} questions...")
            
            # Get questions for this difficulty and subjects
            questions = Question.objects.filter(
                subject_id__in=subject_ids,
                difficulty=difficulty,
                is_active=True
            ).order_by('?')[:count]  # Random order for variety
            
            questions_list = list(questions)
            print(f"✅ Found {len(questions_list)} {difficulty} questions")
            
            # Add questions to exam
            for i, question in enumerate(questions_list):
                ExamQuestion.objects.create(
                    exam_simulation=exam_simulation,
                    question=question,
                    order=questions_added + i
                )
            
            questions_added += len(questions_list)
            print(f"📥 Added {len(questions_list)} {difficulty} questions")
        
        print(f"✅ Total questions added: {questions_added}")
        
        # If we couldn't get enough questions, fill with whatever is available
        if questions_added < total_questions:
            remaining = total_questions - questions_added
            print(f"⚠️ Need {remaining} more questions, fetching from available pool...")
            
            additional_questions = Question.objects.filter(
                subject_id__in=subject_ids,
                is_active=True
            ).exclude(
                id__in=exam_simulation.questions.values_list('id', flat=True)
            ).order_by('?')[:remaining]
            
            additional_list = list(additional_questions)
            print(f"🔍 Found {len(additional_list)} additional questions")
            
            for i, question in enumerate(additional_list):
                ExamQuestion.objects.create(
                    exam_simulation=exam_simulation,
                    question=question,
                    order=questions_added + i
                )
            
            questions_added += len(additional_list)
            print(f"📥 Added {len(additional_list)} additional questions")
        
        print(f"🎉 Final total questions added: {questions_added}")
        
        # Update the exam simulation with actual question count
        if questions_added != total_questions:
            exam_simulation.total_questions = questions_added
            exam_simulation.save()
            print(f"📝 Updated exam total_questions to {questions_added}")
        
        return questions_added
    
    def get_exam_questions(self, exam_simulation):
        """Get questions for the exam with their order"""
        return exam_simulation.questions.all().order_by('examquestion__order')
    def create_exam_session(self, exam_simulation):
        """Create exam session"""
        # This would create a detailed exam session
        return {
            'id': 1,  # Placeholder
            'exam_simulation_id': exam_simulation.id,
            'started_at': timezone.now()
        }
    
    def get_exam_instructions(self, exam_simulation):
        """Get exam instructions"""
        return {
            'duration': f"{exam_simulation.duration} minutes",
            'total_questions': exam_simulation.total_questions,
            'subjects': [subject.name for subject in exam_simulation.subjects.all()],
            'strict_timing': exam_simulation.strict_timing,
            'show_results_after': exam_simulation.show_results_after
        }
    
    def get_performance_breakdown(self, exam_simulation):
        """Get performance breakdown"""
        return {
            'overall_score': 75,  # Placeholder
            'subject_breakdown': [
                {'subject': 'Math', 'score': 80},
                {'subject': 'Science', 'score': 70}
            ],
            'difficulty_breakdown': [
                {'difficulty': 'easy', 'correct': 8, 'total': 10},
                {'difficulty': 'medium', 'correct': 12, 'total': 15},
                {'difficulty': 'hard', 'correct': 5, 'total': 10}
            ]
        }
    
    def analyze_time_management(self, exam_simulation):
        """Analyze time management"""
        return {
            'average_time_per_question': 45,  # seconds
            'time_spent_on_easy': 300,  # seconds
            'time_spent_on_medium': 600,  # seconds
            'time_spent_on_hard': 900,  # seconds
            'recommendation': "Spend less time on easy questions"
        }
    
    def identify_exam_weak_areas(self, exam_simulation):
        """Identify weak areas from exam"""
        return [
            {
                'subject': 'Mathematics',
                'topic': 'Algebra',
                'accuracy': 60,
                'suggestion': 'Practice more algebra problems'
            },
            {
                'subject': 'Science',
                'topic': 'Physics',
                'accuracy': 55,
                'suggestion': 'Review physics formulas'
            }
        ]
    
    def generate_exam_improvements(self, exam_simulation):
        """Generate improvement suggestions"""
        return [
            "Focus on time management during exams",
            "Practice more difficult questions",
            "Review explanations for incorrect answers",
            "Take more full-length practice tests"
        ]
    
    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """Get all questions for the exam simulation"""
        print(f"🎯 Fetching questions for exam simulation {pk}")
        
        try:
            exam_simulation = self.get_object()
            
            # Get questions with their order through the ExamQuestion through model
            exam_questions = ExamQuestion.objects.filter(
                exam_simulation=exam_simulation
            ).select_related(
                'question', 
                'question__subject'
            ).prefetch_related(
                'question__options'
            ).order_by('order')
            
            print(f"📊 Found {exam_questions.count()} questions for exam {pk}")
            
            # Serialize the questions
            questions_data = []
            for exam_question in exam_questions:
                question = exam_question.question
                
                # Prepare question data
                question_data = {
                    'id': question.id,
                    'exam_question_id': exam_question.id,
                    'order': exam_question.order,
                    'question_text': question.question_text,
                    'question_type': question.question_type,
                    'difficulty': question.difficulty,
                    'explanation': question.explanation,
                    'marks': question.marks,
                    'subject': question.subject.name,
                    'options': []
                }
                
                # Add options (shuffle for security during exam)
                options = list(question.options.all())
                random.shuffle(options)  # Shuffle options to prevent pattern recognition
                
                for option in options:
                    question_data['options'].append({
                        'id': option.id,
                        'option_text': option.option_text,
                        # Don't include is_correct during the exam for security
                    })
                
                questions_data.append(question_data)
            
            print(f"✅ Returning {len(questions_data)} questions for exam")
            
            return Response({
                'exam_id': exam_simulation.id,
                'exam_name': exam_simulation.name,
                'total_questions': exam_simulation.total_questions,
                'time_limit': exam_simulation.duration,
                'questions': questions_data
            })
            
        except Exception as e:
            print(f"❌ Error fetching questions: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Failed to fetch questions: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def start_simulation(self, request, pk=None):
        """Start exam simulation"""
        exam_simulation = self.get_object()
        
        # Check if exam has questions
        question_count = exam_simulation.questions.count()
        if question_count == 0:
            # Generate questions if none exist
            self.generate_exam_questions(exam_simulation, exam_simulation.question_breakdown)
            question_count = exam_simulation.questions.count()
        
        # Create exam session
        session = self.create_exam_session(exam_simulation)
        
        return Response({
            'session_id': session['id'],
            'instructions': self.get_exam_instructions(exam_simulation),
            'time_remaining': exam_simulation.duration * 60,
            'total_questions': exam_simulation.total_questions,
            'question_count': question_count
        })
    
    @action(detail=True, methods=['get'])
    def analysis(self, request, pk=None):
        """Get detailed exam analysis"""
        exam_simulation = self.get_object()
        
        analysis_data = {
            'performance_breakdown': self.get_performance_breakdown(exam_simulation),
            'time_management': self.analyze_time_management(exam_simulation),
            'weak_areas': self.identify_exam_weak_areas(exam_simulation),
            'improvement_suggestions': self.generate_exam_improvements(exam_simulation)
        }
        
        return Response(analysis_data)

# Utility functions for extended functionality
def calculate_peak_study_hours(user):
    """Calculate user's peak study hours"""
    sessions = PracticeSession.objects.filter(user=user, is_completed=True)
    hour_counts = {}
    
    for session in sessions:
        hour = session.started_at.hour
        hour_counts[hour] = hour_counts.get(hour, 0) + 1
    
    return dict(sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:3])

def identify_weak_areas(user):
    """Identify user's weak areas based on performance"""
    progress_data = UserProgress.objects.filter(user=user)
    weak_areas = []
    
    for progress in progress_data:
        if progress.accuracy < 60:  # Threshold for weak area
            weak_areas.append({
                'subject': progress.subject.name,
                'accuracy': progress.accuracy,
                'suggested_actions': generate_study_suggestions(progress)
            })
    
    return weak_areas

def generate_ai_recommendations(user):
    """Generate AI-powered learning recommendations"""
    # This would integrate with ML models in production
    weak_areas = identify_weak_areas(user)
    recommendations = []
    
    for area in weak_areas[:3]:  # Top 3 weak areas
        subject = Subject.objects.get(name=area['subject'])
        recommendation = LearningRecommendation.objects.create(
            user=user,
            recommendation_type='weak_area',
            subject=subject,
            priority=10 - len(recommendations),  # Decreasing priority
            confidence_score=0.8,
            reason=f"Low accuracy ({area['accuracy']:.1f}%) in {area['subject']}"
        )
        recommendations.append(recommendation)
    
    return recommendations


# core/extended_views.py (continued)
class AdvancedAnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def calculate_peak_study_hours(self, user):
        """Calculate user's peak study hours"""
        from collections import defaultdict
        
        sessions = PracticeSession.objects.filter(
            user=user, 
            is_completed=True
        )
        
        hour_counts = defaultdict(int)
        for session in sessions:
            hour = session.started_at.hour
            hour_counts[hour] += 1
        
        # Return top 3 hours
        sorted_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        return {f"{hour}:00": count for hour, count in sorted_hours}
    
    def identify_weak_areas(self, user):
        """Identify user's weak areas based on performance"""
        from .utils import generate_study_suggestions
        
        progress_data = UserProgress.objects.filter(user=user)
        weak_areas = []
        
        for progress in progress_data:
            if progress.attempted_questions > 10 and progress.accuracy < 60:
                weak_areas.append({
                    'subject': progress.subject.name,
                    'category': progress.subject.category.name,
                    'accuracy': float(progress.accuracy),
                    'attempted_questions': progress.attempted_questions,
                    'suggested_actions': generate_study_suggestions(progress)
                })
        
        return sorted(weak_areas, key=lambda x: x['accuracy'])[:5]  # Top 5 weakest
    
    def calculate_improvement_trend(self, user):
        """Calculate user's improvement trend"""
        from .utils import calculate_improvement_trend as calc_trend
        return calc_trend(user)
    
    def calculate_percentile(self, user, metric_type):
        """Calculate user's percentile for a metric"""
        from .utils import calculate_percentile as calc_percentile
        return calc_percentile(user, metric_type)
    
    def calculate_consistency_rank(self, user):
        """Calculate user's consistency rank"""
        # Count consecutive days of activity
        daily_stats = DailyStats.objects.filter(
            user=user
        ).order_by('date')
        
        if not daily_stats:
            return 0
        
        current_streak = 0
        previous_date = None
        
        for stat in daily_stats:
            if previous_date is None:
                current_streak = 1
            elif (stat.date - previous_date).days == 1:
                current_streak += 1
            else:
                current_streak = 1
            
            previous_date = stat.date
        
        return current_streak
    
    def get_subject_rankings(self, user):
        """Get user's subject rankings compared to peers"""
        subjects = Subject.objects.filter(is_active=True)
        rankings = []
        
        for subject in subjects:
            try:
                user_progress = UserProgress.objects.get(user=user, subject=subject)
                
                # Get all users' progress for this subject
                all_progress = UserProgress.objects.filter(
                    subject=subject,
                    attempted_questions__gte=10  # Minimum attempts
                ).order_by('-accuracy')
                
                # Find user's rank
                user_rank = None
                for rank, progress in enumerate(all_progress, 1):
                    if progress.user == user:
                        user_rank = rank
                        break
                
                if user_rank:
                    total_users = all_progress.count()
                    percentile = ((total_users - user_rank) / total_users) * 100
                    
                    rankings.append({
                        'subject': subject.name,
                        'rank': user_rank,
                        'total_users': total_users,
                        'percentile': round(percentile, 1),
                        'accuracy': float(user_progress.accuracy)
                    })
                    
            except UserProgress.DoesNotExist:
                continue
        
        return sorted(rankings, key=lambda x: x['rank'])
    
    def generate_recommendations(self, user):
        """Generate personalized recommendations"""
        weak_areas = self.identify_weak_areas(user)
        recommendations = []
        
        for area in weak_areas[:3]:
            recommendations.append({
                'type': 'weak_area_focus',
                'priority': 'high',
                'subject': area['subject'],
                'action': f"Practice {area['subject']} questions",
                'reason': f"Your accuracy is {area['accuracy']:.1f}% in this subject"
            })
        
        # Add time-based recommendations
        peak_hours = self.calculate_peak_study_hours(user)
        if peak_hours:
            best_hour = list(peak_hours.keys())[0]
            recommendations.append({
                'type': 'study_schedule',
                'priority': 'medium',
                'action': f"Study during {best_hour} for better focus",
                'reason': "This is your most productive time based on past activity"
            })
        
        return recommendations
    
    @action(detail=False, methods=['get'])
    def learning_insights(self, request):
        """Get AI-powered learning insights"""
        user = request.user
        
        peak_hours = self.calculate_peak_study_hours(user)
        weak_areas = self.identify_weak_areas(user)
        improvement_trend = self.calculate_improvement_trend(user)
        
        return Response({
            'peak_study_hours': peak_hours,
            'weak_areas': weak_areas,
            'improvement_trend': improvement_trend,
            'recommended_actions': self.generate_recommendations(user)
        })
    
    @action(detail=False, methods=['get'])
    def comparative_analysis(self, request):
        """Compare user performance with peers"""
        user = request.user
        
        comparative_data = {
            'accuracy_percentile': self.calculate_percentile(user, 'accuracy'),
            'speed_percentile': self.calculate_percentile(user, 'speed'),
            'consistency_rank': self.calculate_consistency_rank(user),
            'subject_rankings': self.get_subject_rankings(user)
        }
        
        return Response(comparative_data)



class AdaptiveLearningEngine:
    """Enhanced adaptive learning algorithm implementation"""
    
    def __init__(self, user):
        self.user = user
        self.ability_estimate = self._get_initial_ability(user)
        self.difficulty_threshold = 0.5
    
    def _get_initial_ability(self, user):
        """Get user's initial ability estimate based on past performance"""
        try:
            # Try to get from recent user progress
            recent_progress = UserProgress.objects.filter(user=user).order_by('-updated_at').first()
            if recent_progress and recent_progress.accuracy > 0:
                return recent_progress.accuracy / 100.0
            
            # Default to medium ability
            return 0.5
        except:
            return 0.5
    
    def select_next_question(self, user, subject, session_data):
        """Select next question based on current ability estimate"""
        # Get questions with difficulty close to current ability
        difficulty_mapping = {
            'easy': 0.3,
            'medium': 0.5,
            'hard': 0.7
        }
        
        target_difficulty = self.ability_estimate
        
        # Find closest difficulty level
        closest_diff = min(
            difficulty_mapping.keys(),
            key=lambda x: abs(difficulty_mapping[x] - target_difficulty)
        )
        
        # Get questions of that difficulty that haven't been answered
        answered_questions = session_data.get('answered_questions', [])
        
        questions = Question.objects.filter(
            subject=subject,
            difficulty=closest_diff,
            is_active=True
        ).exclude(
            id__in=answered_questions
        ).select_related('subject').prefetch_related('options')
        
        if questions.exists():
            return random.choice(list(questions))
        
        # If no questions found at target difficulty, expand search
        questions = Question.objects.filter(
            subject=subject,
            is_active=True
        ).exclude(
            id__in=answered_questions
        ).select_related('subject').prefetch_related('options')
        
        if questions.exists():
            return random.choice(list(questions))
        
        return None
    
    def update_ability_estimate(self, user, session_data, is_correct, response_time=None):
        """Update user ability estimate using simplified IRT"""
        learning_rate = 0.1
        max_ability = 0.95
        min_ability = 0.05
        
        if is_correct:
            # Increase ability more for difficult questions
            difficulty_bonus = max(0, self.ability_estimate - 0.5) * 0.2
            self.ability_estimate += learning_rate + difficulty_bonus
        else:
            # Decrease ability more for easy questions
            difficulty_penalty = max(0, 0.5 - self.ability_estimate) * 0.2
            self.ability_estimate -= learning_rate + difficulty_penalty
        
        # Consider response time (faster correct answers = bigger boost)
        if response_time and is_correct:
            time_bonus = max(0, (30 - response_time) / 300)  # Bonus for answering quickly
            self.ability_estimate += time_bonus
        
        # Keep ability estimate within bounds
        self.ability_estimate = max(min_ability, min(max_ability, self.ability_estimate))
        
        return self.ability_estimate
    
    def calculate_session_score(self, session_data):
        """Calculate final session score"""
        total_questions = session_data.get('questions_answered', 0)
        correct_answers = session_data.get('correct_answers', 0)
        
        if total_questions == 0:
            return 0
        
        return (correct_answers / total_questions) * 100
    
    def get_recommendations(self, user, session_data):
        """Get learning recommendations based on session performance"""
        score = self.calculate_session_score(session_data)
        ability = self.ability_estimate
        
        recommendations = []
        
        if score < 60:
            recommendations.append({
                'type': 'review_basics',
                'priority': 'high',
                'message': 'Review fundamental concepts in this subject',
                'action': 'Focus on easy and medium difficulty questions'
            })
        elif score < 80:
            recommendations.append({
                'type': 'practice_medium',
                'priority': 'medium',
                'message': 'Continue practicing with medium difficulty questions',
                'action': 'Build consistency with moderate challenges'
            })
        else:
            recommendations.append({
                'type': 'challenge_advanced',
                'priority': 'low',
                'message': 'Ready for advanced challenges',
                'action': 'Try hard difficulty questions to push your limits'
            })
        
        # Time-based recommendation
        if session_data.get('average_response_time', 0) > 60:
            recommendations.append({
                'type': 'improve_speed',
                'priority': 'medium',
                'message': 'Work on improving response time',
                'action': 'Practice with timed sessions'
            })
        
        return recommendations


class AdaptiveLearningViewSet(viewsets.ViewSet):
    """ViewSet for adaptive learning functionality"""
    
    def start_adaptive_session(self, request):
        """Start a new adaptive learning session"""
        try:
            subject_id = request.data.get('subjectId')
            question_count = int(request.data.get('questionCount', 10))
            
            if not subject_id:
                return Response(
                    {'error': 'Subject ID is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get subject
            try:
                subject = Subject.objects.get(id=subject_id, is_active=True)
            except Subject.DoesNotExist:
                return Response(
                    {'error': 'Subject not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Initialize adaptive learning engine
            engine = AdaptiveLearningEngine(request.user)
            
            # Create adaptive session
            session = AdaptiveSession.objects.create(
                user=request.user,
                subject=subject,
                total_questions=question_count,
                ability_estimate=engine.ability_estimate,
                session_data={
                    'questions_answered': 0,
                    'correct_answers': 0,
                    'answered_questions': [],
                    'started_at': timezone.now().isoformat(),
                    'question_count': question_count
                }
            )
            
            # Get first question
            first_question = engine.select_next_question(request.user, subject, {
                'user_id': request.user.id,
                'subject_id': subject.id,
                'question_count': question_count,
                'ability_estimate': engine.ability_estimate,
                'questions_answered': 0,
                'correct_answers': 0,
                'answered_questions': [],
                'session_start': timezone.now()
            })
            
            if not first_question:
                return Response(
                    {'error': 'No questions available for this subject'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Create adaptive question entry
            adaptive_question = AdaptiveQuestion.objects.create(
                base_question=first_question,
                session=session,
                difficulty_adjustment=engine.ability_estimate,
                user_ability_estimate=engine.ability_estimate,
                response_time_threshold=45.0  # Default threshold
            )
            
            # Prepare response data
            session_data = {
                'id': session.id,
                'user': session.user.id,
                'subject': {
                    'id': subject.id,
                    'name': subject.name,
                    'description': subject.description
                },
                'ability_estimate': engine.ability_estimate,
                'questions_answered': 0,
                'correct_answers': 0,
                'total_questions': question_count,
                'current_question': {
                    'id': first_question.id,
                    'question_text': first_question.question_text,
                    'question_type': first_question.question_type,
                    'difficulty': first_question.difficulty,
                    'explanation': first_question.explanation,
                    'marks': first_question.marks,
                    'options': [
                        {
                            'id': option.id,
                            'option_text': option.option_text,
                            'is_correct': option.is_correct
                        }
                        for option in first_question.options.all().order_by('order')
                    ]
                },
                'session_data': session.session_data,
                'started_at': session.started_at.isoformat()
            }
            
            return Response(session_data)
            
        except Exception as e:
            print(f"Error starting adaptive session: {str(e)}")
            return Response(
                {'error': f'Failed to start session: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_next_adaptive_question(self, request):
        """Get next adaptive question based on user performance"""
        try:
            session_id = request.data.get('sessionId')
            previous_question_id = request.data.get('questionId')
            selected_option = request.data.get('selectedOption')
            response_time = request.data.get('responseTime', 30)
            
            if not session_id:
                return Response(
                    {'error': 'Session ID is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get session
            try:
                session = AdaptiveSession.objects.get(id=session_id, user=request.user)
            except AdaptiveSession.DoesNotExist:
                return Response(
                    {'error': 'Session not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Update session based on previous answer
            if previous_question_id and selected_option is not None:
                # Get the previous question
                try:
                    previous_question = Question.objects.get(id=previous_question_id)
                    # Check if answer was correct
                    is_correct = previous_question.options.filter(
                        id=selected_option, 
                        is_correct=True
                    ).exists()
                    
                    # Update the adaptive question record
                    try:
                        adaptive_q = AdaptiveQuestion.objects.get(
                            base_question=previous_question,
                            session=session
                        )
                        adaptive_q.was_answered_correctly = is_correct
                        adaptive_q.actual_response_time = response_time
                        adaptive_q.save()
                    except AdaptiveQuestion.DoesNotExist:
                        pass
                    
                    # Update ability estimate
                    engine = AdaptiveLearningEngine(request.user)
                    engine.ability_estimate = session.ability_estimate
                    
                    new_ability = engine.update_ability_estimate(
                        request.user, 
                        session.session_data, 
                        is_correct, 
                        response_time
                    )
                    
                    # Update session
                    session.ability_estimate = new_ability
                    session.questions_answered += 1
                    if is_correct:
                        session.correct_answers += 1
                    
                    # Update session data
                    session_data = session.session_data
                    session_data['questions_answered'] = session.questions_answered
                    session_data['correct_answers'] = session.correct_answers
                    session_data['answered_questions'].append(previous_question_id)
                    session.session_data = session_data
                    session.save()
                    
                except Question.DoesNotExist:
                    pass
            
            # Check if session is completed
            if session.questions_answered >= session.total_questions:
                session.completed_at = timezone.now()
                session.is_completed = True
                session.save()
                return Response({
                    'session_completed': True,
                    'final_score': session.correct_answers,
                    'total_questions': session.total_questions,
                    'ability_estimate': session.ability_estimate,
                    'score_percentage': session.score
                })
            
            # Get next question
            engine = AdaptiveLearningEngine(request.user)
            engine.ability_estimate = session.ability_estimate
            
            next_question = engine.select_next_question(
                request.user, 
                session.subject, 
                session.session_data
            )
            
            if not next_question:
                session.completed_at = timezone.now()
                session.is_completed = True
                session.save()
                return Response({
                    'session_completed': True,
                    'final_score': session.correct_answers,
                    'total_questions': session.questions_answered,
                    'ability_estimate': session.ability_estimate,
                    'score_percentage': session.score,
                    'message': 'No more questions available'
                })
            
            # Create adaptive question entry
            adaptive_question = AdaptiveQuestion.objects.create(
                base_question=next_question,
                session=session,
                difficulty_adjustment=engine.ability_estimate,
                user_ability_estimate=engine.ability_estimate,
                response_time_threshold=45.0
            )
            
            response_data = {
                'session_id': session.id,
                'ability_estimate': session.ability_estimate,
                'questions_answered': session.questions_answered,
                'correct_answers': session.correct_answers,
                'total_questions': session.total_questions,
                'next_question': {
                    'id': next_question.id,
                    'question_text': next_question.question_text,
                    'question_type': next_question.question_type,
                    'difficulty': next_question.difficulty,
                    'explanation': next_question.explanation,
                    'marks': next_question.marks,
                    'options': [
                        {
                            'id': option.id,
                            'option_text': option.option_text,
                            'is_correct': option.is_correct
                        }
                        for option in next_question.options.all().order_by('order')
                    ]
                }
            }
            
            return Response(response_data)
            
        except Exception as e:
            print(f"Error getting next question: {str(e)}")
            return Response(
                {'error': f'Failed to get next question: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def submit_adaptive_answer(self, request):
        """Submit answer and get next question in one call"""
        try:
            session_id = request.data.get('sessionId')
            question_id = request.data.get('questionId')
            selected_option = request.data.get('selectedOption')
            response_time = request.data.get('responseTime', 30)
            
            if not all([session_id, question_id, selected_option is not None]):
                return Response(
                    {'error': 'Session ID, Question ID, and selected option are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get session and question
            try:
                session = AdaptiveSession.objects.get(id=session_id, user=request.user)
                question = Question.objects.get(id=question_id)
            except AdaptiveSession.DoesNotExist:
                return Response(
                    {'error': 'Session not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            except Question.DoesNotExist:
                return Response(
                    {'error': 'Question not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if answer was correct
            is_correct = question.options.filter(
                id=selected_option, 
                is_correct=True
            ).exists()
            
            # Update the adaptive question record
            try:
                adaptive_q = AdaptiveQuestion.objects.get(
                    base_question=question,
                    session=session
                )
                adaptive_q.was_answered_correctly = is_correct
                adaptive_q.actual_response_time = response_time
                adaptive_q.save()
            except AdaptiveQuestion.DoesNotExist:
                # Create if doesn't exist
                AdaptiveQuestion.objects.create(
                    base_question=question,
                    session=session,
                    was_answered_correctly=is_correct,
                    actual_response_time=response_time,
                    user_ability_estimate=session.ability_estimate
                )
            
            # Update ability estimate
            engine = AdaptiveLearningEngine(request.user)
            engine.ability_estimate = session.ability_estimate
            
            new_ability = engine.update_ability_estimate(
                request.user, 
                session.session_data, 
                is_correct, 
                response_time
            )
            
            # Update session
            session.ability_estimate = new_ability
            session.questions_answered += 1
            if is_correct:
                session.correct_answers += 1
            
            # Update session data
            session_data = session.session_data
            session_data['questions_answered'] = session.questions_answered
            session_data['correct_answers'] = session.correct_answers
            session_data['answered_questions'].append(question_id)
            session.session_data = session_data
            session.save()
            
            # Check if session is completed
            if session.questions_answered >= session.total_questions:
                session.completed_at = timezone.now()
                session.is_completed = True
                session.save()
                return Response({
                    'session_completed': True,
                    'final_score': session.correct_answers,
                    'total_questions': session.total_questions,
                    'ability_estimate': session.ability_estimate,
                    'score_percentage': session.score,
                    'is_correct': is_correct
                })
            
            # Get next question
            next_question = engine.select_next_question(
                request.user, 
                session.subject, 
                session.session_data
            )
            
            if not next_question:
                session.completed_at = timezone.now()
                session.is_completed = True
                session.save()
                return Response({
                    'session_completed': True,
                    'final_score': session.correct_answers,
                    'total_questions': session.questions_answered,
                    'ability_estimate': session.ability_estimate,
                    'score_percentage': session.score,
                    'is_correct': is_correct,
                    'message': 'No more questions available'
                })
            
            # Create adaptive question entry for next question
            AdaptiveQuestion.objects.create(
                base_question=next_question,
                session=session,
                difficulty_adjustment=engine.ability_estimate,
                user_ability_estimate=engine.ability_estimate,
                response_time_threshold=45.0
            )
            
            response_data = {
                'is_correct': is_correct,
                'ability_estimate': session.ability_estimate,
                'questions_answered': session.questions_answered,
                'correct_answers': session.correct_answers,
                'total_questions': session.total_questions,
                'next_question': {
                    'id': next_question.id,
                    'question_text': next_question.question_text,
                    'question_type': next_question.question_type,
                    'difficulty': next_question.difficulty,
                    'explanation': next_question.explanation,
                    'marks': next_question.marks,
                    'options': [
                        {
                            'id': option.id,
                            'option_text': option.option_text,
                            'is_correct': option.is_correct
                        }
                        for option in next_question.options.all().order_by('order')
                    ]
                }
            }
            
            return Response(response_data)
            
        except Exception as e:
            print(f"Error submitting answer: {str(e)}")
            return Response(
                {'error': f'Failed to submit answer: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
            

# core/views.py - Add this to the existing file

# Add the BattleViewSet class
class BattleViewSet(viewsets.ModelViewSet):
    serializer_class = BattleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Battle.objects.filter(
            Q(creator=self.request.user) | Q(opponent=self.request.user)
        ).select_related('creator', 'opponent', 'subject').prefetch_related(
            'participants', 'participants__user'
        ).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateBattleSerializer
        return super().get_serializer_class()
    
    def perform_create(self, serializer):
        battle = serializer.save(creator=self.request.user)
        
        # Add creator as participant
        BattleParticipant.objects.create(
            battle=battle,
            user=self.request.user
        )
    
    @action(detail=False, methods=['post'])
    def create_quick_battle(self, request):
        """Create a quick battle with random subject"""
        import random
        
        # Get random active subject
        subjects = Subject.objects.filter(is_active=True)
        if not subjects.exists():
            return Response(
                {'error': 'No subjects available'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        random_subject = random.choice(subjects)
        
        battle_data = {
            'battle_type': 'quick',
            'subject': random_subject.id,
            'question_count': 10,
            'time_per_question': 30,
            'difficulty': 'medium'
        }
        
        serializer = CreateBattleSerializer(data=battle_data)
        if serializer.is_valid():
            battle = serializer.save(creator=request.user)
            BattleParticipant.objects.create(battle=battle, user=request.user)
            
            return Response(
                BattleSerializer(battle, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def join(self, request):
        """Join a battle using battle code"""
        serializer = JoinBattleSerializer(data=request.data)
        if serializer.is_valid():
            battle_code = serializer.validated_data['battle_code']
            
            try:
                battle = Battle.objects.get(
                    battle_code=battle_code,
                    status='waiting'
                )
                
                # Check if battle is full
                if battle.opponent:
                    return Response(
                        {'error': 'Battle is already full'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Check if user is trying to join their own battle
                if battle.creator == request.user:
                    return Response(
                        {'error': 'Cannot join your own battle'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Join the battle
                battle.opponent = request.user
                battle.save()
                
                # Add opponent as participant
                BattleParticipant.objects.create(
                    battle=battle,
                    user=request.user
                )
                
                return Response(
                    BattleSerializer(battle, context={'request': request}).data,
                    status=status.HTTP_200_OK
                )
                
            except Battle.DoesNotExist:
                return Response(
                    {'error': 'Battle not found or already started'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def ready(self, request, pk=None):
        """Mark player as ready"""
        battle = self.get_object()
        
        try:
            participant = BattleParticipant.objects.get(
                battle=battle,
                user=request.user
            )
            participant.is_ready = True
            participant.save()
            
            return Response({'status': 'ready'})
            
        except BattleParticipant.DoesNotExist:
            return Response(
                {'error': 'Not a participant in this battle'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    @action(detail=True, methods=['post'])
    def submit_answer(self, request, pk=None):
        """Submit answer for current question"""
        battle = self.get_object()
        
        if battle.status != 'active':
            return Response(
                {'error': 'Battle is not active'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        question_id = request.data.get('question_id')
        selected_options = request.data.get('selected_options', [])
        time_taken = request.data.get('time_taken', 0)
        
        if not question_id:
            return Response(
                {'error': 'Question ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            participant = BattleParticipant.objects.get(battle=battle, user=request.user)
            question = Question.objects.get(id=question_id)
            
            # Process the answer
            correct_options = question.options.filter(is_correct=True)
            selected_option_objs = Option.objects.filter(id__in=selected_options)
            is_correct = set(selected_option_objs) == set(correct_options)
            
            # Calculate score
            base_points = question.marks if is_correct else 0
            time_bonus = max(0, (battle.time_per_question - time_taken) / battle.time_per_question * 10)
            points_earned = base_points + time_bonus
            
            # Save answer
            battle_answer, created = BattleAnswer.objects.get_or_create(
                battle=battle,
                participant=participant,
                question=question
            )
            battle_answer.selected_options.set(selected_option_objs)
            battle_answer.is_correct = is_correct
            battle_answer.time_taken = time_taken
            battle_answer.save()
            
            # Update participant stats
            participant.score += points_earned
            participant.total_time += time_taken
            if is_correct:
                participant.correct_answers += 1
            participant.save()
            
            return Response({
                'is_correct': is_correct,
                'points_earned': points_earned,
                'correct_options': list(correct_options.values_list('id', flat=True)),
                'explanation': question.explanation
            })
            
        except (BattleParticipant.DoesNotExist, Question.DoesNotExist):
            return Response(
                {'error': 'Invalid battle or question'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get available battles to join"""
        available_battles = Battle.objects.filter(
            status='waiting',
            opponent__isnull=True
        ).exclude(creator=request.user).select_related('creator', 'subject')
        
        serializer = BattleSerializer(available_battles, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get user's active battles"""
        active_battles = self.get_queryset().filter(status__in=['waiting', 'active'])
        serializer = BattleSerializer(active_battles, many=True, context={'request': request})
        return Response(serializer.data)