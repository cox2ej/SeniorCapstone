from rest_framework import serializers

from accounts.serializers import UserSerializer
from .models import Assignment, AssignmentAttachment, Course, Enrollment


class CourseSerializer(serializers.ModelSerializer):
  instructor = UserSerializer(read_only=True)

  class Meta:
    model = Course
    fields = [
      'id', 'code', 'title', 'term', 'description',
      'instructor', 'start_date', 'end_date', 'created_at', 'updated_at'
    ]
    read_only_fields = ['id', 'created_at', 'updated_at', 'instructor']


class EnrollmentSerializer(serializers.ModelSerializer):
  user = UserSerializer(read_only=True)

  class Meta:
    model = Enrollment
    fields = ['id', 'course', 'user', 'role', 'joined_at']
    read_only_fields = ['id', 'user', 'joined_at']


class AssignmentAttachmentSerializer(serializers.ModelSerializer):
  uploaded_by = UserSerializer(read_only=True)

  class Meta:
    model = AssignmentAttachment
    fields = ['id', 'assignment', 'file', 'original_name', 'uploaded_by', 'uploaded_at']
    read_only_fields = ['id', 'uploaded_by', 'uploaded_at']


class AssignmentSerializer(serializers.ModelSerializer):
  course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all())
  created_by = UserSerializer(read_only=True)
  attachments = serializers.SerializerMethodField()

  class Meta:
    model = Assignment
    fields = [
      'id', 'course', 'created_by', 'title', 'description', 'due_date',
      'allow_self_assessment', 'anonymize_reviewers', 'rubric',
      'created_at', 'updated_at', 'attachments'
    ]
    read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'attachments']

  def get_attachments(self, obj):
    request = self.context.get('request')
    attachments = obj.attachments.all()
    serializer = AssignmentAttachmentSerializer(attachments, many=True, context={'request': request})
    return serializer.data
