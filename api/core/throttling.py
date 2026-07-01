# core/throttling.py
from rest_framework.throttling import UserRateThrottle

class QuizAttemptThrottle(UserRateThrottle):
  """Custom throttle for quiz attempts"""
  scope = 'quiz_attempt'
  rate = '10/minute'

class PracticeSessionThrottle(UserRateThrottle):
  """Custom throttle for practice sessions"""
  scope = 'practice_session'
  rate = '30/minute'