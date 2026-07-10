import datetime
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from apps.dues.models import MasavariPayment
from apps.members.models import Member

def check_member_masavari_statuses():
    """Checks all active members' Masavari payments. If a member hasn't paid in the last 1 year
    (12 months), and they joined more than 1 year ago, mark them as inactive.
    """
    today = timezone.now().date()
    one_year_ago = today - relativedelta(months=12)

    # Fetch active members who joined more than a year ago
    active_members = Member.objects.filter(status='active', joining_date__lt=one_year_ago)
    
    # Get all member IDs who HAVE paid in the last 12 months
    paid_member_ids = MasavariPayment.objects.filter(
        status='paid',
        paid_date__gte=one_year_ago
    ).values_list('member_id', flat=True).distinct()

    # Inactive members are those who are active but not in paid_member_ids
    to_deactivate = active_members.exclude(id__in=paid_member_ids)
    
    if to_deactivate.exists():
        for m in to_deactivate:
            m.status = 'inactive'
            m.remarks = (m.remarks or "") + f"\nAuto-deactivated on {today} due to non-payment of Masavari for 1+ years."
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
