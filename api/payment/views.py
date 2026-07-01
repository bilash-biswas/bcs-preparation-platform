# payment/views.py
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, Count
from django.utils import timezone
from datetime import timedelta
import stripe
from django.conf import settings
from django.db.models import Avg


from .models import PaymentPlan, Payment, UserSubscription, Coupon, CouponUsage, Transaction
from .serializers import (
    PaymentPlanSerializer, PaymentPlanDetailSerializer,
    PaymentSerializer, PaymentCreateSerializer, PaymentDetailSerializer,
    UserSubscriptionSerializer, CouponSerializer, CouponValidateSerializer,
    CouponUsageSerializer, TransactionSerializer, SubscriptionSummarySerializer
)

stripe.api_key = settings.STRIPE_SECRET_KEY

class PaymentPlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PaymentPlan.objects.filter(is_active=True)
    serializer_class = PaymentPlanSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    filterset_fields = ['plan_type', 'is_active', 'is_popular']
    ordering_fields = ['price', 'duration_days']
    
    def get_queryset(self):
        return PaymentPlan.objects.filter(is_active=True)
    
    @action(detail=True, methods=['get'])
    def subscriptions(self, request, pk=None):
        """Get active subscriptions for this plan"""
        plan = self.get_object()
        subscriptions = UserSubscription.objects.filter(
            plan_type=plan.plan_type,
            status='active'
        )[:10]  # Limit to 10 for performance
        
        serializer = UserSubscriptionSerializer(subscriptions, many=True)
        return Response(serializer.data)

