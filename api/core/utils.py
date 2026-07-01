# core/utils.py
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Avg, Sum, Q
from .models import *

def calculate_study_plan_progress(study_plan):
    """Calculate progress for a smart study plan"""
    total_days = study_plan.duration_days
    days_passed = (timezone.now().date() - study_plan.created_at.date()).days
    
    if days_passed <= 0:
        return 0.0
    
    # Calculate completion based on daily goals
    daily_stats = DailyStats.objects.filter(
        user=study_plan.user,
        date__gte=study_plan.created_at.date()
    )
    
    total_questions_goal = total_days * study_plan.daily_goal
    actual_questions = daily_stats.aggregate(
        total=Sum('questions_attempted')
    )['total'] or 0
    
    if total_questions_goal > 0:
        progress = min(100.0, (actual_questions / total_questions_goal) * 100)
    else:
        progress = 0.0
    
    return progress

def generate_study_suggestions(user_progress):
    """Generate study suggestions based on user progress"""
    suggestions = []
    
    if user_progress.accuracy < 40:
        suggestions.extend([
            "Focus on fundamental concepts",
            "Review basic theory before attempting questions",
            "Start with easier difficulty levels"
        ])
    elif user_progress.accuracy < 60:
        suggestions.extend([
            "Practice more questions in weak areas",
            "Review explanations for incorrect answers",
            "Try mixed difficulty practice sessions"
        ])
    elif user_progress.accuracy < 80:
        suggestions.extend([
            "Challenge yourself with harder questions",
            "Focus on time management",
            "Practice full-length tests"
        ])
    else:
        suggestions.extend([
            "Maintain consistency with daily practice",
            "Help others in discussion forums",
            "Explore advanced topics"
        ])
    
    # Add difficulty-specific suggestions
    if user_progress.hard_attempted > 0 and user_progress.hard_correct / user_progress.hard_attempted < 0.3:
        suggestions.append("Spend more time on hard difficulty concepts")
    
    return suggestions

def calculate_improvement_trend(user):
    """Calculate user's improvement trend over time"""
    from datetime import datetime, timedelta
    
    # Get last 30 days of accuracy data
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=30)
    
    daily_stats = DailyStats.objects.filter(
        user=user,
        date__range=[start_date, end_date]
    ).order_by('date')
    
    if daily_stats.count() < 2:
        return 0.0
    
    # Calculate trend using linear regression (simplified)
    accuracies = []
    for stat in daily_stats:
        if stat.questions_attempted > 0:
            accuracy = (stat.correct_answers / stat.questions_attempted) * 100
            accuracies.append(accuracy)
    
    if len(accuracies) < 2:
        return 0.0
    
    # Simple trend calculation
    first_half = accuracies[:len(accuracies)//2]
    second_half = accuracies[len(accuracies)//2:]
    
    if not first_half or not second_half:
        return 0.0
    
    avg_first = sum(first_half) / len(first_half)
    avg_second = sum(second_half) / len(second_half)
    
    improvement = avg_second - avg_first
    return improvement

def calculate_percentile(user, metric_type):
    """Calculate user's percentile for a given metric"""
    from django.db.models import Avg
    
    if metric_type == 'accuracy':
        # Get all users' average accuracy
        user_accuracy = UserProgress.objects.filter(
            user=user
        ).aggregate(avg_accuracy=Avg('accuracy'))['avg_accuracy'] or 0
        
        all_users_avg = UserProgress.objects.values('user').annotate(
            user_avg=Avg('accuracy')
        ).exclude(user_avg=None).values_list('user_avg', flat=True)
        
    elif metric_type == 'speed':
        # Calculate average time per question
        user_speed = UserProgress.objects.filter(
            user=user
        ).aggregate(avg_speed=Avg('average_time_per_question'))['avg_speed'] or 0
        
        all_users_avg = UserProgress.objects.values('user').annotate(
            user_avg=Avg('average_time_per_question')
        ).exclude(user_avg=None).values_list('user_avg', flat=True)
    
    if not all_users_avg:
        return 50.0  # Default percentile if no data
    
    # Convert to list and sort
    all_scores = list(all_users_avg)
    all_scores.sort()
    
    # Find percentile
    if metric_type == 'speed':
        # For speed, lower is better
        user_score = user_speed
        better_scores = [score for score in all_scores if score <= user_score]
    else:
        # For accuracy, higher is better
        user_score = user_accuracy
        better_scores = [score for score in all_scores if score >= user_score]
    
    percentile = (len(better_scores) / len(all_scores)) * 100
    return round(percentile, 1)