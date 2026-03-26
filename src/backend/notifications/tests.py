from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from courses.models import Assignment, Course, Enrollment
from notifications.models import Notification


class NotificationAPITests(APITestCase):

  def setUp(self):
    self.instructor = User.objects.create_user(username='prof', password='pass', role=User.Roles.INSTRUCTOR)
    self.student = User.objects.create_user(username='student', password='pass', role=User.Roles.STUDENT)
    self.reviewer = User.objects.create_user(username='reviewer', password='pass', role=User.Roles.STUDENT)

    self.course = Course.objects.create(code='ENG300', title='Writing Studio', instructor=self.instructor)
    Enrollment.objects.create(course=self.course, user=self.student)

    self.assignment_url = reverse('assignment-list')
    self.feedback_url = reverse('feedback-list')
    self.notifications_url = reverse('notification-list')

  def authenticate(self, user):
    self.client.force_authenticate(user=user)

  def test_assignment_creation_sends_notification_to_enrolled_students(self):
    self.authenticate(self.instructor)
    payload = {
      'course': self.course.id,
      'title': 'Peer Review 1',
      'description': 'Write a draft.',
    }

    response = self.client.post(self.assignment_url, payload, format='json')

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(Notification.objects.filter(recipient=self.student, verb=Notification.Types.ASSIGNMENT_POSTED).count(), 1)

  def test_feedback_submission_creates_notifications_for_author_and_reviewer(self):
    assignment = Assignment.objects.create(course=self.course, created_by=self.student, title='Essay Draft')
    self.authenticate(self.reviewer)
    payload = {
      'assignment': assignment.id,
      'rating': 4,
      'comments': 'Solid work',
    }

    response = self.client.post(self.feedback_url, payload, format='json')

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    verbs = Notification.objects.values_list('verb', flat=True)
    self.assertIn(Notification.Types.FEEDBACK_RECEIVED, verbs)
    self.assertIn(Notification.Types.FEEDBACK_GIVEN, verbs)

  def test_anonymized_feedback_notification_hides_reviewer_identity(self):
    assignment = Assignment.objects.create(
      course=self.course,
      created_by=self.student,
      title='Anonymous Draft',
      anonymize_reviewers=True,
    )
    self.authenticate(self.reviewer)
    payload = {
      'assignment': assignment.id,
      'rating': 4,
      'comments': 'Anonymous note',
    }

    response = self.client.post(self.feedback_url, payload, format='json')

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    self.authenticate(self.student)
    list_response = self.client.get(self.notifications_url)
    self.assertEqual(list_response.status_code, status.HTTP_200_OK)
    received_notification = next(item for item in list_response.data if item['verb'] == Notification.Types.FEEDBACK_RECEIVED)

    self.assertIsNone(received_notification['actor'])
    self.assertIsNone(received_notification['recipient'])
    self.assertIn('A classmate', received_notification['message'])
    self.assertIsNone(received_notification['assignment']['created_by'])
    self.assertIsNone(received_notification['feedback']['reviewer_user'])

  def test_list_and_mark_read_endpoints(self):
    notification = Notification.objects.create(
      recipient=self.student,
      actor=self.instructor,
      verb=Notification.Types.ASSIGNMENT_POSTED,
      message='Test',
    )
    Notification.objects.create(
      recipient=self.student,
      actor=self.instructor,
      verb=Notification.Types.ASSIGNMENT_POSTED,
      message='Another',
    )

    self.authenticate(self.student)

    list_response = self.client.get(self.notifications_url)
    self.assertEqual(list_response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(list_response.data), 2)
    self.assertTrue(all(item['actor'] is None for item in list_response.data))
    self.assertTrue(all(item['recipient'] is None for item in list_response.data))

    mark_url = reverse('notification-mark-read', args=[notification.id])
    mark_response = self.client.post(mark_url)
    self.assertEqual(mark_response.status_code, status.HTTP_200_OK)
    notification.refresh_from_db()
    self.assertTrue(notification.is_read)

    mark_all_url = reverse('notification-mark-all-read')
    mark_all_response = self.client.post(mark_all_url)
    self.assertEqual(mark_all_response.status_code, status.HTTP_200_OK)
    self.assertEqual(mark_all_response.data['updated'], 1)

  def test_course_invite_accept_creates_enrollment(self):
    invite_course = Course.objects.create(code='ENG301', title='Invite Course', instructor=self.instructor)
    notification = Notification.objects.create(
      recipient=self.student,
      actor=self.instructor,
      verb=Notification.Types.COURSE_INVITED,
      message='Invite',
      metadata={
        'course_id': invite_course.id,
        'role': Enrollment.Roles.STUDENT,
        'invite_status': 'pending',
      },
    )
    self.authenticate(self.student)

    respond_url = reverse('notification-course-invite-respond', args=[notification.id])
    response = self.client.post(respond_url, {'decision': 'accept'}, format='json')

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertTrue(Enrollment.objects.filter(course=invite_course, user=self.student).exists())
    notification.refresh_from_db()
    self.assertEqual(notification.metadata.get('invite_status'), 'accepted')
    self.assertTrue(notification.is_read)

  def test_course_invite_decline_does_not_create_enrollment(self):
    invite_course = Course.objects.create(code='ENG302', title='Invite Course 2', instructor=self.instructor)
    notification = Notification.objects.create(
      recipient=self.student,
      actor=self.instructor,
      verb=Notification.Types.COURSE_INVITED,
      message='Invite',
      metadata={
        'course_id': invite_course.id,
        'role': Enrollment.Roles.STUDENT,
        'invite_status': 'pending',
      },
    )
    self.authenticate(self.student)

    respond_url = reverse('notification-course-invite-respond', args=[notification.id])
    response = self.client.post(respond_url, {'decision': 'decline'}, format='json')

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertFalse(Enrollment.objects.filter(course=invite_course, user=self.student).exists())
    notification.refresh_from_db()
    self.assertEqual(notification.metadata.get('invite_status'), 'declined')
    self.assertTrue(notification.is_read)
