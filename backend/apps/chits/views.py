"""
Views for the chits app.
"""

from django.utils import timezone
from rest_framework import generics, status, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .models import ChitGroup, ChitEnrollment, ChitPayment, WelfareAuction, WelfareAuctionSlot
from .serializers import (
    ChitGroupSerializer,
    ChitGroupListSerializer,
    ChitEnrollmentSerializer,
    ChitPaymentSerializer,
    ChitPaymentOverdueSerializer,
    WelfareAuctionSerializer,
)
from apps.accounts.permissions import IsAdminOrStaffOrReadOnly


class ChitGroupListCreateView(generics.ListCreateAPIView):
    """GET /api/chit-groups/ | POST — create chit group."""

    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['group_no', 'group_name']
    ordering_fields = ['start_date', 'group_no', 'status']

    def get_queryset(self):
        qs = ChitGroup.objects.all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ChitGroupSerializer
        return ChitGroupListSerializer


class ChitGroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT /api/chit-groups/{id}/ | DELETE — soft delete."""

    queryset = ChitGroup.objects.prefetch_related('enrollments__member', 'enrollments__payments')
    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]
    serializer_class = ChitGroupSerializer

    def destroy(self, request, *args, **kwargs):
        group = self.get_object()
        group.status = 'terminated'
        group.save()
        return Response({'message': 'Chit group terminated.'}, status=status.HTTP_200_OK)


class ChitEnrollmentListView(generics.ListAPIView):
    """GET /api/chit-groups/{id}/enrollments/"""

    pagination_class = None
    serializer_class = ChitEnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChitEnrollment.objects.filter(
            chit_group_id=self.kwargs['group_pk']
        ).select_related('member', 'chit_group').prefetch_related('payments')


class ChitEnrollView(generics.CreateAPIView):
    """POST /api/chit-groups/{id}/enroll/ — enroll a member."""

    serializer_class = ChitEnrollmentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]

    def perform_create(self, serializer):
        group = ChitGroup.objects.get(pk=self.kwargs['group_pk'])
        enrollment = serializer.save(chit_group=group)

        # Auto-generate payment schedule up to current active month
        from datetime import date
        from dateutil.relativedelta import relativedelta
        start = group.start_date
        for month in range(1, group.current_month + 1):
            due = start + relativedelta(months=month - 1)
            ChitPayment.objects.create(
                enrollment=enrollment,
                month_number=month,
                installment_amount=group.monthly_instalment,
                amount_paid=0.00,
                due_date=due,
                is_paid=False,
            )

        # Activity log
        try:
            from apps.activities.models import ActivityLog
            ActivityLog.objects.create(
                member=enrollment.member,
                activity_type='chit_enrolled',
                description=f"Enrolled in chit group {group.group_no} — Ticket {enrollment.ticket_number}.",
                reference_id=str(enrollment.id),
                reference_type='ChitEnrollment',
                performed_by=self.request.user,
            )
        except Exception:
            pass


class ChitEnrollmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """PUT/DELETE /api/enrollments/{eid}/"""

    queryset = ChitEnrollment.objects.select_related('member', 'chit_group')
    serializer_class = ChitEnrollmentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]

    def perform_update(self, serializer):
        from apps.chits.models import WelfareAuctionSlot
        from apps.collections.models import DailyEntry
        from rest_framework.exceptions import ValidationError

        old_instance = self.get_object()
        old_received_date = old_instance.received_date
        old_service_charge = old_instance.service_charge
        old_surcharge_amount = old_instance.surcharge_amount
        old_prize_amount = old_instance.prize_amount

        # Validation: If already received/handed over, prevent editing payout details
        if old_received_date:
            has_payout_changes = (
                serializer.validated_data.get('service_charge', old_service_charge) != old_service_charge or
                serializer.validated_data.get('surcharge_amount', old_surcharge_amount) != old_surcharge_amount or
                serializer.validated_data.get('prize_amount', old_prize_amount) != old_prize_amount
            )
            # Allow setting/changing received_date, but prevent changing actual payout numbers
            if has_payout_changes:
                raise ValidationError("Cannot modify payout details once the welfare amount has been handed over.")

        enrollment = serializer.save()

        # Case 1: Money was just handed over (received_date is set for the first time)
        if enrollment.received_date and not old_received_date:
            prize_date = enrollment.received_date

            # Log Surcharge (Profit)
            if enrollment.surcharge_amount and enrollment.surcharge_amount > 0:
                DailyEntry.objects.create(
                    date=prize_date,
                    entry_type='income',
                    category='welfare_surcharge',
                    amount=enrollment.surcharge_amount,
                    description=f"Welfare Surcharge Profit (Commission: ₹{enrollment.surcharge_amount - enrollment.service_charge}, Service Charge: ₹{enrollment.service_charge}) for Group {enrollment.chit_group.group_name} (Ticket #{enrollment.ticket_number})",
                    member=enrollment.member,
                    payment_mode=enrollment.payout_payment_mode,
                    recorded_by=self.request.user,
                )

            # Log Payout Expense
            DailyEntry.objects.create(
                date=prize_date,
                entry_type='expense',
                category='welfare_payout',
                amount=enrollment.prize_amount,
                description=f"Welfare Payout for Group {enrollment.chit_group.group_name} (Ticket #{enrollment.ticket_number}){f' (Cheque/Ref: {enrollment.cheque_number})' if enrollment.cheque_number else ''}",
                member=enrollment.member,
                payment_mode=enrollment.payout_payment_mode,
                recorded_by=self.request.user,
            )

            # Log Grace Period Reduction (Profit)
            if enrollment.reduction_amount and enrollment.reduction_amount > 0:
                DailyEntry.objects.create(
                    date=prize_date,
                    entry_type='income',
                    category='welfare_reduction',
                    amount=enrollment.reduction_amount,
                    description=f"Welfare Beyond Grace Period Reduction Profit for Group {enrollment.chit_group.group_name} (Ticket #{enrollment.ticket_number})",
                    member=enrollment.member,
                    payment_mode=enrollment.payout_payment_mode,
                    recorded_by=self.request.user,
                )

            # Log activity log
            try:
                from apps.activities.models import ActivityLog
                ActivityLog.objects.create(
                    member=enrollment.member,
                    activity_type='chit_prize',
                    description=f"Welfare draw/prize handed over/disbursed in {enrollment.chit_group.group_name} (Ticket #{enrollment.ticket_number}) — Handover Amount: ₹{enrollment.prize_amount}.",
                    amount=enrollment.prize_amount,
                    reference_id=str(enrollment.id),
                    reference_type='ChitEnrollment',
                    performed_by=self.request.user,
                )
            except Exception:
                pass

        # Case 2: Handover already occurred, but received_date itself was changed later
        elif enrollment.received_date and old_received_date and enrollment.received_date != old_received_date:
            # Sync the dates of matching DailyEntry records
            payout_entry = DailyEntry.objects.filter(
                member=enrollment.member,
                entry_type='expense',
                category='welfare_payout',
                description__contains=f"Ticket #{enrollment.ticket_number}"
            ).first()
            if payout_entry:
                payout_entry.date = enrollment.received_date
                payout_entry.save()

            surcharge_entry = DailyEntry.objects.filter(
                member=enrollment.member,
                entry_type='income',
                category='welfare_surcharge',
                description__contains=f"Ticket #{enrollment.ticket_number}"
            ).first()
            if surcharge_entry:
                surcharge_entry.date = enrollment.received_date
                surcharge_entry.save()

        # Case 3: Prize won, but not yet handed over (received_date is None), and values updated
        elif enrollment.prize_won and not enrollment.received_date and (
            enrollment.service_charge != old_service_charge or
            enrollment.surcharge_amount != old_surcharge_amount or
            enrollment.prize_amount != old_prize_amount
        ):
            # Update the corresponding WelfareAuctionSlot
            slot = WelfareAuctionSlot.objects.filter(enrollment=enrollment).first()
            if slot:
                slot.service_charge = enrollment.service_charge
                slot.commission_amount = enrollment.surcharge_amount - enrollment.service_charge
                slot.surcharge_amount = enrollment.surcharge_amount
                slot.net_received = enrollment.prize_amount
                slot.profit_earned = enrollment.surcharge_amount + slot.discount_amount
                slot.save()

    def destroy(self, request, *args, **kwargs):
        enrollment = self.get_object()
        if request.user.role != 'admin':
            return Response({'error': True, 'message': 'Only admins can remove enrollments.'},
                            status=status.HTTP_403_FORBIDDEN)
        enrollment.status = 'defaulted'
        enrollment.save()
        return Response({'message': 'Enrollment removed.'})


class ChitPaymentListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/enrollments/{eid}/payments/"""

    serializer_class = ChitPaymentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]

    def get_queryset(self):
        return ChitPayment.objects.filter(enrollment_id=self.kwargs['enrollment_pk']).order_by('month_number')

    def create(self, request, *args, **kwargs):
        from decimal import Decimal
        enrollment = ChitEnrollment.objects.get(pk=self.kwargs['enrollment_pk'])
        month_number = int(request.data.get('month_number'))
        amount_to_pay = Decimal(str(request.data.get('amount_paid', 0)))

        payment, created = ChitPayment.objects.get_or_create(
            enrollment=enrollment,
            month_number=month_number,
            defaults={
                'installment_amount': enrollment.chit_group.monthly_instalment,
                'amount_paid': Decimal('0.00'),
                'due_date': request.data.get('paid_date') or timezone.now().date(),
            }
        )

        payment.amount_paid += amount_to_pay
        payment.payment_mode = request.data.get('payment_mode', 'cash')
        payment.receipt_no = request.data.get('receipt_no', '')
        payment.remarks = request.data.get('remarks', '')
        payment.paid_date = request.data.get('paid_date') or timezone.now().date()
        payment.recorded_by = request.user

        if payment.amount_paid >= payment.installment_amount:
            payment.is_paid = True
        else:
            payment.is_paid = False

        payment.save()

        # Create a DailyEntry for the SPECIFIC paid amount (the transaction amount)
        from apps.collections.models import DailyEntry
        DailyEntry.objects.create(
            chit_payment=payment,
            date=payment.paid_date,
            entry_type='income',
            category='welfare_payment',
            amount=amount_to_pay,
            description=f"Welfare Payment (Partial/Full) — Month {payment.month_number} for {enrollment.member.full_name if enrollment.member else enrollment.non_member_name}",
            member=enrollment.member,
            payment_mode=payment.payment_mode,
            recorded_by=request.user,
        )

        # Activity log
        try:
            from apps.activities.models import ActivityLog
            ActivityLog.objects.create(
                member=enrollment.member,
                activity_type='chit_payment',
                description=f"Chit payment recorded — Month {payment.month_number}, ₹{amount_to_pay}.",
                amount=amount_to_pay,
                reference_id=str(payment.id),
                reference_type='ChitPayment',
                performed_by=request.user,
            )
        except Exception:
            pass

        serializer = self.get_serializer(payment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ChitPaymentDetailView(generics.RetrieveUpdateAPIView):
    """PUT /api/payments/{pid}/"""

    queryset = ChitPayment.objects.all()
    serializer_class = ChitPaymentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]


