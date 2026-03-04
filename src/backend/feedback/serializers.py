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
  reviewer = serializers.PrimaryKeyRelatedField(queryset=AssignmentReviewer.objects.all(), required=False, allow_null=True)
  reviewer_alias = serializers.CharField(source='reviewer.alias', read_only=True)
  assignment_detail = AssignmentSerializer(source='assignment', read_only=True)
  reviewer_user = UserSerializer(source='reviewer.user', read_only=True)

  class Meta:
    model = FeedbackSubmission
    fields = [
      'id', 'assignment', 'reviewer', 'assignment_detail', 'reviewer_alias', 'reviewer_user',
      'rating', 'comments', 'rubric_scores', 'status', 'submitted_at', 'updated_at'
    ]
    read_only_fields = ['id', 'assignment_detail', 'reviewer_alias', 'reviewer_user', 'submitted_at', 'updated_at']

  def validate_rating(self, value):
    if value < 1 or value > 5:
      raise serializers.ValidationError('Rating must be between 1 and 5.')
    return value

  def validate(self, attrs):
    assignment = attrs.get('assignment') or getattr(self.instance, 'assignment', None)
    reviewer = attrs.get('reviewer') or getattr(self.instance, 'reviewer', None)
    request = self.context.get('request')
    user = getattr(request, 'user', None)
    rubric_scores = attrs.get('rubric_scores') or getattr(self.instance, 'rubric_scores', {})

    if assignment is None:
      raise serializers.ValidationError({'assignment': 'Assignment is required.'})

    if reviewer:
      if reviewer.assignment_id != assignment.id:
        raise serializers.ValidationError({'reviewer': 'Reviewer does not belong to this assignment.'})
      if reviewer.user_id and user and reviewer.user_id != user.id:
        raise serializers.ValidationError({'reviewer': 'This reviewer slot belongs to another user.'})

    if user and assignment.created_by_id == user.id:
      raise serializers.ValidationError({'assignment': 'You cannot review your own assignment.'})

    rubric_errors = self._validate_rubric_scores(assignment, rubric_scores)
    if rubric_errors:
      raise serializers.ValidationError({'rubric_scores': rubric_errors})

    return attrs

  def _validate_rubric_scores(self, assignment, rubric_scores):
    rubric = assignment.rubric or {}
    criteria = rubric.get('criteria') or []
    if not criteria:
      return None
    if not isinstance(rubric_scores, dict):
      return 'Must be an object mapping criterion ids to numeric scores.'

    errors = {}
    for criterion in criteria:
      key = criterion.get('id') or criterion.get('key') or criterion.get('label')
      if not key:
        continue
      required = criterion.get('required', False)
      max_score = criterion.get('max_score') or criterion.get('maxScore') or 5
      min_score = criterion.get('min_score') or criterion.get('minScore') or 0
      score = rubric_scores.get(key)
      if score is None:
        if required:
          errors[key] = 'This criterion is required.'
        continue
      try:
        numeric_score = float(score)
      except (TypeError, ValueError):
        errors[key] = 'Score must be a number.'
        continue
      if numeric_score < min_score or numeric_score > max_score:
        errors[key] = f'Score must be between {min_score} and {max_score}.'
      else:
        rubric_scores[key] = numeric_score

    return errors or None


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
