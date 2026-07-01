# # core/admin.py
# from django.contrib import admin
# from django.utils.html import format_html
# from .models import *

# class OptionInline(admin.TabularInline):
#     model = Option
#     extra = 4
#     min_num = 2
#     max_num = 6

# class UserAnswerInline(admin.TabularInline):
#     model = UserAnswer
#     extra = 0
#     readonly_fields = ['answered_at']
#     can_delete = False

# @admin.register(Category)
# class CategoryAdmin(admin.ModelAdmin):
#     list_display = ['name', 'subject_count', 'total_questions', 'created_at']
#     list_filter = ['created_at']
#     search_fields = ['name', 'description']
#     readonly_fields = ['created_at']
#     fieldsets = (
#         ('Basic Information', {
#             'fields': ('name', 'description', 'icon', 'color')
#         }),
#         ('Metadata', {
#             'fields': ('created_at',),
#             'classes': ('collapse',)
#         }),
#     )

#     def subject_count(self, obj):
#         return obj.subjects.count()
#     subject_count.short_description = 'Subjects'

#     def total_questions(self, obj):
#         return Question.objects.filter(subject__category=obj, is_active=True).count()
#     total_questions.short_description = 'Total Questions'

# @admin.register(Subject)
# class SubjectAdmin(admin.ModelAdmin):
#     list_display = ['name', 'category', 'total_questions', 'priority', 'is_active']
#     list_filter = ['category', 'is_active']
#     search_fields = ['name', 'description']
#     list_editable = ['priority', 'is_active']
#     fieldsets = (
#         ('Basic Information', {
#             'fields': ('category', 'name', 'description')
#         }),
#         ('Settings', {
#             'fields': ('total_questions', 'priority', 'is_active')
#         }),
#     )

#     def get_queryset(self, request):
#         return super().get_queryset(request).select_related('category')

# @admin.register(Question)
# class QuestionAdmin(admin.ModelAdmin):
#     list_display = ['truncated_question_text', 'subject', 'question_type', 'difficulty', 'marks', 'is_active', 'created_at']
#     list_filter = ['subject', 'question_type', 'difficulty', 'is_active', 'created_at']
#     search_fields = ['question_text', 'explanation']
#     list_editable = ['is_active', 'marks']
#     readonly_fields = ['created_at', 'updated_at']
#     inlines = [OptionInline]
#     fieldsets = (
#         ('Basic Information', {
#             'fields': ('subject', 'question_text', 'question_type', 'difficulty')
#         }),
#         ('Scoring', {
#             'fields': ('marks', 'negative_marks')
#         }),
#         ('Additional Information', {
#             'fields': ('explanation', 'is_active')
#         }),
#         ('Metadata', {
#             'fields': ('created_at', 'updated_at'),
#             'classes': ('collapse',)
#         }),
#     )

#     def truncated_question_text(self, obj):
#         return obj.question_text[:100] + '...' if len(obj.question_text) > 100 else obj.question_text
#     truncated_question_text.short_description = 'Question Text'

#     def get_queryset(self, request):
#         return super().get_queryset(request).select_related('subject')

# class SubjectInline(admin.TabularInline):
#     model = Quiz.subjects.through
#     extra = 1
#     verbose_name = "Subject"
#     verbose_name_plural = "Subjects"

# @admin.register(Quiz)
# class QuizAdmin(admin.ModelAdmin):
#     list_display = ['title', 'total_questions', 'time_limit', 'total_marks', 'negative_marking', 'is_published', 'created_at']
#     list_filter = ['is_published', 'negative_marking', 'created_at']
#     search_fields = ['title', 'description']
#     list_editable = ['is_published', 'time_limit']
#     readonly_fields = ['created_at']
#     filter_horizontal = ['subjects']
#     fieldsets = (
#         ('Basic Information', {
#             'fields': ('title', 'description')
#         }),
#         ('Quiz Settings', {
#             'fields': ('total_questions', 'time_limit', 'total_marks', 'negative_marking')
#         }),
#         ('Publication', {
#             'fields': ('is_published',)
#         }),
#         ('Metadata', {
#             'fields': ('created_at',),
#             'classes': ('collapse',)
#         }),
#     )

#     def get_inlines(self, request, obj=None):
#         if obj:
#             return [SubjectInline]
#         return []

