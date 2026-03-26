from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from courses.models import Course, Enrollment
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
  serializer_class = NotificationSerializer
  permission_classes = [permissions.IsAuthenticated]

  def get_queryset(self):
    qs = Notification.objects.select_related('recipient', 'actor', 'assignment', 'feedback').filter(recipient=self.request.user)
    unread = self.request.query_params.get('unread')
    if unread == 'true':
      qs = qs.filter(is_read=False)
    return qs.order_by('-created_at')

  @action(detail=False, methods=['post'], url_path='mark-all-read')
  def mark_all_read(self, request):
    count = self.get_queryset().filter(is_read=False).update(is_read=True)
    return Response({'updated': count})

  @action(detail=True, methods=['post'], url_path='mark-read')
  def mark_read(self, request, pk=None):
    notification = self.get_object()
    if notification.is_read:
      return Response(status=status.HTTP_204_NO_CONTENT)
    notification.is_read = True
    notification.save(update_fields=['is_read'])
    return Response(self.get_serializer(notification).data)

  @action(detail=True, methods=['post'], url_path='course-invite-respond')
  def course_invite_respond(self, request, pk=None):
    notification = self.get_object()
    if notification.verb != Notification.Types.COURSE_INVITED:
      raise ValidationError({'detail': 'This notification is not a course invitation.'})

    decision = (request.data.get('decision') or '').strip().lower()
    if decision not in ('accept', 'decline'):
      raise ValidationError({'decision': 'Decision must be either accept or decline.'})

    metadata = dict(notification.metadata or {})
    if metadata.get('invite_status') in ('accepted', 'declined'):
      notification.is_read = True
      notification.save(update_fields=['is_read'])
      return Response(self.get_serializer(notification).data)

    course_id = metadata.get('course_id')
    role = metadata.get('role') or Enrollment.Roles.STUDENT
    if decision == 'accept':
      if not course_id:
        raise ValidationError({'detail': 'Invitation is missing course information.'})
      try:
        course = Course.objects.get(pk=course_id)
      except Course.DoesNotExist as exc:
        raise ValidationError({'detail': 'Course no longer exists.'}) from exc
      Enrollment.objects.get_or_create(course=course, user=request.user, defaults={'role': role})

    metadata['invite_status'] = 'accepted' if decision == 'accept' else 'declined'
    notification.metadata = metadata
    notification.is_read = True
    notification.save(update_fields=['metadata', 'is_read'])
    return Response(self.get_serializer(notification).data)
