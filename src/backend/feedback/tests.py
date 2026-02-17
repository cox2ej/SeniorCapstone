from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from courses.models import Assignment, Course
from .models import AssignmentReviewer, FeedbackSubmission


class FeedbackSubmissionAPITests(APITestCase):

  def setUp(self):
    self.instructor = User.objects.create_user(username='instructor', password='pass', role=User.Roles.INSTRUCTOR)
    self.student = User.objects.create_user(username='student', password='pass', role=User.Roles.STUDENT)
    self.other_student = User.objects.create_user(username='student2', password='pass', role=User.Roles.STUDENT)

    self.course = Course.objects.create(code='ENG101', title='Writing 101', instructor=self.instructor)
    self.assignment = Assignment.objects.create(course=self.course, created_by=self.other_student, title='Essay Draft')
    self.url = reverse('feedback-list')

  def authenticate(self, user):
    self.client.force_authenticate(user=user)

  def test_student_can_submit_feedback_with_auto_created_reviewer(self):
    self.authenticate(self.student)
    payload = {
      'assignment': self.assignment.id,
      'rating': 4,
      'comments': 'Nice job',
      'rubric_scores': {'clarity': 4}
    }

    response = self.client.post(self.url, payload, format='json')

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    submission = FeedbackSubmission.objects.get()
    self.assertEqual(submission.reviewer.user, self.student)
    self.assertEqual(submission.rating, 4)
    self.assertEqual(submission.assignment, self.assignment)

  def test_cannot_review_own_assignment(self):
    self.authenticate(self.other_student)
    payload = {
      'assignment': self.assignment.id,
      'rating': 5,
      'comments': 'Self review'
    }

    response = self.client.post(self.url, payload, format='json')

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertIn('assignment', response.data)
    self.assertEqual(FeedbackSubmission.objects.count(), 0)

  def test_rating_must_be_within_bounds(self):
    self.authenticate(self.student)
    payload = {
      'assignment': self.assignment.id,
      'rating': 6,
      'comments': 'Too high'
    }

    response = self.client.post(self.url, payload, format='json')

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertIn('rating', response.data)

  def test_cannot_use_another_users_reviewer_slot(self):
    self.authenticate(self.student)
    reviewer = AssignmentReviewer.objects.create(assignment=self.assignment, user=self.other_student)
    payload = {
      'assignment': self.assignment.id,
      'reviewer': reviewer.id,
      'rating': 3,
      'comments': 'Attempt to hijack'
    }

    response = self.client.post(self.url, payload, format='json')

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertIn('reviewer', response.data)
    self.assertEqual(FeedbackSubmission.objects.count(), 0)


class DashboardSummaryAPITests(APITestCase):

  def setUp(self):
    self.instructor = User.objects.create_user(username='instructor', password='pass', role=User.Roles.INSTRUCTOR)
    self.student = User.objects.create_user(username='student', password='pass', role=User.Roles.STUDENT)
    self.classmate = User.objects.create_user(username='classmate', password='pass', role=User.Roles.STUDENT)

    self.course = Course.objects.create(code='ENG201', title='Comp II', instructor=self.instructor)
    self.student_assignment = Assignment.objects.create(course=self.course, created_by=self.student, title='Student Draft')
    self.peer_assignment = Assignment.objects.create(course=self.course, created_by=self.classmate, title='Peer Draft')

    self.summary_url = reverse('dashboard-summary')

    self.student_reviewer = AssignmentReviewer.objects.create(assignment=self.peer_assignment, user=self.student)
    AssignmentReviewer.objects.create(assignment=self.peer_assignment, user=self.student)  # duplicate alias prevented by unique, but we can create second pending

    FeedbackSubmission.objects.create(
      assignment=self.peer_assignment,
      reviewer=self.student_reviewer,
      rating=4,
      comments='Great work'
    )

    classmate_reviewer = AssignmentReviewer.objects.create(assignment=self.student_assignment, user=self.classmate)
    FeedbackSubmission.objects.create(
      assignment=self.student_assignment,
      reviewer=classmate_reviewer,
      rating=5,
      comments='Solid'
    )

    # leave one pending reviewer slot for the student (created above)

  def authenticate(self, user):
    self.client.force_authenticate(user=user)

  def test_student_summary_counts(self):
    self.authenticate(self.student)

    response = self.client.get(self.summary_url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    data = response.json()
    self.assertEqual(data['assignments_posted'], 1)
    self.assertEqual(data['reviews_given'], 1)
    self.assertEqual(data['reviews_received'], 1)
    self.assertEqual(data['pending_reviews'], 1)
    self.assertAlmostEqual(data['average_rating_given'], 4.0)
    self.assertAlmostEqual(data['average_rating_received'], 5.0)

  def test_instructor_summary_includes_course_rollups(self):
    self.authenticate(self.instructor)

    response = self.client.get(self.summary_url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    data = response.json()
    self.assertIn('course_assignments', data)
    self.assertEqual(data['course_assignments'], 2)
    self.assertEqual(data['course_reviews'], 2)
    self.assertAlmostEqual(data['average_rating_for_course'], 4.5)
