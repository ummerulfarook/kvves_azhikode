"""
URL configuration for the curries app.
"""

from django.urls import path
from .views import (
    CurryListCreateView, CurryDetailView,
    CurryParticipantListView, CurryEnrollView,
    CurryPaymentListCreateView, CurryOverdueView,
    CurryBulkPaymentView, CurryStatsView,
)

urlpatterns = [
    path('curries/', CurryListCreateView.as_view(), name='curry-list'),
    path('curries/stats/', CurryStatsView.as_view(), name='curry-stats'),
    path('curries/overdue/', CurryOverdueView.as_view(), name='curry-overdue'),
    path('curries/<int:pk>/', CurryDetailView.as_view(), name='curry-detail'),
    path('curries/<int:curry_pk>/participants/', CurryParticipantListView.as_view(), name='curry-participants'),
    path('curries/<int:curry_pk>/enroll/', CurryEnrollView.as_view(), name='curry-enroll'),
    path('curries/<int:curry_pk>/bulk-pay/', CurryBulkPaymentView.as_view(), name='curry-bulk-pay'),
    path('curry-participants/<int:participant_pk>/payments/', CurryPaymentListCreateView.as_view(), name='curry-payments'),
]
