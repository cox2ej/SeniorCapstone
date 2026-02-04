from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
  class Roles(models.TextChoices):
    STUDENT = 'student', 'Student'
    INSTRUCTOR = 'instructor', 'Instructor'
    ADMIN = 'admin', 'Admin'

  role = models.CharField(max_length=32, choices=Roles.choices, default=Roles.STUDENT)
  display_name = models.CharField(max_length=255, blank=True)
  timezone = models.CharField(max_length=64, default='UTC')
  agreed_to_privacy = models.BooleanField(default=False)

  @property
  def is_student(self):
    return self.role == self.Roles.STUDENT

  @property
  def is_instructor(self):
    return self.role == self.Roles.INSTRUCTOR

  def __str__(self):
    return self.display_name or self.get_full_name() or self.username
