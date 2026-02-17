from rest_framework import viewsets

from .models import Assignment, Course, Enrollment
from .serializers import AssignmentSerializer, CourseSerializer, EnrollmentSerializer
from notifications.services import notify_assignment_posted


class CourseViewSet(viewsets.ModelViewSet):
  queryset = Course.objects.select_related('instructor').all()
  serializer_class = CourseSerializer

  def perform_create(self, serializer):
    serializer.save(instructor=self.request.user)


class EnrollmentViewSet(viewsets.ModelViewSet):
  queryset = Enrollment.objects.select_related('course', 'user').all()
  serializer_class = EnrollmentSerializer

  def get_queryset(self):
    qs = super().get_queryset()
    course_id = self.request.query_params.get('course')
    if course_id:
      qs = qs.filter(course_id=course_id)
    return qs

  def perform_create(self, serializer):
    serializer.save(user=self.request.user)


class AssignmentViewSet(viewsets.ModelViewSet):
  queryset = Assignment.objects.select_related('course', 'created_by').all()
  serializer_class = AssignmentSerializer

  def get_queryset(self):
    qs = super().get_queryset()
    course_id = self.request.query_params.get('course')
    if course_id:
      qs = qs.filter(course_id=course_id)
    return qs

  def perform_create(self, serializer):
    assignment = serializer.save(created_by=self.request.user)
    notify_assignment_posted(assignment)
