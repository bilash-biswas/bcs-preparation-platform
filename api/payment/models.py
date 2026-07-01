# payment/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class PaymentPlan(models.Model):
    PLAN_TYPES = [
        ('basic', 'Basic'),
        ('premium', 'Premium'),
        ('gold', 'Gold'),
        ('platinum', 'Platinum'),
    ]
    
    DURATION_CHOICES = [
        (30, '1 Month'),
        (90, '3 Months'),
        (180, '6 Months'),
        (365, '1 Year'),
    ]
    
    name = models.CharField(max_length=100)
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPES, default='basic')
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    duration_days = models.IntegerField(choices=DURATION_CHOICES, default=30)
    features = models.JSONField(default=list)  # List of features
    is_popular = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['price']
    
    def __str__(self):
        return f"{self.name} - {self.get_duration_days_display()}"
    
    def save(self, *args, **kwargs):
        # Set original price if not set and there's a discount
        if not self.original_price:
            self.original_price = self.price
        super().save(*args, **kwargs)
    
    @property
    def discount_percentage(self):
        if self.original_price and self.original_price > self.price:
            return int(((self.original_price - self.price) / self.original_price) * 100)
        return 0

class Payment(models.Model):
    PAYMENT_STATUS = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_METHODS = [
        ('stripe', 'Stripe'),
        ('bkash', 'bKash'),
        ('nagad', 'Nagad'),
        ('rocket', 'Rocket'),
        ('bank', 'Bank Transfer'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    plan = models.ForeignKey(PaymentPlan, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_id = models.CharField(max_length=100, unique=True, blank=True)
    stripe_payment_intent_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='stripe')
    metadata = models.JSONField(default=dict, blank=True)  # Additional payment data
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['payment_id']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.amount} - {self.status}"
    
    def mark_completed(self):
        """Mark payment as completed and update user premium status"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()
        
        # Update user premium status
        self.user.is_premium = True
        self.user.premium_expiry = timezone.now() + timezone.timedelta(days=self.plan.duration_days)
        self.user.save()
        
        # Create user subscription record
        UserSubscription.objects.create(
            user=self.user,
            plan_type=self.plan.plan_type,
            start_date=timezone.now(),
            end_date=timezone.now() + timezone.timedelta(days=self.plan.duration_days),
            payment=self,
            is_active=True
        )
    
    def mark_failed(self):
        """Mark payment as failed"""
        self.status = 'failed'
        self.save()
    
    def is_refundable(self):
        """Check if payment can be refunded"""
        return self.status == 'completed' and self.completed_at and \
               (timezone.now() - self.completed_at).days <= 7  # Within 7 days

class UserSubscription(models.Model):
    SUBSCRIPTION_STATUS = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    plan_type = models.CharField(max_length=20, choices=PaymentPlan.PLAN_TYPES)
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name='subscriptions')
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=SUBSCRIPTION_STATUS, default='active')
    is_active = models.BooleanField(default=True)
    auto_renew = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['end_date']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.plan_type} - {self.status}"
    
    @property
    def days_remaining(self):
        """Calculate days remaining in subscription"""
        if self.end_date:
            remaining = self.end_date - timezone.now()
            return max(0, remaining.days)
        return 0
    
    @property
    def is_expired(self):
        """Check if subscription has expired"""
        return self.end_date and timezone.now() > self.end_date
    
    def renew_subscription(self, payment):
        """Renew subscription with new payment"""
        self.payment = payment
        self.start_date = timezone.now()
        self.end_date = timezone.now() + timezone.timedelta(days=payment.plan.duration_days)
        self.status = 'active'
        self.is_active = True
        self.save()

class Coupon(models.Model):
    COUPON_TYPES = [
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    ]
    
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    coupon_type = models.CharField(max_length=20, choices=COUPON_TYPES, default='percentage')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    max_discount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    min_purchase_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()
    max_uses = models.IntegerField(default=1)  # Maximum number of times coupon can be used
    used_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    applicable_plans = models.ManyToManyField(PaymentPlan, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.code} - {self.discount_value}{'%' if self.coupon_type == 'percentage' else '৳'}"
    
    def is_valid(self, user=None, plan=None, amount=0):
        """Check if coupon is valid for use"""
        now = timezone.now()
        
        # Basic validation
        if not self.is_active:
            return False, "Coupon is not active"
        
        if now < self.valid_from or now > self.valid_to:
            return False, "Coupon is not valid at this time"
        
        if self.used_count >= self.max_uses:
            return False, "Coupon has reached maximum usage limit"
        
        if amount < self.min_purchase_amount:
            return False, f"Minimum purchase amount of ৳{self.min_purchase_amount} required"
        
        # Check if coupon is applicable to the plan
        if plan and self.applicable_plans.exists() and plan not in self.applicable_plans.all():
            return False, "Coupon not applicable to this plan"
        
        return True, "Valid coupon"
    
    def calculate_discount(self, amount):
        """Calculate discount amount"""
        if self.coupon_type == 'percentage':
            discount = (amount * self.discount_value) / 100
            if self.max_discount and discount > self.max_discount:
                return self.max_discount
            return discount
        else:  # fixed amount
            return min(self.discount_value, amount)
    
    def use_coupon(self):
        """Increment usage count"""
        self.used_count += 1
        self.save()

class CouponUsage(models.Model):
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name='usages')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coupon_usages')
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='coupon_usage')
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    used_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['coupon', 'payment']
    
    def __str__(self):
        return f"{self.user.email} used {self.coupon.code}"

class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('payment', 'Payment'),
        ('refund', 'Refund'),
        ('payout', 'Payout'),
    ]
    
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='transactions', null=True, blank=True)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='BDT')
    gateway_transaction_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=Payment.PAYMENT_STATUS, default='pending')
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.transaction_type} - {self.amount} - {self.status}"

# Signal handlers for payment
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Payment)
def handle_payment_status_change(sender, instance, **kwargs):
    """
    Handle payment status changes and update related models
    """
    if instance.status == 'completed' and not instance.completed_at:
        instance.mark_completed()
    
    elif instance.status == 'failed':
        # Deactivate any active subscription for this payment
        UserSubscription.objects.filter(payment=instance, is_active=True).update(
            is_active=False,
            status='cancelled'
        )

@receiver(post_save, sender=UserSubscription)
def check_subscription_expiry(sender, instance, **kwargs):
    """
    Check and update subscription status based on expiry
    """
    if instance.is_expired and instance.status == 'active':
        instance.status = 'expired'
        instance.is_active = False
        instance.save(update_fields=['status', 'is_active'])
        
        # Update user premium status if this was their active subscription
        user = instance.user
        active_subscriptions = UserSubscription.objects.filter(
            user=user, 
            status='active', 
            is_active=True
        ).exists()
        
        if not active_subscriptions:
            user.is_premium = False
            user.save(update_fields=['is_premium'])