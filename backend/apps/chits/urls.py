"""
URL configuration for the chits app.
"""

from django.urls import path
from . import views

urlpatterns = [
    path('chit-groups/', views.ChitGroupListCreateView.as_view(), name='chit-groups-list'),
    path('chit-groups/<int:pk>/', views.ChitGroupDetailView.as_view(), name='chit-groups-detail'),
    path('chit-groups/<int:group_pk>/enrollments/', views.ChitEnrollmentListView.as_view(), name='chit-enrollments-list'),
    path('chit-groups/<int:group_pk>/enroll/', views.ChitEnrollView.as_view(), name='chit-enroll'),
    path('chit-groups/<int:group_pk>/bulk-pay/', views.ChitBulkPaymentView.as_view(), name='chit-groups-bulk-pay'),
    path('chit-groups/<int:group_pk>/active-auction/', views.WelfareActiveAuctionView.as_view(), name='welfare-active-auction'),
    path('chit-groups/<int:group_pk>/active-auction/complete/', views.WelfareActiveAuctionView.as_view(), name='welfare-active-auction-complete'),
    path('chit-groups/<int:group_pk>/auctions/', views.WelfareAuctionListView.as_view(), name='welfare-completed-auctions'),

    path('enrollments/<int:pk>/', views.ChitEnrollmentDetailView.as_view(), name='enrollment-detail'),
    path('enrollments/<int:enrollment_pk>/payments/', views.ChitPaymentListCreateView.as_view(), name='chit-payments-list'),
    path('payments/<int:pk>/', views.ChitPaymentDetailView.as_view(), name='chit-payment-detail'),

    path('chits/overdue/', views.ChitOverdueView.as_view(), name='chits-overdue'),
]
