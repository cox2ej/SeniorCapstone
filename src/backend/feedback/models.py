import uuid

from django.conf import settings
from django.db import models

from courses.models import Assignment


class AssignmentReviewer(models.Model):
  assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='reviewers')
  user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assignment_aliases')
  alias = models.CharField(max_length=36, editable=False)
  assigned_at = models.DateTimeField(auto_now_add=True)

  class Meta:
    unique_together = ('assignment', 'alias')

  def save(self, *args, **kwargs):
    if not self.alias:
      self.alias = uuid.uuid4().hex[:12]
    return super().save(*args, **kwargs)

  def __str__(self):
    return f"Reviewer {self.alias} for {self.assignment_id}"


class FeedbackSubmission(models.Model):
  class Status(models.TextChoices):
    DRAFT = 'draft', 'Draft'
    SUBMITTED = 'submitted', 'Submitted'
    PUBLISHED = 'published', 'Published'

  assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='feedback_submissions')
  reviewer = models.ForeignKey(AssignmentReviewer, on_delete=models.CASCADE, related_name='submissions')
  rating = models.PositiveSmallIntegerField()
  comments = models.TextField(blank=True)
  rubric_scores = models.JSONField(default=dict, blank=True)
  status = models.CharField(max_length=16, choices=Status.choices, default=Status.SUBMITTED)
  submitted_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  class Meta:
    ordering = ['-submitted_at']

  def __str__(self):
    return f"Feedback {self.id} on {self.assignment_id}"


class SelfAssessment(models.Model):
  assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='self_assessments')
  owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='self_assessments')
  rating = models.PositiveSmallIntegerField()
  comments = models.TextField(blank=True)
  submitted_at = models.DateTimeField(auto_now_add=True)

  class Meta:
    ordering = ['-submitted_at']


class FeedbackAnalytics(models.Model):
  assignment = models.OneToOneField(Assignment, on_delete=models.CASCADE, related_name='analytics')
  summary = models.JSONField(default=dict, blank=True)
  last_calculated = models.DateTimeField(auto_now=True)

  def __str__(self):
    return f"Analytics for {self.assignment_id}"
