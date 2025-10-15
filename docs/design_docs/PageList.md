Peer Feedback App - Web Application Page List
This document lists the proposed pages for the Peer Feedback App, organized by user role and functionality. It is based on the project's functional and non-functional requirements as well as user stories. The goal is to outline all necessary pages for a complete and accessible user experience.
1.	Authentication & Access
a.	Login Page
i.	Purpose: Secure entry to the app using OAuth (university or Google SSO).
ii.	Key Features: OAuth 2.0 sign-in, error handling for failed login attempts.
b.	Logout (Session Timeout)
i.	Purpose: Automatically logs users out after inactivity.
ii.	Key Features: Session handling, warning prompt before logout.
c.	Registration (Optional)
i.	Purpose: For users not tied to university SSO, e.g., testing/demo mode.
ii.	Key Features: Basic sign-up form, email verification.
2.	Dashboard (Landing Page After Login)
a.	Student Dashboard
i.	Purpose: Overview of feedback received, pending tasks, and reminders.
ii.	Key Features: Summary cards, graphs showing performance trends, 'Give Feedback' button.
b.	Instructor Dashboard
i.	Purpose: Class-level summaries and analytics.
ii.	Key Features: Aggregated charts (no personal identifiers), 'Create Assignment' or 'View Reports.'
3.	Peer Feedback
a.	Give Feedback Page
i.	Purpose: Students complete peer evaluations.
ii.	Key Features: Select peer(s), fill out criteria (numeric + written), submit anonymously, progress bar.
b.	Feedback Guidelines Page
i.	Purpose: Help students write constructive feedback.
ii.	Key Features: Examples of good/bad feedback, tone suggestions.
c.	Feedback Confirmation Page
i.	Purpose: Displays after submission.
ii.	Key Features: Summary of submitted feedback, 'Return to Dashboard' option.
4.	Receiving & Viewing Feedback
a.	My Feedback Page
i.	Purpose: View feedback received (aggregated and anonymous).
ii.	Key Features: Filter by assignment/date, view average ratings, and read comments.
b.	Self-Assessment Page
i.	Purpose: Reflect on personal performance.
ii.	Key Features: Input self-evaluation scores/comments, compare with peer averages.
c.	Feedback History Page
i.	Purpose: Track growth over time.
ii.	Key Features: Timeline or trend graph, export (future enhancement).
5.	Instructor/Admin Tools
a.	Create Evaluation / Assignment Page
i.	Purpose: Define feedback sessions (criteria, due dates, participants).
ii.	Key Features: Form builder for custom rubrics, deadline settings.
b.	Manage Courses / Groups Page
i.	Purpose: Manage students, classes, and peer groups.
ii.	Key Features: Add/remove students, import class lists.
c.	View Aggregated Reports Page
i.	Purpose: View anonymized summaries of class performance.
ii.	Key Features: Charts and statistics, export CSV/PDF (future).
d.	Settings Page (Admin)
i.	Purpose: Adjust app-level options.
ii.	Key Features: Access control, criteria templates, policy text editing.
6.	Notifications
a.	Notifications Center
i.	Purpose: View reminders and alerts (new feedback, upcoming deadlines).
ii.	Key Features: In-app messages, mark-as-read, link to relevant pages.
7.	Account & Privacy
a.	Profile Page
i.	Purpose: Basic user info (non-identifiable in feedback).
ii.	Key Features: Edit profile picture (optional), manage notification preferences.
b.	Privacy Settings Page
i.	Purpose: Control over data retention and visibility.
ii.	Key Features: 'Delete My Account,' manage consent, data export.
8.	System & Legal
a.	About / Help Page
i.	Purpose: Explain purpose and how to use the app.
ii.	Key Features: FAQ, video walkthroughs, contact info.
b.	Terms of Use / Privacy Policy Page
i.	Purpose: Legal compliance (FERPA, GDPR, CCPA).
ii.	Key Features: Consent acknowledgement before first use.
c.	Accessibility Statement Page
i.	Purpose: Accessibility info per WCAG 2.1 AA compliance.
ii.	Key Features: Keyboard navigation guide, contact for assistance.
9.	Optional / Future Enhancements
a.	Mobile Feedback View — simplified layout for mobile users.
b.	Peer Matching Page — algorithmic or manual group formation.
c.	Reports Export Page — download individual or class summaries.
d.	Admin Analytics Dashboard — system-level usage and security logs.

