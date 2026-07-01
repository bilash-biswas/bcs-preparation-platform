# core/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Question, Subject

@receiver([post_save, post_delete], sender=Question)
def update_subject_question_count(sender, instance, **kwargs):
    """Update total_questions count when questions are modified"""
    subject = instance.subject
    active_questions_count = subject.questions.filter(is_active=True).count()
    
    # Only update if the count has changed
    if subject.total_questions != active_questions_count:
        subject.total_questions = active_questions_count
        subject.save(update_fields=['total_questions'])