# @admin.register(QuizAttempt)
# class QuizAttemptAdmin(admin.ModelAdmin):
#     list_display = ['user', 'quiz', 'score', 'total_marks', 'time_taken', 'is_completed', 'started_at']
#     list_filter = ['is_completed', 'quiz', 'started_at']
#     search_fields = ['user__username', 'user__email', 'quiz__title']
#     readonly_fields = ['started_at', 'completed_at', 'time_taken']
#     inlines = [UserAnswerInline]
#     fieldsets = (
#         ('Attempt Information', {
#             'fields': ('user', 'quiz')
#         }),
#         ('Results', {
#             'fields': ('score', 'total_marks', 'time_taken', 'is_completed')
#         }),
#         ('Timestamps', {
#             'fields': ('started_at', 'completed_at'),
#             'classes': ('collapse',)
#         }),
#     )

#     def get_queryset(self, request):
#         return super().get_queryset(request).select_related('user', 'quiz')

# @admin.register(UserAnswer)
# class UserAnswerAdmin(admin.ModelAdmin):
#     list_display = ['user', 'question', 'is_correct', 'marks_obtained', 'answered_at']
#     list_filter = ['is_correct', 'answered_at']
#     search_fields = ['attempt__user__username', 'question__question_text']
#     readonly_fields = ['answered_at']
#     filter_horizontal = ['selected_options']

#     def user(self, obj):
#         return obj.attempt.user
#     user.short_description = 'User'

#     def get_queryset(self, request):
#         return super().get_queryset(request).select_related('attempt__user', 'question')

# @admin.register(UserProgress)
# class UserProgressAdmin(admin.ModelAdmin):
#     list_display = ['user', 'subject', 'attempted_questions', 'correct_answers', 'accuracy_percentage', 'last_attempt']
#     list_filter = ['subject', 'last_attempt']
#     search_fields = ['user__username', 'user__email', 'subject__name']
#     readonly_fields = ['last_attempt']
#     fieldsets = (
#         ('Progress Information', {
#             'fields': ('user', 'subject')
#         }),
#         ('Statistics', {
#             'fields': ('total_questions', 'attempted_questions', 'correct_answers', 'accuracy')
#         }),
#         ('Timestamps', {
#             'fields': ('last_attempt',),
#             'classes': ('collapse',)
#         }),
#     )

#     def accuracy_percentage(self, obj):
#         return f"{obj.accuracy:.1f}%"
#     accuracy_percentage.short_description = 'Accuracy'

#     def get_queryset(self, request):
#         return super().get_queryset(request).select_related('user', 'subject')

# # In core/admin.py - Fix the DiscussionAdmin class
# @admin.register(Discussion)
# class DiscussionAdmin(admin.ModelAdmin):
#     list_display = ['user', 'truncated_title', 'truncated_comment', 'reply_count', 'created_at']
#     list_filter = ['created_at']
#     search_fields = ['user__username', 'title', 'comment']
#     readonly_fields = ['created_at']
#     fieldsets = (
#         ('Discussion Content', {
#             'fields': ('user', 'title', 'comment', 'parent')
#         }),
#         ('Engagement', {
#             'fields': ('likes', 'dislikes', 'bookmarks'),
#             'classes': ('collapse',)
#         }),
#         ('Metadata', {
#             'fields': ('is_active', 'created_at', 'updated_at'),
#             'classes': ('collapse',)
#         }),
#     )

#     def truncated_title(self, obj):
#         return obj.title[:50] + '...' if len(obj.title) > 50 else obj.title
#     truncated_title.short_description = 'Title'

#     def truncated_comment(self, obj):
#         return obj.comment[:50] + '...' if len(obj.comment) > 50 else obj.comment
#     truncated_comment.short_description = 'Comment'

#     def reply_count(self, obj):
#         return obj.replies.count()
#     reply_count.short_description = 'Replies'

#     def get_queryset(self, request):
#         return super().get_queryset(request).select_related('user')

# @admin.register(Option)
# class OptionAdmin(admin.ModelAdmin):
#     list_display = ['truncated_option_text', 'question', 'is_correct', 'order']
#     list_filter = ['is_correct']
#     search_fields = ['option_text', 'question__question_text']
#     list_editable = ['is_correct', 'order']
#     fieldsets = (
#         ('Option Information', {
#             'fields': ('question', 'option_text', 'is_correct', 'order')
#         }),
#     )

