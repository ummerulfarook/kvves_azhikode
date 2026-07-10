from django.contrib import admin
from .models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['activity_type', 'member', 'description', 'performed_by', 'timestamp']
    list_filter = ['activity_type']
    search_fields = ['member__full_name', 'description']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']
