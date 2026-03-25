from rest_framework import serializers

from accounts.models import User
from accounts.serializers import UserSerializer
from .models import Assignment, AssignmentAttachment, AssignmentDiscussionPost, Course, CourseRubricTemplate, Enrollment


class CourseSerializer(serializers.ModelSerializer):
  instructor = serializers.SerializerMethodField()

  class Meta:
    model = Course
    fields = [
      'id', 'code', 'title', 'term', 'description',
      'instructor', 'start_date', 'end_date', 'created_at', 'updated_at'
    ]
    read_only_fields = ['id', 'created_at', 'updated_at', 'instructor']

  def _can_view_user_identity(self):
    request = self.context.get('request')
    request_user = getattr(request, 'user', None)
    if request_user is None:
      return False
    return bool(
      getattr(request_user, 'is_staff', False)
      or getattr(request_user, 'is_instructor', False)
      or getattr(request_user, 'role', None) == 'admin'
    )

  def get_instructor(self, obj):
    if not self._can_view_user_identity():
      return None
    return UserSerializer(obj.instructor, context=self.context).data


class EnrollmentSerializer(serializers.ModelSerializer):
  user = serializers.SerializerMethodField()
  user_id = serializers.PrimaryKeyRelatedField(source='user', queryset=User.objects.all(), write_only=True, required=False)

  class Meta:
    model = Enrollment
    fields = ['id', 'course', 'user', 'user_id', 'role', 'joined_at']
    read_only_fields = ['id', 'user', 'joined_at']

  def _can_view_user_identity(self):
    request = self.context.get('request')
    request_user = getattr(request, 'user', None)
    if request_user is None:
      return False
    return bool(
      getattr(request_user, 'is_staff', False)
      or getattr(request_user, 'is_instructor', False)
      or getattr(request_user, 'role', None) == 'admin'
    )

  def get_user(self, obj):
    if not self._can_view_user_identity():
      return None
    return UserSerializer(obj.user, context=self.context).data


class CourseRubricTemplateSerializer(serializers.ModelSerializer):
  class Meta:
    model = CourseRubricTemplate
    fields = ['id', 'course', 'name', 'description', 'definition', 'is_default', 'created_at', 'updated_at']
    read_only_fields = ['id', 'created_at', 'updated_at']


class AssignmentAttachmentSerializer(serializers.ModelSerializer):
  uploaded_by = serializers.SerializerMethodField()

  class Meta:
    model = AssignmentAttachment
    fields = ['id', 'assignment', 'file', 'original_name', 'uploaded_by', 'uploaded_at']
    read_only_fields = ['id', 'uploaded_by', 'uploaded_at']

  def _can_view_user_identity(self):
    request = self.context.get('request')
    request_user = getattr(request, 'user', None)
    if request_user is None:
      return False
    return bool(
      getattr(request_user, 'is_staff', False)
      or getattr(request_user, 'is_instructor', False)
      or getattr(request_user, 'role', None) == 'admin'
    )

  def get_uploaded_by(self, obj):
    if not self._can_view_user_identity():
      return None
    if obj.uploaded_by is None:
      return None
    return UserSerializer(obj.uploaded_by, context=self.context).data


class AssignmentSerializer(serializers.ModelSerializer):
  course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all())
  created_by = serializers.SerializerMethodField()
  rubric_template = serializers.PrimaryKeyRelatedField(
    queryset=CourseRubricTemplate.objects.select_related('course'),
    required=False,
    allow_null=True,
  )
  rubric_template_detail = serializers.SerializerMethodField()
  attachments = serializers.SerializerMethodField()

  class Meta:
    model = Assignment
    fields = [
      'id', 'course', 'created_by', 'title', 'description', 'due_date',
      'allow_self_assessment', 'anonymize_reviewers', 'rubric_template', 'rubric_template_detail', 'rubric',
      'created_at', 'updated_at', 'attachments'
    ]
    read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'attachments', 'rubric_template_detail']

  def _can_view_user_identity(self):
    request = self.context.get('request')
    request_user = getattr(request, 'user', None)
    if request_user is None:
      return False
    return bool(
      getattr(request_user, 'is_staff', False)
      or getattr(request_user, 'is_instructor', False)
      or getattr(request_user, 'role', None) == 'admin'
    )

  def get_created_by(self, obj):
    if not self._can_view_user_identity():
      return None
    if obj.created_by is None:
      return None
    return UserSerializer(obj.created_by, context=self.context).data

  def validate(self, attrs):
    course = attrs.get('course') or getattr(self.instance, 'course', None)
    template = attrs.get('rubric_template')
    if template and course and template.course_id != course.id:
      raise serializers.ValidationError({'rubric_template': 'Template must belong to the same course.'})
    return super().validate(attrs)

  def _coalesce_rubric(self, rubric, template):
    if rubric:
      return rubric
    if template:
      return template.definition or {}
    return rubric or {}

  def create(self, validated_data):
    template = validated_data.get('rubric_template')
    validated_data['rubric'] = self._coalesce_rubric(validated_data.get('rubric'), template)
    assignment = super().create(validated_data)
    return assignment

  def update(self, instance, validated_data):
    template = validated_data.get('rubric_template', instance.rubric_template)
    if 'rubric' in validated_data or template:
      validated_data['rubric'] = self._coalesce_rubric(validated_data.get('rubric'), template)
    return super().update(instance, validated_data)

  def get_attachments(self, obj):
    request = self.context.get('request')
    attachments = obj.attachments.all()
    serializer = AssignmentAttachmentSerializer(attachments, many=True, context={'request': request})
    return serializer.data

  def get_rubric_template_detail(self, obj):
    if not obj.rubric_template:
      return None
    return CourseRubricTemplateSerializer(obj.rubric_template).data


class AssignmentDiscussionPostSerializer(serializers.ModelSerializer):
  author = serializers.SerializerMethodField()

  class Meta:
    model = AssignmentDiscussionPost
    fields = ['id', 'assignment', 'author', 'body', 'created_at', 'updated_at']
    read_only_fields = ['id', 'author', 'created_at', 'updated_at']

  def _can_view_user_identity(self):
    request = self.context.get('request')
    request_user = getattr(request, 'user', None)
    if request_user is None:
      return False
    return bool(
      getattr(request_user, 'is_staff', False)
      or getattr(request_user, 'is_instructor', False)
      or getattr(request_user, 'role', None) == 'admin'
    )

  def get_author(self, obj):
    if not self._can_view_user_identity():
      return None
    if obj.author is None:
      return None
    return UserSerializer(obj.author, context=self.context).data
