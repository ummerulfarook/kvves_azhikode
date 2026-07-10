"""
URL configuration for the accounts app.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='auth-login'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('logout/', views.LogoutView.as_view(), name='auth-logout'),
    path('me/', views.ProfileView.as_view(), name='auth-profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='auth-change-password'),

    # Admin user management
    path('../admin/users/', views.UserManagementListView.as_view(), name='admin-users-list'),
    path('../admin/users/<int:pk>/', views.UserManagementDetailView.as_view(), name='admin-users-detail'),
    path('../admin/users/<int:pk>/toggle/', views.UserToggleView.as_view(), name='admin-users-toggle'),
]
