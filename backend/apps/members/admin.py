"""
Django admin for members app.
"""

from django.contrib import admin
from .models import Member


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ['member_no', 'full_name', 'phone', 'membership_type', 'status', 'joining_date']
    list_filter = ['status', 'membership_type', 'gender', 'district']
    search_fields = ['member_no', 'full_name', 'phone', 'email', 'aadhaar_number']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    ordering = ['member_no']
    list_per_page = 25
