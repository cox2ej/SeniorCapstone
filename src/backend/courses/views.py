from django.db.models import Q
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Assignment, AssignmentAttachment, Course, Enrollment
from .serializers import AssignmentAttachmentSerializer, AssignmentSerializer, CourseSerializer, EnrollmentSerializer
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


class AssignmentAttachmentViewSet(viewsets.ModelViewSet):
  queryset = AssignmentAttachment.objects.select_related('assignment', 'assignment__course', 'assignment__created_by', 'uploaded_by')
  serializer_class = AssignmentAttachmentSerializer
  parser_classes = [MultiPartParser, FormParser]
  http_method_names = ['get', 'post', 'delete']

  def get_queryset(self):
    qs = super().get_queryset()
    user = self.request.user if self.request.user.is_authenticated else None
    if not user:
      return AssignmentAttachment.objects.none()

    qs = qs.filter(
      Q(assignment__created_by=user)
      | Q(assignment__course__instructor=user)
      | Q(assignment__reviewers__user=user)
    ).distinct()

    assignment_id = self.request.query_params.get('assignment')
    if assignment_id:
      qs = qs.filter(assignment_id=assignment_id)
    return qs

  def perform_create(self, serializer):
    assignment = serializer.validated_data['assignment']
    user = self.request.user
    if assignment.created_by_id != user.id:
      raise PermissionDenied('Only the assignment author can upload attachments.')
    serializer.save(uploaded_by=user)

  def perform_destroy(self, instance):
    user = self.request.user
    assignment = instance.assignment
    if assignment.created_by_id != user.id and assignment.course.instructor_id != user.id:
      raise PermissionDenied('You cannot delete this attachment.')
    instance.delete()