#     def truncated_option_text(self, obj):
#         return obj.option_text[:100] + '...' if len(obj.option_text) > 100 else obj.option_text
#     truncated_option_text.short_description = 'Option Text'

#     def get_queryset(self, request):
#         return super().get_queryset(request).select_related('question')

# # Custom admin site configuration
# admin.site.site_header = "BCS Preparation Admin"
# admin.site.site_title = "BCS Preparation Admin Portal"
# admin.site.index_title = "Welcome to BCS Preparation Admin Portal"

# # Action functions
# def make_published(modeladmin, request, queryset):
#     queryset.update(is_published=True)
# make_published.short_description = "Mark selected quizzes as published"

# def make_unpublished(modeladmin, request, queryset):
#     queryset.update(is_published=False)
# make_unpublished.short_description = "Mark selected quizzes as unpublished"

# def activate_questions(modeladmin, request, queryset):
#     queryset.update(is_active=True)
# activate_questions.short_description = "Activate selected questions"

# def deactivate_questions(modeladmin, request, queryset):
#     queryset.update(is_active=False)
# deactivate_questions.short_description = "Deactivate selected questions"

# # Add actions to models
# QuizAdmin.actions = [make_published, make_unpublished]
# QuestionAdmin.actions = [activate_questions, deactivate_questions]

# # Custom filters
# class HasExplanationFilter(admin.SimpleListFilter):
#     title = 'has explanation'
#     parameter_name = 'has_explanation'

#     def lookups(self, request, model_admin):
#         return (
#             ('yes', 'Has explanation'),
#             ('no', 'No explanation'),
#         )

#     def queryset(self, request, queryset):
#         if self.value() == 'yes':
#             return queryset.exclude(explanation='')
#         if self.value() == 'no':
#             return queryset.filter(explanation='')
#         return queryset

# QuestionAdmin.list_filter += (HasExplanationFilter,)

# class CompletedAttemptFilter(admin.SimpleListFilter):
#     title = 'completion status'
#     parameter_name = 'completion_status'

#     def lookups(self, request, model_admin):
#         return (
#             ('completed', 'Completed'),
#             ('in_progress', 'In Progress'),
#         )

#     def queryset(self, request, queryset):
#         if self.value() == 'completed':
#             return queryset.filter(is_completed=True)
#         if self.value() == 'in_progress':
#             return queryset.filter(is_completed=False)
#         return queryset

# QuizAttemptAdmin.list_filter += (CompletedAttemptFilter,)


# core/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import *

class OptionInline(admin.TabularInline):
    model = Option
    extra = 4
    min_num = 2
    max_num = 6

class UserAnswerInline(admin.TabularInline):
    model = UserAnswer
    extra = 0
    readonly_fields = ['answered_at']
    can_delete = False

class PracticeSessionQuestionInline(admin.TabularInline):
    model = PracticeSessionQuestion
    extra = 0
    readonly_fields = ['answered_at']
    can_delete = False

class QuizParticipantInline(admin.TabularInline):
    model = QuizParticipant
    extra = 0
    readonly_fields = ['joined_at', 'completed_at']
    can_delete = False

class QuizInvitationInline(admin.TabularInline):
    model = QuizInvitation
    extra = 0
    readonly_fields = ['sent_at', 'accepted_at']
    can_delete = False

class GroupMemberInline(admin.TabularInline):
    model = GroupMember
    extra = 0
    readonly_fields = ['joined_at']
    can_delete = False

