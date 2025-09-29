Project: Peer Feedback App
Team: Senior Design Team 32 – Ethan Cox, Advait Parab, Melanie Peck, Nathaniel Wisher
Date: September 2025

1. Introduction
1.1 Purpose

The purpose of this document is to define the functional requirements for the Peer Feedback App. These requirements describe the features, behaviors, and system interactions that must be implemented to meet project goals.

1.2 Scope

The Peer Feedback App will provide students with a structured, anonymous platform to exchange feedback with peers. The system will include user authentication, feedback submission, dashboards for tracking progress, notifications, and privacy/security mechanisms. Both web and mobile interfaces (responsive design) will be supported.

1.3 Intended Audience

Development team: For implementation guidance.

Instructors: To validate educational usefulness.

Students (end users): To confirm needs are met.

2. Overall Description

The system will consist of three main components:

Frontend (React): User-facing interface for students and instructors.

Backend (Django): Business logic, authentication, and APIs.

Database (PostgreSQL): Storage for users, feedback, and summaries.

The app emphasizes anonymity, usability, and compliance with FERPA, GDPR, and related privacy laws.

3. Functional Requirements
3.1 Authentication & User Accounts

    FR-1.1: The system shall allow users to log in using OAuth 2.0 via university accounts.

    FR-1.2: The system shall verify authentication before granting access to app features.

    FR-1.3: The system shall restrict access to authorized users only (students, instructors).

    FR-1.4: The system shall log users out automatically after a period of inactivity.

3.2 Feedback Submission

    FR-2.1: The system shall allow a student to submit peer feedback anonymously.

    FR-2.2: The system shall allow feedback to include:

    Numeric ratings (e.g., 1–5 scale).

Written comments.

    FR-2.3: The system shall anonymize submissions so the receiver cannot identify the sender.

    FR-2.4: The system shall validate that all required fields are completed before submission.     

    FR-2.5: The system shall allow customizable feedback criteria (defined by instructor/admin).

3.3 Feedback Dashboard

    FR-3.1: The system shall display aggregated peer feedback summaries in a dashboard.

    FR-3.2: The system shall allow users to view both numeric and written feedback.

    FR-3.3: The system shall display trends over time (e.g., performance improvement).

    FR-3.4: The system shall allow users to compare self-assessment with peer feedback.

    FR-3.5: The dashboard shall update automatically when new feedback is submitted.

3.4 Notifications & Reminders

    FR-4.1: The system shall send a reminder notification if a student has not submitted required feedback by the deadline.

    FR-4.2: The system shall notify a student when they have received new feedback.

    FR-4.3: Notifications shall appear in-app (and may expand to email/SMS in future).

3.5 Security & Privacy

    FR-5.1: The system shall encrypt all feedback data in transit (TLS) and at rest.

    FR-5.2: The system shall anonymize feedback by removing personally identifiable information.

    FR-5.3: The system shall comply with FERPA, GDPR, and CCPA requirements.

    FR-5.4: The system shall allow users to delete their account and associated feedback history.

    FR-5.5: The system shall log security-related events (e.g., failed logins).

3.6 System Administration (Instructor/Admin)

    FR-6.1: The system shall allow instructors/admins to configure evaluation criteria.

    FR-6.2: The system shall allow instructors/admins to view aggregated class-level feedback (no individual identifiers).

    FR-6.3: The system shall allow exporting of aggregated feedback in CSV/PDF format (future feature).