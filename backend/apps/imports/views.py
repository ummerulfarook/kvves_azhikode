"""
Views for import/export — Excel upload, validation, preview, and download.
"""

import io
from django.http import HttpResponse
from django.db import transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminOrStaffOrReadOnly
from apps.members.models import Member

from .validators import validate_member_row
from .exporters import export_members, export_overdue, get_member_import_template, export_period_report


class MemberImportView(APIView):
    """POST /api/import/members/ — upload, validate, and import member Excel."""

    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]

    def post(self, request):
        try:
            import pandas as pd
        except ImportError:
            return Response({'error': True, 'message': 'pandas not installed.'}, status=500)

        file = request.FILES.get('file')
        if not file:
            return Response({'error': True, 'message': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        preview_only = request.data.get('preview', 'false').lower() == 'true'

        try:
            df = pd.read_excel(file, dtype=str)
            df = df.fillna('')
        except Exception as e:
            return Response({'error': True, 'message': f'Could not read Excel file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        # Existing member nos for duplicate check
        existing_nos = set(Member.objects.values_list('member_no', flat=True))
        newly_added = set()

        valid_rows = []
        all_errors = []

        for i, row in df.iterrows():
            row_dict = row.to_dict()
            data, errors = validate_member_row(row_dict, i + 2, existing_nos | newly_added)
            if errors:
                all_errors.extend(errors)
            else:
                valid_rows.append(data)
                newly_added.add(data.get('member_no', ''))

        if preview_only:
            return Response({
                'total_rows': len(df),
                'valid_rows': len(valid_rows),
                'error_count': len(all_errors),
                'errors': all_errors[:50],  # limit to 50 errors in preview
                'preview': valid_rows[:10],  # show first 10 valid rows
            })

        if all_errors:
            return Response({
                'error': True,
                'message': f'{len(all_errors)} validation errors found. Fix them and re-upload.',
                'errors': all_errors[:50],
                'valid_count': len(valid_rows),
            }, status=status.HTTP_400_BAD_REQUEST)

        # Import all valid rows atomically
        try:
            with transaction.atomic():
                created = []
                for data in valid_rows:
                    masavari_paid_till = data.pop('masavari_paid_till', None)
                    member = Member.objects.create(
                        created_by=request.user,
                        **{k: v for k, v in data.items() if v != ''},
                    )
                    created.append(member.member_no)
                    
                    if masavari_paid_till:
                        from apps.members.utils import populate_masavari_payments_up_to
                        populate_masavari_payments_up_to(member, masavari_paid_till, recorded_by=request.user)
        except Exception as e:
            return Response({'error': True, 'message': f'Import failed: {str(e)}'}, status=500)

        return Response({
            'message': f'Successfully imported {len(created)} members.',
            'imported_count': len(created),
            'member_nos': created,
        })


class MemberExportView(APIView):
    """GET /api/export/members/ — download all members as Excel."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        members = Member.objects.prefetch_related(
            'nominees', 'chit_enrollments__chit_group', 'loans', 'deposits'
        ).all()

        # Apply filters from query params
        status_filter = request.query_params.get('status')
        if status_filter:
            members = members.filter(status=status_filter)

        excel_bytes = export_members(members)
        response = HttpResponse(
            excel_bytes,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="kvva_members.xlsx"'
        return response


class SingleMemberExportView(APIView):
    """GET /api/export/member/{id}/ — download single member full report."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            member = Member.objects.prefetch_related(
                'nominees', 'chit_enrollments__chit_group', 'loans', 'deposits'
            ).get(pk=pk)
        except Member.DoesNotExist:
            return Response({'error': True, 'message': 'Member not found.'}, status=404)

        excel_bytes = export_members([member])
        response = HttpResponse(
            excel_bytes,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="member_{member.member_no}.xlsx"'
        return response


class OverdueExportView(APIView):
    """GET /api/export/overdue/ — download overdue list as Excel."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.reports.views import OverdueListView
        from django.test import RequestFactory

        from apps.chits.models import ChitPayment
        from apps.loans.models import LoanRepayment
        from apps.dues.models import Due
        from django.utils import timezone

        today = timezone.now().date()
        result = []

        chit_overdue = ChitPayment.objects.filter(is_paid=False, due_date__lt=today).select_related(
            'enrollment__member', 'enrollment__chit_group')
        for p in chit_overdue:
            result.append({
                'type': 'Chit Payment', 'member_no': p.enrollment.member.member_no,
                'member_name': p.enrollment.member.full_name, 'amount': str(p.amount_paid),
                'due_date': p.due_date.isoformat(), 'days_overdue': (today - p.due_date).days,
                'detail': f"{p.enrollment.chit_group.group_name} — Month {p.month_number}",
            })

        loan_overdue = LoanRepayment.objects.filter(is_paid=False, due_date__lt=today).select_related('loan__member')
        for r in loan_overdue:
            result.append({
                'type': 'Loan EMI', 'member_no': r.loan.member.member_no,
                'member_name': r.loan.member.full_name, 'amount': str(r.amount_paid),
                'due_date': r.due_date.isoformat(), 'days_overdue': (today - r.due_date).days,
                'detail': f"Loan {r.loan.loan_no} — EMI {r.instalment_no}",
            })

        due_overdue = Due.objects.filter(status='pending', due_date__lt=today).select_related('member')
        for d in due_overdue:
            result.append({
                'type': 'Due', 'member_no': d.member.member_no,
                'member_name': d.member.full_name, 'amount': str(d.amount),
                'due_date': d.due_date.isoformat(), 'days_overdue': (today - d.due_date).days,
                'detail': d.get_due_type_display(),
            })

        result.sort(key=lambda x: x['days_overdue'], reverse=True)
        excel_bytes = export_overdue(result)
        response = HttpResponse(
            excel_bytes,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="kvva_overdue.xlsx"'
        return response


class MemberImportTemplateView(APIView):
    """GET /api/import/template/members/ — download import template."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        excel_bytes = get_member_import_template()
        response = HttpResponse(
            excel_bytes,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="kvva_members_import_template.xlsx"'
        return response


class PeriodReportExportView(APIView):
    """GET /api/export/report/ — download period report as Excel."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.reports.views import PeriodReportView
        # We can construct a request and call PeriodReportView
        view = PeriodReportView()
        view.request = request
        response = view.get(request)
        if response.status_code != 200:
            return response

        data = response.data
        from .exporters import export_period_report
        excel_bytes = export_period_report(data)

        response = HttpResponse(
            excel_bytes,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        period = data.get('period', 'report')
        label = data.get('label', 'report').replace(' ', '_')
        response['Content-Disposition'] = f'attachment; filename="kvva_{period}_{label}.xlsx"'
        return response
