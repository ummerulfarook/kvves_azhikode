"""
Views for the activities app.
"""

from rest_framework import generics, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .models import ActivityLog, CommunityPost, CommunityAttachment, DistrictActivity, Committee, DistrictScheme
from .serializers import (
    ActivityLogSerializer, CommunityPostSerializer, DistrictActivitySerializer,
    CommitteeSerializer, DistrictSchemeSerializer
)
from apps.accounts.permissions import IsAdminOrStaffOrReadOnly


class ActivityLogListView(generics.ListAPIView):
    """GET /api/activities/ — paginated, filterable activity log."""

    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['activity_type', 'member']
    search_fields = ['description', 'member__full_name', 'member__member_no']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']

    def get_queryset(self):
        qs = ActivityLog.objects.select_related('member', 'performed_by').all()
        activity_type = self.request.query_params.get('activity_type')
        member_id = self.request.query_params.get('member_id')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if activity_type:
            qs = qs.filter(activity_type=activity_type)
        if member_id:
            qs = qs.filter(member_id=member_id)
        if date_from:
            qs = qs.filter(timestamp__date__gte=date_from)
        if date_to:
            qs = qs.filter(timestamp__date__lte=date_to)
        return qs


class CommunityPostListCreateView(generics.ListCreateAPIView):
    """GET /api/community-posts/ | POST — community work and plans."""
    serializer_class = CommunityPostSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'post_type']

    def get_queryset(self):
        qs = CommunityPost.objects.prefetch_related('attachments').select_related('created_by', 'committee').all()
        post_type = self.request.query_params.get('post_type')
        committee_id = self.request.query_params.get('committee')
        if post_type:
            qs = qs.filter(post_type=post_type)
        if committee_id:
            qs = qs.filter(committee_id=committee_id)
        return qs

    def perform_create(self, serializer):
        post = serializer.save(created_by=self.request.user)
        # Handle multiple file uploads
        files = self.request.FILES.getlist('files')
        for f in files:
            import os
            _, ext = os.path.splitext(f.name)
            CommunityAttachment.objects.create(
                post=post,
                file=f,
                filename=f.name,
                file_type=ext.lstrip('.').lower(),
            )


class CommunityPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE /api/community-posts/{id}/"""
    serializer_class = CommunityPostSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    queryset = CommunityPost.objects.prefetch_related('attachments').select_related('created_by').all()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        # Handle new file uploads on edit
        files = request.FILES.getlist('files')
        for f in files:
            import os
            _, ext = os.path.splitext(f.name)
            CommunityAttachment.objects.create(
                post=instance,
                file=f,
                filename=f.name,
                file_type=ext.lstrip('.').lower(),
            )
        return super().update(request, *args, **kwargs)


class CommunityAttachmentDeleteView(APIView):
    """DELETE /api/community-posts/attachments/{id}/"""
    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]

    def delete(self, request, pk):
        try:
            att = CommunityAttachment.objects.get(pk=pk)
            att.file.delete(save=False)
            att.delete()
            return Response({'message': 'Attachment deleted.'})
        except CommunityAttachment.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)


class DistrictActivityListCreateView(generics.ListCreateAPIView):
    """GET /api/district-activities/ | POST"""
    serializer_class = DistrictActivitySerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'reference_no']
    ordering_fields = ['activity_date', 'created_at', 'status']

    def get_queryset(self):
        qs = DistrictActivity.objects.select_related('created_by').all()
        activity_type = self.request.query_params.get('activity_type')
        status_param = self.request.query_params.get('status')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if activity_type:
            qs = qs.filter(activity_type=activity_type)
        if status_param:
            qs = qs.filter(status=status_param)
        if date_from:
            qs = qs.filter(activity_date__gte=date_from)
        if date_to:
            qs = qs.filter(activity_date__lte=date_to)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class DistrictActivityDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE /api/district-activities/{id}/"""
    serializer_class = DistrictActivitySerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]
    queryset = DistrictActivity.objects.select_related('created_by').all()

    def perform_update(self, serializer):
        serializer.save(created_by=self.request.user)


class CommitteeListCreateView(generics.ListCreateAPIView):
    """GET /api/committees/ | POST"""
    serializer_class = CommitteeSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering = ['-name']

    def get_queryset(self):
        return Committee.objects.all()


class CommitteeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE /api/committees/{id}/"""
    serializer_class = CommitteeSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]
    queryset = Committee.objects.all()


class DistrictSchemeListCreateView(generics.ListCreateAPIView):
    """GET /api/district-schemes/ | POST"""
    serializer_class = DistrictSchemeSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'scheme_code', 'description']
    ordering_fields = ['created_at', 'status', 'start_date', 'end_date']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = DistrictScheme.objects.select_related('created_by').all()
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class DistrictSchemeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE /api/district-schemes/{id}/"""
    serializer_class = DistrictSchemeSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaffOrReadOnly]
    queryset = DistrictScheme.objects.select_related('created_by').all()

    def perform_update(self, serializer):
        serializer.save(created_by=self.request.user)
