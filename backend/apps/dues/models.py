"""
Dues app models — Deposit, Due, and MasavariPayment.
"""

from django.db import models
from django.utils import timezone


class Deposit(models.Model):
    DEPOSIT_TYPES = [
        ('membership_fee', 'Membership Fee'),
        ('share_capital', 'Share Capital'),
        ('savings', 'Savings Deposit'),
        ('fixed', 'Fixed Deposit'),
        ('recurring', 'Recurring Deposit'),
        ('other', 'Other'),
    ]
    STATUS = [
        ('active', 'Active'),
        ('matured', 'Matured'),
        ('withdrawn', 'Withdrawn'),
        ('closed', 'Closed'),
    ]

    member = models.ForeignKey(
        'members.Member',
        on_delete=models.PROTECT,
        related_name='deposits',
    )
    deposit_type = models.CharField(max_length=30, choices=DEPOSIT_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    deposit_date = models.DateField()
    maturity_date = models.DateField(null=True, blank=True)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    receipt_no = models.CharField(max_length=50, blank=True)
    payment_mode = models.CharField(max_length=20, default='cash')
    status = models.CharField(max_length=20, choices=STATUS, default='active')
    remarks = models.TextField(blank=True)
    recorded_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-deposit_date']
        db_table = 'dues_deposit'

    def __str__(self):
        return f"{self.get_deposit_type_display()} — {self.member.full_name} — ₹{self.amount}"


class Due(models.Model):
    DUE_TYPES = [
        ('chit_instalment', 'Chit Instalment'),
        ('loan_emi', 'Loan EMI'),
        ('membership_renewal', 'Membership Renewal'),
        ('masavari', 'Masavari (Monthly Due)'),
        ('penalty', 'Penalty'),
        ('other', 'Other'),
    ]
    STATUS = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('waived', 'Waived'),
    ]

    member = models.ForeignKey(
        'members.Member',
        on_delete=models.PROTECT,
        related_name='dues',
    )
    due_type = models.CharField(max_length=30, choices=DUE_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    reference = models.CharField(max_length=100, blank=True)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_date']
        db_table = 'dues_due'

    def __str__(self):
        return f"{self.get_due_type_display()} — {self.member.full_name} — ₹{self.amount}"

    @property
    def is_overdue(self):
        """Dynamic overdue check — not stored as static field."""
        return self.status == 'pending' and self.due_date < timezone.now().date()

    @property
    def days_overdue(self):
        if self.is_overdue:
            return (timezone.now().date() - self.due_date).days
        return 0


class MasavariPayment(models.Model):
    """Monthly membership fee (Masavari) paid by members to maintain active status.
    Members who haven't paid for 12 months are considered inactive.
    """
    PAYMENT_MODES = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('cheque', 'Cheque'),
        ('upi', 'UPI'),
    ]
    STATUS = [
        ('paid', 'Paid'),
        ('pending', 'Pending'),
        ('overdue', 'Overdue'),
    ]

    member = models.ForeignKey(
        'members.Member',
        on_delete=models.PROTECT,
        related_name='masavari_payments',
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    month = models.PositiveIntegerField(help_text='Month number (1-12)')
    year = models.PositiveIntegerField(help_text='Year e.g. 2026')
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODES, default='cash')
    receipt_no = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    remarks = models.TextField(blank=True)
    recorded_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-year', '-month']
        unique_together = ['member', 'year', 'month']
        db_table = 'dues_masavari'

    def __str__(self):
        return f"Masavari \u2014 {self.member.full_name} \u2014 {self.month}/{self.year} \u2014 \u20b9{self.amount}"

    @property
    def is_overdue(self):
        return self.status == 'pending' and self.due_date < timezone.now().date()

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.status == 'paid' and self.member and self.member.status == 'inactive':
            from apps.members.utils import check_and_reactivate_member
            check_and_reactivate_member(self.member)
