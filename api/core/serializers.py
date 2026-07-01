# core/serializers.py
from rest_framework import serializers
from .models import *
from .utils import *

class CategorySerializer(serializers.ModelSerializer):
    subject_count = serializers.IntegerField(source='cached_subject_count', read_only=True)
    question_count = serializers.IntegerField(source='cached_question_count', read_only=True)
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'description', 'icon', 'color', 
            'created_at', 'subject_count', 'question_count'
        ]

class SubjectSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    total_questions = serializers.SerializerMethodField()
    
    class Meta:
        model = Subject
        fields = '__all__'
    
    def get_total_questions(self, obj):
        """Use annotated count instead of property"""
        if hasattr(obj, 'active_question_count'):
            return obj.active_question_count
        return obj.actual_total_questions

class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = '__all__'

class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    
    class Meta:
        model = Question
        fields = '__all__'

    def create(self, validated_data):
        options_data = self.initial_data.get('options', [])
        question = Question.objects.create(**validated_data)
        for option_data in options_data:
            # Safely extract fields
            opt_text = option_data.get('option_text', '')
            is_corr = option_data.get('is_correct', False)
            order = option_data.get('order', 0)
            Option.objects.create(question=question, option_text=opt_text, is_correct=is_corr, order=order)
        return question

    def update(self, instance, validated_data):
        options_data = self.initial_data.get('options', None)
        
        # Update question fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # If options are explicitly provided, replace them
        if options_data is not None:
            instance.options.all().delete()
            for option_data in options_data:
                opt_text = option_data.get('option_text', '')
                is_corr = option_data.get('is_correct', False)
                order = option_data.get('order', 0)
                Option.objects.create(question=instance, option_text=opt_text, is_correct=is_corr, order=order)
        return instance

class QuizSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True)
    
    class Meta:
        model = Quiz
        fields = '__all__'

    def create(self, validated_data):
        subjects_data = self.initial_data.get('subjects', [])
        questions_data = self.initial_data.get('questions', [])
        
        quiz = Quiz.objects.create(**validated_data)
        
        if subjects_data:
            quiz.subjects.set(subjects_data)
        if questions_data:
            quiz.questions.set(questions_data)
        return quiz

    def update(self, instance, validated_data):
        subjects_data = self.initial_data.get('subjects', None)
        questions_data = self.initial_data.get('questions', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if subjects_data is not None:
            instance.subjects.set(subjects_data)
        if questions_data is not None:
            instance.questions.set(questions_data)
        return instance


class QuizAttemptSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    quiz_details = serializers.SerializerMethodField()
    user_answers = serializers.SerializerMethodField()
    performance_stats = serializers.SerializerMethodField()
    
    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'user', 'user_name', 'quiz', 'quiz_title', 'quiz_details',
            'started_at', 'completed_at', 'score', 'total_marks', 
            'time_taken', 'is_completed', 'user_answers', 'performance_stats'
        ]
        read_only_fields = ['user', 'started_at', 'completed_at', 'score']
        
    def get_quiz_details(self, obj):
        """Safely get quiz details"""
        try:
            from .serializers import QuizSerializer
            return QuizSerializer(obj.quiz, context=self.context).data
        except Exception:
            return {}
        
    def get_user_answers(self, obj):
        """Get user answers for this attempt"""
        try:
            user_answers = obj.user_answers.all()
            return UserAnswerSerializer(user_answers, many=True).data
        except Exception:
            return []
    
    def get_performance_stats(self, obj):
        """Calculate performance statistics"""
        user_answers = obj.user_answers.all()
        total_answered = user_answers.count()
        correct_answers = user_answers.filter(is_correct=True).count()
        
        return {
            'total_answered': total_answered,
            'correct_answers': correct_answers,
            'wrong_answers': total_answered - correct_answers,
            'accuracy': round(
                (correct_answers / total_answered * 100) if total_answered > 0 else 0, 
                2
            )
        }
    
    def create(self, validated_data):
        """Automatically set the current user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class UserAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    selected_option_texts = serializers.SerializerMethodField()
    
    class Meta:
        model = UserAnswer
        fields = [
            'id', 'attempt', 'question', 'question_text', 
            'selected_options', 'selected_option_texts',
            'is_correct', 'marks_obtained', 'answered_at'
        ]
    
    def get_selected_option_texts(self, obj):
        return list(obj.selected_options.values_list('option_text', flat=True))

class UserProgressSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    category_name = serializers.CharField(source='subject.category.name', read_only=True)
    
    class Meta:
        model = UserProgress
        fields = '__all__'

class DiscussionCreateSerializer(serializers.ModelSerializer):
    title = serializers.CharField(required=False, allow_blank=True, max_length=200)

    class Meta:
        model = Discussion
        fields = ['title', 'comment', 'parent']
        read_only_fields = ['user']

    def create(self, validated_data):
        user = self.context['request'].user
        parent = validated_data.get('parent')
        title = validated_data.get('title')
        
        if not title:
            if parent:
                title = f"Reply to {parent.title}"[:200]
            else:
                title = "No Title"
                
        discussion = Discussion.objects.create(
            user=user,
            title=title,
            comment=validated_data.get('comment'),
            parent=parent
        )
        return discussion

class DiscussionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    replies = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    dislikes_count = serializers.SerializerMethodField()
    bookmarks_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_disliked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    reply_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Discussion
        fields = [
            'id', 'user', 'user_name', 'title', 'comment', 
            'created_at', 'updated_at', 'parent', 'is_active', 
            'replies', 'reply_count', 'likes_count', 'dislikes_count', 
            'bookmarks_count', 'is_liked', 'is_disliked', 'is_bookmarked'
        ]
    
    def get_replies(self, obj):
        if obj.replies.exists():
            return DiscussionSerializer(
                obj.replies.filter(is_active=True).order_by('created_at'), 
                many=True,
                context=self.context
            ).data
        return []
    
    def get_reply_count(self, obj):
        return obj.replies.filter(is_active=True).count()
    
    def get_likes_count(self, obj):
        return obj.likes.count()
    
    def get_dislikes_count(self, obj):
        return obj.dislikes.count()
    
    def get_bookmarks_count(self, obj):
        return obj.bookmarks.count()
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False
    
    def get_is_disliked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.dislikes.filter(id=request.user.id).exists()
        return False
    
    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.bookmarks.filter(id=request.user.id).exists()
        return False

class LeaderboardSerializer(serializers.ModelSerializer):
    total_score = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_attempts = serializers.IntegerField()
    average_accuracy = serializers.DecimalField(max_digits=5, decimal_places=2)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'total_score', 'total_attempts', 'average_accuracy']
        
# core/serializers.py - Add these serializers

class PracticeSessionQuestionSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    subject_name = serializers.CharField(source='question.subject.name', read_only=True)
    difficulty = serializers.CharField(source='question.difficulty', read_only=True)
    options = OptionSerializer(source='question.options', many=True, read_only=True)
    explanation = serializers.CharField(source='question.explanation', read_only=True)
    
    class Meta:
        model = PracticeSessionQuestion
        fields = '__all__'

class PracticeSessionSerializer(serializers.ModelSerializer):
    session_questions = PracticeSessionQuestionSerializer(many=True, read_only=True)
    subject_names = serializers.SerializerMethodField()
    duration_minutes = serializers.SerializerMethodField()
    accuracy = serializers.SerializerMethodField()
    
    class Meta:
        model = PracticeSession
        fields = '__all__'
    
    def get_subject_names(self, obj):
        return [subject.name for subject in obj.subjects.all()]
    
    def get_duration_minutes(self, obj):
        if obj.time_taken:
            return obj.time_taken.total_seconds() / 60
        return 0
    
    def get_accuracy(self, obj):
        if obj.completed_questions > 0:
            return (obj.correct_answers / obj.completed_questions) * 100
        return 0

class DailyStatsSerializer(serializers.ModelSerializer):
    accuracy = serializers.SerializerMethodField()
    date_formatted = serializers.DateField(source='date', format='%Y-%m-%d')
    
    class Meta:
        model = DailyStats
        fields = '__all__'
    
    def get_accuracy(self, obj):
        if obj.questions_attempted > 0:
            return (obj.correct_answers / obj.questions_attempted) * 100
        return 0

class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = '__all__'

# Enhanced UserProgressSerializer
class UserProgressSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    category_name = serializers.CharField(source='subject.category.name', read_only=True)
    easy_accuracy = serializers.SerializerMethodField()
    medium_accuracy = serializers.SerializerMethodField()
    hard_accuracy = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProgress
        fields = '__all__'
    
    def get_easy_accuracy(self, obj):
        if obj.easy_attempted > 0:
            return (obj.easy_correct / obj.easy_attempted) * 100
        return 0
    
    def get_medium_accuracy(self, obj):
        if obj.medium_attempted > 0:
            return (obj.medium_correct / obj.medium_attempted) * 100
        return 0
    
    def get_hard_accuracy(self, obj):
        if obj.hard_attempted > 0:
            return (obj.hard_correct / obj.hard_attempted) * 100
        return 0
    
    
# core/serializers.py
class QuizSessionSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source='creator.username', read_only=True)
    participant_count = serializers.SerializerMethodField()
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    can_join = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = QuizSession
        fields = '__all__'
    
    def get_participant_count(self, obj):
        return obj.participants.count()

class QuizParticipantSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    session_title = serializers.CharField(source='session.title', read_only=True)
    
    class Meta:
        model = QuizParticipant
        fields = '__all__'

class QuizInvitationSerializer(serializers.ModelSerializer):
    session_title = serializers.CharField(source='session.title', read_only=True)
    creator_name = serializers.CharField(source='session.creator.username', read_only=True)
    
    class Meta:
        model = QuizInvitation
        fields = '__all__'

class CreateQuizSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizSession
        fields = ['title', 'description', 'quiz', 'scheduled_start', 'duration', 'max_participants', 'is_public']
    
    def validate_scheduled_start(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("Scheduled start must be in the future")
        return value

class JoinQuizSessionSerializer(serializers.Serializer):
    session_code = serializers.CharField(max_length=10)
    
    
# core/extended_serializers.py
class AdvancedAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdvancedAnalytics
        fields = '__all__'

class LearningRecommendationSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    category_name = serializers.CharField(source='subject.category.name', read_only=True)
    
    class Meta:
        model = LearningRecommendation
        fields = '__all__'

class SmartStudyPlanSerializer(serializers.ModelSerializer):
    subject_names = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    
    class Meta:
        model = SmartStudyPlan
        fields = '__all__'
    
    def get_subject_names(self, obj):
        return [subject.name for subject in obj.subjects.all()]
    
    def get_progress(self, obj):
        # Calculate study plan progress
        return calculate_study_plan_progress(obj)

class UserBadgeSerializer(serializers.ModelSerializer):
    badge_name = serializers.SerializerMethodField()
    badge_description = serializers.SerializerMethodField()
    
    class Meta:
        model = UserBadge
        fields = '__all__'
    
    def get_badge_name(self, obj):
        return dict(UserBadge._meta.get_field('badge_type').choices).get(obj.badge_type)
    
    def get_badge_description(self, obj):
        """Return descriptive text for each badge type"""
        descriptions = {
            'streak_master': 'Awarded for maintaining consistent study streaks',
            'speed_demon': 'Awarded for quick and accurate question answering',
            'perfectionist': 'Awarded for achieving high accuracy scores',
            'explorer': 'Awarded for exploring different subjects and topics',
            'challenger': 'Awarded for completing difficult challenges'
        }
        return descriptions.get(obj.badge_type, 'An achievement badge')

class StudyGroupSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source='creator.username', read_only=True)
    member_count = serializers.SerializerMethodField()
    subject_names = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    
    class Meta:
        model = StudyGroup
        fields = '__all__'
    
    def get_member_count(self, obj):
        return obj.groupmember_set.count()
    
    def get_subject_names(self, obj):
        return [subject.name for subject in obj.subjects.all()]
    
    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.groupmember_set.filter(user=request.user).exists()
        return False

class AdaptiveQuestionSerializer(serializers.ModelSerializer):
    question_details = QuestionSerializer(source='base_question', read_only=True)
    
    class Meta:
        model = AdaptiveQuestion
        fields = '__all__'
        

# core/extended_serializers.py
# serializers.py - Update ExamSimulationSerializer
class ExamSimulationSerializer(serializers.ModelSerializer):
    subjects = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Subject.objects.all(),
        required=True
    )
    subject_names = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    time_remaining = serializers.SerializerMethodField()
    question_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ExamSimulation
        fields = [
            'id', 'user', 'name', 'subjects', 'duration', 'total_questions',
            'question_breakdown', 'strict_timing', 'show_results_after',
            'created_at', 'subject_names', 'progress', 'time_remaining', 'question_count'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'subject_names', 'progress', 'time_remaining', 'question_count']
    
    def get_subject_names(self, obj):
        return [subject.name for subject in obj.subjects.all()]
    
    def get_progress(self, obj):
        return 0  # Placeholder
    
    def get_time_remaining(self, obj):
        if obj.created_at:
            elapsed = timezone.now() - obj.created_at
            total_seconds = obj.duration * 60
            remaining = max(0, total_seconds - elapsed.total_seconds())
            return remaining
        return obj.duration * 60
    
    def get_question_count(self, obj):
        return obj.questions.count()
    
    def create(self, validated_data):
        print("🔧 Serializer create - validated_data:", validated_data)
        
        subjects_data = validated_data.pop('subjects', [])
        exam_simulation = ExamSimulation.objects.create(**validated_data)
        exam_simulation.subjects.set(subjects_data)
        
        print(f"✅ Created exam simulation with {len(subjects_data)} subjects")
        return exam_simulation

class ChallengeSerializer(serializers.ModelSerializer):
    time_remaining = serializers.SerializerMethodField()
    participant_count = serializers.SerializerMethodField()
    is_joined = serializers.SerializerMethodField()
    
    class Meta:
        model = Challenge
        fields = '__all__'
    
    def get_time_remaining(self, obj):
        now = timezone.now()
        if now > obj.end_date:
            return "Ended"
        remaining = obj.end_date - now
        days = remaining.days
        hours = remaining.seconds // 3600
        return f"{days}d {hours}h"
    
    def get_participant_count(self, obj):
        return obj.userchallenge_set.count()
    
    def get_is_joined(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.userchallenge_set.filter(user=request.user).exists()
        return False

class UserChallengeSerializer(serializers.ModelSerializer):
    challenge_title = serializers.CharField(source='challenge.title', read_only=True)
    challenge_description = serializers.CharField(source='challenge.description', read_only=True)
    challenge_type = serializers.CharField(source='challenge.challenge_type', read_only=True)
    reward_points = serializers.IntegerField(source='challenge.reward_points', read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = UserChallenge
        fields = '__all__'
    
    def get_progress_percentage(self, obj):
        # Calculate progress based on challenge requirements
        requirements = obj.challenge.requirements
        progress = obj.progress or {}
        
        if 'target_questions' in requirements:
            target = requirements['target_questions']
            completed = progress.get('questions_completed', 0)
            return min(100, (completed / target) * 100)
        elif 'target_accuracy' in requirements:
            target = requirements['target_accuracy']
            current = progress.get('current_accuracy', 0)
            return min(100, (current / target) * 100)
        
        return 0

class GroupActivitySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.SerializerMethodField()
    activity_description = serializers.SerializerMethodField()
    
    class Meta:
        model = GroupActivity
        fields = '__all__'
    
    def get_user_avatar(self, obj):
        # Return user avatar URL if available
        return f"/media/avatars/{obj.user.username}.jpg"  # Placeholder
    
    def get_activity_description(self, obj):
        activity_descriptions = {
            'quiz_completed': 'completed a quiz',
            'achievement_unlocked': 'unlocked an achievement',
            'discussion_created': 'started a discussion',
            'milestone_reached': 'reached a milestone'
        }
        base_description = activity_descriptions.get(obj.activity_type, 'did something')
        
        # Add details if available
        details = obj.details or {}
        if 'quiz_score' in details:
            return f"scored {details['quiz_score']} on a quiz"
        elif 'achievement_name' in details:
            return f"unlocked '{details['achievement_name']}' achievement"
        
        return base_description
    
    
# core/serializers.py - Add these serializers

class BattleParticipantSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = BattleParticipant
        fields = ['id', 'user', 'user_name', 'user_avatar', 'score', 'correct_answers', 'total_time', 'is_ready']
    
    def get_user_avatar(self, obj):
        # Return user avatar URL if available
        return f"/media/avatars/{obj.user.username}.jpg"  # Placeholder

class BattleAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    selected_option_texts = serializers.SerializerMethodField()
    
    class Meta:
        model = BattleAnswer
        fields = ['id', 'question', 'question_text', 'selected_options', 'selected_option_texts', 
                'is_correct', 'time_taken', 'answered_at']
    
    def get_selected_option_texts(self, obj):
        return list(obj.selected_options.values_list('option_text', flat=True))

class BattleSerializer(serializers.ModelSerializer):
    creator_name = serializers.CharField(source='creator.username', read_only=True)
    opponent_name = serializers.CharField(source='opponent.username', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    participants = BattleParticipantSerializer(many=True, read_only=True)
    current_question = serializers.SerializerMethodField()
    battle_stats = serializers.SerializerMethodField()
    time_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = Battle
        fields = ['id', 'battle_type', 'status', 'battle_code', 'creator', 'creator_name', 
                 'opponent', 'opponent_name', 'subject', 'subject_name', 'question_count',
                 'time_per_question', 'difficulty', 'current_question_index', 'participants',
                 'current_question', 'battle_stats', 'time_remaining', 'created_at', 
                 'started_at', 'completed_at']
    
    def get_current_question(self, obj):
        """Get current question details"""
        if obj.status == 'active' and obj.questions.exists():
            try:
                battle_question = BattleQuestion.objects.filter(
                    battle=obj, 
                    order=obj.current_question_index
                ).first()
                if battle_question:
                    question = battle_question.question
                    return {
                        'id': question.id,
                        'question_text': question.question_text,
                        'question_type': question.question_type,
                        'difficulty': question.difficulty,
                        'explanation': question.explanation,
                        'marks': question.marks,
                        'options': OptionSerializer(question.options.all(), many=True).data
                    }
            except BattleQuestion.DoesNotExist:
                pass
        return None
    
    def get_battle_stats(self, obj):
        """Get battle statistics"""
        if obj.status == 'completed':
            participants = obj.participants.all()
            return {
                'winner': self.get_winner(obj),
                'scores': {
                    participant.user.username: participant.score 
                    for participant in participants
                },
                'correct_answers': {
                    participant.user.username: participant.correct_answers 
                    for participant in participants
                }
            }
        return None
    
    def get_winner(self, obj):
        """Determine battle winner"""
        participants = obj.participants.all().order_by('-score', 'total_time')
        if participants.count() >= 2:
            top_player = participants[0]
            second_player = participants[1]
            
            if top_player.score > second_player.score:
                return top_player.user.username
            elif top_player.score == second_player.score:
                if top_player.total_time < second_player.total_time:
                    return top_player.user.username
                else:
                    return second_player.user.username
        return None
    
    def get_time_remaining(self, obj):
        """Calculate time remaining for current question"""
        if obj.status == 'active' and obj.started_at:
            elapsed = (timezone.now() - obj.started_at).total_seconds()
            question_elapsed = elapsed % obj.time_per_question
            return max(0, obj.time_per_question - question_elapsed)
        return None

class CreateBattleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Battle
        fields = ['battle_type', 'subject', 'question_count', 'time_per_question', 'difficulty']
    
    def validate_question_count(self, value):
        if value < 5 or value > 50:
            raise serializers.ValidationError("Question count must be between 5 and 50")
        return value
    
    def validate_time_per_question(self, value):
        if value < 10 or value > 120:
            raise serializers.ValidationError("Time per question must be between 10 and 120 seconds")
        return value

class JoinBattleSerializer(serializers.Serializer):
    battle_code = serializers.CharField(max_length=8)

class BattleQuestionSerializer(serializers.ModelSerializer):
    question_details = QuestionSerializer(source='question', read_only=True)
    
    class Meta:
        model = BattleQuestion
        fields = ['id', 'order', 'question_details']