from rest_framework import serializers

from accounts.serializers import UserSerializer
from courses.serializers import AssignmentSerializer
from .models import AssignmentReviewer, FeedbackAnalytics, FeedbackSubmission, SelfAssessment


class AssignmentReviewerSerializer(serializers.ModelSerializer):
  assignment = AssignmentSerializer(read_only=True)
  user = serializers.SerializerMethodField()

  class Meta:
    model = AssignmentReviewer
    fields = ['id', 'assignment', 'user', 'alias', 'assigned_at']
    read_only_fields = ['id', 'assignment', 'user', 'alias', 'assigned_at']

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

  def get_user(self, obj):
    if not self._can_view_user_identity():
      return None
    return UserSerializer(obj.user, context=self.context).data


class FeedbackSubmissionSerializer(serializers.ModelSerializer):
  reviewer = serializers.PrimaryKeyRelatedField(
    queryset=AssignmentReviewer.objects.all(),
    required=False,
    allow_null=True,
    write_only=True,
  )
  reviewer_alias = serializers.SerializerMethodField()
  assignment_detail = serializers.SerializerMethodField()
  reviewer_user = serializers.SerializerMethodField()

  class Meta:
    model = FeedbackSubmission
    fields = [
      'id', 'assignment', 'reviewer', 'assignment_detail', 'reviewer_alias', 'reviewer_user',
      'rating', 'comments', 'rubric_scores', 'status', 'submitted_at', 'updated_at'
    ]
    read_only_fields = ['id', 'assignment_detail', 'reviewer_alias', 'reviewer_user', 'submitted_at', 'updated_at']
    extra_kwargs = {
      'reviewer': {'write_only': True},
    }

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

  def _can_view_user_identity(self):
    request = self.context.get('request')
    request_user = getattr(request, 'user', None)
    return bool(
      getattr(request_user, 'is_staff', False)
      or getattr(request_user, 'is_instructor', False)
      or getattr(request_user, 'role', None) == 'admin'
    )

  def get_assignment_detail(self, obj):
    data = AssignmentSerializer(obj.assignment, context=self.context).data
    if not self._can_view_user_identity() and isinstance(data, dict):
      data.pop('created_by', None)
    return data

  def get_reviewer_alias(self, obj):
    if not self._can_view_user_identity():
      return None
    reviewer = getattr(obj, 'reviewer', None)
    return getattr(reviewer, 'alias', None)

  def get_reviewer_user(self, obj):
    reviewer = getattr(obj, 'reviewer', None)
    reviewer_user = getattr(reviewer, 'user', None)
    if reviewer_user is None:
      return None

    if not self._can_view_user_identity():
      return None

    return UserSerializer(reviewer_user, context=self.context).data

  def to_representation(self, instance):
    data = super().to_representation(instance)
    if not self._can_view_user_identity():
      data.pop('reviewer', None)
      data['reviewer_alias'] = None
      data['reviewer_user'] = None
      assignment_detail = data.get('assignment_detail')
      if isinstance(assignment_detail, dict):
        assignment_detail.pop('created_by', None)
    return data


class SelfAssessmentSerializer(serializers.ModelSerializer):
  owner = serializers.SerializerMethodField()

  class Meta:
    model = SelfAssessment
    fields = ['id', 'assignment', 'owner', 'rating', 'comments', 'submitted_at']
    read_only_fields = ['id', 'owner', 'submitted_at']

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

  def get_owner(self, obj):
    if not self._can_view_user_identity():
      return None
    return UserSerializer(obj.owner, context=self.context).data


class FeedbackAnalyticsSerializer(serializers.ModelSerializer):
  class Meta:
    model = FeedbackAnalytics
    fields = ['assignment', 'summary', 'last_calculated']
    read_only_fields = fields
