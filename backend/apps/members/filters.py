"""
Django-filter FilterSets for the members app.
"""

import django_filters
from .models import Member


class MemberFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name='full_name', lookup_expr='icontains')
    phone = django_filters.CharFilter(lookup_expr='icontains')
    member_no = django_filters.CharFilter(lookup_expr='icontains')
    joining_date_from = django_filters.DateFilter(field_name='joining_date', lookup_expr='gte')
    joining_date_to = django_filters.DateFilter(field_name='joining_date', lookup_expr='lte')
    status = django_filters.MultipleChoiceFilter(choices=Member.STATUS)
    membership_type = django_filters.MultipleChoiceFilter(choices=Member.MEMBERSHIP_TYPES)
    district = django_filters.CharFilter(lookup_expr='icontains')

    class Meta:
        model = Member
        fields = ['status', 'membership_type', 'gender', 'district']
