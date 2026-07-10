"""
URLs for nominees — nested under members.
"""
from django.urls import path
from . import views

# Used as a nested URL include from members/urls.py
urlpatterns = [
    path('', views.NomineeListCreateView.as_view(), name='nominee-list'),
    path('<int:pk>/', views.NomineeDetailView.as_view(), name='nominee-detail'),
]
