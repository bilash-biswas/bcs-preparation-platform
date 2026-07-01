# core/models.py
from datetime import timedelta
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=7, default='#000000')
    created_at = models.DateTimeField(auto_now_add=True)
    
    cached_subject_count = models.IntegerField(default=0)
    cached_question_count = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['name']
        verbose_name_plural = "Categories"
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return self.name

class Subject(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subjects')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    total_questions = models.IntegerField(default=0)
    priority = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['priority', 'name']
        indexes = [
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['name']),
            models.Index(fields=['priority', 'is_active']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.category.name} - {self.name}"
    
    @property
    def actual_total_questions(self):
        """Dynamically calculate total questions from related Question objects"""
        return self.questions.filter(is_active=True).count()
    
    @property
    def difficulty_distribution(self):
        """Calculate difficulty distribution for this subject"""
        from django.db.models import Count
        distribution = self.questions.filter(is_active=True).values('difficulty').annotate(
            count=Count('id')
        )
        result = {'easy': 0, 'medium': 0, 'hard': 0}
        for item in distribution:
            result[item['difficulty']] = item['count']
        return result

class Question(models.Model):
    QUESTION_TYPES = [
        ('mcq', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('fill_blank', 'Fill in the Blank'),
    ]
    
    DIFFICULTY_LEVELS = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='mcq')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_LEVELS, default='medium')
    explanation = models.TextField(blank=True)
    marks = models.IntegerField(default=1)
    negative_marks = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['subject', 'is_active']),
            models.Index(fields=['difficulty', 'is_active']),
            models.Index(fields=['question_type', 'is_active']),
            models.Index(fields=['is_active']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.subject.name} - {self.question_text[:50]}"

class Option(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    option_text = models.TextField()
    is_correct = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, null=True)  # Fixed: removed default
    
    class Meta:
        ordering = ['order', 'created_at']
        indexes = [
            models.Index(fields=['question']),
            models.Index(fields=['is_correct']),
            models.Index(fields=['question', 'is_correct']),
        ]
    
    def __str__(self):
        return f"{self.question.question_text[:30]} - {self.option_text[:30]}"

