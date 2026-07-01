# payment/serializers.py
from rest_framework import serializers
from django.utils import timezone
from .models import PaymentPlan, Payment, UserSubscription, Coupon, CouponUsage, Transaction

class PaymentPlanSerializer(serializers.ModelSerializer):
    discount_percentage = serializers.ReadOnlyField()
    duration_display = serializers.CharField(source='get_duration_days_display', read_only=True)
    original_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    
    class Meta:
        model = PaymentPlan
        fields = [
            'id', 'name', 'plan_type', 'description', 'price', 'original_price',
            'duration_days', 'duration_display', 'features', 'is_popular',
            'is_active', 'discount_percentage', 'created_at'
        ]
        read_only_fields = ['created_at', 'discount_percentage']

class PaymentSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    plan_type = serializers.CharField(source='plan.plan_type', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    days_until_expiry = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'user_email', 'user_name', 'plan', 'plan_name', 'plan_type',
            'amount', 'payment_id', 'stripe_payment_intent_id', 'status', 
            'payment_method', 'metadata', 'created_at', 'updated_at', 
            'completed_at', 'days_until_expiry'
        ]
        read_only_fields = [
            'user', 'amount', 'payment_id', 'stripe_payment_intent_id', 
            'status', 'created_at', 'updated_at', 'completed_at',
            'days_until_expiry'
        ]
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    
    def get_days_until_expiry(self, obj):
        if obj.status == 'completed' and obj.completed_at:
            expiry_date = obj.completed_at + timezone.timedelta(days=obj.plan.duration_days)
            remaining = expiry_date - timezone.now()
            return max(0, remaining.days)
        return 0

class PaymentCreateSerializer(serializers.ModelSerializer):
    plan_id = serializers.IntegerField(write_only=True)
    coupon_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    final_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'plan_id', 'payment_method', 'coupon_code', 
            'final_amount', 'discount_amount'
        ]
    
    def validate(self, attrs):
        plan_id = attrs.get('plan_id')
        coupon_code = attrs.get('coupon_code')
        
        try:
            plan = PaymentPlan.objects.get(id=plan_id, is_active=True)
        except PaymentPlan.DoesNotExist:
            raise serializers.ValidationError("Invalid payment plan")
        
        attrs['plan'] = plan
        attrs['amount'] = plan.price
        
        # Apply coupon if provided
        if coupon_code:
            try:
                coupon = Coupon.objects.get(code=coupon_code, is_active=True)
                is_valid, message = coupon.is_valid(
                    user=self.context['request'].user,
                    plan=plan,
                    amount=plan.price
                )
                if not is_valid:
                    raise serializers.ValidationError(message)
                
                discount_amount = coupon.calculate_discount(plan.price)
                attrs['coupon'] = coupon
                attrs['discount_amount'] = discount_amount
                attrs['final_amount'] = plan.price - discount_amount
            except Coupon.DoesNotExist:
                raise serializers.ValidationError("Invalid coupon code")
        else:
            attrs['discount_amount'] = 0
            attrs['final_amount'] = plan.price
        
        return attrs
    
    def create(self, validated_data):
        request = self.context['request']
        plan = validated_data['plan']
        coupon = validated_data.pop('coupon', None)
        discount_amount = validated_data.pop('discount_amount', 0)
        final_amount = validated_data.pop('final_amount', plan.price)
        
        # Create payment record
        payment = Payment.objects.create(
            user=request.user,
            plan=plan,
            amount=final_amount,
            payment_method=validated_data.get('payment_method', 'stripe'),
            metadata={
                'original_price': float(plan.price),
                'discount_amount': float(discount_amount),
                'coupon_used': coupon.code if coupon else None
            }
        )
        
        # Record coupon usage if applicable
        if coupon:
            CouponUsage.objects.create(
                coupon=coupon,
                user=request.user,
                payment=payment,
                discount_amount=discount_amount
            )
            coupon.use_coupon()
        
        return payment

class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan_type_display = serializers.CharField(source='get_plan_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    days_remaining = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    payment_amount = serializers.DecimalField(
        source='payment.amount', 
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    
    class Meta:
        model = UserSubscription
        fields = [
            'id', 'user', 'plan_type', 'plan_type_display', 'payment',
            'start_date', 'end_date', 'status', 'status_display',
            'is_active', 'auto_renew', 'days_remaining', 'is_expired',
            'payment_amount', 'created_at'
        ]
        read_only_fields = ['user', 'payment', 'created_at']

class CouponSerializer(serializers.ModelSerializer):
    coupon_type_display = serializers.CharField(source='get_coupon_type_display', read_only=True)
    is_valid = serializers.SerializerMethodField()
    validity_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'description', 'coupon_type', 'coupon_type_display',
            'discount_value', 'max_discount', 'min_purchase_amount',
            'valid_from', 'valid_to', 'max_uses', 'used_count',
            'is_active', 'is_valid', 'validity_message', 'applicable_plans',
            'created_at'
        ]
    
    def get_is_valid(self, obj):
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None
        is_valid, _ = obj.is_valid(user=user)
        return is_valid
    
    def get_validity_message(self, obj):
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None
        _, message = obj.is_valid(user=user)
        return message

