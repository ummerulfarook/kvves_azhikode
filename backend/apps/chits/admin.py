from django.contrib import admin
from .models import ChitGroup, ChitEnrollment, ChitPayment


@admin.register(ChitGroup)
class ChitGroupAdmin(admin.ModelAdmin):
    list_display = ['group_no', 'group_name', 'chit_value', 'monthly_instalment', 'duration_months', 'status']
    list_filter = ['status']
    search_fields = ['group_no', 'group_name']


@admin.register(ChitEnrollment)
class ChitEnrollmentAdmin(admin.ModelAdmin):
    list_display = ['ticket_number', 'member', 'chit_group', 'enrollment_date', 'status', 'prize_won']
    list_filter = ['status', 'prize_won']
    search_fields = ['ticket_number', 'member__full_name', 'chit_group__group_no']


@admin.register(ChitPayment)
class ChitPaymentAdmin(admin.ModelAdmin):
    list_display = ['enrollment', 'month_number', 'amount_paid', 'due_date', 'paid_date', 'is_paid']
    list_filter = ['is_paid', 'payment_mode']
