from functools import wraps
from time import time

from django.contrib.auth import authenticate, get_user_model
from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import UserProfileSerializer, UserRegisterSerializer

User = get_user_model()

# Simple rate limiting: 5 attempts per hour per IP
RATE_LIMIT_ATTEMPTS = 100
RATE_LIMIT_WINDOW = 60  # 1 hour


def rate_limit_auth(view_func):
    @wraps(view_func)
    def _wrapped(request, *args, **kwargs):
        client_ip = request.META.get('REMOTE_ADDR', 'unknown')
        cache_key = f"auth_attempt:{client_ip}"

        attempts = cache.get(cache_key, 0)
        if attempts >= RATE_LIMIT_ATTEMPTS:
            return Response(
                {'detail': 'Too many attempts. Please try again later.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        cache.set(cache_key, attempts + 1, RATE_LIMIT_WINDOW)
        return view_func(request, *args, **kwargs)
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