class CouponValidateSerializer(serializers.Serializer):
    coupon_code = serializers.CharField(max_length=50)
    plan_id = serializers.IntegerField(required=False)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    def validate(self, attrs):
        coupon_code = attrs.get('coupon_code')
        plan_id = attrs.get('plan_id')
        amount = attrs.get('amount')
        
        try:
            coupon = Coupon.objects.get(code=coupon_code, is_active=True)
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("Invalid coupon code")
        
        plan = None
        if plan_id:
            try:
                plan = PaymentPlan.objects.get(id=plan_id, is_active=True)
            except PaymentPlan.DoesNotExist:
                raise serializers.ValidationError("Invalid payment plan")
        
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None
        
        is_valid, message = coupon.is_valid(
            user=user,
            plan=plan,
            amount=amount
        )
        
        if not is_valid:
            raise serializers.ValidationError(message)
        
        # Calculate discount
        discount_amount = coupon.calculate_discount(amount)
        final_amount = amount - discount_amount
        
        attrs['coupon'] = coupon
        attrs['discount_amount'] = discount_amount
        attrs['final_amount'] = final_amount
        attrs['validity_message'] = message
        
        return attrs

class CouponUsageSerializer(serializers.ModelSerializer):
    coupon_code = serializers.CharField(source='coupon.code', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    payment_amount = serializers.DecimalField(source='payment.amount', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = CouponUsage
        fields = [
            'id', 'coupon', 'coupon_code', 'user', 'user_email', 'payment',
            'payment_amount', 'discount_amount', 'used_at'
        ]
        read_only_fields = ['used_at']

class TransactionSerializer(serializers.ModelSerializer):
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_plan = serializers.CharField(source='payment.plan.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'payment', 'payment_plan', 'transaction_type', 
            'transaction_type_display', 'amount', 'currency',
            'gateway_transaction_id', 'status', 'status_display',
            'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class SubscriptionSummarySerializer(serializers.Serializer):
    active_subscription = UserSubscriptionSerializer(read_only=True, allow_null=True)
    is_premium = serializers.BooleanField()
    premium_expiry = serializers.DateTimeField(allow_null=True)
    days_remaining = serializers.IntegerField(default=0)
    total_payments = serializers.IntegerField(default=0)
    total_amount_spent = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_history = PaymentSerializer(many=True, read_only=True)

class PaymentWebhookSerializer(serializers.Serializer):
    id = serializers.CharField()
    object = serializers.CharField()
    amount_total = serializers.IntegerField()
    currency = serializers.CharField()
    customer_email = serializers.EmailField()
    metadata = serializers.JSONField()
    payment_status = serializers.CharField()
    
    def validate(self, attrs):
        # Validate webhook data structure
        if attrs.get('object') != 'checkout.session':
            raise serializers.ValidationError("Invalid webhook object type")
        
        if not attrs.get('metadata', {}).get('user_id'):
            raise serializers.ValidationError("Missing user_id in metadata")
        
        return attrs

# Admin serializers for detailed views
class PaymentDetailSerializer(PaymentSerializer):
    subscription_details = serializers.SerializerMethodField()
    coupon_usage = serializers.SerializerMethodField()
    
    class Meta(PaymentSerializer.Meta):
        fields = PaymentSerializer.Meta.fields + ['subscription_details', 'coupon_usage', 'metadata']
    
    def get_subscription_details(self, obj):
        subscription = UserSubscription.objects.filter(payment=obj).first()
        if subscription:
            return UserSubscriptionSerializer(subscription).data
        return None
    
    def get_coupon_usage(self, obj):
        coupon_usage = CouponUsage.objects.filter(payment=obj).first()
        if coupon_usage:
            return CouponUsageSerializer(coupon_usage).data
        return None

class PaymentPlanDetailSerializer(PaymentPlanSerializer):
    total_subscriptions = serializers.SerializerMethodField()
    total_revenue = serializers.SerializerMethodField()
    
    class Meta(PaymentPlanSerializer.Meta):
        fields = PaymentPlanSerializer.Meta.fields + ['total_subscriptions', 'total_revenue']
    
    def get_total_subscriptions(self, obj):
        return UserSubscription.objects.filter(plan_type=obj.plan_type, status='active').count()
    
    def get_total_revenue(self, obj):
        from django.db.models import Sum
        total = Payment.objects.filter(
            plan=obj, 
            status='completed'
        ).aggregate(total=Sum('amount'))['total']
        return total or 0