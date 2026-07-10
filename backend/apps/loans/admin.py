from django.contrib import admin
from .models import Loan, LoanRepayment


@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ['loan_no', 'member', 'loan_amount', 'outstanding_balance', 'status', 'created_at']
    list_filter = ['status', 'loan_type']
    search_fields = ['loan_no', 'member__full_name', 'member__member_no']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(LoanRepayment)
class LoanRepaymentAdmin(admin.ModelAdmin):
    list_display = ['loan', 'instalment_no', 'amount_paid', 'due_date', 'paid_date', 'is_paid']
    list_filter = ['is_paid', 'payment_mode']
