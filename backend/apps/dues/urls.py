"""
URL configuration for the dues app.
"""

from django.urls import path
from . import views

urlpatterns = [
    path('deposits/', views.DepositListCreateView.as_view(), name='deposits-list'),
    path('deposits/<int:pk>/', views.DepositDetailView.as_view(), name='deposits-detail'),
    path('deposits/<int:pk>/withdraw/', views.DepositWithdrawView.as_view(), name='deposits-withdraw'),

    path('dues/', views.DueListCreateView.as_view(), name='dues-list'),
    path('dues/overdue/', views.DueOverdueView.as_view(), name='dues-overdue'),
    path('dues/<int:pk>/', views.DueDetailView.as_view(), name='dues-detail'),
    path('dues/<int:pk>/mark-paid/', views.DueMarkPaidView.as_view(), name='dues-mark-paid'),

    path('masavari/', views.MasavariListCreateView.as_view(), name='masavari-list'),
    path('masavari/dues/', views.MasavariDueListView.as_view(), name='masavari-dues'),
    path('masavari/overdue/', views.MasavariOverdueView.as_view(), name='masavari-overdue'),
    path('masavari/<int:pk>/', views.MasavariDetailView.as_view(), name='masavari-detail'),
    path('masavari/<int:pk>/mark-paid/', views.MasavariMarkPaidView.as_view(), name='masavari-mark-paid'),
]
