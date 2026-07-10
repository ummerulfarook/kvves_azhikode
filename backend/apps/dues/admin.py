from django.contrib import admin
from .models import Deposit, Due


@admin.register(Deposit)
class DepositAdmin(admin.ModelAdmin):
    list_display = ['member', 'deposit_type', 'amount', 'deposit_date', 'status']
    list_filter = ['deposit_type', 'status']
    search_fields = ['member__full_name', 'member__member_no', 'receipt_no']


@admin.register(Due)
class DueAdmin(admin.ModelAdmin):
    list_display = ['member', 'due_type', 'amount', 'due_date', 'status']
    list_filter = ['due_type', 'status']
    search_fields = ['member__full_name', 'member__member_no']
