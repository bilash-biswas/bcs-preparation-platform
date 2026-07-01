# users/permissions.py
from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner
        return obj.user == request.user

class IsPremiumUser(permissions.BasePermission):
    """
    Permission to only allow premium users to access certain features.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_premium

class IsTeacherOrAdmin(permissions.BasePermission):
    """
    Permission to only allow teachers or admins to access certain features.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.user_type in ['teacher', 'admin'] or 
            request.user.is_staff
        )

class IsAdminOnly(permissions.BasePermission):
    """
    Permission to only allow admins to access certain features.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.user_type == 'admin' or 
            request.user.is_staff or 
            request.user.is_superuser
        )