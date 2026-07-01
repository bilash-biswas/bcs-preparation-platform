# payment/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'plans', views.PaymentPlanViewSet)
router.register(r'payments', views.PaymentViewSet, basename='payment')
router.register(r'subscriptions', views.UserSubscriptionViewSet, basename='subscription')
router.register(r'coupons', views.CouponViewSet, basename='coupon')
router.register(r'transactions', views.TransactionViewSet, basename='transaction')
router.register(r'analytics', views.PaymentAnalyticsViewSet, basename='analytics')
router.register(r'webhook', views.PaymentWebhookViewSet, basename='webhook')

urlpatterns = [
    path('', include(router.urls)),
]