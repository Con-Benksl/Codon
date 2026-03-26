# Repository Guidelines

## Project Structure & Module Organization
This repository is split into a Vite/React frontend and a FastAPI backend.

- `frontend/`: React 19 + TypeScript UI. Main code lives in `frontend/src/`, with feature views in `src/views/`, shared UI in `src/components/`, API helpers in `src/api/`, and locale/runtime schema support in `src/i18n/` and `src/runtime-schema/`.
- `backend/`: FastAPI service. Application code lives in `backend/app/`, organized into `api/v1/` routes, `services/`, `agents/`, `models/`, `schemas/`, and `tasks/`.
- Root docs such as `README.md`, `DEPLOYMENT.md`, and `API_TEST_GUIDE.md` describe setup, deployment, and manual API testing.

## Build, Test, and Development Commands
- `cd frontend && npm install && npm run dev`: start the frontend locally on port `3000`.
- `cd frontend && npm run build`: create a production bundle in `frontend/dist/`.
- `cd frontend && npm run lint`: run the TypeScript type check (`tsc --noEmit`).
- `cd backend && pip install -r requirements.txt`: install backend dependencies.
- `cd backend && python -m app.database`: initialize the local SQLite database.
- `cd backend && python -m uvicorn app.main:app --reload`: run the API with hot reload.
- `docker-compose up --build`: start the full local stack when Docker is preferred.

## Coding Style & Naming Conventions
Follow the existing style in each layer.

- Frontend: TypeScript, semicolons, double quotes in many files, PascalCase for components (`ProjectsView.tsx`), and camelCase for helpers/hooks.
- Backend: PEP 8 with 4-space indentation, snake_case for modules/functions, and typed Pydantic/SQLAlchemy models.
- Keep route/view names aligned across frontend and backend when adding new workflow steps.

## Testing Guidelines
There is no committed automated test suite yet. Until one is added:

- Run `npm run lint` before opening a PR.
- Smoke-test frontend flows at `http://localhost:3000`.
- Verify backend endpoints through `http://127.0.0.1:8000/api/docs`.
- Add new tests beside the code they cover when introducing a test framework; prefer `test_*.py` for backend and `*.test.ts(x)` for frontend.

## Commit & Pull Request Guidelines
Recent commits use short subjects such as `Mars_design V1.5.3` and occasional imperative fixes like `Update config.py`. Keep commit titles concise and scoped to one change.

- PRs should explain user-visible impact, config changes, and any database or API contract updates.
- Link the related issue when available.
- Include screenshots or short recordings for frontend changes.
- Note manual verification steps for both `frontend/` and `backend/`.

## Agent-Specific Instructions
- Default to Chinese for contributor, reviewer, and agent-facing communication in this repository unless a task explicitly requires another language.
- Keep code, commands, API fields, and file paths in their original language and format; translate explanations, summaries, and review notes into Chinese.
