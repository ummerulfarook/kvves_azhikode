"""
Custom DRF permission classes for role-based access control.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    """Allow access only to admin users."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')


class IsAdminOrStaff(BasePermission):
    """Allow access to admin and staff users."""

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ('admin', 'staff')
        )


class IsAdminOrStaffOrReadOnly(BasePermission):
    """Allow read-only to viewers; write to admin/staff."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in ('admin', 'staff')


class IsAdminOrReadOnly(BasePermission):
    """Allow read-only to all authenticated; write only to admin."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role == 'admin'


class CanDeleteMember(BasePermission):
    """Only admins can soft-delete members."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method == 'DELETE':
            return request.user.role == 'admin'
        return True


class CanApproveLoan(BasePermission):
    """Only admins can approve loans."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')
