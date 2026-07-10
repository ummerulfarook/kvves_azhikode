"""
Curries app — rotating savings groups open to members and non-members.
"""

from django.db import models


class Curry(models.Model):
    STATUS = [
        ('upcoming', 'Upcoming'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('terminated', 'Terminated'),
    ]

    curry_no = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=150)
    monthly_amount = models.DecimalField(max_digits=10, decimal_places=2)
    total_slots = models.PositiveIntegerField()
    duration_months = models.PositiveIntegerField()
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='active')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'curries_curry'

    def __str__(self):
        return f"{self.curry_no} - {self.name}"

    @property
    def participant_count(self):
        return self.participants.filter(status='active').count()


class CurryParticipant(models.Model):
    STATUS = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('defaulted', 'Defaulted'),
        ('withdrawn', 'Withdrawn'),
    ]

    curry = models.ForeignKey(Curry, on_delete=models.PROTECT, related_name='participants')
    is_member = models.BooleanField(default=True)

    # For registered members
    member = models.ForeignKey(
        'members.Member',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='curry_participations',
    )

    # For non-members
    participant_name = models.CharField(max_length=150, blank=True)
    participant_phone = models.CharField(max_length=15, blank=True)
    participant_address = models.TextField(blank=True)

    # Guarantor (required for non-members)
    guarantor_name = models.CharField(max_length=150, blank=True)
    guarantor_phone = models.CharField(max_length=15, blank=True)
    guarantor_address = models.TextField(blank=True)
    guarantor_relation = models.CharField(max_length=100, blank=True)

    ticket_number = models.CharField(max_length=20)
    enrollment_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS, default='active')
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['curry', 'ticket_number']
        ordering = ['ticket_number']
        db_table = 'curries_participant'

    def __str__(self):
        name = self.member.full_name if self.is_member and self.member else self.participant_name
        return f"Ticket {self.ticket_number} — {name} in {self.curry.curry_no}"

    @property
    def display_name(self):
        if self.is_member and self.member:
            return self.member.full_name
        return self.participant_name

    @property
    def paid_months(self):
        return self.payments.filter(is_paid=True).count()

    @property
    def total_paid_amount(self):
        from django.db.models import Sum
        result = self.payments.filter(is_paid=True).aggregate(total=Sum('amount'))
        return result['total'] or 0


class CurryPayment(models.Model):
    PAYMENT_MODES = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('cheque', 'Cheque'),
        ('upi', 'UPI'),
    ]

    participant = models.ForeignKey(CurryParticipant, on_delete=models.PROTECT, related_name='payments')
    month_number = models.PositiveIntegerField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODES, default='cash')
    receipt_no = models.CharField(max_length=50, blank=True)
    is_paid = models.BooleanField(default=False)
    remarks = models.TextField(blank=True)
    recorded_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['participant', 'month_number']
        ordering = ['month_number']
        db_table = 'curries_payment'

    def __str__(self):
        return f"Month {self.month_number} — {self.participant}"

    @property
    def is_overdue(self):
        from django.utils import timezone
        return not self.is_paid and self.due_date < timezone.now().date()

    @property
    def days_overdue(self):
        from django.utils import timezone
        if self.is_overdue:
            return (timezone.now().date() - self.due_date).days
        return 0
