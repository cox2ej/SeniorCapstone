## Backend (Django + SQL Server)

### Prerequisites
- Python 3.13 (py launcher available)
- SQL Server instance or enable `USE_SQLITE_FOR_TESTS=True` in `.env`
- ODBC Driver 18 for SQL Server (or update `DB_DRIVER` in `.env`)

### Setup
1. `py -m pip install -r requirements.txt`
2. Copy `.env.example` → `.env` (already committed) and adjust values as needed.
3. Run migrations (SQLite fallback works for integration tests): `py manage.py migrate`

### Running locally
```bash
py manage.py runserver 0.0.0.0:8000
```
API base URL: `http://localhost:8000/api/`

### Apps & Endpoints
- `accounts`: custom `User` model, `/api/users/`
- `courses`: `/api/courses/`, `/api/assignments/`, `/api/enrollments/`
- `feedback`: `/api/feedback/`, `/api/self-assessments/`, `/api/analytics/`, `/api/assignment-reviewers/`

All endpoints use session auth for now; add DRF tokens/OAuth later.
