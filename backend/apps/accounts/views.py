"""
Views for the accounts app — auth and user management endpoints.
"""

from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    UserManagementSerializer,
)
from .permissions import IsAdmin


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — obtain JWT pair with user data."""
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class LogoutView(APIView):
    """POST /api/auth/logout/ — blacklist refresh token."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        except Exception:
            return Response(
                {'error': True, 'message': 'Invalid or expired token.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET/PUT /api/auth/me/ — current user profile."""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """PUT /api/auth/change-password/ — change own password."""
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            return Response({'message': 'Password changed successfully.'})
        return Response(
            {'error': True, 'message': 'Validation failed.', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )


class UserManagementListView(generics.ListCreateAPIView):
    """GET/POST /api/admin/users/ — list and create staff users (admin only)."""
    serializer_class = UserManagementSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = User.objects.all().order_by('username')


class UserManagementDetailView(generics.RetrieveUpdateAPIView):
    """GET/PUT /api/admin/users/{id}/ — retrieve and update a user."""
    serializer_class = UserManagementSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = User.objects.all()


class UserToggleView(APIView):
    """PATCH /api/admin/users/{id}/toggle/ — activate/deactivate user."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            if user == request.user:
                return Response(
                    {'error': True, 'message': 'Cannot deactivate your own account.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.is_active = not user.is_active
            user.save()
            state = 'activated' if user.is_active else 'deactivated'
            return Response({'message': f'User {state} successfully.', 'is_active': user.is_active})
        except User.DoesNotExist:
            return Response(
                {'error': True, 'message': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
