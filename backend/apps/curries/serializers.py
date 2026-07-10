"""
Serializers for the curries app.
"""

from rest_framework import serializers
from django.utils import timezone
from .models import Curry, CurryParticipant, CurryPayment


class CurryPaymentSerializer(serializers.ModelSerializer):
    is_overdue = serializers.SerializerMethodField()
    days_overdue = serializers.SerializerMethodField()

    class Meta:
        model = CurryPayment
        fields = '__all__'
        read_only_fields = ['created_at', 'recorded_by']

    def get_is_overdue(self, obj):
        return obj.is_overdue

    def get_days_overdue(self, obj):
        return obj.days_overdue


class CurryParticipantSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(read_only=True)
    member_no = serializers.CharField(source='member.member_no', read_only=True)
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    paid_months = serializers.IntegerField(read_only=True)
    total_paid_amount = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    payments = CurryPaymentSerializer(many=True, read_only=True)
    monthly_amount = serializers.DecimalField(
        source='curry.monthly_amount', max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = CurryParticipant
        fields = '__all__'
        read_only_fields = ['created_at']
        validators = []  # Disable automatic unique-together validator
        extra_kwargs = {
            'curry': {'required': False},
        }

    def validate(self, attrs):
        view = self.context.get('view')
        curry = None
        if view and hasattr(view, 'kwargs') and 'curry_pk' in view.kwargs:
            try:
                from .models import Curry
                curry = Curry.objects.get(pk=view.kwargs['curry_pk'])
            except Curry.DoesNotExist:
                pass

        if not curry and self.instance:
            curry = self.instance.curry

        if not curry:
            curry = attrs.get('curry')

        if curry:
            ticket_number = attrs.get('ticket_number') or (self.instance.ticket_number if self.instance else None)
            if ticket_number:
                qs = CurryParticipant.objects.filter(curry=curry, ticket_number=ticket_number)
                if self.instance:
                    qs = qs.exclude(pk=self.instance.pk)
                if qs.exists():
                    raise serializers.ValidationError({
                        'ticket_number': f'Ticket number {ticket_number} is already taken in this curry.'
                    })
        else:
            raise serializers.ValidationError({'curry': 'Curry is required.'})

        is_member = attrs.get('is_member', True)
        if not is_member:
            if not attrs.get('participant_name'):
                raise serializers.ValidationError({'participant_name': 'Required for non-members.'})
            if not attrs.get('participant_phone'):
                raise serializers.ValidationError({'participant_phone': 'Required for non-members.'})
            if not attrs.get('guarantor_name'):
                raise serializers.ValidationError({'guarantor_name': 'A guarantor is required for non-members.'})
            if not attrs.get('guarantor_phone'):
                raise serializers.ValidationError({'guarantor_phone': 'Guarantor phone is required.'})
        else:
            if not attrs.get('member'):
                raise serializers.ValidationError({'member': 'Please select a member.'})
        return attrs


class CurryListSerializer(serializers.ModelSerializer):
    participant_count = serializers.SerializerMethodField()

    class Meta:
        model = Curry
        fields = [
            'id', 'curry_no', 'name', 'monthly_amount', 'total_slots',
            'duration_months', 'start_date', 'end_date', 'status',
            'participant_count', 'description',
        ]

    def get_participant_count(self, obj):
        return obj.participants.filter(status='active').count()


class CurrySerializer(serializers.ModelSerializer):
    participant_count = serializers.SerializerMethodField()
    participants = CurryParticipantSerializer(many=True, read_only=True)

    class Meta:
        model = Curry
        fields = '__all__'
        read_only_fields = ['created_at']

    def get_participant_count(self, obj):
        return obj.participants.filter(status='active').count()

    def validate(self, attrs):
        start = attrs.get('start_date')
        end = attrs.get('end_date')
        if start and end and end < start:
            raise serializers.ValidationError({'end_date': 'End date must be after start date.'})
        return attrs


class CurryPaymentOverdueSerializer(serializers.ModelSerializer):
    is_overdue = serializers.SerializerMethodField()
    days_overdue = serializers.SerializerMethodField()
    participant_id = serializers.IntegerField(source='participant.id', read_only=True)
    display_name = serializers.CharField(source='participant.display_name', read_only=True)
    member_no = serializers.CharField(source='participant.member.member_no', read_only=True, default='')
    member_id = serializers.IntegerField(source='participant.member.id', read_only=True, default=None)
    curry_name = serializers.CharField(source='participant.curry.name', read_only=True)
    curry_no = serializers.CharField(source='participant.curry.curry_no', read_only=True)

    class Meta:
        model = CurryPayment
        fields = [
            'id', 'participant_id', 'display_name', 'member_no', 'member_id',
            'curry_name', 'curry_no', 'month_number', 'amount',
            'due_date', 'is_overdue', 'days_overdue', 'is_paid',
        ]

    def get_is_overdue(self, obj):
        return obj.is_overdue

    def get_days_overdue(self, obj):
        return obj.days_overdue