class ExamQuestionInline(admin.TabularInline):
    model = ExamQuestion
    extra = 0
    readonly_fields = ['created_at']
    can_delete = False

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'subject_count', 'total_questions', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'icon', 'color')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    def subject_count(self, obj):
        return obj.subjects.count()
    subject_count.short_description = 'Subjects'

    def total_questions(self, obj):
        return Question.objects.filter(subject__category=obj, is_active=True).count()
    total_questions.short_description = 'Total Questions'

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'total_questions', 'priority', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'description']
    list_editable = ['priority', 'is_active']
    fieldsets = (
        ('Basic Information', {
            'fields': ('category', 'name', 'description')
        }),
        ('Settings', {
            'fields': ('total_questions', 'priority', 'is_active')
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('category')

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['truncated_question_text', 'subject', 'question_type', 'difficulty', 'marks', 'is_active', 'created_at']
    list_filter = ['subject', 'question_type', 'difficulty', 'is_active', 'created_at']
    search_fields = ['question_text', 'explanation']
    list_editable = ['is_active', 'marks']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [OptionInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('subject', 'question_text', 'question_type', 'difficulty')
        }),
        ('Scoring', {
            'fields': ('marks', 'negative_marks')
        }),
        ('Additional Information', {
            'fields': ('explanation', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def truncated_question_text(self, obj):
        return obj.question_text[:100] + '...' if len(obj.question_text) > 100 else obj.question_text
    truncated_question_text.short_description = 'Question Text'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('subject')

class SubjectInline(admin.TabularInline):
    model = Quiz.subjects.through
    extra = 1
    verbose_name = "Subject"
    verbose_name_plural = "Subjects"

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ['title', 'total_questions', 'time_limit', 'total_marks', 'negative_marking', 'is_published', 'created_at']
    list_filter = ['is_published', 'negative_marking', 'created_at']
    search_fields = ['title', 'description']
    list_editable = ['is_published', 'time_limit']
    readonly_fields = ['created_at']
    filter_horizontal = ['subjects']
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description')
        }),
        ('Quiz Settings', {
            'fields': ('total_questions', 'time_limit', 'total_marks', 'negative_marking')
        }),
        ('Publication', {
            'fields': ('is_published',)
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    def get_inlines(self, request, obj=None):
        if obj:
            return [SubjectInline]
        return []

@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ['user', 'quiz', 'score', 'total_marks', 'time_taken', 'is_completed', 'started_at']
    list_filter = ['is_completed', 'quiz', 'started_at']
    search_fields = ['user__username', 'user__email', 'quiz__title']
    readonly_fields = ['started_at', 'completed_at', 'time_taken']
    inlines = [UserAnswerInline]
    fieldsets = (
        ('Attempt Information', {
            'fields': ('user', 'quiz')
        }),
        ('Results', {
            'fields': ('score', 'total_marks', 'time_taken', 'is_completed')
        }),
        ('Timestamps', {
            'fields': ('started_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'quiz')

@admin.register(UserAnswer)
class UserAnswerAdmin(admin.ModelAdmin):
    list_display = ['user', 'question', 'is_correct', 'marks_obtained', 'answered_at']
    list_filter = ['is_correct', 'answered_at']
    search_fields = ['attempt__user__username', 'question__question_text']
    readonly_fields = ['answered_at']
    filter_horizontal = ['selected_options']

    def user(self, obj):
        return obj.attempt.user
    user.short_description = 'User'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('attempt__user', 'question')

@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'subject', 'attempted_questions', 'correct_answers', 'accuracy_percentage', 'last_attempt']
    list_filter = ['subject', 'last_attempt']
    search_fields = ['user__username', 'user__email', 'subject__name']
    readonly_fields = ['last_attempt']
    fieldsets = (
        ('Progress Information', {
            'fields': ('user', 'subject')
        }),
        ('Statistics', {
            'fields': ('total_questions', 'attempted_questions', 'correct_answers', 'accuracy')
        }),
        ('Timestamps', {
            'fields': ('last_attempt',),
            'classes': ('collapse',)
        }),
    )

    def accuracy_percentage(self, obj):
        return f"{obj.accuracy:.1f}%"
    accuracy_percentage.short_description = 'Accuracy'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'subject')

@admin.register(Discussion)
class DiscussionAdmin(admin.ModelAdmin):
    list_display = ['user', 'truncated_title', 'truncated_comment', 'reply_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'title', 'comment']
    readonly_fields = ['created_at']
    fieldsets = (
        ('Discussion Content', {
            'fields': ('user', 'title', 'comment', 'parent')
        }),
        ('Engagement', {
            'fields': ('likes', 'dislikes', 'bookmarks'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('is_active', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def truncated_title(self, obj):
        return obj.title[:50] + '...' if len(obj.title) > 50 else obj.title
    truncated_title.short_description = 'Title'

    def truncated_comment(self, obj):
        return obj.comment[:50] + '...' if len(obj.comment) > 50 else obj.comment
    truncated_comment.short_description = 'Comment'

    def reply_count(self, obj):
        return obj.replies.count()
    reply_count.short_description = 'Replies'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(Option)
class OptionAdmin(admin.ModelAdmin):
    list_display = ['truncated_option_text', 'question', 'is_correct', 'order']
    list_filter = ['is_correct']
    search_fields = ['option_text', 'question__question_text']
    list_editable = ['is_correct', 'order']
    fieldsets = (
        ('Option Information', {
            'fields': ('question', 'option_text', 'is_correct', 'order')
        }),
    )

    def truncated_option_text(self, obj):
        return obj.option_text[:100] + '...' if len(obj.option_text) > 100 else obj.option_text
    truncated_option_text.short_description = 'Option Text'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('question')

# ========== NEW MODELS ADDED BELOW ==========

@admin.register(PracticeSession)
class PracticeSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'session_type', 'total_questions', 'completed_questions', 'score', 'is_completed', 'started_at']
    list_filter = ['session_type', 'difficulty', 'is_completed', 'started_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['started_at', 'completed_at']
    filter_horizontal = ['subjects']
    inlines = [PracticeSessionQuestionInline]
    fieldsets = (
        ('Session Information', {
            'fields': ('user', 'session_type', 'subjects', 'difficulty')
        }),
        ('Progress', {
            'fields': ('total_questions', 'completed_questions', 'correct_answers', 'wrong_answers', 'score')
        }),
        ('Timing', {
            'fields': ('time_taken',)
        }),
        ('Status', {
            'fields': ('is_completed', 'started_at', 'completed_at')
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(PracticeSessionQuestion)
class PracticeSessionQuestionAdmin(admin.ModelAdmin):
    list_display = ['session', 'question', 'is_correct', 'answered_at']
    list_filter = ['is_correct', 'answered_at']
    search_fields = ['session__user__username', 'question__question_text']
    readonly_fields = ['answered_at']
    fieldsets = (
        ('Session Question', {
            'fields': ('session', 'question', 'user_answer')
        }),
        ('Results', {
            'fields': ('is_correct', 'time_taken')
        }),
        ('Metadata', {
            'fields': ('sequence_order', 'answered_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('session__user', 'question')

@admin.register(DailyStats)
class DailyStatsAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'questions_attempted', 'correct_answers', 'accuracy_percentage', 'daily_goal_met']
    list_filter = ['date', 'daily_goal_met']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['date']
    fieldsets = (
        ('Daily Statistics', {
            'fields': ('user', 'date')
        }),
        ('Activity', {
            'fields': ('sessions_completed', 'questions_attempted', 'correct_answers', 'time_spent')
        }),
        ('Goals', {
            'fields': ('daily_goal_met',)
        }),
    )

    def accuracy_percentage(self, obj):
        if obj.questions_attempted > 0:
            return f"{(obj.correct_answers / obj.questions_attempted) * 100:.1f}%"
        return "0%"
    accuracy_percentage.short_description = 'Accuracy'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ['user', 'achievement_type', 'name', 'is_unlocked', 'unlocked_at']
    list_filter = ['achievement_type', 'is_unlocked', 'unlocked_at']
    search_fields = ['user__username', 'name', 'description']
    readonly_fields = ['unlocked_at']
    fieldsets = (
        ('Achievement Information', {
            'fields': ('user', 'achievement_type', 'name', 'description')
        }),
        ('Progress', {
            'fields': ('progress', 'is_unlocked')
        }),
        ('Metadata', {
            'fields': ('icon', 'unlocked_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(QuizSession)
class QuizSessionAdmin(admin.ModelAdmin):
    list_display = ['title', 'creator', 'quiz', 'status', 'scheduled_start', 'participant_count', 'is_public']
    list_filter = ['status', 'is_public', 'scheduled_start']
    search_fields = ['title', 'creator__username', 'quiz__title', 'session_code']
    readonly_fields = ['session_code', 'created_at', 'started_at', 'completed_at']
    inlines = [QuizParticipantInline, QuizInvitationInline]
    fieldsets = (
        ('Session Information', {
            'fields': ('creator', 'title', 'description', 'quiz')
        }),
        ('Settings', {
            'fields': ('scheduled_start', 'duration', 'max_participants', 'session_code')
        }),
        ('Status', {
            'fields': ('status', 'is_public')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'started_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )

    def participant_count(self, obj):
        return obj.participants.count()
    participant_count.short_description = 'Participants'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('creator', 'quiz')

@admin.register(QuizParticipant)
class QuizParticipantAdmin(admin.ModelAdmin):
    list_display = ['user', 'session', 'status', 'score', 'joined_at']
    list_filter = ['status', 'joined_at']
    search_fields = ['user__username', 'session__title']
    readonly_fields = ['joined_at', 'completed_at']
    fieldsets = (
        ('Participation', {
            'fields': ('user', 'session')
        }),
        ('Progress', {
            'fields': ('status', 'score', 'time_taken')
        }),
        ('Timestamps', {
            'fields': ('joined_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'session')

@admin.register(QuizInvitation)
class QuizInvitationAdmin(admin.ModelAdmin):
    list_display = ['session', 'email', 'accepted', 'sent_at']
    list_filter = ['accepted', 'sent_at']
    search_fields = ['email', 'session__title', 'token']
    readonly_fields = ['token', 'sent_at', 'accepted_at']
    fieldsets = (
        ('Invitation', {
            'fields': ('session', 'email', 'token')
        }),
        ('Status', {
            'fields': ('accepted', 'sent_at', 'accepted_at')
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('session')

@admin.register(AdvancedAnalytics)
class AdvancedAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'preferred_difficulty', 'consistency_score']
    list_filter = ['date', 'preferred_difficulty']
    search_fields = ['user__username']
    readonly_fields = ['date']
    fieldsets = (
        ('Analytics Information', {
            'fields': ('user', 'date')
        }),
        ('Learning Patterns', {
            'fields': ('peak_study_hours', 'preferred_difficulty', 'average_session_duration')
        }),
        ('Performance Metrics', {
            'fields': ('improvement_rate', 'consistency_score', 'knowledge_gaps')
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(ComparativeAnalytics)
class ComparativeAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['user', 'metric_type', 'user_score', 'average_score', 'percentile', 'created_at']
    list_filter = ['metric_type', 'created_at']
    search_fields = ['user__username']
    readonly_fields = ['created_at']
    fieldsets = (
        ('Comparative Analytics', {
            'fields': ('user', 'metric_type')
        }),
        ('Scores', {
            'fields': ('user_score', 'average_score', 'percentile')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(LearningRecommendation)
class LearningRecommendationAdmin(admin.ModelAdmin):
    list_display = ['user', 'recommendation_type', 'subject', 'priority', 'is_completed', 'created_at']
    list_filter = ['recommendation_type', 'is_completed', 'created_at']
    search_fields = ['user__username', 'subject__name', 'reason']
    readonly_fields = ['created_at']
    fieldsets = (
        ('Recommendation', {
            'fields': ('user', 'recommendation_type', 'subject')
        }),
        ('Priority & Confidence', {
            'fields': ('priority', 'confidence_score', 'reason')
        }),
        ('Status', {
            'fields': ('is_completed', 'created_at')
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'subject')

@admin.register(SmartStudyPlan)
class SmartStudyPlanAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'duration_days', 'daily_goal', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user__username', 'name']
    readonly_fields = ['created_at', 'completed_at']
    filter_horizontal = ['subjects']
    fieldsets = (
        ('Study Plan', {
            'fields': ('user', 'name', 'subjects')
        }),
        ('Settings', {
            'fields': ('duration_days', 'daily_goal', 'difficulty_progression')
        }),
        ('Status', {
            'fields': ('is_active', 'created_at', 'completed_at')
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ['user', 'badge_type', 'level', 'progress', 'unlocked_at']
    list_filter = ['badge_type', 'level', 'unlocked_at']
    search_fields = ['user__username']
    readonly_fields = ['unlocked_at']
    fieldsets = (
        ('Badge Information', {
            'fields': ('user', 'badge_type', 'level')
        }),
        ('Progress', {
            'fields': ('progress', 'unlocked_at')
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ['title', 'challenge_type', 'reward_points', 'start_date', 'end_date', 'is_active']
    list_filter = ['challenge_type', 'is_active', 'start_date']
    search_fields = ['title', 'description']
    readonly_fields = ['start_date', 'end_date']
    fieldsets = (
        ('Challenge Information', {
            'fields': ('title', 'description', 'challenge_type')
        }),
        ('Requirements & Rewards', {
            'fields': ('requirements', 'reward_points')
        }),
        ('Timing', {
            'fields': ('start_date', 'end_date')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )

@admin.register(UserChallenge)
class UserChallengeAdmin(admin.ModelAdmin):
    list_display = ['user', 'challenge', 'is_completed', 'reward_claimed', 'completed_at']
    list_filter = ['is_completed', 'reward_claimed', 'completed_at']
    search_fields = ['user__username', 'challenge__title']
    readonly_fields = ['completed_at']
    fieldsets = (
        ('User Challenge', {
            'fields': ('user', 'challenge')
        }),
        ('Progress', {
            'fields': ('progress', 'is_completed')
        }),
        ('Rewards', {
            'fields': ('reward_claimed', 'completed_at')
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'challenge')

@admin.register(StudyGroup)
class StudyGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'creator', 'max_members', 'member_count', 'is_public', 'created_at']
    list_filter = ['is_public', 'created_at']
    search_fields = ['name', 'creator__username', 'invite_code']
    readonly_fields = ['invite_code', 'created_at']
    filter_horizontal = ['subjects']
    inlines = [GroupMemberInline]
    fieldsets = (
        ('Group Information', {
            'fields': ('name', 'description', 'creator')
        }),
        ('Settings', {
            'fields': ('subjects', 'max_members', 'invite_code')
        }),
        ('Visibility', {
            'fields': ('is_public', 'created_at')
        }),
    )

    def member_count(self, obj):
        return obj.groupmember_set.count()
    member_count.short_description = 'Members'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('creator')

@admin.register(GroupMember)
class GroupMemberAdmin(admin.ModelAdmin):
    list_display = ['user', 'group', 'role', 'joined_at']
    list_filter = ['role', 'joined_at']
    search_fields = ['user__username', 'group__name']
    readonly_fields = ['joined_at']
    fieldsets = (
        ('Membership', {
            'fields': ('user', 'group', 'role')
        }),
        ('Timestamps', {
            'fields': ('joined_at',),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'group')

@admin.register(GroupActivity)
class GroupActivityAdmin(admin.ModelAdmin):
    list_display = ['user', 'group', 'activity_type', 'created_at']
    list_filter = ['activity_type', 'created_at']
    search_fields = ['user__username', 'group__name']
    readonly_fields = ['created_at']
    fieldsets = (
        ('Activity', {
            'fields': ('user', 'group', 'activity_type')
        }),
        ('Details', {
            'fields': ('details', 'created_at')
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'group')

@admin.register(AdaptiveSession)
class AdaptiveSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'subject', 'total_questions', 'questions_answered', 'ability_estimate', 'is_completed', 'started_at']
    list_filter = ['is_completed', 'started_at']
    search_fields = ['user__username', 'subject__name']
    readonly_fields = ['started_at', 'completed_at']
    fieldsets = (
        ('Session Information', {
            'fields': ('user', 'subject', 'total_questions')
        }),
        ('Progress', {
            'fields': ('questions_answered', 'correct_answers', 'ability_estimate')
        }),
        ('Data', {
            'fields': ('session_data',)
        }),
        ('Status', {
            'fields': ('is_completed', 'started_at', 'completed_at')
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'subject')

@admin.register(AdaptiveQuestion)
class AdaptiveQuestionAdmin(admin.ModelAdmin):
    list_display = ['base_question', 'session', 'difficulty_adjustment', 'was_answered_correctly', 'presented_at']
    list_filter = ['was_answered_correctly', 'presented_at']
    search_fields = ['base_question__question_text', 'session__user__username']
    readonly_fields = ['presented_at']
    fieldsets = (
        ('Adaptive Question', {
            'fields': ('base_question', 'session')
        }),
        ('Adaptive Properties', {
            'fields': ('difficulty_adjustment', 'user_ability_estimate', 'response_time_threshold')
        }),
        ('Results', {
            'fields': ('was_answered_correctly', 'actual_response_time')
        }),
        ('Timestamps', {
            'fields': ('presented_at',),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('base_question', 'session__user')

@admin.register(QuizTemplate)
class QuizTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_by', 'is_public', 'created_at']
    list_filter = ['is_public', 'created_at']
    search_fields = ['name', 'created_by__username']
    readonly_fields = ['created_at']
    fieldsets = (
        ('Template Information', {
            'fields': ('name', 'description', 'created_by')
        }),
        ('Settings', {
            'fields': ('settings', 'is_public')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('created_by')

@admin.register(ExamSimulation)
class ExamSimulationAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'duration', 'total_questions', 'strict_timing', 'created_at']
    list_filter = ['strict_timing', 'created_at']
    search_fields = ['name', 'user__username']
    readonly_fields = ['created_at']
    filter_horizontal = ['subjects']
    inlines = [ExamQuestionInline]
    fieldsets = (
        ('Exam Information', {
            'fields': ('name', 'user', 'subjects')
        }),
        ('Settings', {
            'fields': ('duration', 'total_questions', 'question_breakdown')
        }),
        ('Exam Rules', {
            'fields': ('strict_timing', 'show_results_after')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(ExamQuestion)
class ExamQuestionAdmin(admin.ModelAdmin):
    list_display = ['exam_simulation', 'question', 'order', 'created_at']
    list_filter = ['created_at']
    search_fields = ['exam_simulation__name', 'question__question_text']
    readonly_fields = ['created_at']
    fieldsets = (
        ('Exam Question', {
            'fields': ('exam_simulation', 'question', 'order')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('exam_simulation', 'question')

# Custom admin site configuration
admin.site.site_header = "BCS Preparation Admin"
admin.site.site_title = "BCS Preparation Admin Portal"
admin.site.index_title = "Welcome to BCS Preparation Admin Portal"

# Action functions
def make_published(modeladmin, request, queryset):
    queryset.update(is_published=True)
make_published.short_description = "Mark selected quizzes as published"

def make_unpublished(modeladmin, request, queryset):
    queryset.update(is_published=False)
make_unpublished.short_description = "Mark selected quizzes as unpublished"

def activate_questions(modeladmin, request, queryset):
    queryset.update(is_active=True)
activate_questions.short_description = "Activate selected questions"

def deactivate_questions(modeladmin, request, queryset):
    queryset.update(is_active=False)
deactivate_questions.short_description = "Deactivate selected questions"

def complete_sessions(modeladmin, request, queryset):
    for session in queryset:
        session.is_completed = True
        session.completed_at = timezone.now()
        session.save()
complete_sessions.short_description = "Mark selected sessions as completed"

# Add actions to models
QuizAdmin.actions = [make_published, make_unpublished]
QuestionAdmin.actions = [activate_questions, deactivate_questions]
PracticeSessionAdmin.actions = [complete_sessions]
QuizSessionAdmin.actions = [complete_sessions]
AdaptiveSessionAdmin.actions = [complete_sessions]

# Custom filters
class HasExplanationFilter(admin.SimpleListFilter):
    title = 'has explanation'
    parameter_name = 'has_explanation'

    def lookups(self, request, model_admin):
        return (
            ('yes', 'Has explanation'),
            ('no', 'No explanation'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'yes':
            return queryset.exclude(explanation='')
        if self.value() == 'no':
            return queryset.filter(explanation='')
        return queryset

QuestionAdmin.list_filter += (HasExplanationFilter,)

class CompletedAttemptFilter(admin.SimpleListFilter):
    title = 'completion status'
    parameter_name = 'completion_status'

    def lookups(self, request, model_admin):
        return (
            ('completed', 'Completed'),
            ('in_progress', 'In Progress'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'completed':
            return queryset.filter(is_completed=True)
        if self.value() == 'in_progress':
            return queryset.filter(is_completed=False)
        return queryset

QuizAttemptAdmin.list_filter += (CompletedAttemptFilter,)

class HighAccuracyFilter(admin.SimpleListFilter):
    title = 'accuracy level'
    parameter_name = 'accuracy_level'

    def lookups(self, request, model_admin):
        return (
            ('high', 'High (>80%)'),
            ('medium', 'Medium (60-80%)'),
            ('low', 'Low (<60%)'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'high':
            return queryset.filter(accuracy__gt=80)
        if self.value() == 'medium':
            return queryset.filter(accuracy__range=[60, 80])
        if self.value() == 'low':
            return queryset.filter(accuracy__lt=60)
        return queryset

UserProgressAdmin.list_filter += (HighAccuracyFilter,)