from django.db.models import Q
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser

from accounts.models import User
from .models import Assignment, AssignmentAttachment, AssignmentDiscussionAttachment, AssignmentDiscussionPost, Course, CourseRubricTemplate, Enrollment
from .serializers import (
  AssignmentAttachmentSerializer,
  AssignmentDiscussionAttachmentSerializer,
  AssignmentDiscussionPostSerializer,
  AssignmentSerializer,
  CourseRubricTemplateSerializer,
  CourseSerializer,
  EnrollmentSerializer,
)
from notifications.services import notify_assignment_posted, notify_course_invited


class CourseViewSet(viewsets.ModelViewSet):
  queryset = Course.objects.select_related('instructor').all()
  serializer_class = CourseSerializer

  def get_queryset(self):
    qs = super().get_queryset()
    user = self.request.user if self.request.user.is_authenticated else None
    if not user:
      return Course.objects.none()
    if getattr(user, 'is_staff', False) or getattr(user, 'role', None) == 'admin':
      return qs
    return qs.filter(Q(instructor=user) | Q(enrollments__user=user)).distinct()

  def perform_create(self, serializer):
    user = self.request.user
    if not (
      getattr(user, 'is_staff', False)
      or getattr(user, 'is_instructor', False)
      or getattr(user, 'role', None) == 'admin'
    ):
      raise PermissionDenied('Only instructors can create courses.')
    serializer.save(instructor=self.request.user)

  def perform_update(self, serializer):
    self._ensure_course_owner(serializer.instance)
    serializer.save()

  def perform_destroy(self, instance):
    self._ensure_course_owner(instance)
    instance.delete()

  def _ensure_course_owner(self, course):
    user = self.request.user
    if (
      course.instructor_id != user.id
      and not getattr(user, 'is_staff', False)
      and getattr(user, 'role', None) != 'admin'
    ):
      raise PermissionDenied('You do not have permission to manage this course.')


class AssignmentDiscussionPostViewSet(viewsets.ModelViewSet):
  queryset = AssignmentDiscussionPost.objects.select_related('assignment', 'assignment__course', 'author', 'parent').prefetch_related('attachments')
  serializer_class = AssignmentDiscussionPostSerializer
  permission_classes = [permissions.IsAuthenticated]
  http_method_names = ['get', 'post']

  def get_parser_classes(self):
    if self.action == 'create':
      return [MultiPartParser, FormParser]
    return []

  def get_queryset(self):
    qs = super().get_queryset()
    user = self.request.user if self.request.user.is_authenticated else None
    if not user:
      return AssignmentDiscussionPost.objects.none()

    can_view_all = bool(
      getattr(user, 'is_staff', False)
      or getattr(user, 'is_instructor', False)
      or getattr(user, 'role', None) == 'admin'
    )
    if not can_view_all:
      qs = qs.filter(
        Q(assignment__course__enrollments__user=user)
        | Q(assignment__created_by=user)
      ).distinct()

    assignment_id = self.request.query_params.get('assignment')
    if assignment_id:
      qs = qs.filter(assignment_id=assignment_id)

    course_id = self.request.query_params.get('course')
    if course_id:
      qs = qs.filter(assignment__course_id=course_id)
    return qs

  def perform_create(self, serializer):
    assignment = serializer.validated_data['assignment']
    parent = serializer.validated_data.get('parent')
    user = self.request.user

    # Validate parent belongs to same assignment
    if parent and parent.assignment != assignment:
        raise PermissionDenied('Reply must be to a post in the same assignment.')

    can_post = bool(
      assignment.course.instructor_id == user.id
      or getattr(user, 'is_staff', False)
      or Enrollment.objects.filter(course=assignment.course, user=user).exists()
    )
    if not can_post:
      raise PermissionDenied('You do not have permission to post in this assignment discussion.')
    
    post = serializer.save(author=user)
    
    # Handle file uploads
    files = self.request.FILES.getlist('attachments')
    for file_obj in files:
        AssignmentDiscussionAttachment.objects.create(
            post=post,
            file=file_obj,
            uploaded_by=user
        )


