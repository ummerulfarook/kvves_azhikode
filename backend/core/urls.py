"""
Root URL configuration for KVVA Management System.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/', include('apps.members.urls')),
    path('api/', include('apps.nominees.urls')),
    path('api/', include('apps.chits.urls')),
    path('api/', include('apps.loans.urls')),
    path('api/', include('apps.dues.urls')),
    path('api/', include('apps.reports.urls')),
    path('api/', include('apps.imports.urls')),
    path('api/', include('apps.activities.urls')),
    path('api/', include('apps.collections.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
else:
    # Also serve media files in production for local deployment
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
