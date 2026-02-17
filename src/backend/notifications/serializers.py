from rest_framework import serializers

from accounts.serializers import UserSerializer
from courses.serializers import AssignmentSerializer
from feedback.serializers import FeedbackSubmissionSerializer
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
  recipient = UserSerializer(read_only=True)
  actor = UserSerializer(read_only=True)
  assignment = AssignmentSerializer(read_only=True)
  feedback = FeedbackSubmissionSerializer(read_only=True)

  class Meta:
    model = Notification
    fields = [
      'id', 'verb', 'message', 'metadata', 'is_read', 'created_at',
      'recipient', 'actor', 'assignment', 'feedback'
    ]
    read_only_fields = fields
