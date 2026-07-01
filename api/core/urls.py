# core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import consumers

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet)
router.register(r'subjects', views.SubjectViewSet, basename='subject')
router.register(r'questions', views.QuestionViewSet)
router.register(r'quizzes', views.QuizViewSet)
router.register(r'attempts', views.QuizAttemptViewSet, basename='attempt')
router.register(r'discussions', views.DiscussionViewSet)
router.register(r'leaderboard', views.LeaderboardViewSet, basename='leaderboard')
router.register(r'practice-sessions', views.PracticeSessionViewSet, basename='practice-sessions')
router.register(r'analytics', views.AnalyticsViewSet, basename='analytics')
router.register(r'progress', views.UserProgressViewSet, basename='progress')
router.register(r'quiz-sessions', views.QuizSessionViewSet, basename='quiz-sessions')  
router.register(r'quiz-participants', views.QuizParticipantViewSet, basename='quiz-participants')

router.register(r'advanced-analytics', views.AdvancedAnalyticsViewSet, basename='advance-analytics')
router.register(r'recommendations', views.RecommendationViewSet, basename='recommendations')
router.register(r'study-plans', views.SmartStudyPlanViewSet, basename='study-plans')
router.register(r'study-groups', views.StudyGroupViewSet, basename='study-groups')
router.register(r'exam-simulations', views.ExamSimulationViewSet, basename='exam-simulations') 

router.register(r'battles', views.BattleViewSet, basename='battles')
urlpatterns = [
    path('', include(router.urls)),
    # Explicit endpoints for quiz sessions
    path('quiz-sessions/<int:pk>/questions/', views.QuizSessionViewSet.as_view({'get': 'questions'}), name='quiz-session-questions'),
    path('quiz-sessions/<int:pk>/submit-answer/', views.QuizSessionViewSet.as_view({'post': 'submit_answer'}), name='quiz-session-submit-answer'),
    path('quiz-sessions/<int:pk>/complete/', views.QuizSessionViewSet.as_view({'post': 'complete_session'}), name='quiz-session-complete'),
    path('gamification/dashboard/', views.GamificationViewSet.as_view({'get': 'dashboard'})),
    path('gamification/challenges/', views.GamificationViewSet.as_view({'get': 'challenges'})),
    path('adaptive/start-session/', views.AdaptiveLearningViewSet.as_view({'post': 'start_adaptive_session'})),
    path('adaptive/submit-answer/', views.AdaptiveLearningViewSet.as_view({'post': 'submit_adaptive_answer'}), name='adaptive-submit-answer'),
    path('adaptive/next-question/', views.AdaptiveLearningViewSet.as_view({'post': 'get_next_adaptive_question'})),
    path('exam-simulations/<int:pk>/start_simulation/', views.ExamSimulationViewSet.as_view({'post': 'start_simulation'}), name='exam-simulation-start'),
    path('exam-simulations/<int:pk>/analysis/', views.ExamSimulationViewSet.as_view({'get': 'analysis'}), name='exam-simulation-analysis'),
    path('exam-simulations/<int:pk>/questions/', views.ExamSimulationViewSet.as_view({'get': 'questions'}), name='exam-simulation-questions'),
    path('attempts/<int:pk>/questions/', views.QuizAttemptViewSet.as_view({'get': 'questions'}), name='attempt-questions'),
    path('attempts/by_quiz/', views.QuizAttemptViewSet.as_view({'get': 'by_quiz'}), name='attempt-by-quiz'),
    path('attempts/latest/', views.QuizAttemptViewSet.as_view({'get': 'latest'}), name='attempt-latest'),
    path('attempts/statistics/', views.QuizAttemptViewSet.as_view({'get': 'statistics'}), name='attempt-statistics'),
    path('attempts/recent/', views.QuizAttemptViewSet.as_view({'get': 'recent'}), name='attempt-recent'),
    path('attempts/attempts/', views.QuizAttemptViewSet.as_view({'get': 'attempts'}), name='attempt-attempts'),
    path('attempts/<int:pk>/questions/', views.QuizAttemptViewSet.as_view({'get': 'questions'}), name='attempt-questions'),
    path('attempts/<int:pk>/submit_answer/', views.QuizAttemptViewSet.as_view({'post': 'submit_answer'}), name='attempt-submit-answer'),
    path('attempts/<int:pk>/complete_attempt/', views.QuizAttemptViewSet.as_view({'post': 'complete_attempt'}), name='attempt-complete'),
    
    #path('ws/battle/<str:battle_code>/', views.BattleConsumer.as_asgi(), name='battle-websocket'),
    
    # Battle endpoints
    path('battles/create_quick/', views.BattleViewSet.as_view({'post': 'create_quick_battle'}), name='battle-create-quick'),
    path('battles/join/', views.BattleViewSet.as_view({'post': 'join'}), name='battle-join'),
    path('battles/available/', views.BattleViewSet.as_view({'get': 'available'}), name='battle-available'),
    path('battles/active/', views.BattleViewSet.as_view({'get': 'active'}), name='battle-active'),
    path('battles/<int:pk>/ready/', views.BattleViewSet.as_view({'post': 'ready'}), name='battle-ready'),
    path('battles/<int:pk>/submit_answer/', views.BattleViewSet.as_view({'post': 'submit_answer'}), name='battle-submit-answer'),
]