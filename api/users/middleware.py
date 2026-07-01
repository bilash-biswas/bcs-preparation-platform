# users/middleware.py
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin
from datetime import timedelta

class UpdateLastActiveMiddleware(MiddlewareMixin):
    """
    Update user's last_active field and study streak on each request
    """
    def process_request(self, request):
        if request.user.is_authenticated:
            user = request.user
            today = timezone.now().date()
            last_active_date = user.last_active.date() if user.last_active else None
            
            if last_active_date != today or user.streak == 0:
                yesterday = today - timedelta(days=1)
                if last_active_date == yesterday:
                    user.streak = max(1, user.streak + 1)
                else:
                    user.streak = 1
                
                # Update both last_active and streak
                user.last_active = timezone.now()
                user.save(update_fields=['last_active', 'streak'])
            else:
                # Just update the last_active time of day
                user.last_active = timezone.now()
                user.save(update_fields=['last_active'])