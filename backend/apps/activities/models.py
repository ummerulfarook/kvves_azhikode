"""
Activities app — ActivityLog, CommunityPost, and DistrictActivity models.
"""

from django.db import models
import os


def community_post_upload_path(instance, filename):
    return f'community_posts/{instance.post.id}/{filename}'


def district_activity_doc_path(instance, filename):
    return f'district_activities/{instance.activity.id}/{filename}'


class ActivityLog(models.Model):
    ACTIVITY_TYPES = [
        ('member_joined', 'Member Joined'),
        ('member_updated', 'Member Updated'),
        ('chit_enrolled', 'Enrolled in Chit'),
        ('chit_payment', 'Chit Payment Made'),
        ('chit_prize', 'Chit Prize Won'),
        ('loan_applied', 'Loan Applied'),
        ('loan_approved', 'Loan Approved'),
        ('loan_repayment', 'Loan Repayment'),
        ('deposit_made', 'Deposit Made'),
        ('deposit_withdrawn', 'Deposit Withdrawn'),
        ('due_paid', 'Due Paid'),
        ('due_overdue', 'Due Marked Overdue'),
        ('masavari_paid', 'Masavari (Monthly Fee) Paid'),
        ('nominee_added', 'Nominee Added'),
        ('nominee_updated', 'Nominee Updated'),
        ('status_changed', 'Status Changed'),
        ('other', 'Other'),
    ]

    member = models.ForeignKey(
        'members.Member',
        on_delete=models.CASCADE,
        related_name='activities',
        null=True,
        blank=True,
    )
    activity_type = models.CharField(max_length=30, choices=ACTIVITY_TYPES)
    description = models.TextField()
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    reference_id = models.CharField(max_length=50, blank=True)
    reference_type = models.CharField(max_length=50, blank=True)
    performed_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='activities_performed',
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        db_table = 'activities_activitylog'

    def __str__(self):
        return f"{self.activity_type} — {self.timestamp.strftime('%Y-%m-%d %H:%M')}"


class Committee(models.Model):
    name = models.CharField(max_length=100)  # e.g. "2022-24 Committee"
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    # Authority details
    president_name = models.CharField(max_length=150, blank=True)
    president_phone = models.CharField(max_length=15, blank=True)
    secretary_name = models.CharField(max_length=150, blank=True)
    secretary_phone = models.CharField(max_length=15, blank=True)
    treasurer_name = models.CharField(max_length=150, blank=True)
    treasurer_phone = models.CharField(max_length=15, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-name']
        db_table = 'activities_committee'

    def __str__(self):
        return self.name


class CommunityPost(models.Model):
    POST_TYPES = [
        ('plan', 'Future Plan'),
        ('work', 'Ongoing Work'),
        ('announcement', 'Announcement'),
        ('report', 'Report / Update'),
    ]

    committee = models.ForeignKey(
        Committee,
        on_delete=models.CASCADE,
        related_name='posts',
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=255)
    content = models.TextField()
    post_type = models.CharField(max_length=20, choices=POST_TYPES, default='announcement')
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='community_posts',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'activities_communitypost'

    def __str__(self):
        return f"{self.post_type} — {self.title}"


def community_attachment_path(instance, filename):
    return f'community_posts/{instance.post_id}/{filename}'


class CommunityAttachment(models.Model):
    post = models.ForeignKey(CommunityPost, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to=community_attachment_path)
    filename = models.CharField(max_length=255, blank=True)
    file_type = models.CharField(max_length=10, blank=True)  # pdf, jpg, png, etc.
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'activities_communityattachment'

    def save(self, *args, **kwargs):
        if self.file and not self.filename:
            self.filename = os.path.basename(self.file.name)
            _, ext = os.path.splitext(self.filename)
            self.file_type = ext.lstrip('.').lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.filename} — {self.post.title}"


class DistrictActivity(models.Model):
    ACTIVITY_TYPES = [
        ('payment', 'Payment to District'),
        ('collection', 'Collection / Remittance'),
        ('report', 'Report Submission'),
        ('meeting', 'Meeting / Visit'),
        ('inspection', 'Inspection'),
        ('other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('partial', 'Partial'),
        ('cancelled', 'Cancelled'),
    ]

    title = models.CharField(max_length=255)
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES, default='other')
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    activity_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reference_no = models.CharField(max_length=100, blank=True)
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='district_activities',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-activity_date', '-created_at']
        db_table = 'activities_districtactivity'

    def __str__(self):
        return f"{self.activity_type} — {self.title} ({self.activity_date})"


class DistrictScheme(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('completed', 'Completed'),
    ]
    name = models.CharField(max_length=255)
    scheme_code = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='district_schemes',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'activities_districtscheme'

    def __str__(self):
        return self.name
