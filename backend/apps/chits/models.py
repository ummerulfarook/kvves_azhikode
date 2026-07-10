"""
Chits app models — ChitGroup, ChitEnrollment, ChitPayment.
"""

from django.db import models


class ChitGroup(models.Model):
    STATUS = [
        ('upcoming', 'Upcoming'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('terminated', 'Terminated'),
    ]

    group_no = models.CharField(max_length=20, unique=True)
    group_name = models.CharField(max_length=100)
    chit_value = models.DecimalField(max_digits=12, decimal_places=2)
    monthly_instalment = models.DecimalField(max_digits=10, decimal_places=2)
    duration_months = models.PositiveIntegerField()
    total_members = models.PositiveIntegerField()
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    commission_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Commission rate/surcharge (flat amount in ₹)")
    status = models.CharField(max_length=20, choices=STATUS, default='upcoming')
    remarks = models.TextField(blank=True)
    number_of_divisions = models.PositiveIntegerField(default=2, null=True, blank=True)
    division_labels = models.CharField(max_length=150, default="A,B", blank=True, help_text="Comma-separated labels for divisions")
    current_month = models.PositiveIntegerField(default=1, help_text="The current active month of the welfare group")
    processing_days = models.PositiveIntegerField(default=7, help_text="Number of days for processing payouts")
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def effective_divisions(self):
        if self.number_of_divisions is None or self.number_of_divisions == 0:
            return 1
        return self.number_of_divisions

    @property
    def effective_division_labels(self):
        labels = [l.strip() for l in (self.division_labels or '').split(',') if l.strip()]
        eff_divs = self.effective_divisions
        if not labels:
            labels = ['A']
        while len(labels) < eff_divs:
            labels.append(chr(ord('A') + len(labels)))
        return labels[:eff_divs]

    class Meta:
        ordering = ['-created_at']
        db_table = 'chits_chitgroup'

    def __str__(self):
        return f"{self.group_no} - {self.group_name}"

    @property
    def enrolled_count(self):
        return self.enrollments.filter(status__in=['active', 'awarded']).count()


class ChitEnrollment(models.Model):
    STATUS = [
        ('active', 'Active'),
        ('awarded', 'Awarded'),
        ('completed', 'Completed'),
        ('defaulted', 'Defaulted'),
        ('transferred', 'Transferred'),
    ]

    member = models.ForeignKey(
        'members.Member',
        on_delete=models.PROTECT,
        related_name='chit_enrollments',
        null=True,
        blank=True,
    )
    non_member_name = models.CharField(max_length=150, blank=True)
    non_member_phone = models.CharField(max_length=15, blank=True)
    non_member_address = models.TextField(blank=True)

    guarantor1 = models.ForeignKey(
        'members.Member',
        on_delete=models.PROTECT,
        related_name='welfare_guarantor1_set',
        null=True,
        blank=True,
    )
    guarantor2 = models.ForeignKey(
        'members.Member',
        on_delete=models.PROTECT,
        related_name='welfare_guarantor2_set',
        null=True,
        blank=True,
    )

    chit_group = models.ForeignKey(
        ChitGroup,
        on_delete=models.PROTECT,
        related_name='enrollments',
    )
    ticket_number = models.CharField(max_length=20)
    division_label = models.CharField(max_length=20, blank=True)
    enrollment_date = models.DateField()
    prize_won = models.BooleanField(default=False)
    prize_date = models.DateField(null=True, blank=True)
    prize_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    surcharge_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Surcharge amount (profit of firm)")
    service_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Service charge instead of or in addition to commission")
    reduction_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Deduction/reduction beyond grace period (profit of firm)")
    received_date = models.DateField(null=True, blank=True)
    payout_payment_mode = models.CharField(max_length=20, default='cash', choices=[
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('cheque', 'Cheque'),
        ('upi', 'UPI'),
    ])
    cheque_number = models.CharField(max_length=50, blank=True, help_text="Cheque number or transaction reference number")
    status = models.CharField(max_length=20, choices=STATUS, default='active')
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['chit_group', 'ticket_number']
        ordering = ['ticket_number']
        db_table = 'chits_chitenrollment'

    def __str__(self):
        name = self.member.full_name if self.member else f"{self.non_member_name} (Non-member)"
        return f"Ticket {self.ticket_number} — {name} in {self.chit_group.group_no}"

    @property
    def paid_months(self):
        return self.payments.filter(is_paid=True).count()

    @property
    def total_paid_amount(self):
        from django.db.models import Sum
        result = self.payments.filter(is_paid=True).aggregate(total=Sum('amount_paid'))
        return result['total'] or 0


class ChitPayment(models.Model):
    PAYMENT_MODES = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('cheque', 'Cheque'),
        ('upi', 'UPI'),
    ]

    enrollment = models.ForeignKey(
        ChitEnrollment,
        on_delete=models.PROTECT,
        related_name='payments',
    )
    month_number = models.PositiveIntegerField()
    installment_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODES, default='cash')
    receipt_no = models.CharField(max_length=50, blank=True)
    late_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    is_paid = models.BooleanField(default=False)
    remarks = models.TextField(blank=True)
    recorded_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['enrollment', 'month_number']
        ordering = ['month_number']
        db_table = 'chits_chitpayment'

    def __str__(self):
        return f"Month {self.month_number} — {self.enrollment}"

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


class WelfareAuction(models.Model):
    welfare_group = models.ForeignKey(
        ChitGroup,
        on_delete=models.CASCADE,
        related_name='auctions',
    )
    month_number = models.PositiveIntegerField()
    installment_amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_completed = models.BooleanField(default=False)
    completed_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['welfare_group', 'month_number']
        ordering = ['month_number']
        db_table = 'chits_welfareauction'

    def __str__(self):
        return f"Auction Month {self.month_number} — {self.welfare_group.group_name}"


class WelfareAuctionSlot(models.Model):
    SLOT_TYPES = [
        ('winner', 'Winner'),
        ('caller', 'Caller'),
    ]

    auction = models.ForeignKey(
        WelfareAuction,
        on_delete=models.CASCADE,
        related_name='slots',
    )
    slot_type = models.CharField(max_length=10, choices=SLOT_TYPES)
    division_label = models.CharField(max_length=20)
    enrollment = models.ForeignKey(
        ChitEnrollment,
        on_delete=models.PROTECT,
        related_name='auction_slots',
        null=True,
        blank=True,
    )
    bid_amount = models.DecimalField(max_digits=12, decimal_places=2)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2)
    service_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    surcharge_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    net_received = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    profit_earned = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    class Meta:
        db_table = 'chits_welfareauctionslot'
        ordering = ['slot_type']

    def __str__(self):
        recipient = self.enrollment.member.full_name if (self.enrollment and self.enrollment.member) else (self.enrollment.non_member_name if self.enrollment else 'Unassigned')
        return f"{self.slot_type.upper()} ({self.division_label}) — {recipient} — Bid: {self.bid_amount}"

