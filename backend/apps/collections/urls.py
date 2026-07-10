from django.urls import path
from . import views


urlpatterns = [
    path('collections/daily/', views.DailyEntryListCreateView.as_view(), name='daily-collections-list'),
    path('collections/summary/', views.DailySummaryView.as_view(), name='daily-collections-summary'),
]