class Quiz(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    subjects = models.ManyToManyField(Subject, related_name='quizzes')
    total_questions = models.IntegerField(default=0)
    time_limit = models.IntegerField(default=30)  # in minutes
    total_marks = models.IntegerField(default=0)
    negative_marking = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    questions = models.ManyToManyField(
        'Question', 
        related_name='quizzes',
        blank=True
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Quizzes"
        indexes = [
            models.Index(fields=['is_published']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return self.title

class QuizAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    total_marks = models.IntegerField(default=0)
    time_taken = models.IntegerField(default=0)  # in seconds
    is_completed = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['user', 'is_completed']),
            models.Index(fields=['user', 'quiz']),
            models.Index(fields=['is_completed', 'completed_at']),
            models.Index(fields=['started_at']),
            models.Index(fields=['completed_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.quiz.title}"

class UserAnswer(models.Model):
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='user_answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_options = models.ManyToManyField(Option)
    is_correct = models.BooleanField(default=False)
    marks_obtained = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    answered_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-answered_at']
        indexes = [
            models.Index(fields=['attempt']),
            models.Index(fields=['question']),
            models.Index(fields=['is_correct']),
            models.Index(fields=['answered_at']),
        ]
    
    def __str__(self):
        return f"{self.attempt.user.username} - {self.question.question_text[:30]}"


# core/models.py - Ensure Discussion model is correct
class Discussion(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    comment = models.TextField()
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Engagement fields
    likes = models.ManyToManyField(User, related_name='liked_discussions', blank=True)
    dislikes = models.ManyToManyField(User, related_name='disliked_discussions', blank=True)
    bookmarks = models.ManyToManyField(User, related_name='bookmarked_discussions', blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['parent', 'is_active']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['is_active', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.title[:50]}"
    
    @property
    def likes_count(self):
        return self.likes.count()
    
    @property
    def dislikes_count(self):
        return self.dislikes.count()
    
    @property
    def bookmarks_count(self):
        return self.bookmarks.count()
    
    
class PracticeSession(models.Model):
    SESSION_TYPES = [
        ('practice', 'Practice Session'),
        ('quiz', 'Quiz Session'),
        ('mock', 'Mock Test'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='practice_sessions')
    session_type = models.CharField(max_length=20, choices=SESSION_TYPES, default='practice')
    subjects = models.ManyToManyField(Subject, related_name='practice_sessions')
    total_questions = models.IntegerField(default=0)
    completed_questions = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    wrong_answers = models.IntegerField(default=0)
    score = models.FloatField(default=0.0)  # Percentage score
    time_taken = models.DurationField(null=True, blank=True)  # Total time taken
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    
    # Session settings
    difficulty = models.CharField(max_length=10, choices=[
        ('all', 'All Levels'),
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ], default='all')
    
    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['user', 'is_completed']),
            models.Index(fields=['user', 'session_type']),
            models.Index(fields=['is_completed', 'completed_at']),
            models.Index(fields=['started_at']),
            models.Index(fields=['completed_at']),
            models.Index(fields=['score']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.session_type} - {self.started_at.strftime('%Y-%m-%d %H:%M')}"
    
    def calculate_score(self):
        if self.total_questions > 0:
            self.score = (self.correct_answers / self.total_questions) * 100
        return self.score
    
    def mark_completed(self):
        self.completed_at = timezone.now()
        self.is_completed = True
        self.calculate_score()
        self.save()

class PracticeSessionQuestion(models.Model):
    session = models.ForeignKey(PracticeSession, on_delete=models.CASCADE, related_name='session_questions')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    user_answer = models.ForeignKey(Option, on_delete=models.SET_NULL, null=True, blank=True)
    is_correct = models.BooleanField(default=False)
    time_taken = models.DurationField(null=True, blank=True)  # Time for this specific question
    answered_at = models.DateTimeField(auto_now_add=True)
    sequence_order = models.IntegerField(default=0)  # Order in which question was presented
    
    class Meta:
        ordering = ['sequence_order']
        unique_together = ['session', 'question']
        indexes = [
            models.Index(fields=['session']),
            models.Index(fields=['question']),
            models.Index(fields=['user_answer']),
            models.Index(fields=['is_correct']),
            models.Index(fields=['session', 'is_correct']),
            models.Index(fields=['session', 'user_answer']),
        ]
    
    def __str__(self):
        return f"Session {self.session.id} - Q{self.sequence_order} - {'Correct' if self.is_correct else 'Wrong'}"

class DailyStats(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_stats')
    date = models.DateField(default=timezone.now)
    
    # Daily activity
    sessions_completed = models.IntegerField(default=0)
    questions_attempted = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    time_spent = models.DurationField(default=timezone.timedelta(0))  # Total time spent
    
    # Goals and achievements
    daily_goal_met = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']
        verbose_name_plural = "Daily Stats"
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['date']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.date} - {self.questions_attempted} questions"

class Achievement(models.Model):
    ACHIEVEMENT_TYPES = [
        ('streak', 'Streak'),
        ('accuracy', 'Accuracy'),
        ('practice', 'Practice'),
        ('mastery', 'Mastery'),
        ('consistency', 'Consistency'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    achievement_type = models.CharField(max_length=20, choices=ACHIEVEMENT_TYPES)
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50, blank=True)  # Icon class or URL
    unlocked_at = models.DateTimeField(auto_now_add=True)
    progress = models.FloatField(default=0.0)  # 0-100 percentage
    is_unlocked = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-unlocked_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"

class UserProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    total_questions = models.IntegerField(default=0)
    attempted_questions = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    accuracy = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    last_attempt = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # NEW FIELDS FOR ENHANCED TRACKING
    # Difficulty-wise statistics
    easy_attempted = models.IntegerField(default=0)
    easy_correct = models.IntegerField(default=0)
    medium_attempted = models.IntegerField(default=0)
    medium_correct = models.IntegerField(default=0)
    hard_attempted = models.IntegerField(default=0)
    hard_correct = models.IntegerField(default=0)
    
    # Time and performance metrics
    average_time_per_question = models.FloatField(default=0.0)  # In seconds
    total_time_spent = models.DurationField(default=timezone.timedelta(0))
    
    # Streak and consistency
    current_streak = models.IntegerField(default=0)
    best_streak = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-updated_at']
        unique_together = ['user', 'subject']
        verbose_name_plural = "User Progress"
        
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['subject']),
            models.Index(fields=['accuracy']),
            models.Index(fields=['last_attempt']),
            models.Index(fields=['user', 'subject']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.subject.name} - {self.accuracy}%"
    
    def calculate_accuracy(self):
        if self.attempted_questions > 0:
            self.accuracy = (self.correct_answers / self.attempted_questions) * 100
        return self.accuracy
    
    def update_streak(self):
        today = timezone.now().date()
        if self.last_attempt and self.last_attempt.date() == today:
            return  # Already updated today
        
        if self.last_attempt and (today - self.last_attempt.date()).days == 1:
            self.current_streak += 1
        else:
            self.current_streak = 1
        
        if self.current_streak > self.best_streak:
            self.best_streak = self.current_streak
        
        self.last_attempt = timezone.now()
        self.save()
        
        
class QuizSession(models.Model):
    SESSION_STATUS = [
        ('created', 'Created'),
        ('scheduled', 'Scheduled'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_quiz_sessions')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='quiz_sessions')
    scheduled_start = models.DateTimeField()
    duration = models.IntegerField(default=30)  # in minutes
    max_participants = models.IntegerField(default=50)
    session_code = models.CharField(max_length=10, unique=True)  # For joining
    status = models.CharField(max_length=20, choices=SESSION_STATUS, default='created')
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session_code']),
            models.Index(fields=['creator', 'status']),
            models.Index(fields=['scheduled_start', 'status']),
        ]
    
    def __str__(self):
        return f"{self.title} by {self.creator.username}"
    
    def save(self, *args, **kwargs):
        if not self.session_code:
            self.session_code = self.generate_session_code()
        super().save(*args, **kwargs)
    
    def generate_session_code(self):
        import random
        import string
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        while QuizSession.objects.filter(session_code=code).exists():
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return code
    
    @property
    def is_active(self):
        return self.status == 'active'
    
    @property
    def can_join(self):
        return self.status in ['created', 'scheduled'] and self.participants.count() < self.max_participants

class QuizParticipant(models.Model):
    PARTICIPANT_STATUS = [
        ('invited', 'Invited'),
        ('joined', 'Joined'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('left', 'Left'),
    ]
    
    session = models.ForeignKey(QuizSession, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_participations')
    status = models.CharField(max_length=20, choices=PARTICIPANT_STATUS, default='invited')
    joined_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    time_taken = models.IntegerField(default=0)  # in seconds
    
    class Meta:
        unique_together = ['session', 'user']
        indexes = [
            models.Index(fields=['session', 'user']),
            models.Index(fields=['user', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.username} in {self.session.title}"

class QuizInvitation(models.Model):
    session = models.ForeignKey(QuizSession, on_delete=models.CASCADE, related_name='invitations')
    email = models.EmailField()
    token = models.CharField(max_length=50, unique=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    accepted = models.BooleanField(default=False)
    accepted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['session', 'email']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['email', 'accepted']),
        ]
    
    def __str__(self):
        return f"Invitation for {self.email} to {self.session.title}"
    
# core/analytics_models.py
class AdvancedAnalytics(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    
    # Learning patterns
    peak_study_hours = models.JSONField(default=dict)  # {"hour": count}
    preferred_difficulty = models.CharField(max_length=10, blank=True)
    average_session_duration = models.DurationField(null=True)
    
    # Performance metrics
    improvement_rate = models.FloatField(default=0.0)  # % improvement over time
    consistency_score = models.FloatField(default=0.0)  # 0-100 score
    knowledge_gaps = models.JSONField(default=list)  # Weak areas
    
    class Meta:
        unique_together = ['user', 'date']

class ComparativeAnalytics(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    metric_type = models.CharField(max_length=50)  # 'accuracy', 'speed', etc.
    user_score = models.FloatField()
    average_score = models.FloatField()  # Compared to peers
    percentile = models.FloatField()  # User's percentile
    created_at = models.DateTimeField(auto_now_add=True)    
    

# core/recommendation_models.py
class LearningRecommendation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    recommendation_type = models.CharField(max_length=50, choices=[
        ('weak_area', 'Weak Area Practice'),
        ('revision', 'Revision'),
        ('challenge', 'Challenge'),
        ('concept', 'Concept Mastery')
    ])
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    priority = models.IntegerField(default=0)  # 1-10 priority score
    confidence_score = models.FloatField(default=0.0)  # AI confidence
    reason = models.TextField()  # Why this recommendation
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-priority', '-confidence_score']

class SmartStudyPlan(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    subjects = models.ManyToManyField(Subject)
    duration_days = models.IntegerField(default=7)
    daily_goal = models.IntegerField(default=20)  # Questions per day
    difficulty_progression = models.JSONField(default=dict)  # Difficulty schedule
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)


# core/gamification_models.py
class UserBadge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    badge_type = models.CharField(max_length=50, choices=[
        ('streak_master', 'Streak Master'),
        ('speed_demon', 'Speed Demon'),
        ('perfectionist', 'Perfectionist'),
        ('explorer', 'Explorer'),
        ('challenger', 'Challenger')
    ])
    level = models.IntegerField(default=1)
    progress = models.FloatField(default=0.0)
    unlocked_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'badge_type']

class Challenge(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    challenge_type = models.CharField(max_length=50, choices=[
        ('daily', 'Daily Challenge'),
        ('weekly', 'Weekly Challenge'),
        ('monthly', 'Monthly Challenge'),
        ('special', 'Special Event')
    ])
    requirements = models.JSONField(default=dict)  # Challenge criteria
    reward_points = models.IntegerField(default=0)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)

class UserChallenge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE)
    progress = models.JSONField(default=dict)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    reward_claimed = models.BooleanField(default=False)
    

# core/social_models.py
class StudyGroup(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_groups')
    subjects = models.ManyToManyField(Subject)
    max_members = models.IntegerField(default=10)
    is_public = models.BooleanField(default=True)
    invite_code = models.CharField(max_length=10, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

class GroupMember(models.Model):
    group = models.ForeignKey(StudyGroup, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=[
        ('admin', 'Admin'),
        ('moderator', 'Moderator'),
        ('member', 'Member')
    ], default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

class GroupActivity(models.Model):
    group = models.ForeignKey(StudyGroup, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    activity_type = models.CharField(max_length=50, choices=[
        ('quiz_completed', 'Quiz Completed'),
        ('achievement_unlocked', 'Achievement Unlocked'),
        ('discussion_created', 'Discussion Created'),
        ('milestone_reached', 'Milestone Reached')
    ])
    details = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    


class AdaptiveSession(models.Model):
    """Model to track adaptive learning sessions"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    subject = models.ForeignKey('Subject', on_delete=models.CASCADE)
    total_questions = models.IntegerField(default=10)
    questions_answered = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    ability_estimate = models.FloatField(default=0.5)  # 0.0 to 1.0
    session_data = models.JSONField(default=dict)  # Store session progress
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.subject.name} - {self.started_at}"
    
    @property
    def score(self):
        if self.questions_answered == 0:
            return 0
        return (self.correct_answers / self.questions_answered) * 100
    
    @property
    def duration(self):
        if self.completed_at:
            return self.completed_at - self.started_at
        return timezone.now() - self.started_at


class AdaptiveQuestion(models.Model):
    """Model for adaptive learning questions with adjusted difficulty"""
    base_question = models.ForeignKey('Question', on_delete=models.CASCADE)
    session = models.ForeignKey(AdaptiveSession, on_delete=models.CASCADE, null=True, blank=True)
    difficulty_adjustment = models.FloatField(default=1.0)  # AI-adjusted difficulty
    user_ability_estimate = models.FloatField(default=0.0)  # IRT ability estimate at question time
    response_time_threshold = models.FloatField(null=True, blank=True)  # Expected time in seconds
    presented_at = models.DateTimeField(default=timezone.now)  # Use default instead of auto_now_add
    was_answered_correctly = models.BooleanField(null=True, blank=True)
    actual_response_time = models.FloatField(null=True, blank=True)  # Actual time taken
    
    class Meta:
        ordering = ['-presented_at']
    
    def __str__(self):
        return f"Adaptive: {self.base_question.id} - Ability: {self.user_ability_estimate:.2f}"

class QuizTemplate(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    settings = models.JSONField(default=dict)  # Template configuration
    is_public = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

# models.py - Update ExamSimulation model
class ExamSimulation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    subjects = models.ManyToManyField(Subject)
    duration = models.IntegerField()  # Minutes
    total_questions = models.IntegerField()
    question_breakdown = models.JSONField(default=dict)  # Difficulty distribution
    strict_timing = models.BooleanField(default=True)
    show_results_after = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Add questions field to store selected questions for the exam
    questions = models.ManyToManyField('Question', through='ExamQuestion', blank=True)
    
    def __str__(self):
        return f"{self.name} - {self.user.username}"

class ExamQuestion(models.Model):
    """Through model for exam simulation questions"""
    exam_simulation = models.ForeignKey(ExamSimulation, on_delete=models.CASCADE)
    question = models.ForeignKey('Question', on_delete=models.CASCADE)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
        unique_together = ['exam_simulation', 'question']
        
        
# core/models.py - Add these models

class Battle(models.Model):
    BATTLE_STATUS = [
        ('waiting', 'Waiting for Opponent'),
        ('active', 'Battle Active'),
        ('completed', 'Battle Completed'),
        ('cancelled', 'Battle Cancelled'),
    ]
    
    BATTLE_TYPES = [
        ('quick', 'Quick Match'),
        ('ranked', 'Ranked Battle'),
        ('friendly', 'Friendly Battle'),
    ]
    
    # Battle details
    battle_type = models.CharField(max_length=20, choices=BATTLE_TYPES, default='quick')
    status = models.CharField(max_length=20, choices=BATTLE_STATUS, default='waiting')
    battle_code = models.CharField(max_length=8, unique=True)
    
    # Players
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_battles')
    opponent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='joined_battles', null=True, blank=True)
    
    # Battle settings
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, null=True, blank=True)
    question_count = models.IntegerField(default=10)
    time_per_question = models.IntegerField(default=30)  # seconds
    difficulty = models.CharField(max_length=10, choices=Question.DIFFICULTY_LEVELS, default='medium')
    
    # Battle state
    current_question_index = models.IntegerField(default=0)
    questions = models.ManyToManyField(Question, through='BattleQuestion')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['battle_code']),
            models.Index(fields=['status', 'battle_type']),
            models.Index(fields=['creator', 'status']),
        ]
    
    def __str__(self):
        return f"Battle {self.battle_code} - {self.creator.username} vs {self.opponent.username if self.opponent else 'Waiting'}"
    
    def save(self, *args, **kwargs):
        if not self.battle_code:
            self.battle_code = self.generate_battle_code()
        super().save(*args, **kwargs)
    
    def generate_battle_code(self):
        import random
        import string
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        while Battle.objects.filter(battle_code=code).exists():
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return code
    
    @property
    def is_full(self):
        return self.opponent is not None
    
    @property
    def can_start(self):
        return self.is_full and self.status == 'waiting'
    
    def get_players(self):
        return [self.creator, self.opponent] if self.opponent else [self.creator]
    
    def get_opponent(self, user):
        if user == self.creator:
            return self.opponent
        elif user == self.opponent:
            return self.creator
        return None

class BattleQuestion(models.Model):
    """Through model for battle questions with order"""
    battle = models.ForeignKey(Battle, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']
        unique_together = ['battle', 'question']

class BattleParticipant(models.Model):
    """Track participant progress and scores"""
    battle = models.ForeignKey(Battle, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    score = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    total_time = models.FloatField(default=0.0)  # Total time taken in seconds
    is_ready = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['battle', 'user']
    
    def __str__(self):
        return f"{self.user.username} in Battle {self.battle.battle_code}"

class BattleAnswer(models.Model):
    """Track answers for each question in battle"""
    battle = models.ForeignKey(Battle, on_delete=models.CASCADE)
    participant = models.ForeignKey(BattleParticipant, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_options = models.ManyToManyField(Option)
    is_correct = models.BooleanField(default=False)
    time_taken = models.FloatField(default=0.0)  # Time taken for this question
    answered_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['battle', 'participant', 'question']
        indexes = [
            models.Index(fields=['battle', 'participant']),
            models.Index(fields=['is_correct']),
        ]
    
    def __str__(self):
        return f"{self.participant.user.username} - Q{self.question.id} - {'Correct' if self.is_correct else 'Wrong'}"