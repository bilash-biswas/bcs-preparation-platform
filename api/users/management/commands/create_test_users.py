# users/management/commands/create_test_users.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Create test users for development'
    
    def handle(self, *args, **options):
        test_users = [
            {
                'username': 'student1',
                'email': 'student1@example.com',
                'password': 'password123',
                'user_type': 'student',
                'first_name': 'John',
                'last_name': 'Doe',
            },
            {
                'username': 'teacher1',
                'email': 'teacher1@example.com',
                'password': 'password123',
                'user_type': 'teacher',
                'first_name': 'Jane',
                'last_name': 'Smith',
            },
            {
                'username': 'admin_user',
                'email': 'admin@example.com',
                'password': 'admin123',
                'user_type': 'admin',
                'first_name': 'Admin',
                'last_name': 'User',
                'is_staff': True,
            },
            {
                'username': 'premium_student',
                'email': 'premium@example.com',
                'password': 'password123',
                'user_type': 'student',
                'first_name': 'Premium',
                'last_name': 'Student',
                'is_premium': True,
            }
        ]
        
        for user_data in test_users:
            username = user_data['username']
            if not User.objects.filter(username=username).exists():
                User.objects.create_user(**user_data)
                self.stdout.write(
                    self.style.SUCCESS(f'Created user: {username}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'User already exists: {username}')
                )