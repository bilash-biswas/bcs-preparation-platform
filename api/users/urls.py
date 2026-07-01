# users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentication
    path('auth/register/', views.register_view, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    
    # Token
    path('token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Password management
    path('change-password/', views.change_password, name='change_password'),
    path('reset-password/', views.reset_password, name='reset_password'),
    path('reset-password/confirm/', views.reset_password_confirm, name='reset_password_confirm'),
    
    # User profile
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('stats/', views.user_stats, name='user_stats'),
    
    # Social auth (placeholder)
    path('social-auth/', views.social_auth, name='social_auth'),
    
    # Admin User management
    path('admin/users/', views.AdminUserViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin-users-list'),
    path('admin/users/<int:pk>/', views.AdminUserViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='admin-users-detail'),
]