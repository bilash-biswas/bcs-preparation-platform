# users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.utils import timezone
from datetime import timedelta
from .models import User, UserProfile

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fields = ('bio', 'address', 'education', 'profession', 'social_links')
    classes = ('collapse',)

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = [
        'username', 'email', 'user_type', 'is_premium', 
        'premium_status', 'streak', 'last_active', 'date_joined'
    ]
    list_filter = [
        'user_type', 'is_premium', 'is_staff', 'is_superuser', 
        'is_active', 'date_joined', 'last_active'
    ]
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone']
    ordering = ['-date_joined']
    readonly_fields = ['last_login', 'date_joined', 'last_active', 'premium_status']
    inlines = [UserProfileInline]
    
    fieldsets = (
        ('Authentication', {
            'fields': ('username', 'password')
        }),
        ('Personal Info', {
            'fields': ('first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'avatar')
        }),
        ('User Type & Status', {
            'fields': ('user_type', 'is_active', 'is_staff', 'is_superuser')
        }),
        ('Premium Features', {
            'fields': ('is_premium', 'premium_expiry', 'premium_status', 'coins', 'streak')
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined', 'last_active'),
            'classes': ('collapse',)
        }),
        ('Permissions', {
            'fields': ('groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'user_type'),
        }),
    )

    def premium_status(self, obj):
        if obj.is_premium and obj.premium_expiry:
            if obj.premium_expiry > timezone.now():
                days_left = (obj.premium_expiry - timezone.now()).days
                color = 'green' if days_left > 7 else 'orange'
                return format_html(
                    '<span style="color: {};">{} days left</span>',
                    color,
                    days_left
                )
            else:
                return format_html('<span style="color: red;">Expired</span>')
        return format_html('<span style="color: gray;">Not Premium</span>')
    premium_status.short_description = 'Premium Status'

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('profile')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'profession', 'education', 'created_at']
    list_filter = ['profession', 'education']
    search_fields = ['user__username', 'user__email', 'profession', 'education']
    readonly_fields = ['user_info']
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'user_info')
        }),
        ('Personal Details', {
            'fields': ('bio', 'address', 'education', 'profession')
        }),
        ('Social Links', {
            'fields': ('social_links',),
            'classes': ('collapse',)
        }),
    )

    def user_info(self, obj):
        return f"{obj.user.email} | {obj.user.get_user_type_display()}"
    user_info.short_description = 'User Info'

    def created_at(self, obj):
        return obj.user.date_joined
    created_at.short_description = 'Joined'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

# Custom filters
class PremiumStatusFilter(admin.SimpleListFilter):
    title = 'premium status'
    parameter_name = 'premium_status'

    def lookups(self, request, model_admin):
        return (
            ('active', 'Active Premium'),
            ('expired', 'Expired Premium'),
            ('none', 'No Premium'),
        )

    def queryset(self, request, queryset):
        now = timezone.now()
        if self.value() == 'active':
            return queryset.filter(is_premium=True, premium_expiry__gt=now)
        if self.value() == 'expired':
            return queryset.filter(is_premium=True, premium_expiry__lte=now)
        if self.value() == 'none':
            return queryset.filter(is_premium=False)
        return queryset

class StreakRangeFilter(admin.SimpleListFilter):
    title = 'streak range'
    parameter_name = 'streak_range'

    def lookups(self, request, model_admin):
        return (
            ('0', 'No Streak'),
            ('1-7', '1-7 Days'),
            ('8-30', '8-30 Days'),
            ('31+', '31+ Days'),
        )

    def queryset(self, request, queryset):
        if self.value() == '0':
            return queryset.filter(streak=0)
        if self.value() == '1-7':
            return queryset.filter(streak__range=(1, 7))
        if self.value() == '8-30':
            return queryset.filter(streak__range=(8, 30))
        if self.value() == '31+':
            return queryset.filter(streak__gte=31)
        return queryset

class RecentActivityFilter(admin.SimpleListFilter):
    title = 'recent activity'
    parameter_name = 'recent_activity'

    def lookups(self, request, model_admin):
        return (
            ('today', 'Active Today'),
            ('week', 'Active This Week'),
            ('month', 'Active This Month'),
            ('inactive', 'Inactive (30+ days)'),
        )

    def queryset(self, request, queryset):
        now = timezone.now()
        if self.value() == 'today':
            return queryset.filter(last_active__date=now.date())
        if self.value() == 'week':
            return queryset.filter(last_active__gte=now - timedelta(days=7))
        if self.value() == 'month':
            return queryset.filter(last_active__gte=now - timedelta(days=30))
        if self.value() == 'inactive':
            return queryset.filter(last_active__lt=now - timedelta(days=30))
        return queryset

# Add custom filters to UserAdmin
CustomUserAdmin.list_filter += (PremiumStatusFilter, StreakRangeFilter, RecentActivityFilter)

# Custom actions
def make_premium(modeladmin, request, queryset):
    for user in queryset:
        user.is_premium = True
        user.premium_expiry = timezone.now() + timedelta(days=30)
        user.save()
make_premium.short_description = "Grant 30-day premium access"

def remove_premium(modeladmin, request, queryset):
    queryset.update(is_premium=False, premium_expiry=None)
remove_premium.short_description = "Remove premium access"

def reset_streak(modeladmin, request, queryset):
    queryset.update(streak=0)
reset_streak.short_description = "Reset streak to zero"

def add_coins(modeladmin, request, queryset):
    for user in queryset:
        user.coins += 100
        user.save()
add_coins.short_description = "Add 100 coins to selected users"

# Add actions to UserAdmin
CustomUserAdmin.actions = [make_premium, remove_premium, reset_streak, add_coins]

# Admin site customization
admin.site.site_header = "BCS Preparation - User Management"
admin.site.site_title = "BCS Preparation User Admin"
admin.site.index_title = "User Administration"

# Change list customization
class CustomUserAdminWithStats(CustomUserAdmin):
    def changelist_view(self, request, extra_context=None):
        # Add statistics to the changelist view
        stats = {
            'total_users': User.objects.count(),
            'premium_users': User.objects.filter(is_premium=True).count(),
            'active_today': User.objects.filter(last_active__date=timezone.now().date()).count(),
            'total_students': User.objects.filter(user_type='student').count(),
            'total_teachers': User.objects.filter(user_type='teacher').count(),
        }
        
        extra_context = extra_context or {}
        extra_context['stats'] = stats
        return super().changelist_view(request, extra_context=extra_context)

# Re-register with enhanced admin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdminWithStats)