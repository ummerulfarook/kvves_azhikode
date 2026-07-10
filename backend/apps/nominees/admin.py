from django.contrib import admin
from .models import Nominee


@admin.register(Nominee)
class NomineeAdmin(admin.ModelAdmin):
    list_display = ['name', 'member', 'relationship', 'share_percentage', 'is_primary']
    list_filter = ['relationship', 'is_primary']
    search_fields = ['name', 'member__full_name', 'member__member_no']