class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'payment_method', 'plan']
    ordering_fields = ['created_at', 'amount']
    
    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentCreateSerializer
        elif self.action == 'retrieve':
            return PaymentDetailSerializer
        return PaymentSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def create_subscription(self, request):
        """Create a subscription payment with Stripe"""
        try:
            serializer = PaymentCreateSerializer(
                data=request.data, 
                context={'request': request}
            )
            
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            payment = serializer.save()
            plan = payment.plan
            
            # Create Stripe checkout session
            try:
                checkout_session = stripe.checkout.Session.create(
                    payment_method_types=['card'],
                    line_items=[{
                        'price_data': {
                            'currency': 'bdt',
                            'product_data': {
                                'name': plan.name,
                                'description': plan.description,
                            },
                            'unit_amount': int(payment.amount * 100),  # Convert to cents
                        },
                        'quantity': 1,
                    }],
                    mode='payment',
                    success_url=settings.FRONTEND_URL + f'/payment/success?payment_id={payment.id}',
                    cancel_url=settings.FRONTEND_URL + f'/payment/cancel?payment_id={payment.id}',
                    customer_email=request.user.email,
                    metadata={
                        'user_id': str(request.user.id),
                        'plan_id': str(plan.id),
                        'payment_id': str(payment.id)
                    }
                )
                
                # Update payment with Stripe session ID
                payment.payment_id = checkout_session.id
                payment.stripe_payment_intent_id = checkout_session.payment_intent
                payment.save()
                
                return Response({
                    'checkout_url': checkout_session.url, 
                    'payment_id': payment.id,
                    'amount': float(payment.amount)
                })
            except Exception as stripe_err:
                print(f"Stripe session creation failed: {stripe_err}")
                return Response({
                    'error': str(stripe_err),
                    'payment_id': payment.id,
                    'is_mock_available': True,
                    'amount': float(payment.amount)
                }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
    @action(detail=True, methods=['post'])
    def simulate_mock_payment(self, request, pk=None):
        """Simulate completing a payment in dev sandbox mode"""
        payment = self.get_object()
        if payment.status != 'completed':
            payment.mark_completed()
            Transaction.objects.create(
                payment=payment,
                transaction_type='payment',
                amount=payment.amount,
                gateway_transaction_id=f"mock_gateway_{payment.id}",
                status='completed',
                metadata={'simulated': True}
            )
            return Response({'status': 'completed', 'message': 'Payment completed successfully in mock mode'})
        return Response({'status': 'completed', 'message': 'Payment was already completed'})
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Get payment status"""
        payment = self.get_object()
        if payment.payment_id:
            try:
                session = stripe.checkout.Session.retrieve(payment.payment_id)
                return Response({
                    'payment_status': session.payment_status,
                    'stripe_status': session.status,
                    'our_status': payment.status
                })
            except stripe.error.StripeError:
                pass
        
        return Response({'status': payment.status})
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get user's payment and subscription summary"""
        user = request.user
        
        # Get active subscription
        active_subscription = UserSubscription.objects.filter(
            user=user, 
            status='active',
            is_active=True
        ).first()
        
        # Payment statistics
        payment_stats = Payment.objects.filter(user=user).aggregate(
            total_payments=Count('id'),
            total_amount=Sum('amount'),
            successful_payments=Count('id', filter=Q(status='completed'))
        )
        
        serializer = SubscriptionSummarySerializer({
            'active_subscription': active_subscription,
            'is_premium': user.is_premium,
            'premium_expiry': user.premium_expiry,
            'days_remaining': active_subscription.days_remaining if active_subscription else 0,
            'total_payments': payment_stats['total_payments'] or 0,
            'total_amount_spent': payment_stats['total_amount'] or 0,
            'payment_history': Payment.objects.filter(user=user).order_by('-created_at')[:5]
        })
        
        return Response(serializer.data)

class UserSubscriptionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSubscriptionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserSubscription.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def cancel_auto_renew(self, request, pk=None):
        """Cancel auto-renew for subscription"""
        subscription = self.get_object()
        subscription.auto_renew = False
        subscription.save()
        
        return Response({'message': 'Auto-renew cancelled successfully'})
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active subscription"""
        active_subscription = UserSubscription.objects.filter(
            user=request.user,
            status='active',
            is_active=True
        ).first()
        
        if active_subscription:
            serializer = self.get_serializer(active_subscription)
            return Response(serializer.data)
        return Response({'detail': 'No active subscription'}, status=status.HTTP_404_NOT_FOUND)

class CouponViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CouponSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ['code']
    
    def get_queryset(self):
        return Coupon.objects.filter(is_active=True)
    
    @action(detail=False, methods=['post'])
    def validate(self, request):
        """Validate a coupon code"""
        serializer = CouponValidateSerializer(
            data=request.data, 
            context={'request': request}
        )
        
        if serializer.is_valid():
            coupon = serializer.validated_data['coupon']
            return Response({
                'valid': True,
                'coupon': CouponSerializer(coupon, context={'request': request}).data,
                'discount_amount': float(serializer.validated_data['discount_amount']),
                'final_amount': float(serializer.validated_data['final_amount']),
                'message': serializer.validated_data['validity_message']
            })
        
        return Response({
            'valid': False,
            'message': serializer.errors.get('non_field_errors', ['Invalid coupon'])[0]
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def my_usage(self, request):
        """Get user's coupon usage history"""
        coupon_usages = CouponUsage.objects.filter(user=request.user)
        serializer = CouponUsageSerializer(coupon_usages, many=True)
        return Response(serializer.data)

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Transaction.objects.filter(payment__user=self.request.user)

class PaymentWebhookViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def stripe(self, request):
        """Handle Stripe webhook events"""
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            return Response({'error': 'Invalid payload'}, status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError as e:
            return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Handle different event types
        event_handlers = {
            'checkout.session.completed': self._handle_checkout_session_completed,
            'checkout.session.expired': self._handle_checkout_session_expired,
            'payment_intent.succeeded': self._handle_payment_intent_succeeded,
            'payment_intent.payment_failed': self._handle_payment_intent_failed,
        }
        
        handler = event_handlers.get(event['type'])
        if handler:
            handler(event['data']['object'])
        
        return Response({'status': 'success'})
    
    def _handle_checkout_session_completed(self, session):
        """Handle completed checkout session"""
        try:
            payment_id = session['metadata'].get('payment_id')
            if payment_id:
                payment = Payment.objects.get(id=payment_id)
                payment.mark_completed()
                
                # Create transaction record
                Transaction.objects.create(
                    payment=payment,
                    transaction_type='payment',
                    amount=payment.amount,
                    gateway_transaction_id=session.get('payment_intent'),
                    status='completed',
                    metadata=session
                )
        except (Payment.DoesNotExist, KeyError) as e:
            print(f"Webhook error: {e}")
    
    def _handle_checkout_session_expired(self, session):
        """Handle expired checkout session"""
        try:
            payment_id = session['metadata'].get('payment_id')
            if payment_id:
                payment = Payment.objects.get(id=payment_id)
                payment.status = 'cancelled'
                payment.save()
        except (Payment.DoesNotExist, KeyError):
            pass
    
    def _handle_payment_intent_succeeded(self, payment_intent):
        """Handle successful payment intent"""
        # This is a backup handler in case checkout.session.completed fails
        pass
    
    def _handle_payment_intent_failed(self, payment_intent):
        """Handle failed payment intent"""
        try:
            payment = Payment.objects.get(stripe_payment_intent_id=payment_intent['id'])
            payment.mark_failed()
            
            Transaction.objects.create(
                payment=payment,
                transaction_type='payment',
                amount=payment.amount,
                gateway_transaction_id=payment_intent['id'],
                status='failed',
                metadata=payment_intent
            )
        except Payment.DoesNotExist:
            pass

# Admin views for analytics and management
class PaymentAnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]
    
    def list(self, request):
        """Get payment analytics for admin"""
        # Revenue statistics
        revenue_stats = Payment.objects.filter(status='completed').aggregate(
            total_revenue=Sum('amount'),
            total_payments=Count('id'),
            avg_payment=Avg('amount')
        )
        
        # Subscription statistics
        subscription_stats = UserSubscription.objects.filter(status='active').aggregate(
            total_subscriptions=Count('id'),
            premium_count=Count('id', filter=Q(plan_type='premium')),
            gold_count=Count('id', filter=Q(plan_type='gold'))
        )
        
        # Recent payments
        recent_payments = Payment.objects.filter(status='completed').order_by('-completed_at')[:10]
        
        # Monthly revenue
        monthly_revenue = Payment.objects.filter(
            status='completed',
            completed_at__gte=timezone.now() - timedelta(days=30)
        ).aggregate(monthly_revenue=Sum('amount'))
        
        return Response({
            'revenue': {
                'total': revenue_stats['total_revenue'] or 0,
                'total_payments': revenue_stats['total_payments'] or 0,
                'average_payment': revenue_stats['avg_payment'] or 0,
                'monthly': monthly_revenue['monthly_revenue'] or 0
            },
            'subscriptions': {
                'total': subscription_stats['total_subscriptions'] or 0,
                'premium': subscription_stats['premium_count'] or 0,
                'gold': subscription_stats['gold_count'] or 0
            },
            'recent_payments': PaymentSerializer(recent_payments, many=True).data
        })
    
    @action(detail=False, methods=['get'])
    def plans_performance(self, request):
        """Get performance metrics for each payment plan"""
        plans = PaymentPlan.objects.filter(is_active=True)
        
        plan_performance = []
        for plan in plans:
            plan_data = PaymentPlanDetailSerializer(plan).data
            plan_performance.append(plan_data)
        
        return Response(plan_performance)

# Update the URLs configuration