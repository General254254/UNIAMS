from functools import wraps

from django.contrib.auth import authenticate, get_user_model
from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import UserProfileSerializer, UserRegisterSerializer

User = get_user_model()


def rate_limit_auth(view_func):
    """Rate limit that only counts FAILED authentication attempts."""
    @wraps(view_func)
    def _wrapped(request, *args, **kwargs):
        client_ip = request.META.get('REMOTE_ADDR', 'unknown')
        attempts_key = f"auth_failed:{client_ip}"
        blocked_key = f"auth_blocked:{client_ip}"

        # Check if blocked (10 failed attempts in 15 minutes)
        if cache.get(blocked_key):
            return Response(
                {'detail': 'Too many failed attempts. Try again in 15 minutes.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Call the view
        response = view_func(request, *args, **kwargs)

        # Only count failed attempts (400, 401), not successes (200, 201)
        if response.status_code >= 400:
            attempts = cache.get(attempts_key, 0) + 1
            cache.set(attempts_key, attempts, 900)  # 15 min window
            if attempts >= 10:
                cache.set(blocked_key, True, 900)

        return response
    return _wrapped


@api_view(['POST'])
@permission_classes([AllowAny])
@rate_limit_auth
def register_view(request):
    serializer = UserRegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    refresh = RefreshToken.for_user(user)
    return Response(
        {
            'user': UserProfileSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
@rate_limit_auth
def login_view(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')
    user = authenticate(request, username=username, password=password)
    if not user:
        return Response(
            {'detail': 'Invalid credentials.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    refresh = RefreshToken.for_user(user)
    return Response(
        {
            'user': UserProfileSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(UserProfileSerializer(request.user).data)
