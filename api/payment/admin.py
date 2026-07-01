# payment/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import PaymentPlan, Payment, UserSubscription, Coupon, CouponUsage, Transaction

class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    max_num = 5
    readonly_fields = ['amount', 'status', 'created_at']
    can_delete = False
    fields = ['plan', 'amount', 'status', 'payment_method', 'created_at']

class UserSubscriptionInline(admin.TabularInline):
    model = UserSubscription
    extra = 0
    max_num = 3
    readonly_fields = ['start_date', 'end_date', 'status']
    can_delete = False
    fields = ['plan_type', 'start_date', 'end_date', 'status', 'is_active']

@admin.register(PaymentPlan)
class PaymentPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'plan_type', 'price', 'duration_days', 'discount_percentage', 'is_popular', 'is_active']
    list_filter = ['plan_type', 'is_active', 'is_popular']
    search_fields = ['name', 'description']
    list_editable = ['is_popular', 'is_active']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'plan_type', 'description')
        }),
        ('Pricing', {
            'fields': ('price', 'original_price', 'duration_days')
        }),
        ('Features', {
            'fields': ('features',)
        }),
        ('Status', {
            'fields': ('is_popular', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def discount_percentage(self, obj):
        if obj.discount_percentage > 0:
            return format_html(
                '<span style="color: green;">{}% OFF</span>',
                obj.discount_percentage
            )
        return '-'
    discount_percentage.short_description = 'Discount'

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'amount', 'status_badge', 'payment_method', 'created_at']
    list_filter = ['status', 'payment_method', 'plan', 'created_at']
    search_fields = ['user__username', 'user__email', 'payment_id']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']
    inlines = [UserSubscriptionInline]
    fieldsets = (
        ('Payment Information', {
            'fields': ('user', 'plan', 'amount', 'payment_method')
        }),
        ('Payment Details', {
            'fields': ('payment_id', 'stripe_payment_intent_id', 'status')
        }),
        ('Metadata', {
            'fields': ('metadata', 'created_at', 'updated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )

    def status_badge(self, obj):
        color_map = {
            'completed': 'green',
            'pending': 'orange',
            'failed': 'red',
            'refunded': 'blue',
            'cancelled': 'gray'
        }
        color = color_map.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">{}</span>',
            color,
            obj.get_status_display().upper()
        )
    status_badge.short_description = 'Status'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'plan')

@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan_type', 'status_badge', 'start_date', 'end_date', 'days_remaining', 'is_active']
    list_filter = ['plan_type', 'status', 'is_active', 'start_date']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at', 'days_remaining_display']
    fieldsets = (
        ('Subscription Information', {
            'fields': ('user', 'plan_type', 'payment')
        }),
        ('Duration', {
            'fields': ('start_date', 'end_date', 'days_remaining_display')
        }),
        ('Status', {
            'fields': ('status', 'is_active', 'auto_renew')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def status_badge(self, obj):
        color_map = {
            'active': 'green',
            'expired': 'red',
            'cancelled': 'gray'
        }
        color = color_map.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">{}</span>',
            color,
            obj.get_status_display().upper()
        )
    status_badge.short_description = 'Status'

    def days_remaining(self, obj):
        days = obj.days_remaining
        if days > 7:
            color = 'green'
        elif days > 0:
            color = 'orange'
        else:
            color = 'red'
        return format_html(
            '<span style="color: {};">{} days</span>',
            color,
            days
        )
    days_remaining.short_description = 'Days Left'

    def days_remaining_display(self, obj):
        return f"{obj.days_remaining} days"
    days_remaining_display.short_description = 'Days Remaining'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'payment')

@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ['code', 'coupon_type', 'discount_value', 'used_count', 'max_uses', 'is_active', 'validity_status']
    list_filter = ['coupon_type', 'is_active']
    search_fields = ['code', 'description']
    filter_horizontal = ['applicable_plans']
    readonly_fields = ['created_at', 'updated_at', 'used_count']
    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'description', 'coupon_type')
        }),
        ('Discount Details', {
            'fields': ('discount_value', 'max_discount', 'min_purchase_amount')
        }),
        ('Validity', {
            'fields': ('valid_from', 'valid_to', 'max_uses', 'used_count', 'is_active')
        }),
        ('Applicable Plans', {
            'fields': ('applicable_plans',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def validity_status(self, obj):
        now = timezone.now()
        if not obj.is_active:
            return format_html('<span style="color: red;">Inactive</span>')
        elif now < obj.valid_from:
            return format_html('<span style="color: orange;">Not Started</span>')
        elif now > obj.valid_to:
            return format_html('<span style="color: red;">Expired</span>')
        elif obj.used_count >= obj.max_uses:
            return format_html('<span style="color: red;">Fully Used</span>')
        else:
            return format_html('<span style="color: green;">Active</span>')
    validity_status.short_description = 'Validity'

@admin.register(CouponUsage)
class CouponUsageAdmin(admin.ModelAdmin):
    list_display = ['coupon', 'user', 'discount_amount', 'used_at']
    list_filter = ['used_at']
    search_fields = ['coupon__code', 'user__username']
    readonly_fields = ['used_at']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('coupon', 'user', 'payment')

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['payment', 'transaction_type', 'amount', 'status', 'created_at']
    list_filter = ['transaction_type', 'status', 'created_at']
    search_fields = ['payment__payment_id', 'gateway_transaction_id']
    readonly_fields = ['created_at', 'updated_at']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('payment')

# Custom actions for payment admin
def mark_payments_completed(modeladmin, request, queryset):
    for payment in queryset:
        if payment.status == 'pending':
            payment.mark_completed()
mark_payments_completed.short_description = "Mark selected payments as completed"

def mark_payments_failed(modeladmin, request, queryset):
    queryset.filter(status='pending').update(status='failed')
mark_payments_failed.short_description = "Mark selected payments as failed"

PaymentAdmin.actions = [mark_payments_completed, mark_payments_failed]