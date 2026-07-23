import datetime
from django.utils import timezone
from django.db.models import Q
from dateutil.relativedelta import relativedelta
from apps.dues.models import MasavariPayment
from apps.members.models import Member

def check_member_masavari_statuses():
    """Checks all active members' Masavari payments. If a member hasn't paid for any month
    in the last 1 year (12 months), and they joined more than 1 year ago, mark them as inactive.
    """
    today = timezone.now().date()
    cutoff_date = today - relativedelta(months=12)
    cutoff_year = cutoff_date.year
    cutoff_month = cutoff_date.month

    # Fetch active members who joined more than a year ago
    active_members = Member.objects.filter(status='active', joining_date__lt=cutoff_date)
    
    # Get all member IDs who HAVE a paid Masavari payment for a month/year >= cutoff
    paid_member_ids = MasavariPayment.objects.filter(
        status='paid'
    ).filter(
        Q(year__gt=cutoff_year) | Q(year=cutoff_year, month__gte=cutoff_month)
    ).values_list('member_id', flat=True).distinct()

    # Inactive members are those who are active but not in paid_member_ids
    to_deactivate = active_members.exclude(id__in=paid_member_ids)
    
    if to_deactivate.exists():
        for m in to_deactivate:
            m.status = 'inactive'
            remarks = m.remarks or ""
            if "Auto-deactivated" not in remarks:
                m.remarks = (remarks + f"\nAuto-deactivated on {today} due to non-payment of Masavari for 1+ years.").strip()
            m.save()


def check_and_reactivate_member(member):
    """If an inactive member has cleared all their pending Masavari payments
    (i.e. no unpaid/pending Masavari payments from joining date to today),
    automatically reactivate them. Reactivation depends ONLY on clearing Masavari dues.
    """
    if member.status != 'inactive':
        return

    today = timezone.now().date()
    start_date = member.joining_date
    curr = start_date.replace(day=1)
    end = today.replace(day=1)

    # Fetch all paid Masavari payments (year, month)
    paid_set = set(
        MasavariPayment.objects.filter(member=member, status='paid').values_list('year', 'month')
    )

    # Check if there are any unpaid months from joining_date to current month
    has_pending = False
    while curr <= end:
        if (curr.year, curr.month) not in paid_set:
            has_pending = True
            break
        curr += relativedelta(months=1)

    # Reactivate only if they have cleared all their Masavari dues
    if not has_pending:
        member.status = 'active'
        member.remarks = (member.remarks or "") + f"\nAuto-reactivated on {today} after clearing all Masavari dues."
        member.save()


def populate_masavari_payments_up_to(member, paid_till_date_or_str, recorded_by=None):
    """
    Given a member and a paid-till date/string, automatically create/update MasavariPayment records
    with status='paid' for all months from joining_date up to the paid-till month/year.
    """
    from apps.dues.models import MasavariPayment
    from dateutil.relativedelta import relativedelta
    from datetime import datetime
    from decimal import Decimal

    if not paid_till_date_or_str:
        return

    # Parse paid_till date
    if isinstance(paid_till_date_or_str, str):
        try:
            if len(paid_till_date_or_str.strip()) == 7: # YYYY-MM
                paid_till = datetime.strptime(paid_till_date_or_str.strip(), '%Y-%m').date()
            else:
                paid_till = datetime.strptime(paid_till_date_or_str.strip(), '%Y-%m-%d').date()
        except ValueError:
            return
    else:
        paid_till = paid_till_date_or_str

    start_date = member.joining_date
    if not start_date or start_date > paid_till:
        return

    curr = start_date.replace(day=1)
    end = paid_till.replace(day=1)

    while curr <= end:
        # Check or create paid masavari payment
        MasavariPayment.objects.update_or_create(
            member=member,
            year=curr.year,
            month=curr.month,
            defaults={
                'amount': member.masavari_amount,
                'due_date': curr + relativedelta(day=5),
                'paid_date': timezone.now().date(),
                'status': 'paid',
                'remarks': 'Pre-populated cleared dues on member creation/import.',
                'recorded_by': recorded_by
            }
        )
        curr += relativedelta(months=1)