class EnrollmentViewSet(viewsets.ModelViewSet):
  queryset = Enrollment.objects.select_related('course', 'user').all()
  serializer_class = EnrollmentSerializer

  def get_queryset(self):
    qs = super().get_queryset()
    user = self.request.user if self.request.user.is_authenticated else None
    if not user:
      return Enrollment.objects.none()

    can_view_all = bool(
      getattr(user, 'is_staff', False)
      or getattr(user, 'role', None) == 'admin'
    )
    if can_view_all:
      scoped = qs
    elif getattr(user, 'is_instructor', False):
      scoped = qs.filter(course__instructor=user)
    else:
      scoped = qs.filter(user=user)

    course_id = self.request.query_params.get('course')
    if course_id:
      scoped = scoped.filter(course_id=course_id)
    return scoped

  def perform_create(self, serializer):
    user = self.request.user
    course = serializer.validated_data['course']
    requested_user = serializer.validated_data.get('user')

    if getattr(user, 'is_staff', False) or getattr(user, 'role', None) == 'admin':
      serializer.save(user=requested_user or user)
      return

    if getattr(user, 'is_instructor', False):
      if course.instructor_id != user.id:
        raise PermissionDenied('You cannot manage enrollments for this course.')
      if requested_user is None:
        raise PermissionDenied('Select a user to enroll.')
      serializer.save(user=requested_user)
      return

    serializer.save(user=user)

  def perform_update(self, serializer):
    self._ensure_can_manage_enrollment(serializer.instance)
    serializer.save()

  def perform_destroy(self, instance):
    self._ensure_can_manage_enrollment(instance)
    instance.delete()

  def _ensure_can_manage_enrollment(self, enrollment):
    user = self.request.user
    if getattr(user, 'is_staff', False) or getattr(user, 'role', None) == 'admin':
      return
    if getattr(user, 'is_instructor', False) and enrollment.course.instructor_id == user.id:
      return
    if enrollment.user_id == user.id:
      return
    raise PermissionDenied('You do not have permission to manage this enrollment.')

  @action(detail=False, methods=['post'], url_path='invite')
  def invite(self, request):
    user = request.user
    course_id = request.data.get('course')
    email = (request.data.get('email') or '').strip().lower()
    role = request.data.get('role') or Enrollment.Roles.STUDENT

    if not course_id or not email:
      return Response({'detail': 'Course and email are required.'}, status=400)

    try:
      course = Course.objects.get(pk=course_id)
    except Course.DoesNotExist:
      return Response({'detail': 'Course not found.'}, status=404)

    is_admin = bool(getattr(user, 'is_staff', False) or getattr(user, 'role', None) == 'admin')
    is_owner_instructor = bool(getattr(user, 'is_instructor', False) and course.instructor_id == user.id)
    if not (is_admin or is_owner_instructor):
      raise PermissionDenied('You do not have permission to invite users to this course.')

    try:
      recipient = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
      return Response({'detail': 'No user account exists for that email yet.'}, status=404)

    if Enrollment.objects.filter(course=course, user=recipient).exists():
      return Response({'created': False, 'already_enrolled': True})

    notify_course_invited(course=course, recipient=recipient, actor=user, role=role)
    return Response({'created': True, 'invited': True})


class AssignmentViewSet(viewsets.ModelViewSet):
  queryset = Assignment.objects.select_related('course', 'created_by').all()
  serializer_class = AssignmentSerializer

  def get_queryset(self):
    qs = super().get_queryset()
    user = self.request.user if self.request.user.is_authenticated else None
    if not user:
      return Assignment.objects.none()

    role = self.request.query_params.get('role')
    if role == 'mine':
      return qs.filter(created_by=user)

    can_view_all = bool(
      getattr(user, 'is_staff', False)
      or getattr(user, 'is_instructor', False)
      or getattr(user, 'role', None) == 'admin'
    )
    if not can_view_all:
      qs = qs.filter(
        Q(is_public=True)
        | Q(course__enrollments__user=user)
        | Q(created_by=user)
        | Q(reviewers__user=user)
      )
      if self.action == 'list':
        qs = qs.exclude(created_by=user)
      qs = qs.distinct()

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
