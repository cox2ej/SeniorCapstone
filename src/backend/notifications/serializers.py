from rest_framework import serializers

from accounts.serializers import UserSerializer
from courses.serializers import AssignmentSerializer
from feedback.serializers import FeedbackSubmissionSerializer
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
  recipient = serializers.SerializerMethodField()
  actor = serializers.SerializerMethodField()
  assignment = AssignmentSerializer(read_only=True)
  feedback = FeedbackSubmissionSerializer(read_only=True)

  class Meta:
    model = Notification
    fields = [
      'id', 'verb', 'message', 'metadata', 'is_read', 'created_at',
      'recipient', 'actor', 'assignment', 'feedback'
    ]
    read_only_fields = fields

  def _can_view_user_identity(self):
    request = self.context.get('request')
    request_user = getattr(request, 'user', None)
    if request_user is None:
      return False
    return bool(
      getattr(request_user, 'is_staff', False)
      or getattr(request_user, 'is_instructor', False)
      or getattr(request_user, 'role', None) == 'admin'
    )

  def get_recipient(self, obj):
    if not self._can_view_user_identity():
      return None
    return UserSerializer(obj.recipient, context=self.context).data

  def get_actor(self, obj):
    if not self._can_view_user_identity():
      return None
    if obj.actor is None:
      return None
    return UserSerializer(obj.actor, context=self.context).data
