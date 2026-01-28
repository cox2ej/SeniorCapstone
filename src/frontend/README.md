Explanation of frontend structure to be edited when implemented

# Frontend (React + Vite)

## Getting Started

```bash
cd src/frontend/react-app
npm install
npm run dev
```

## Environment Configuration

Vite only reads environment variables defined inside the `react-app` folder.

1. **Create `.env.local` (ignored by git) in `src/frontend/react-app/`:**
   ```
   VITE_API_BASE_URL=http://localhost:8000/api
   VITE_ENABLE_BACKEND=true
   ```
   - When `VITE_ENABLE_BACKEND` is `false` (default), the UI falls back to the mock store.
   - Set it to `true` while the Django server is running so API requests go to the backend.

2. Restart `npm run dev` (or rebuild) after changing any `VITE_*` variables so Vite picks them up.

## Feature Flags

- **Mock vs Backend:** The app uses feature-flagged hooks (e.g., `useAssignmentsData`) to switch between local mock data and the live API.
- **API Client:** All requests go through `src/api/client.js`, which respects the env vars above.

## Manual Integration Test (Assignments)
1. Start backend: `py manage.py runserver 0.0.0.0:8000` from `src/backend`.
2. Ensure `.env.local` has backend enabled.
3. Run the frontend dev server and open `/my-feedback`.
4. Post an assignment and confirm the Network tab shows `POST http://localhost:8000/api/assignments/`.