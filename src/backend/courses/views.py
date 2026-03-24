from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Assignment, AssignmentAttachment, Course, CourseRubricTemplate, Enrollment
from .serializers import (
  AssignmentAttachmentSerializer,
  AssignmentSerializer,
  CourseRubricTemplateSerializer,
  CourseSerializer,
  EnrollmentSerializer,
)
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
    user = self.request.user if self.request.user.is_authenticated else None
    if not user:
      return Assignment.objects.none()

    can_view_all = bool(
      getattr(user, 'is_staff', False)
      or getattr(user, 'is_instructor', False)
      or getattr(user, 'role', None) == 'admin'
    )
    if not can_view_all:
      qs = qs.filter(course__enrollments__user=user).exclude(created_by=user).distinct()

    course_id = self.request.query_params.get('course')
    if course_id:
      qs = qs.filter(course_id=course_id)
    return qs

  def perform_create(self, serializer):
    assignment = serializer.save(created_by=self.request.user)
    notify_assignment_posted(assignment)

  @action(detail=True, methods=['get'], url_path='rubric')
  def rubric(self, request, pk=None):
    assignment = self.get_object()
    rubric = assignment.rubric or {}
    template = assignment.rubric_template
    template_data = CourseRubricTemplateSerializer(template).data if template else None
    return Response({
      'assignment': assignment.id,
      'rubric': rubric,
      'rubric_template': template_data,
    })


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


class CourseRubricTemplateViewSet(viewsets.ModelViewSet):
  queryset = CourseRubricTemplate.objects.select_related('course', 'course__instructor')
  serializer_class = CourseRubricTemplateSerializer

  def get_queryset(self):
    qs = super().get_queryset()
    user = self.request.user if self.request.user.is_authenticated else None
    if not user:
      return CourseRubricTemplate.objects.none()
    if user.is_staff:
      return qs
    course_id = self.request.query_params.get('course')
    if course_id:
      qs = qs.filter(course_id=course_id)
    return qs.filter(course__instructor=user)

  def perform_create(self, serializer):
    course = serializer.validated_data['course']
    self._ensure_course_owner(course)
    template = serializer.save()
    self._ensure_single_default(template)

  def perform_update(self, serializer):
    instance = serializer.instance
    self._ensure_course_owner(instance.course)
    template = serializer.save()
    self._ensure_single_default(template)

  def perform_destroy(self, instance):
    self._ensure_course_owner(instance.course)
    instance.delete()

  def _ensure_course_owner(self, course):
    user = self.request.user
    if course.instructor_id != user.id and not user.is_staff:
      raise PermissionDenied('You do not have permission to manage this rubric template.')

  def _ensure_single_default(self, template):
    if template.is_default:
      CourseRubricTemplate.objects.filter(course=template.course).exclude(pk=template.pk).update(is_default=False)
