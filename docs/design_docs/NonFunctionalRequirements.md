1. Introduction
1.1 Purpose

The purpose of this document is to define the non-functional requirements (NFRs) for the Peer Feedback App. These requirements describe quality attributes and constraints that determine how the system performs, rather than what it does.

1.2 Scope

The NFRs apply to the frontend, backend, database, and overall system architecture of the Peer Feedback App. They ensure the app is secure, scalable, reliable, and accessible to all intended users.

2. Non-Functional Requirements

2.1 Security & Privacy

    NFR-1.1: All communication between client and server shall use TLS (HTTPS) encryption.

    NFR-1.2: Sensitive data (feedback submissions, account info) shall be encrypted at rest in the database.

    NFR-1.3: The system shall comply with FERPA, GDPR, and CCPA for data handling.

    NFR-1.4: User accounts shall lock after 5 failed login attempts within 10 minutes.

    NFR-1.5: The system shall anonymize peer feedback to prevent identification of the submitter.

2.2 Usability

    NFR-2.1: The user interface shall be intuitive and require no more than 2 clicks to access core features (submit feedback, view dashboard).

    NFR-2.2: Users shall be able to learn how to use the app within 5 minutes without training.

    NFR-2.3: The app shall provide tooltips or inline guidance for new users.

    NFR-2.4: Error messages shall be clear, specific, and provide corrective guidance (e.g., “Please enter a valid email”).

2.3 Accessibility

    NFR-3.1: The system shall comply with WCAG 2.1 AA accessibility standards.

    NFR-3.2: The app shall provide alternative text for all images and icons.

    NFR-3.3: The system shall support screen readers (e.g., NVDA, JAWS).

    NFR-3.4: All features shall be accessible using only a keyboard (no mouse required).

    NFR-3.5: Color contrast shall meet accessibility guidelines for visually impaired users.

2.4 Maintainability

    NFR-4.1: The system codebase shall follow consistent coding standards (PEP 8 for Python, ESLint rules for React, etc).

    NFR-4.2: All major features shall include unit tests with at least 70% code coverage.

    NFR-4.3: The system shall use version control (Git/GitHub) with documented branching strategy.

2.5 Portability

    NFR-5.1: The frontend shall run on modern browsers (Chrome, Firefox, Edge, Safari).

    NFR-5.2: The app shall be responsive for use on desktop, tablet, and mobile devices.