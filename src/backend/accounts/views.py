from django.contrib.auth import authenticate, get_user_model, login, logout
from django.middleware import csrf
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .serializers import UserSerializer

UserModel = get_user_model()


class UserViewSet(viewsets.ReadOnlyModelViewSet):
  queryset = User.objects.all().order_by('id')
  serializer_class = UserSerializer

  @action(detail=False, methods=['get'], url_path='me')
  def me(self, request):
    user = request.user
    if not (user and user.is_authenticated):
      return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
    serializer = self.get_serializer(user)
    return Response(serializer.data)


class CsrfTokenView(APIView):
  permission_classes = [permissions.AllowAny]

  def get(self, request):
    token = csrf.get_token(request)
    return Response({'csrfToken': token})


class LoginView(APIView):
  permission_classes = [permissions.AllowAny]

  def post(self, request):
    username = (request.data.get('username') or '').strip()
    password = request.data.get('password') or ''
    if not username or not password:
      return Response({'detail': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=username, password=password)
    if user is None and '@' in username:
      try:
        resolved = UserModel.objects.get(email__iexact=username)
        user = authenticate(request, username=resolved.username, password=password)
      except UserModel.DoesNotExist:
        user = None

    if user is None:
      return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_400_BAD_REQUEST)

    if not user.is_active:
      return Response({'detail': 'Account is disabled.'}, status=status.HTTP_403_FORBIDDEN)

    login(request, user)
    serializer = UserSerializer(user)
    return Response(serializer.data)


class LogoutView(APIView):

  def post(self, request):
    if request.user.is_authenticated:
      logout(request)
    return Response({'detail': 'Logged out.'})
