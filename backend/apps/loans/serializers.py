"""
Serializers for the loans app.
"""

from rest_framework import serializers
from .models import Loan, LoanRepayment


class LoanRepaymentSerializer(serializers.ModelSerializer):
    is_overdue = serializers.SerializerMethodField()
    days_overdue = serializers.SerializerMethodField()
    recorded_by_name = serializers.SerializerMethodField()
    emi_amount = serializers.DecimalField(source='loan.emi_amount', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = LoanRepayment
        fields = '__all__'
        read_only_fields = ['created_at', 'recorded_by']

    def get_is_overdue(self, obj):
        return obj.is_overdue

    def get_days_overdue(self, obj):
        return obj.days_overdue

    def get_recorded_by_name(self, obj):
        if obj.recorded_by:
            return obj.recorded_by.get_full_name() or obj.recorded_by.username
        return None

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['recorded_by'] = request.user
        return super().create(validated_data)


class LoanSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    member_no = serializers.CharField(source='member.member_no', read_only=True)
    guarantor_name = serializers.CharField(source='guarantor.full_name', read_only=True, allow_null=True)
    guarantor2_name = serializers.CharField(source='guarantor2.full_name', read_only=True, allow_null=True)
    approved_by_name = serializers.SerializerMethodField()
    repayments = LoanRepaymentSerializer(many=True, read_only=True)
    next_pending_instalment = serializers.SerializerMethodField()

    class Meta:
        model = Loan
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'approved_by', 'outstanding_balance']

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name() or obj.approved_by.username
        return None

    def get_next_pending_instalment(self, obj):
        # We need to filter by repayments that are not paid
        pending_payment = obj.repayments.filter(is_paid=False).order_by('instalment_no').first()
        if pending_payment:
            return pending_payment.instalment_no
        return None

    def create(self, validated_data):
        validated_data['outstanding_balance'] = validated_data.get('loan_amount', 0)
        return super().create(validated_data)

    def validate_loan_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Loan amount must be positive.')
        return value

    def validate_service_charge(self, value):
        if value < 0:
            raise serializers.ValidationError('Service charge must be 0 or a positive amount.')
        return value

    def validate(self, attrs):
        member = attrs.get('member') or (self.instance.member if self.instance else None)
        guarantor = attrs.get('guarantor') or (self.instance.guarantor if self.instance else None)
        guarantor2 = attrs.get('guarantor2') or (self.instance.guarantor2 if self.instance else None)

        if not guarantor:
            raise serializers.ValidationError({'guarantor': 'Compulsory guarantor is required.'})

        if member == guarantor:
            raise serializers.ValidationError({'guarantor': 'Borrower cannot be their own guarantor.'})

        if guarantor2:
            if member == guarantor2:
                raise serializers.ValidationError({'guarantor2': 'Borrower cannot be their own guarantor.'})
            if guarantor == guarantor2:
                raise serializers.ValidationError({'guarantor2': 'Optional guarantor must be different from compulsory guarantor.'})

        return attrs
