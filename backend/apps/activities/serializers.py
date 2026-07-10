"""
Serializers for the activities app.
"""

from rest_framework import serializers
from .models import ActivityLog, CommunityPost, CommunityAttachment, DistrictActivity, Committee, DistrictScheme


class ActivityLogSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.SerializerMethodField()
    member_name = serializers.SerializerMethodField()
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)

    class Meta:
        model = ActivityLog
        fields = '__all__'
        read_only_fields = ['timestamp']

    def get_performed_by_name(self, obj):
        if obj.performed_by:
            return obj.performed_by.get_full_name() or obj.performed_by.username
        return 'System'

    def get_member_name(self, obj):
        if obj.member:
            return obj.member.full_name
        return None


class CommunityAttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = CommunityAttachment
        fields = ['id', 'filename', 'file_type', 'url', 'uploaded_at']

    def get_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class CommitteeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Committee
        fields = '__all__'


class CommunityPostSerializer(serializers.ModelSerializer):
    attachments = CommunityAttachmentSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    post_type_display = serializers.CharField(source='get_post_type_display', read_only=True)
    committee_name = serializers.CharField(source='committee.name', read_only=True)

    class Meta:
        model = CommunityPost
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return 'Staff'


class DistrictActivitySerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = DistrictActivity
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return 'Staff'


class DistrictSchemeSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = DistrictScheme
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return 'Staff'
