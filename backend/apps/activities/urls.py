"""
URL configuration for the activities app.
"""

from django.urls import path
from . import views

urlpatterns = [
    path('activities/', views.ActivityLogListView.as_view(), name='activities-list'),
    # Committees
    path('committees/', views.CommitteeListCreateView.as_view(), name='committee-list-create'),
    path('committees/<int:pk>/', views.CommitteeDetailView.as_view(), name='committee-detail'),
    # Community Posts
    path('community-posts/', views.CommunityPostListCreateView.as_view(), name='community-posts-list'),
    path('community-posts/<int:pk>/', views.CommunityPostDetailView.as_view(), name='community-post-detail'),
    path('community-posts/attachments/<int:pk>/', views.CommunityAttachmentDeleteView.as_view(), name='community-attachment-delete'),
    # District Activities
    path('district-activities/', views.DistrictActivityListCreateView.as_view(), name='district-activities-list'),
    path('district-activities/<int:pk>/', views.DistrictActivityDetailView.as_view(), name='district-activity-detail'),
    # District Schemes
    path('district-schemes/', views.DistrictSchemeListCreateView.as_view(), name='district-schemes-list'),
    path('district-schemes/<int:pk>/', views.DistrictSchemeDetailView.as_view(), name='district-scheme-detail'),
]
