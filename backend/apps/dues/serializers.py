"""
Serializers for the dues app.
"""

from rest_framework import serializers
from .models import Deposit, Due, MasavariPayment


class DepositSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    member_no = serializers.CharField(source='member.member_no', read_only=True)
    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Deposit
        fields = '__all__'
        read_only_fields = ['created_at', 'recorded_by']

    def get_recorded_by_name(self, obj):
        if obj.recorded_by:
            return obj.recorded_by.get_full_name() or obj.recorded_by.username
        return None

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['recorded_by'] = request.user
        return super().create(validated_data)


class DueSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    member_no = serializers.CharField(source='member.member_no', read_only=True)
    is_overdue = serializers.SerializerMethodField()
    days_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Due
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_is_overdue(self, obj):
        return obj.is_overdue

    def get_days_overdue(self, obj):
        return obj.days_overdue


class MasavariPaymentSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    member_no = serializers.CharField(source='member.member_no', read_only=True)
    is_overdue = serializers.SerializerMethodField()
    month_label = serializers.SerializerMethodField()
    recorded_by_name = serializers.SerializerMethodField()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Remove UniqueTogetherValidator to handle update_or_create in views
        self.validators = [
            v for v in self.validators
            if not isinstance(v, serializers.UniqueTogetherValidator)
        ]

    class Meta:
        model = MasavariPayment
        fields = '__all__'
        read_only_fields = ['created_at', 'recorded_by']

    def get_is_overdue(self, obj):
        return obj.is_overdue

    def get_month_label(self, obj):
        import calendar
        try:
            return f"{calendar.month_name[obj.month]} {obj.year}"
        except Exception:
            return f"{obj.month}/{obj.year}"

    def get_recorded_by_name(self, obj):
        if obj.recorded_by:
            return obj.recorded_by.get_full_name() or obj.recorded_by.username
        return None

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['recorded_by'] = request.user
        return super().create(validated_data)
