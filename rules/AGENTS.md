# Repository Guidelines

## Project Structure & Module Organization
This repository has a split frontend/backend layout.

- `frontend/`: Vite + React 19 + TypeScript app. Main code lives in `frontend/src/`, with pages in `src/views/`, reusable UI in `src/components/`, API clients in `src/api/`, and localization/runtime schema code in `src/i18n/` and `src/runtime-schema/`.
- `backend/`: FastAPI service. Core modules live in `backend/app/`, organized into `api/v1/`, `services/`, `agents/`, `models/`, `schemas/`, and `tasks/`.
- Root docs such as `README.md`, `DEPLOYMENT.md`, and `API_TEST_GUIDE.md` cover setup and manual verification.

## Build, Test, and Development Commands
- `cd frontend && npm install && npm run dev`: start the UI locally on port `3000`.
- `cd frontend && npm run build`: generate the production bundle in `frontend/dist/`.
- `cd frontend && npm run lint`: run the TypeScript check with `tsc --noEmit`.
- `cd backend && pip install -r requirements.txt`: install backend dependencies.
- `cd backend && python -m uvicorn app.main:app --reload`: start the FastAPI server with hot reload.
- `docker-compose up --build`: run the local full stack when Docker is preferred.

## Deployment Notes
- `frontend/` is deployed on Vercel. Keep frontend environment variables and API base URL changes compatible with Vercel project settings.
- `backend/` is deployed on Railway. Backend changes that affect startup, ports, migrations, or environment variables must stay aligned with `railway.toml`, `railway-start.sh`, and `backend/.env` expectations.
- When a change affects cross-origin requests or API routing, verify both the Vercel frontend configuration and the Railway backend CORS settings.

## Coding Style & Naming Conventions
- Frontend: use TypeScript, semicolons, and existing quote style in the touched file. Components and views use PascalCase, for example `ProjectsView.tsx`; helpers and state variables use camelCase.
- Backend: follow PEP 8 with 4-space indentation. Use snake_case for files, functions, and service modules.
- Keep API field names and route contracts stable across `frontend/src/api/` and `backend/app/api/v1/`.

## Testing Guidelines
There is no committed automated suite in the current tree, so contributors must do focused manual checks.

- Run `npm run lint` before submitting changes.
- Smoke-test affected frontend flows in the browser.
- Verify backend endpoints through `http://127.0.0.1:8000/api/docs`.
- When adding tests, place backend tests under a `tests/` package with `test_*.py`, and frontend tests as `*.test.ts` or `*.test.tsx`.

## Commit & Pull Request Guidelines
Recent history uses short subjects such as `Mars_design V1.5.3`, `Update config.py`, and brief one-line labels. Prefer concise, imperative commit titles scoped to one change.

- PRs should summarize user-visible impact and any API, schema, or config changes.
- Link the issue when available.
- Include screenshots for frontend changes.
- List the manual verification steps you ran for both `frontend/` and `backend/`.
- Call out any Vercel or Railway configuration changes explicitly in the PR description.

## Security & Configuration Tips
- Keep secrets in `backend/.env`; do not commit real API keys.
- Local development defaults to SQLite (`backend/mars_design.db`); treat that file as local state, not source of truth.
