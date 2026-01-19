from rest_framework import serializers

from accounts.serializers import UserSerializer
from courses.serializers import AssignmentSerializer
from .models import AssignmentReviewer, FeedbackAnalytics, FeedbackSubmission, SelfAssessment


class AssignmentReviewerSerializer(serializers.ModelSerializer):
  assignment = AssignmentSerializer(read_only=True)
  user = UserSerializer(read_only=True)

  class Meta:
    model = AssignmentReviewer
    fields = ['id', 'assignment', 'user', 'alias', 'assigned_at']
    read_only_fields = ['id', 'assignment', 'user', 'alias', 'assigned_at']


class FeedbackSubmissionSerializer(serializers.ModelSerializer):
  reviewer_alias = serializers.CharField(source='reviewer.alias', read_only=True)

  class Meta:
    model = FeedbackSubmission
    fields = [
      'id', 'assignment', 'reviewer', 'reviewer_alias', 'rating', 'comments',
      'rubric_scores', 'status', 'submitted_at', 'updated_at'
    ]
    read_only_fields = ['id', 'reviewer_alias', 'submitted_at', 'updated_at']


class SelfAssessmentSerializer(serializers.ModelSerializer):
  owner = UserSerializer(read_only=True)

  class Meta:
    model = SelfAssessment
    fields = ['id', 'assignment', 'owner', 'rating', 'comments', 'submitted_at']
    read_only_fields = ['id', 'owner', 'submitted_at']


class FeedbackAnalyticsSerializer(serializers.ModelSerializer):
  class Meta:
    model = FeedbackAnalytics
    fields = ['assignment', 'summary', 'last_calculated']
    read_only_fields = fields
