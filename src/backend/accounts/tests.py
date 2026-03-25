from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


class UserMeAPITests(APITestCase):

  def setUp(self):
    self.user = User.objects.create_user(
      username='learner',
      password='pass',
      email='learner@example.com',
      role=User.Roles.STUDENT,
      display_name='Learner One',
      timezone='UTC',
      agreed_to_privacy=False,
    )
    self.me_url = reverse('user-me')

  def test_me_requires_authentication(self):
    response = self.client.get(self.me_url)
    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

  def test_me_patch_updates_allowed_fields(self):
    self.client.force_authenticate(user=self.user)
    response = self.client.patch(self.me_url, {
      'display_name': 'Updated Name',
      'timezone': 'America/New_York',
      'agreed_to_privacy': True,
      'role': User.Roles.ADMIN,
    }, format='json')

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.user.refresh_from_db()
    self.assertEqual(self.user.display_name, 'Updated Name')
    self.assertEqual(self.user.timezone, 'America/New_York')
    self.assertTrue(self.user.agreed_to_privacy)
    self.assertEqual(self.user.role, User.Roles.STUDENT)
