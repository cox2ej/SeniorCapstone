from rest_framework import viewsets

from .models import User
from .serializers import UserSerializer


class UserViewSet(viewsets.ReadOnlyModelViewSet):
  queryset = User.objects.all().order_by('id')
  serializer_class = UserSerializer
