# core/adaptive_engine.py
import numpy as np
from django.db.models import Avg
from django.utils import timezone
from .models import UserProgress, Question, AdaptiveQuestion

class AdvancedAdaptiveEngine:
    """
    Enhanced IRT-based adaptive learning engine.
    Uses the Rasch Model (1-Parameter Logistic Model) with 1.7 scaling factor.
    Operates on a Logit scale (-3.0 to +3.0).
    """
    
    def __init__(self, user):
        self.user = user
        self.ability_estimate = self._calculate_initial_ability_logits()
        
    def _calculate_initial_ability_logits(self):
        """
        Calculate initial ability in Logits based on past accuracy.
        Range: -3.0 (Low ability) to +3.0 (High ability)
        """
        try:
            user_progress = UserProgress.objects.filter(user=self.user)
            if user_progress.exists():
                # Get average accuracy (0-100)
                avg_accuracy = user_progress.aggregate(avg=Avg('accuracy'))['avg'] or 50.0
                accuracy = float(avg_accuracy) / 100.0
                
                # Clamp accuracy to avoid log(0) or log(1)
                accuracy = max(0.01, min(0.99, accuracy))
                
                # Convert Probability to Logits: ln(p / (1-p))
                return np.log(accuracy / (1 - accuracy))
            
            # Default to 0.0 (Average ability)
            return 0.0
        except Exception:
            return 0.0

    def get_question_difficulty_logit(self, question):
        """
        Map Question string difficulty to IRT Logit scale.
        Ideally, this should come from historical data (AdaptiveQuestion),
        but we fallback to static mapping.
        """
        # Static mapping fallback
        mapping = {
            'easy': -1.5,   # High probability of success for avg user
            'medium': 0.0,  # 50/50 for avg user
            'hard': 1.5     # Low probability of success for avg user
        }
        base_difficulty = mapping.get(question.difficulty, 0.0)
        
        # ADVANCED: If this question has global stats, adjust the difficulty
        # (Optional: checking global pass rate for this question)
        # For now, return base mapping
        return base_difficulty

    def select_optimal_question(self, subject, answered_question_ids):
        """
        Select the question that maximizes Fisher Information for the current ability.
        OPTIMIZED: Does not scan entire DB.
        """
        # 1. Determine target difficulty bucket based on current ability
        # If ability is 2.0 (High), look for Hard/Medium. If -2.0 (Low), look for Easy.
        if self.ability_estimate > 0.8:
            difficulty_filter = ['medium', 'hard']
        elif self.ability_estimate < -0.8:
            difficulty_filter = ['easy', 'medium']
        else:
            difficulty_filter = ['easy', 'medium', 'hard']

        # 2. Fetch a "Candidate Set" (Optimization)
        # Only fetch ~50 random questions that match the profile to save CPU
        candidates = Question.objects.filter(
            subject=subject,
            is_active=True,
            difficulty__in=difficulty_filter
        ).exclude(
            id__in=answered_question_ids
        ).order_by('?')[:50] # Random sample of 50

        if not candidates.exists():
            # Fallback: Try any question in subject if strict filter fails
            candidates = Question.objects.filter(
                subject=subject, 
                is_active=True
            ).exclude(
                id__in=answered_question_ids
            )[:20]
            
            if not candidates.exists():
                return None

        # 3. IRT Calculation on Candidate Set
        max_info = -1.0
        best_question = None

        for question in candidates:
            difficulty = self.get_question_difficulty_logit(question)
            info = self._calculate_information(difficulty)
            
            # Add small random noise to break ties and prevent repetitive sequences
            noise = np.random.uniform(-0.01, 0.01)
            info += noise
            
            if info > max_info:
                max_info = info
                best_question = question
        
        return best_question
    
    def _calculate_information(self, difficulty):
        """
        Calculate Fisher Information: I(θ) = a² * P(θ) * (1 - P(θ))
        Using a=1.7 (Discrimination parameter)
        """
        a = 1.7
        # Probability of answering correctly given current ability
        # P(θ) = 1 / (1 + e^(-a * (θ - b)))
        try:
            exponent = -a * (self.ability_estimate - difficulty)
            # Avoid overflow
            if exponent > 20: exponent = 20
            if exponent < -20: exponent = -20
            
            p = 1.0 / (1.0 + np.exp(exponent))
            
            # Information
            info = (a ** 2) * p * (1.0 - p)
            return info
        except OverflowError:
            return 0.0

    def update_ability_estimate(self, session_data, is_correct, question_difficulty_logit):
        """
        Update user ability after an answer (Bayesian or MLE approximation).
        Simple heuristic update for real-time performance.
        """
        # Current Estimate
        theta = self.ability_estimate
        
        # Prediction error
        # P(correct)
        a = 1.7
        exponent = -a * (theta - question_difficulty_logit)
        p_correct = 1.0 / (1.0 + np.exp(exponent))
        
        actual = 1.0 if is_correct else 0.0
        
        # Learning rate (dampen changes as session gets longer)
        questions_answered = session_data.get('questions_answered', 1)
        learning_rate = 1.0 / (1.0 + 0.5 * questions_answered)
        
        # Update rule: New Theta = Old Theta + LR * (Actual - Predicted)
        new_theta = theta + learning_rate * (actual - p_correct)
        
        # Clamp to reasonable bounds (-3.0 to +3.0)
        self.ability_estimate = max(-3.0, min(3.0, new_theta))
        
        return self.ability_estimate