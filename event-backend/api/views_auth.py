from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate
from .authentication import create_jwt

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    user = authenticate(username=email, password=password)
    if user is None:
        return Response({'detail': 'Invalid credentials'}, status=400)
    token = create_jwt(user)
    return Response({'token': token, 'user': {'id': user.id, 'name': user.first_name}})

from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    name     = request.data.get('name', '')
    email    = request.data.get('email')
    password = request.data.get('password')
    if not email or not password:
        return Response({'detail': 'Email and password required'}, status=400)
    if User.objects.filter(email=email).exists():
        return Response({'detail': 'Email already registered'}, status=400)
    user = User.objects.create_user(username=email, email=email,
                                    password=password, first_name=name)
    return Response({'id': user.id, 'name': user.first_name}, status=201)