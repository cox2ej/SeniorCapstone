from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
  class Meta:
    model = User
    fields = [
      'id',
      'username',
      'email',
      'display_name',
      'first_name',
      'last_name',
      'role',
      'timezone',
      'agreed_to_privacy',
    ]
    read_only_fields = ['id', 'username', 'email', 'role']
