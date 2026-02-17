from django.conf import settings
from django.db import models


class Notification(models.Model):
  class Types(models.TextChoices):
    ASSIGNMENT_POSTED = 'assignment_posted', 'Assignment Posted'
    FEEDBACK_RECEIVED = 'feedback_received', 'Feedback Received'
    FEEDBACK_GIVEN = 'feedback_given', 'Feedback Given'

  recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
  actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='actions_triggered')
  verb = models.CharField(max_length=64, choices=Types.choices)
  message = models.CharField(max_length=255)
  assignment = models.ForeignKey('courses.Assignment', null=True, blank=True, on_delete=models.CASCADE)
  feedback = models.ForeignKey('feedback.FeedbackSubmission', null=True, blank=True, on_delete=models.CASCADE)
  metadata = models.JSONField(default=dict, blank=True)
  is_read = models.BooleanField(default=False)
  created_at = models.DateTimeField(auto_now_add=True)

  class Meta:
    ordering = ['-created_at']

  def __str__(self):
    return f"Notification({self.verb}) to {self.recipient_id}"