class ChitOverdueView(generics.ListAPIView):
    """GET /api/chits/overdue/ — all overdue chit payments."""

    serializer_class = ChitPaymentOverdueSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        today = timezone.now().date()
        return ChitPayment.objects.filter(
            is_paid=False,
            due_date__lt=today,
        ).select_related(
            'enrollment__member',
            'enrollment__chit_group',
        ).order_by('due_date')


class ChitBulkPaymentView(APIView):
    """POST /api/chit-groups/{group_pk}/bulk-pay/ — record multiple welfare payments."""
    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]

    def post(self, request, group_pk):
        payments_data = request.data.get('payments', [])
        if not payments_data:
            return Response({'error': True, 'message': 'No payments provided.'}, status=400)

        from decimal import Decimal
        from apps.collections.models import DailyEntry
        recorded = []
        errors = []
        for item in payments_data:
            try:
                payment = ChitPayment.objects.get(
                    enrollment_id=item['enrollment_id'],
                    month_number=item['month_number'],
                )
                if not payment.is_paid:
                    remaining = payment.installment_amount - payment.amount_paid
                    amount_to_pay = Decimal(str(item.get('amount_paid', remaining)))
                    if amount_to_pay > 0:
                        payment.amount_paid += amount_to_pay
                        payment.payment_mode = item.get('payment_mode', 'cash')
                        payment.paid_date = timezone.now().date()
                        payment.recorded_by = request.user
                        if payment.amount_paid >= payment.installment_amount:
                            payment.is_paid = True
                        payment.save()

                        # Create DailyEntry manually
                        DailyEntry.objects.create(
                            chit_payment=payment,
                            date=payment.paid_date,
                            entry_type='income',
                            category='welfare_payment',
                            amount=amount_to_pay,
                            description=f"Welfare Payment (Bulk) — Month {payment.month_number} for {payment.enrollment.member.full_name if payment.enrollment.member else payment.enrollment.non_member_name}",
                            member=payment.enrollment.member,
                            payment_mode=payment.payment_mode,
                            recorded_by=request.user,
                        )
                        recorded.append(payment.id)
            except ChitPayment.DoesNotExist:
                errors.append(f"Payment not found: enrollment {item.get('enrollment_id')} month {item.get('month_number')}")

        return Response({'recorded': len(recorded), 'errors': errors})


