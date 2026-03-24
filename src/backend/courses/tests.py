from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from .models import Assignment, Course, Enrollment


class AssignmentPrivacyAPITests(APITestCase):

  def setUp(self):
    self.instructor = User.objects.create_user(username='instructor', password='pass', role=User.Roles.INSTRUCTOR)
    self.student = User.objects.create_user(username='student', password='pass', role=User.Roles.STUDENT)
    self.classmate = User.objects.create_user(username='classmate', password='pass', role=User.Roles.STUDENT)

    self.course = Course.objects.create(code='ENG310', title='Peer Writing', instructor=self.instructor)
    Enrollment.objects.create(course=self.course, user=self.student)
    Enrollment.objects.create(course=self.course, user=self.classmate)

    self.self_assignment = Assignment.objects.create(course=self.course, created_by=self.student, title='My Draft')
    self.peer_assignment = Assignment.objects.create(course=self.course, created_by=self.classmate, title='Peer Draft')

    self.assignments_url = reverse('assignment-list')

  def authenticate(self, user):
    self.client.force_authenticate(user=user)

  def test_student_list_excludes_own_assignments(self):
    self.authenticate(self.student)

    response = self.client.get(self.assignments_url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    assignment_ids = {item['id'] for item in response.data}
    self.assertIn(self.peer_assignment.id, assignment_ids)
    self.assertNotIn(self.self_assignment.id, assignment_ids)

  def test_student_assignment_payload_redacts_created_by(self):
    self.authenticate(self.student)

    response = self.client.get(self.assignments_url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    peer_item = next(item for item in response.data if item['id'] == self.peer_assignment.id)
    self.assertIsNone(peer_item['created_by'])
