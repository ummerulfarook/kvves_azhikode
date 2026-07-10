"""
Serializers for the nominees app.
"""

from rest_framework import serializers
from .models import Nominee


class NomineeSerializer(serializers.ModelSerializer):
    relationship_display = serializers.CharField(source='get_relationship_display', read_only=True)

    class Meta:
        model = Nominee
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'member']

    def validate_share_percentage(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError('Share percentage must be between 0 and 100.')
        return value