class WelfareAuctionListView(generics.ListAPIView):
    serializer_class = WelfareAuctionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WelfareAuction.objects.filter(
            welfare_group_id=self.kwargs['group_pk'],
            is_completed=True
        ).prefetch_related('slots__enrollment__member')


class WelfareActiveAuctionView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]

    def get(self, request, group_pk):
        try:
            group = ChitGroup.objects.get(pk=group_pk)
        except ChitGroup.DoesNotExist:
            return Response({'error': True, 'message': 'Welfare group not found.'}, status=404)

        # Count remaining members who haven't won yet
        remaining_members = group.enrollments.filter(prize_won=False).count()
        eff_divs = group.effective_divisions
        slots_to_generate = min(eff_divs, remaining_members)

        # Get or create active auction for current active month
        auction, created = WelfareAuction.objects.get_or_create(
            welfare_group=group,
            month_number=group.current_month,
            defaults={
                'installment_amount': group.monthly_instalment
            }
        )

        if created or auction.slots.count() != slots_to_generate:
            # Re-generate slots to match the current slots_to_generate
            auction.slots.all().delete()
            
            # Create slot placeholders matching the remaining count and group division labels
            labels = group.effective_division_labels
            from decimal import Decimal
            for i in range(slots_to_generate):
                label = labels[i] if i < len(labels) else chr(ord('A') + i)
                # If remaining_members <= 3, default all slots to winner (Full Draw)!
                # Otherwise, first is winner, subsequent are callers.
                default_type = 'winner' if (remaining_members <= 3 or i == 0) else 'caller'
                
                WelfareAuctionSlot.objects.create(
                    auction=auction,
                    slot_type=default_type,
                    division_label=label,
                    bid_amount=group.chit_value,
                    commission_amount=group.commission_rate,
                    service_charge=Decimal('0.00'),
                    surcharge_amount=group.commission_rate,
                    discount_amount=Decimal('0.00'),
                    net_received=group.chit_value - group.commission_rate,
                    profit_earned=group.commission_rate
                )

        serializer = WelfareAuctionSerializer(auction)
        return Response(serializer.data)

    def post(self, request, group_pk):
        try:
            group = ChitGroup.objects.get(pk=group_pk)
        except ChitGroup.DoesNotExist:
            return Response({'error': True, 'message': 'Welfare group not found.'}, status=404)

        auction = WelfareAuction.objects.filter(
            welfare_group=group,
            month_number=group.current_month,
            is_completed=False
        ).first()

        if not auction:
            return Response({'error': True, 'message': 'No pending auction for the current month.'}, status=400)

        slots_data = request.data.get('slots', [])
        remaining_members = group.enrollments.filter(prize_won=False).count()
        eff_divs = group.effective_divisions
        expected_slots = min(eff_divs, remaining_members)

        if len(slots_data) != expected_slots:
            return Response({
                'error': True, 
                'message': f"Exactly {expected_slots} slots must be provided."
            }, status=400)

        # Validate types, enrollments, bids
        winner_count = 0
        caller_count = 0
        seen_enrollments = set()

        for sdata in slots_data:
            stype = sdata.get('slot_type')
            eid = sdata.get('enrollment')
            bid_amount = sdata.get('bid_amount')

            if stype == 'winner':
                winner_count += 1
            elif stype == 'caller':
                caller_count += 1
            else:
                return Response({'error': True, 'message': f"Invalid slot type: {stype}"}, status=400)

            if not eid:
                return Response({'error': True, 'message': "All slots must be assigned to an enrolled member."}, status=400)

            if eid in seen_enrollments:
                return Response({'error': True, 'message': "A member cannot win or call more than once in the same month."}, status=400)
            seen_enrollments.add(eid)

            try:
                enrollment = ChitEnrollment.objects.get(pk=eid, chit_group=group)
            except ChitEnrollment.DoesNotExist:
                return Response({'error': True, 'message': f"Enrollment {eid} not found in this welfare."}, status=400)

            if enrollment.status == 'awarded':
                return Response({
                    'error': True, 
                    'message': f"{enrollment.member.full_name if enrollment.member else enrollment.non_member_name} has already won/called in a previous month."
                }, status=400)

            if stype == 'winner':
                # Winner bid is always full welfare value
                sdata['bid_amount'] = float(group.chit_value)
            else:
                # Caller bid validation
                if bid_amount is None:
                    return Response({'error': True, 'message': "Bid amount is required for callers."}, status=400)
                bid_val = float(bid_amount)
                # Allow bid_val to be equal to group.chit_value (not strictly less!)
                if bid_val > float(group.chit_value):
                    return Response({'error': True, 'message': f"Caller bid amount cannot be greater than Welfare Value (₹{group.chit_value})."}, status=400)
                if bid_val <= float(group.commission_rate):
                    return Response({'error': True, 'message': f"Caller bid amount must be greater than committee commission (₹{group.commission_rate})."}, status=400)

        if winner_count < 1:
            return Response({'error': True, 'message': "At least 1 slot must be designated as the Winner."}, status=400)

        if remaining_members > 3:
            if winner_count != 1:
                return Response({'error': True, 'message': "Exactly 1 slot must be designated as the Winner."}, status=400)

        # Everything is valid! Process save & recalculation
        from decimal import Decimal
        total_gross_bids = Decimal('0.00')

        # Run inside a transaction
        from django.db import transaction
        with transaction.atomic():
            for sdata in slots_data:
                slot_id = sdata.get('id')
                eid = sdata.get('enrollment')
                stype = sdata.get('slot_type')
                bid_amount = Decimal(str(sdata.get('bid_amount')))

                slot = WelfareAuctionSlot.objects.get(pk=slot_id, auction=auction)
                enrollment = ChitEnrollment.objects.get(pk=eid)

                # Calculations
                commission = Decimal(str(sdata.get('commission_amount', group.commission_rate)))
                service_charge = Decimal(str(sdata.get('service_charge', '0.00')))
                surcharge = commission + service_charge
                discount = (group.chit_value - bid_amount) if stype == 'caller' else Decimal('0.00')
                net_rcvd = bid_amount - commission - service_charge
                profit = surcharge + discount

                slot.slot_type = stype
                slot.enrollment = enrollment
                slot.bid_amount = bid_amount
                slot.commission_amount = commission
                slot.service_charge = service_charge
                slot.surcharge_amount = surcharge
                slot.discount_amount = discount
                slot.net_received = net_rcvd
                slot.profit_earned = profit
                slot.save()

                # Update enrollment status
                enrollment.status = 'awarded'
                enrollment.prize_won = True
                enrollment.prize_date = timezone.now().date()
                enrollment.prize_amount = net_rcvd
                enrollment.surcharge_amount = surcharge
                enrollment.service_charge = service_charge
                enrollment.reduction_amount = discount
                enrollment.received_date = None
                enrollment.save()

                total_gross_bids += bid_amount

            # Recalculate next month installment
            next_installment = total_gross_bids / Decimal(str(group.total_members))
            
            # Save completed auction status
            auction.is_completed = True
            auction.completed_date = timezone.now().date()
            auction.save()

            # Advance current active month
            old_month = group.current_month
            group.monthly_instalment = next_installment
            
            if old_month >= group.duration_months:
                group.status = 'completed'
                group.end_date = timezone.now().date()
            else:
                group.current_month = old_month + 1
                # Generate installment records for all active/awarded members for next month
                from dateutil.relativedelta import relativedelta
                due_date = group.start_date + relativedelta(months=old_month)
                
                # All members enrolled in this group (except defaulted/transferred)
                active_enrollments = group.enrollments.filter(status__in=['active', 'awarded'])
                for enroll in active_enrollments:
                    ChitPayment.objects.update_or_create(
                        enrollment=enroll,
                        month_number=old_month + 1,
                        defaults={
                            'installment_amount': next_installment,
                            'amount_paid': Decimal('0.00'),
                            'due_date': due_date,
                            'is_paid': False,
                        }
                    )
            group.save()

        return Response({
            'success': True, 
            'message': 'Auction completed successfully.',
            'next_installment': str(next_installment)
        })
