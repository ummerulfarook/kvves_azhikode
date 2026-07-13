"""
Members app — Member profile model.
"""

from django.db import models
from django.utils import timezone


class Member(models.Model):
    GENDER = [('M', 'Male'), ('F', 'Female'), ('O', 'Other')]
    STATUS = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('deceased', 'Deceased'),
        ('suspended', 'Suspended'),
    ]
    MEMBERSHIP_TYPES = [
        ('regular', 'Regular'),
        ('associate', 'Associate'),
        ('honorary', 'Honorary'),
    ]

    member_no = models.CharField(max_length=20, unique=True)
    full_name = models.CharField(max_length=150)
    full_name_ml = models.CharField(max_length=150, blank=True)  # Malayalam name
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER)
    phone = models.CharField(max_length=15)
    alternate_phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    business_name = models.CharField(max_length=200, blank=True)  # business / shop name
    business_address = models.TextField(blank=True)  # business address
    address = models.TextField()
    ward = models.CharField(max_length=100, blank=True)
    panchayat = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, default='Kannur')
    pin_code = models.CharField(max_length=10, blank=True)
    aadhaar_number = models.CharField(max_length=12, blank=True)
    pan_number = models.CharField(max_length=10, blank=True)
    photo = models.ImageField(upload_to='members/photos/', null=True, blank=True)
    membership_type = models.CharField(max_length=20, choices=MEMBERSHIP_TYPES, default='regular')
    joining_date = models.DateField(default=timezone.now)
    masavari_amount = models.DecimalField(max_digits=10, decimal_places=2, default=50.00)
    status = models.CharField(max_length=20, choices=STATUS, default='active')
    remarks = models.TextField(blank=True)
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_members',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['member_no']
        db_table = 'members_member'

    def __str__(self):
        return f"{self.member_no} - {self.full_name}"

    @property
    def age(self):
        if self.date_of_birth:
            today = timezone.now().date()
            b = self.date_of_birth
            return today.year - b.year - ((today.month, today.day) < (b.month, b.day))
        return None


class Allowance(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('paid', 'Paid'),
    ]

    member = models.ForeignKey(
        'members.Member',
        on_delete=models.CASCADE,
        related_name='allowances',
    )
    title = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='paid')
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-paid_date', '-created_at']
        db_table = 'members_allowance'

    def __str__(self):
        return f"{self.title} — {self.member.full_name} — ₹{self.amount}"
