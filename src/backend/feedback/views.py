from django.db.models import Avg, Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from courses.models import Assignment
from courses.serializers import AssignmentSerializer
from .models import AssignmentReviewer, FeedbackAnalytics, FeedbackSubmission, SelfAssessment
from notifications.services import notify_feedback_submission
from .serializers import (
  AssignmentReviewerSerializer,
  FeedbackAnalyticsSerializer,
  FeedbackSubmissionSerializer,
  SelfAssessmentSerializer,
)


class AssignmentReviewerViewSet(viewsets.ReadOnlyModelViewSet):
  queryset = AssignmentReviewer.objects.select_related('assignment', 'assignment__created_by', 'user')
  serializer_class = AssignmentReviewerSerializer

  def get_queryset(self):
    qs = super().get_queryset()
    user = self.request.user if self.request.user.is_authenticated else None
    assignment_id = self.request.query_params.get('assignment')
    user_id = self.request.query_params.get('user')
    if assignment_id:
      qs = qs.filter(assignment_id=assignment_id)
    if user_id:
      qs = qs.filter(user_id=user_id)
    elif not (user and user.is_staff):
      if user:
        qs = qs.filter(user=user)
      else:
        qs = qs.none()
    return qs

  def _find_next_assignment(self, user):
    return (
      Assignment.objects
      .exclude(created_by=user)
      .exclude(reviewers__user=user)
      .annotate(reviewer_count=Count('reviewers'))
      .order_by('reviewer_count', 'due_date', 'created_at')
      .first()
    )

  @action(detail=False, methods=['post'], url_path='claim')
  def claim_assignment(self, request):
    user = request.user
    if not (user and user.is_authenticated):
      return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    assignment_id = request.data.get('assignment')
    if assignment_id:
      assignment = get_object_or_404(Assignment, pk=assignment_id)
    else:
      assignment = self._find_next_assignment(user)
      if assignment is None:
        return Response({'detail': 'No assignments available to match right now.'}, status=status.HTTP_404_NOT_FOUND)

    if assignment.created_by_id == user.id:
      return Response({'detail': 'You cannot review your own assignment.'}, status=status.HTTP_400_BAD_REQUEST)

    reviewer, created = AssignmentReviewer.objects.get_or_create(assignment=assignment, user=user)
    serializer = self.get_serializer(reviewer)
    payload = {**serializer.data, 'already_assigned': not created}
    return Response(payload, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

  @action(detail=False, methods=['get'], url_path='available')
  def available_assignments(self, request):
    user = request.user
    if not (user and user.is_authenticated):
      return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    assignments = (
      Assignment.objects
      .exclude(created_by=user)
      .exclude(reviewers__user=user)
      .order_by('due_date', 'created_at')
    )
    serializer = AssignmentSerializer(assignments, many=True, context={'request': request})
    return Response(serializer.data)


class FeedbackSubmissionViewSet(viewsets.ModelViewSet):
  queryset = FeedbackSubmission.objects.select_related('assignment', 'assignment__created_by', 'reviewer', 'reviewer__user').all()
  serializer_class = FeedbackSubmissionSerializer
  permission_classes = [permissions.IsAuthenticated]

  def get_queryset(self):
    qs = super().get_queryset()
    assignment_id = self.request.query_params.get('assignment')
    reviewer_alias = self.request.query_params.get('reviewer_alias')
    role = self.request.query_params.get('role')
    user = self.request.user if self.request.user.is_authenticated else None
    if assignment_id:
      qs = qs.filter(assignment_id=assignment_id)
    if reviewer_alias:
      qs = qs.filter(reviewer__alias=reviewer_alias)
    if user:
      if role == 'received':
        qs = qs.filter(assignment__created_by=user)
      elif role == 'given':
        qs = qs.filter(reviewer__user=user)
      else:
        qs = qs.filter(reviewer__user=user)
    return qs

  def perform_create(self, serializer):
    assignment = serializer.validated_data['assignment']
    reviewer = serializer.validated_data.get('reviewer')
    if reviewer is None:
      reviewer, _ = AssignmentReviewer.objects.get_or_create(assignment=assignment, user=self.request.user)
    elif reviewer.user_id and reviewer.user_id != self.request.user.id:
      raise permissions.PermissionDenied('This reviewer slot belongs to another user.')
    if assignment.created_by_id == self.request.user.id:
      raise permissions.PermissionDenied('You cannot review your own assignment.')
    submission = serializer.save(reviewer=reviewer)
    notify_feedback_submission(submission)


class SelfAssessmentViewSet(viewsets.ModelViewSet):
  queryset = SelfAssessment.objects.select_related('assignment', 'owner').all()
  serializer_class = SelfAssessmentSerializer

  def get_queryset(self):
    qs = super().get_queryset()
    user = self.request.user if self.request.user.is_authenticated else None
    if user:
      qs = qs.filter(owner=user)
    assignment_id = self.request.query_params.get('assignment')
    if assignment_id:
      qs = qs.filter(assignment_id=assignment_id)
    return qs

  def perform_create(self, serializer):
    serializer.save(owner=self.request.user)


class FeedbackAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
  queryset = FeedbackAnalytics.objects.select_related('assignment').all()
  serializer_class = FeedbackAnalyticsSerializer


class DashboardSummaryView(APIView):
  permission_classes = [permissions.IsAuthenticated]

  def get(self, request):
    user = request.user
    assignments_posted = Assignment.objects.filter(created_by=user)
    reviews_given = FeedbackSubmission.objects.filter(reviewer__user=user)
    reviews_received = FeedbackSubmission.objects.filter(assignment__created_by=user)

    submitted_filter = Q(submissions__status__in=[FeedbackSubmission.Status.SUBMITTED, FeedbackSubmission.Status.PUBLISHED])
    pending_reviews = (
      AssignmentReviewer.objects
      .filter(user=user)
      .annotate(submitted_count=Count('submissions', filter=submitted_filter))
      .filter(submitted_count=0)
      .count()
    )

    summary = {
      'role': getattr(user, 'role', None),
      'assignments_posted': assignments_posted.count(),
      'reviews_given': reviews_given.count(),
      'reviews_received': reviews_received.count(),
      'pending_reviews': pending_reviews,
      'average_rating_given': reviews_given.aggregate(avg=Avg('rating'))['avg'],
      'average_rating_received': reviews_received.aggregate(avg=Avg('rating'))['avg'],
    }

    if getattr(user, 'is_instructor', False) or getattr(user, 'is_staff', False):
      instructor_assignments = Assignment.objects.filter(course__instructor=user)
      course_reviews = FeedbackSubmission.objects.filter(assignment__course__instructor=user)
      instructor_pending = (
        AssignmentReviewer.objects
        .filter(assignment__course__instructor=user)
        .annotate(submitted_count=Count('submissions', filter=submitted_filter))
        .filter(submitted_count=0)
        .count()
      )
      summary.update({
        'course_assignments': instructor_assignments.count(),
        'course_reviews': course_reviews.count(),
        'pending_reviews_for_course': instructor_pending,
        'average_rating_for_course': course_reviews.aggregate(avg=Avg('rating'))['avg'],
      })

    return Response(summary)
