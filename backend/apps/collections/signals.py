from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from apps.chits.models import ChitPayment
from apps.loans.models import LoanRepayment
from apps.curries.models import CurryPayment
from apps.dues.models import Deposit, Due
from .models import DailyEntry


# @receiver(post_save, sender=ChitPayment)
# def create_chit_payment_entry(sender, instance, created, **kwargs):
#     if instance.is_paid:
#         DailyEntry.objects.update_or_create(
#             chit_payment=instance,
#             defaults={
#                 'date': instance.paid_date or instance.due_date,
#                 'entry_type': 'income',
#                 'category': 'welfare_payment',
#                 'amount': instance.amount_paid,
#                 'description': f"Welfare Payment — Month {instance.month_number} for {instance.enrollment.member.full_name}",
#                 'member': instance.enrollment.member,
#                 'payment_mode': instance.payment_mode,
#                 'recorded_by': instance.recorded_by,
#             }
#         )
#     else:
#         DailyEntry.objects.filter(chit_payment=instance).delete()


# @receiver(post_save, sender=LoanRepayment)
# def create_loan_repayment_entry(sender, instance, created, **kwargs):
#     if instance.is_paid:
#         DailyEntry.objects.update_or_create(
#             loan_repayment=instance,
#             defaults={
#                 'date': instance.paid_date or instance.due_date,
#                 'entry_type': 'income',
#                 'category': 'loan_emi',
#                 'amount': instance.amount_paid,
#                 'description': f"Loan EMI Payment — Installment {instance.instalment_no} for {instance.loan.member.full_name} (Loan {instance.loan.loan_no})",
#                 'member': instance.loan.member,
#                 'payment_mode': instance.payment_mode,
#                 'recorded_by': instance.recorded_by,
#             }
#         )
#     else:
#         DailyEntry.objects.filter(loan_repayment=instance).delete()


@receiver(post_save, sender=CurryPayment)
def create_curry_payment_entry(sender, instance, created, **kwargs):
    if instance.is_paid:
        participant = instance.participant
        member = participant.member if participant.is_member else None
        name = participant.member.full_name if (participant.is_member and participant.member) else participant.participant_name
        DailyEntry.objects.update_or_create(
            curry_payment=instance,
            defaults={
                'date': instance.paid_date or instance.due_date,
                'entry_type': 'income',
                'category': 'curry_payment',
                'amount': instance.amount,
                'description': f"Curry Payment — Month {instance.month_number} for {name} (Curry {participant.curry.curry_no})",
                'member': member,
                'payment_mode': instance.payment_mode,
                'recorded_by': instance.recorded_by,
            }
        )
    else:
        DailyEntry.objects.filter(curry_payment=instance).delete()


@receiver(post_save, sender=Deposit)
def create_deposit_entry(sender, instance, created, **kwargs):
    # Only map membership fees, share capital or savings deposits to their categories, other as deposit
    category = 'deposit'
    if instance.deposit_type == 'membership_fee':
        category = 'membership_fee'
    elif instance.deposit_type == 'share_capital':
        category = 'share_capital'

    DailyEntry.objects.update_or_create(
        deposit=instance,
        defaults={
            'date': instance.deposit_date,
            'entry_type': 'income',
            'category': category,
            'amount': instance.amount,
            'description': f"Deposit — {instance.get_deposit_type_display()} for {instance.member.full_name}",
            'member': instance.member,
            'payment_mode': instance.payment_mode,
            'recorded_by': instance.recorded_by,
        }
    )


@receiver(post_save, sender=Due)
def create_due_entry(sender, instance, created, **kwargs):
    if instance.status == 'paid':
        DailyEntry.objects.update_or_create(
            due=instance,
            defaults={
                'date': instance.paid_date or timezone.now().date(),
                'entry_type': 'income',
                'category': 'due',
                'amount': instance.paid_amount or instance.amount,
                'description': f"Due Payment — {instance.get_due_type_display()} for {instance.member.full_name}",
                'member': instance.member,
                'payment_mode': 'cash',
            }
        )
    else:
        DailyEntry.objects.filter(due=instance).delete()
