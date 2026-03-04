from django.conf import settings
from django.db import models


class Course(models.Model):
  code = models.CharField(max_length=32)
  title = models.CharField(max_length=255)
  term = models.CharField(max_length=64, blank=True)
  description = models.TextField(blank=True)
  instructor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='courses_taught')
  start_date = models.DateField(null=True, blank=True)
  end_date = models.DateField(null=True, blank=True)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  class Meta:
    unique_together = ('code', 'term')
    ordering = ['title']

  def __str__(self):
    return f"{self.code} - {self.title}"


class Enrollment(models.Model):
  class Roles(models.TextChoices):
    STUDENT = 'student', 'Student'
    TA = 'ta', 'Teaching Assistant'

  course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
  user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='enrollments')
  role = models.CharField(max_length=16, choices=Roles.choices, default=Roles.STUDENT)
  joined_at = models.DateTimeField(auto_now_add=True)

  class Meta:
    unique_together = ('course', 'user')

  def __str__(self):
    return f"{self.user} in {self.course} ({self.role})"


class Assignment(models.Model):
  course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assignments')
  created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='assignments_created')
  title = models.CharField(max_length=255)
  description = models.TextField(blank=True)
  due_date = models.DateTimeField(null=True, blank=True)
  allow_self_assessment = models.BooleanField(default=True)
  anonymize_reviewers = models.BooleanField(default=True)
  rubric = models.JSONField(default=dict, blank=True)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  class Meta:
    ordering = ['-created_at']

  def __str__(self):
    return f"{self.title} ({self.course.code})"


def assignment_upload_to(instance, filename):
  return f"assignments/{instance.assignment_id}/{filename}"


class AssignmentAttachment(models.Model):
  assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='attachments')
  file = models.FileField(upload_to=assignment_upload_to)
  original_name = models.CharField(max_length=255, blank=True)
  uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='assignment_attachments')
  uploaded_at = models.DateTimeField(auto_now_add=True)

  class Meta:
    ordering = ['-uploaded_at']

  def save(self, *args, **kwargs):
    if not self.original_name and hasattr(self.file, 'name'):
      self.original_name = self.file.name
    return super().save(*args, **kwargs)

  def __str__(self):
    return f"Attachment {self.id} for assignment {self.assignment_id}"
