# users/views.py
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.db.models import Avg
from django.utils import timezone
import logging

from .models import User, UserProfile
from .serializers import (
    UserSerializer, UserRegistrationSerializer, 
    UserProfileSerializer, ChangePasswordSerializer,
    ResetPasswordSerializer, ResetPasswordConfirmSerializer
)

logger = logging.getLogger(__name__)

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token obtain view to include user data in response
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            # Get user data
            user = authenticate(
                username=request.data.get('username'),
                password=request.data.get('password')
            )
            if user:
                user_data = UserSerializer(user).data
                response.data['user'] = user_data
        return response

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    """
    User registration endpoint
    """
    print(f"Registration data received: {request.data}")
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Create user profile automatically
        UserProfile.objects.get_or_create(user=user)
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'User registered successfully',
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    print(serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    User login endpoint
    """
    username = request.data.get('username')
    password = request.data.get('password')
    print(f"Login attempt - Username: {username}, Password: {password}")
    
    user = authenticate(username=username, password=password)
    print(f"Authenticated user: {user}")
    if user:
        if user.is_active:
            # Update last active
            user.last_active = timezone.now()
            user.save()
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        else:
            return Response(
                {'error': 'Account is disabled'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
    
    return Response(
        {'error': 'Invalid credentials'}, 
        status=status.HTTP_401_UNAUTHORIZED
    )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """
    User logout endpoint
    """
    try:
        # In a real implementation, you might want to blacklist the token
        # For now, we'll just return success
        logout(request)
        return Response({'message': 'Logout successful'})
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return Response(
            {'error': 'Logout failed'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """
    Change user password
    """
    user = request.user
    serializer = ChangePasswordSerializer(data=request.data)
    
    if serializer.is_valid():
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'error': 'Wrong password'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({'message': 'Password updated successfully'})
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def reset_password(request):
    """
    Request password reset
    """
    serializer = ResetPasswordSerializer(data=request.data)
    
    if serializer.is_valid():
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            
            # Generate reset token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # In production, you would send an email with reset link
            reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
            
            # For development, we'll return the reset link
            return Response({
                'message': 'Password reset email sent',
                'reset_link': reset_link,  # Remove this in production
                'uid': uid,
                'token': token
            })
            
        except User.DoesNotExist:
            # Don't reveal whether user exists
            return Response({
                'message': 'If the email exists, a reset link has been sent'
            })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def reset_password_confirm(request):
    """
    Confirm password reset
    """
    serializer = ResetPasswordConfirmSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            uid = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user = User.objects.get(pk=uid)
            
            if default_token_generator.check_token(user, serializer.validated_data['token']):
                user.set_password(serializer.validated_data['new_password'])
                user.save()
                return Response({'message': 'Password reset successful'})
            else:
                return Response(
                    {'error': 'Invalid reset token'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'error': 'Invalid reset link'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Get or update user profile
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        user = self.request.user
        # Ensure profile exists
        UserProfile.objects.get_or_create(user=user)
        return user

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_stats(request):
    """
    Get user statistics and progress
    """
    user = request.user
    
    # Ensure profile exists
    UserProfile.objects.get_or_create(user=user)
    
    # Import here to avoid circular imports
    from core.models import QuizAttempt, UserProgress
    
    stats = {
        'user': UserSerializer(user).data,
        'quiz_stats': {
            'total_attempts': QuizAttempt.objects.filter(user=user).count(),
            'completed_attempts': QuizAttempt.objects.filter(user=user, is_completed=True).count(),
            'average_score': QuizAttempt.objects.filter(
                user=user, is_completed=True
            ).aggregate(avg_score=Avg('score'))['avg_score'] or 0,
        },
        'progress_stats': {
            'subjects_attempted': UserProgress.objects.filter(user=user).count(),
            'total_accuracy': UserProgress.objects.filter(
                user=user
            ).aggregate(avg_accuracy=Avg('accuracy'))['avg_accuracy'] or 0,
        }
    }
    
    return Response(stats)

@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_profile(request):
    """
    Update user profile information
    """
    user = request.user
    
    try:
        # Get or create user profile if it doesn't exist
        profile, created = UserProfile.objects.get_or_create(user=user)
        if created:
            logger.info(f"Created profile for user: {user.username}")
        
        # Update user fields
        user_serializer = UserSerializer(user, data=request.data, partial=True)
        if user_serializer.is_valid():
            user_serializer.save()
        else:
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Update profile fields
        profile_serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if profile_serializer.is_valid():
            profile_serializer.save()
        else:
            return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Return updated user data
        return Response(UserSerializer(user).data)
        
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        return Response(
            {'error': 'Profile update failed'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

# Social authentication views (placeholder)
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def social_auth(request):
    """
    Social authentication endpoint
    In production, implement with django-allauth or similar
    """
    return Response({
        'message': 'Social authentication endpoint',
        'note': 'Implement with django-allauth or similar package'
    }, status=status.HTTP_501_NOT_IMPLEMENTED)

from rest_framework import viewsets, filters

class IsAdminUserType(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (request.user.user_type == 'admin' or request.user.is_staff)

class AdminUserViewSet(viewsets.ModelViewSet):
    from .serializers import AdminUserSerializer
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUserType]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone']
    ordering_fields = ['username', 'email', 'coins', 'streak', 'created_at']