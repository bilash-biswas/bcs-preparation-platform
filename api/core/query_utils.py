# core/query_utils.py
from django.db.models import Prefetch
from .models import QuizAttempt, UserAnswer

def optimize_quiz_attempt_queries():
  """Optimize complex quiz attempt queries"""
  return QuizAttempt.objects.select_related(
    'user', 'quiz'
  ).prefetch_related(
    Prefetch(
      'user_answers',
      queryset=UserAnswer.objects.select_related('question')
      .prefetch_related('selected_options')
    )
  ).only(
    'id', 'score', 'started_at', 'completed_at', 
    'user__username', 'quiz__title'
  )