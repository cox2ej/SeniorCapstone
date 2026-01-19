from rest_framework import viewsets

from .models import AssignmentReviewer, FeedbackAnalytics, FeedbackSubmission, SelfAssessment
from .serializers import (
  AssignmentReviewerSerializer,
  FeedbackAnalyticsSerializer,
  FeedbackSubmissionSerializer,
  SelfAssessmentSerializer,
)


class AssignmentReviewerViewSet(viewsets.ReadOnlyModelViewSet):
  queryset = AssignmentReviewer.objects.select_related('assignment', 'user')
  serializer_class = AssignmentReviewerSerializer

  def get_queryset(self):
    qs = super().get_queryset()
    assignment_id = self.request.query_params.get('assignment')
    if assignment_id:
      qs = qs.filter(assignment_id=assignment_id)
    return qs


class FeedbackSubmissionViewSet(viewsets.ModelViewSet):
  queryset = FeedbackSubmission.objects.select_related('assignment', 'reviewer').all()
  serializer_class = FeedbackSubmissionSerializer

  def get_queryset(self):
    qs = super().get_queryset()
    assignment_id = self.request.query_params.get('assignment')
    reviewer_alias = self.request.query_params.get('reviewer_alias')
    if assignment_id:
      qs = qs.filter(assignment_id=assignment_id)
    if reviewer_alias:
      qs = qs.filter(reviewer__alias=reviewer_alias)
    return qs


class SelfAssessmentViewSet(viewsets.ModelViewSet):
  queryset = SelfAssessment.objects.select_related('assignment', 'owner').all()
  serializer_class = SelfAssessmentSerializer

  def get_queryset(self):
    qs = super().get_queryset()
    assignment_id = self.request.query_params.get('assignment')
    if assignment_id:
      qs = qs.filter(assignment_id=assignment_id)
    return qs

  def perform_create(self, serializer):
    serializer.save(owner=self.request.user)


class FeedbackAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
  queryset = FeedbackAnalytics.objects.select_related('assignment').all()
  serializer_class = FeedbackAnalyticsSerializer
