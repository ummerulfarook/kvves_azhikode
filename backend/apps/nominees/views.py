"""
Views for the nominees app.
"""

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Nominee
from .serializers import NomineeSerializer
from apps.members.models import Member
from apps.accounts.permissions import IsAdminOrStaffOrReadOnly


class NomineeListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/members/{member_id}/nominees/"""

    serializer_class = NomineeSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]

    def get_queryset(self):
        return Nominee.objects.filter(member_id=self.kwargs['member_pk'])

    def perform_create(self, serializer):
        try:
            member = Member.objects.get(pk=self.kwargs['member_pk'])
        except Member.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Member not found.')

        nominee = serializer.save(member=member)

        # Activity log
        try:
            from apps.activities.models import ActivityLog
            ActivityLog.objects.create(
                member=member,
                activity_type='nominee_added',
                description=f"Nominee {nominee.name} ({nominee.get_relationship_display()}) added.",
                reference_id=str(nominee.id),
                reference_type='Nominee',
                performed_by=self.request.user,
            )
        except Exception:
            pass


class NomineeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/DELETE /api/members/{member_id}/nominees/{id}/"""

    serializer_class = NomineeSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]

    def get_queryset(self):
        return Nominee.objects.filter(member_id=self.kwargs['member_pk'])

    def perform_update(self, serializer):
        nominee = serializer.save()
        try:
            from apps.activities.models import ActivityLog
            ActivityLog.objects.create(
                member=nominee.member,
                activity_type='nominee_updated',
                description=f"Nominee {nominee.name} details updated.",
                reference_id=str(nominee.id),
                reference_type='Nominee',
                performed_by=self.request.user,
            )
        except Exception:
            pass
