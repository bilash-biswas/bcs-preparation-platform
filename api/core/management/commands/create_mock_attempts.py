# core/management/commands/create_mock_attempts.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random
from core.models import Quiz, QuizAttempt, UserAnswer, UserProgress
from users.models import User
from faker import Faker

fake = Faker()

class Command(BaseCommand):
    help = 'Create mock quiz attempts for existing users'
    
    def handle(self, *args, **options):
        self.stdout.write('Creating mock quiz attempts...')
        
        users = User.objects.filter(user_type='student')
        quizzes = Quiz.objects.filter(is_published=True)
        
        for user in users:
            # Create 5-15 quiz attempts per user
            num_attempts = random.randint(5, 15)
            for _ in range(num_attempts):
                quiz = random.choice(quizzes)
                self.create_quiz_attempt(user, quiz)
        
        self.stdout.write(self.style.SUCCESS('Successfully created mock quiz attempts!'))
    
    def create_quiz_attempt(self, user, quiz):
        started_at = fake.date_time_this_year()
        is_completed = random.random() > 0.2  # 80% completion rate
        
        attempt = QuizAttempt.objects.create(
            user=user,
            quiz=quiz,
            started_at=started_at,
            completed_at=started_at + timedelta(minutes=random.randint(10, quiz.time_limit)) if is_completed else None,
            score=random.uniform(quiz.total_marks * 0.3, quiz.total_marks * 0.9) if is_completed else 0,
            total_marks=quiz.total_marks,
            time_taken=random.randint(300, quiz.time_limit * 60),
            is_completed=is_completed
        )
        
        # Update user progress
        if is_completed:
            for subject in quiz.subjects.all():
                progress, created = UserProgress.objects.get_or_create(
                    user=user,
                    subject=subject,
                    defaults={
                        'total_questions': subject.questions.count(),
                        'attempted_questions': 0,
                        'correct_answers': 0,
                        'accuracy': 0
                    }
                )
                
                # Simulate some progress
                progress.attempted_questions += random.randint(5, 20)
                progress.correct_answers += random.randint(3, progress.attempted_questions)
                if progress.attempted_questions > 0:
                    progress.accuracy = (progress.correct_answers / progress.attempted_questions) * 100
                progress.last_attempt = started_at
                progress.save()