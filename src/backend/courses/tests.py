from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from .models import Assignment, AssignmentDiscussionPost, Course, Enrollment


class AssignmentPrivacyAPITests(APITestCase):

  def setUp(self):
    self.instructor = User.objects.create_user(username='instructor', password='pass', role=User.Roles.INSTRUCTOR)
    self.student = User.objects.create_user(username='student', password='pass', role=User.Roles.STUDENT)
    self.classmate = User.objects.create_user(username='classmate', password='pass', role=User.Roles.STUDENT)
    self.unenrolled_author = User.objects.create_user(username='unenrolled_author', password='pass', role=User.Roles.STUDENT)

    self.course = Course.objects.create(code='ENG310', title='Peer Writing', instructor=self.instructor)
    Enrollment.objects.create(course=self.course, user=self.student)
    Enrollment.objects.create(course=self.course, user=self.classmate)

    self.self_assignment = Assignment.objects.create(course=self.course, created_by=self.student, title='My Draft')
    self.peer_assignment = Assignment.objects.create(course=self.course, created_by=self.classmate, title='Peer Draft')
    self.unenrolled_assignment = Assignment.objects.create(course=self.course, created_by=self.unenrolled_author, title='Unenrolled Author Draft')

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

  def test_student_role_mine_returns_only_owned_assignments(self):
    self.authenticate(self.student)

    response = self.client.get(self.assignments_url, {'role': 'mine'})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    assignment_ids = {item['id'] for item in response.data}
    self.assertIn(self.self_assignment.id, assignment_ids)
    self.assertNotIn(self.peer_assignment.id, assignment_ids)

  def test_student_can_view_rubric_for_own_assignment(self):
    self.authenticate(self.student)
    self.self_assignment.rubric = {'criteria': [{'id': 'clarity', 'label': 'Clarity', 'required': True, 'min_score': 1, 'max_score': 5}]}
    self.self_assignment.save(update_fields=['rubric'])

    rubric_url = reverse('assignment-rubric', args=[self.self_assignment.id])
    response = self.client.get(rubric_url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data['assignment'], self.self_assignment.id)
    self.assertEqual(response.data['rubric']['criteria'][0]['id'], 'clarity')

  def test_classmate_can_view_rubric_for_peer_assignment(self):
    self.authenticate(self.student)
    self.peer_assignment.rubric = {
      'criteria': [
        {'id': 'depth', 'label': 'Depth of analysis', 'required': True, 'min_score': 1, 'max_score': 5},
      ]
    }
    self.peer_assignment.save(update_fields=['rubric'])

    rubric_url = reverse('assignment-rubric', args=[self.peer_assignment.id])
    response = self.client.get(rubric_url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data['assignment'], self.peer_assignment.id)
    self.assertEqual(response.data['rubric']['criteria'][0]['id'], 'depth')

  def test_unenrolled_author_can_view_rubric_for_own_assignment(self):
    self.authenticate(self.unenrolled_author)
    self.unenrolled_assignment.rubric = {'criteria': [{'id': 'depth', 'label': 'Depth', 'required': False, 'min_score': 1, 'max_score': 5}]}
    self.unenrolled_assignment.save(update_fields=['rubric'])

    rubric_url = reverse('assignment-rubric', args=[self.unenrolled_assignment.id])
    response = self.client.get(rubric_url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data['assignment'], self.unenrolled_assignment.id)
    self.assertEqual(response.data['rubric']['criteria'][0]['id'], 'depth')


