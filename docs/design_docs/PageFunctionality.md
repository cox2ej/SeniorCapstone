Peer Feedback App - Page Functionality Definitions
This document defines the page-level functionality for the Peer Feedback App. It complements the 'Peer Feedback App – Web Application Page List' by detailing how each page behaves, including user interactions, data flow, and system responses. The goal is to provide developers and designers with a clear understanding of each page’s logic and purpose within the system.
Authentication & Access
a.	Login Page
i.	Users are redirected to a secure OAuth 2.0 authentication screen (university or Google SSO).
ii.	Upon successful login, user credentials are verified via backend API and a session token is created.
iii.	Failed logins trigger error messages and lockout mechanisms after 5 failed attempts.
iv.	After successful login, users are redirected to their respective dashboards based on role (student/instructor).
b.	Logout (Session Timeout)
i.	Users can manually log out or are automatically logged out after a period of inactivity.
ii.	A session timeout warning is displayed 2 minutes before automatic logout.
iii.	Upon logout, session tokens are invalidated, and users are redirected to the login screen.
c.	Registration (Optional)
i.	Non-SSO users can register using name, email, and password fields (for demo/testing environments).
ii.	The system validates email format and password strength.
iii.	Upon registration, a verification email is sent; account remains inactive until confirmed.
Dashboard (Landing Page After Login)
d.	Student Dashboard
i.	Displays personalized overview of pending feedback tasks, received feedback summaries, and performance graphs.
ii.	Pulls data from backend via API to render charts (feedback scores, completion progress).
iii.	Users can navigate to ‘Give Feedback’ or ‘My Feedback’ pages through action buttons.
e.	Instructor Dashboard
i.	Displays class-level summaries (aggregated anonymous feedback).
ii.	Provides quick links to 'Create Evaluation' and 'View Reports' pages.
iii.	Allows filtering by course, assignment, or date range.
Peer Feedback
f.	Give Feedback Page
i.	User selects peer(s) or group(s) from a list pre-assigned by instructor.
ii.	Displays rubric with numeric scales and text fields for comments.
iii.	Form validation ensures all required fields are completed before submission.
iv.	Upon submission, feedback is anonymized and stored in the database.
v.	Confirmation message displayed after successful submission.
g.	Feedback Guidelines Page
i.	Displays static instructional text and examples for writing effective feedback.
ii.	Linked contextually from the ‘Give Feedback’ form for quick reference.
iii.	No backend interaction except for logging guideline access analytics (optional).
h.	Feedback Confirmation Page
i.	Summarizes submitted feedback data for user confirmation.
ii.	Provides navigation options to return to Dashboard or submit feedback for another peer.
Receiving & Viewing Feedback
i.	My Feedback Page
i.	Displays aggregated peer feedback scores and written comments.
ii.	Pulls anonymized data from backend for each completed evaluation.
iii.	Allows sorting/filtering by assignment, peer group, or date.
iv.	Ensures anonymity by removing identifiable metadata.
j.	Self-Assessment Page
i.	Allows users to input self-evaluation scores and reflective comments.
ii.	Displays comparison graph showing self vs peer scores.
iii.	Submissions stored for trend analysis on the Feedback History page.
k.	Feedback History Page
i.	Displays timeline or chart summarizing feedback over time.
ii.	Data fetched from historical feedback tables for visualization.
iii.	Includes export button for generating PDF/CSV reports (future enhancement).
Instructor/Admin Tools
l.	Create Evaluation / Assignment Page
i.	Instructor defines evaluation title, criteria, description, and due date.
ii.	Criteria fields dynamically addable using form builder components.
iii.	Assignments saved to database and linked to student rosters.
iv.	Optional: Preview button to view student-facing evaluation form.
m.	Manage Courses / Groups Page
i.	Displays roster of students enrolled in each course.
ii.	Allows instructors to manually assign peer groups or import CSV lists.
iii.	Supports editing/removing users and reassigning peers dynamically.
n.	View Aggregated Reports Page
i.	Displays visual analytics (charts, tables) for class feedback results.
ii.	Data aggregated by average scores, participation rates, and response counts.
iii.	No individual feedback is identifiable in reports.
o.	Settings Page (Admin)
i.	Allows configuration of global app parameters (feedback limits, privacy rules).
ii.	Supports management of instructor accounts and feedback templates.
Notifications
p.	Notifications Center
i.	Displays list of system-generated alerts such as new feedback received, upcoming deadlines, or missed submissions.
ii.	Notifications fetched dynamically via API and stored locally for read/unread state management.
iii.	Users can click a notification to navigate to the relevant page.
iv.	Future enhancement: Enable optional email or SMS notifications.
q.	Account & Privacy
i.	Profile Page
ii.	Displays basic user information (name, role, university ID).
iii.	Allows users to update notification preferences and display picture (if permitted).
iv.	Data updates handled securely through authenticated API calls.
r.	Privacy Settings Page
i.	Allows users to view data retention policies and manage consent preferences.
ii.	Includes ‘Delete My Account’ option that removes all stored feedback and user data.
iii.	Displays confirmation modal before irreversible actions.
System & Legal
s.	About / Help Page
i.	Provides app overview, FAQs, and contact form for support.
ii.	Links to video tutorials and documentation pages.
t.	Terms of Use / Privacy Policy Page
i.	Displays legal text covering FERPA, GDPR, and institutional policies.
ii.	Users must accept terms during first login or major policy updates.
u.	Accessibility Statement Page
i.	Outlines the app’s accessibility standards and user rights.
ii.	Includes contact information for reporting accessibility issues.
Optional / Future Enhancements
v.	Mobile Feedback View
i.	Simplified layout for mobile users with adaptive feedback forms.
w.	Peer Matching Page
i.	Algorithmically assigns peer groups based on course or preferences.
x.	Reports Export Page
i.	Allows instructors to download aggregated reports in PDF or CSV format.
y.	Admin Analytics Dashboard
i.	Displays overall usage metrics, login activity, and system health indicators.

