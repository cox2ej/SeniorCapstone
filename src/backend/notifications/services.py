from django.utils.translation import gettext as _

from .models import Notification


def notify_feedback_submission(submission):
  assignment = submission.assignment
  reviewer = submission.reviewer.user if submission.reviewer else None

  if assignment and assignment.created_by and assignment.created_by != reviewer:
    Notification.objects.create(
      recipient=assignment.created_by,
      actor=reviewer,
      verb=Notification.Types.FEEDBACK_RECEIVED,
      message=_('{reviewer} reviewed {title}').format(
        reviewer=get_display_name(reviewer) or _('Someone'),
        title=assignment.title,
      ),
      assignment=assignment,
      feedback=submission,
      metadata={'rating': submission.rating},
    )

  if reviewer:
    Notification.objects.create(
      recipient=reviewer,
      actor=reviewer,
      verb=Notification.Types.FEEDBACK_GIVEN,
      message=_('You submitted feedback on {title}').format(title=assignment.title if assignment else ''),
      assignment=assignment,
      feedback=submission,
      metadata={'rating': submission.rating},
    )


def notify_assignment_posted(assignment):
  from courses.models import Enrollment  # local import to avoid circular

  enrollments = Enrollment.objects.filter(course=assignment.course).select_related('user')
  for enrollment in enrollments:
    if enrollment.user_id == assignment.created_by_id:
      continue
    Notification.objects.create(
      recipient=enrollment.user,
      actor=assignment.created_by,
      verb=Notification.Types.ASSIGNMENT_POSTED,
      message=_('{title} posted in {course}').format(
        title=assignment.title,
        course=assignment.course.title if assignment.course else _('course'),
      ),
      assignment=assignment,
      metadata={'course_id': assignment.course_id},
    )


def get_display_name(user):
  if not user:
    return ''
  return getattr(user, 'display_name', None) or user.get_full_name() or user.username