class EnrollmentManagementAPITests(APITestCase):

  def setUp(self):
    self.instructor = User.objects.create_user(username='inst2', password='pass', role=User.Roles.INSTRUCTOR)
    self.student = User.objects.create_user(username='student2', password='pass', role=User.Roles.STUDENT, email='student2@example.com')
    self.classmate = User.objects.create_user(username='classmate2', password='pass', role=User.Roles.STUDENT)
    self.course = Course.objects.create(code='ENG320', title='Advanced Writing', instructor=self.instructor)
    self.enrollments_url = reverse('enrollment-list')
    self.courses_url = reverse('course-list')

  def authenticate(self, user):
    self.client.force_authenticate(user=user)

  def test_instructor_can_enroll_student_in_owned_course(self):
    self.authenticate(self.instructor)

    response = self.client.post(self.enrollments_url, {
      'course': self.course.id,
      'user_id': self.student.id,
      'role': Enrollment.Roles.STUDENT,
    }, format='json')

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertTrue(Enrollment.objects.filter(course=self.course, user=self.student).exists())

  def test_student_cannot_enroll_other_users(self):
    self.authenticate(self.student)

    response = self.client.post(self.enrollments_url, {
      'course': self.course.id,
      'user_id': self.classmate.id,
      'role': Enrollment.Roles.STUDENT,
    }, format='json')

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertTrue(Enrollment.objects.filter(course=self.course, user=self.student).exists())
    self.assertFalse(Enrollment.objects.filter(course=self.course, user=self.classmate).exists())

  def test_instructor_can_invite_student_by_email(self):
    self.authenticate(self.instructor)

    response = self.client.post(reverse('enrollment-invite'), {
      'course': self.course.id,
      'email': 'student2@example.com',
      'role': Enrollment.Roles.STUDENT,
    }, format='json')

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertTrue(response.data['created'])
    self.assertTrue(response.data['invited'])
    self.assertFalse(Enrollment.objects.filter(course=self.course, user=self.student).exists())

  def test_student_can_view_enrolled_courses(self):
    Enrollment.objects.create(course=self.course, user=self.student)
    self.authenticate(self.student)

    response = self.client.get(self.courses_url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    course_ids = {item['id'] for item in response.data}
    self.assertIn(self.course.id, course_ids)


class AssignmentDiscussionPostAPITests(APITestCase):

  def setUp(self):
    self.instructor = User.objects.create_user(username='inst_discuss', password='pass', role=User.Roles.INSTRUCTOR)
    self.student = User.objects.create_user(username='student_discuss', password='pass', role=User.Roles.STUDENT)
    self.outsider = User.objects.create_user(username='outsider_discuss', password='pass', role=User.Roles.STUDENT)
    self.course = Course.objects.create(code='ENG330', title='Discussion Writing', instructor=self.instructor)
    Enrollment.objects.create(course=self.course, user=self.student)
    self.assignment = Assignment.objects.create(course=self.course, created_by=self.instructor, title='Forum Prompt')
    self.discussion_url = reverse('assignment-discussion-post-list')

  def authenticate(self, user):
    self.client.force_authenticate(user=user)

  def test_enrolled_student_can_create_discussion_post(self):
    self.authenticate(self.student)

    response = self.client.post(self.discussion_url, {
      'assignment': self.assignment.id,
      'body': 'Here is my assignment response for discussion.',
    })

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertTrue(
      AssignmentDiscussionPost.objects.filter(
        assignment=self.assignment,
        author=self.student,
        body='Here is my assignment response for discussion.',
      ).exists()
    )

  def test_unenrolled_student_cannot_create_discussion_post(self):
    self.authenticate(self.outsider)

    response = self.client.post(self.discussion_url, {
      'assignment': self.assignment.id,
      'body': 'I should not be allowed to post here.',
    })

    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

  def test_student_can_list_discussion_posts_for_enrolled_assignment(self):
    AssignmentDiscussionPost.objects.create(
      assignment=self.assignment,
      author=self.student,
      body='Discussion starter',
    )
    self.authenticate(self.student)

    response = self.client.get(self.discussion_url, {'assignment': self.assignment.id})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data), 1)
    self.assertEqual(response.data[0]['body'], 'Discussion starter')

  def test_student_can_create_reply_to_discussion_post(self):
    parent_post = AssignmentDiscussionPost.objects.create(
      assignment=self.assignment,
      author=self.student,
      body='Original post',
    )
    self.authenticate(self.student)

    response = self.client.post(self.discussion_url, {
      'assignment': self.assignment.id,
      'parent': parent_post.id,
      'body': 'This is a reply to the original post.',
    })

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertTrue(
      AssignmentDiscussionPost.objects.filter(
        assignment=self.assignment,
        author=self.student,
        parent=parent_post,
        body='This is a reply to the original post.',
      ).exists()
    )

  def test_student_can_create_post_with_file_attachment(self):
    self.authenticate(self.student)
    
    from io import BytesIO
    from django.core.files.uploadedfile import SimpleUploadedFile
    
    test_file = SimpleUploadedFile(
        "test_document.pdf",
        b"file content",
        content_type="application/pdf"
    )

    response = self.client.post(self.discussion_url, {
      'assignment': self.assignment.id,
      'body': 'Post with attachment',
      'attachments': test_file,
    }, format='multipart')

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    post = AssignmentDiscussionPost.objects.get(assignment=self.assignment, author=self.student)
    self.assertEqual(post.attachments.count(), 1)
    self.assertEqual(post.attachments.first().original_name, 'test_document.pdf')
