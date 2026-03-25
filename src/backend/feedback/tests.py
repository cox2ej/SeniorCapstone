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
    self.assignment = Assignment.objects.create(
      course=self.course,
      created_by=self.other_student,
      title='Essay Draft',
      rubric={
        'criteria': [
          {'id': 'clarity', 'label': 'Clarity', 'required': True, 'min_score': 1, 'max_score': 5},
          {'id': 'depth', 'label': 'Depth', 'required': False, 'min_score': 0, 'max_score': 10},
        ]
      }
    )
    self.url = reverse('feedback-list')

  def authenticate(self, user):
    self.client.force_authenticate(user=user)

  def test_student_can_submit_feedback_with_auto_created_reviewer(self):
    self.authenticate(self.student)
    payload = {
      'assignment': self.assignment.id,
      'rating': 4,
      'comments': 'Nice job',
      'rubric_scores': {'clarity': 4, 'depth': 8}
    }

    response = self.client.post(self.url, payload, format='json')

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    submission = FeedbackSubmission.objects.get()
    self.assertEqual(submission.reviewer.user, self.student)
    self.assertEqual(submission.rating, 4)
    self.assertEqual(submission.assignment, self.assignment)
    self.assertEqual(submission.rubric_scores['clarity'], 4)
    self.assertEqual(submission.rubric_scores['depth'], 8)

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

  def test_rubric_requires_required_criterion(self):
    self.authenticate(self.student)
    payload = {
      'assignment': self.assignment.id,
      'rating': 4,
      'rubric_scores': {'depth': 5},
    }

    response = self.client.post(self.url, payload, format='json')

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertIn('rubric_scores', response.data)
    self.assertIn('clarity', response.data['rubric_scores'])

  def test_assignment_reviewer_list_redacts_user_identity_for_student(self):
    self.authenticate(self.student)
    AssignmentReviewer.objects.create(assignment=self.assignment, user=self.student)
    AssignmentReviewer.objects.create(assignment=self.assignment, user=self.other_student)

    url = reverse('assignment-reviewer-list')
    response = self.client.get(url, {'assignment': self.assignment.id})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data), 1)
    self.assertIsNone(response.data[0]['user'])
    self.assertIsNone(response.data[0]['assignment']['created_by'])

  def test_self_assessment_owner_is_redacted_for_student_view(self):
    self.authenticate(self.student)
    url = reverse('self-assessment-list')
    create_response = self.client.post(url, {
      'assignment': self.assignment.id,
      'rating': 3,
      'comments': 'Self reflection',
      'rubric_scores': {'clarity': 3},
    }, format='json')
    self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

    list_response = self.client.get(url)
    self.assertEqual(list_response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(list_response.data), 1)
    self.assertIsNone(list_response.data[0]['owner'])

  def test_self_assessment_requires_required_rubric_scores(self):
    self.authenticate(self.student)
    url = reverse('self-assessment-list')

    response = self.client.post(url, {
      'assignment': self.assignment.id,
      'rating': 4,
      'comments': 'Missing required criterion',
      'rubric_scores': {'depth': 5},
    }, format='json')

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertIn('rubric_scores', response.data)
    self.assertIn('clarity', response.data['rubric_scores'])

  def test_self_assessment_stores_rubric_scores(self):
    self.authenticate(self.student)
    url = reverse('self-assessment-list')

    create_response = self.client.post(url, {
      'assignment': self.assignment.id,
      'rating': 4,
      'comments': 'Rubric included',
      'rubric_scores': {'clarity': 4, 'depth': 8},
    }, format='json')

    self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(create_response.data['rubric_scores']['clarity'], 4)
    self.assertEqual(create_response.data['rubric_scores']['depth'], 8)

  def test_received_feedback_hides_reviewer_user_when_anonymized(self):
    self.authenticate(self.student)
    create_payload = {
      'assignment': self.assignment.id,
      'rating': 4,
      'comments': 'Anonymous feedback',
      'rubric_scores': {'clarity': 4},
    }
    create_response = self.client.post(self.url, create_payload, format='json')
    self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
    feedback_id = create_response.data['id']

    self.authenticate(self.other_student)
    detail_url = reverse('feedback-detail', args=[feedback_id])
    response = self.client.get(detail_url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertNotIn('reviewer', response.data)
    self.assertIsNone(response.data['reviewer_user'])
    self.assertIsNone(response.data['reviewer_alias'])
    self.assertNotIn('created_by', response.data['assignment_detail'])

    self.authenticate(self.student)
    reviewer_view_response = self.client.get(detail_url)
    self.assertEqual(reviewer_view_response.status_code, status.HTTP_200_OK)
    self.assertNotIn('reviewer', reviewer_view_response.data)
    self.assertIsNone(reviewer_view_response.data['reviewer_user'])
    self.assertIsNone(reviewer_view_response.data['reviewer_alias'])
    self.assertNotIn('created_by', reviewer_view_response.data['assignment_detail'])

  def test_received_feedback_hides_reviewer_user_for_non_staff_when_not_anonymized(self):
    non_anonymous_assignment = Assignment.objects.create(
      course=self.course,
      created_by=self.other_student,
      title='Visible Reviewer Draft',
      anonymize_reviewers=False,
      rubric={'criteria': [{'id': 'clarity', 'label': 'Clarity', 'required': False, 'min_score': 1, 'max_score': 5}]},
    )
    self.authenticate(self.student)
    create_payload = {
      'assignment': non_anonymous_assignment.id,
      'rating': 4,
      'comments': 'Named feedback',
      'rubric_scores': {'clarity': 4},
    }
    create_response = self.client.post(self.url, create_payload, format='json')
    self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
    feedback_id = create_response.data['id']

    self.authenticate(self.other_student)
    detail_url = reverse('feedback-detail', args=[feedback_id])
    response = self.client.get(detail_url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertNotIn('reviewer', response.data)
    self.assertIsNone(response.data['reviewer_user'])
    self.assertIsNone(response.data['reviewer_alias'])
    self.assertNotIn('created_by', response.data['assignment_detail'])

  def test_rubric_scores_must_respect_range(self):
    self.authenticate(self.student)
    payload = {
      'assignment': self.assignment.id,
      'rating': 4,
      'rubric_scores': {'clarity': 6},
    }

    response = self.client.post(self.url, payload, format='json')

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertIn('rubric_scores', response.data)
    self.assertIn('clarity', response.data['rubric_scores'])

  def test_rubric_scores_must_be_numeric(self):
    self.authenticate(self.student)
    payload = {
      'assignment': self.assignment.id,
      'rating': 4,
      'rubric_scores': {'clarity': 'excellent'},
    }

    response = self.client.post(self.url, payload, format='json')

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertIn('rubric_scores', response.data)
    self.assertIn('clarity', response.data['rubric_scores'])


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
