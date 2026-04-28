# Contributing

Thanks for contributing to Codon. This project is a full-stack educational
prototype for extreme-environment synthetic biology concept design.

## Development Setup

### Backend

```bash
cd backend
uv venv venv --python python3.12
uv pip install -r requirements.txt --python venv/bin/python
cp .env.example .env
venv/bin/python -m uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Verification

Run the checks that match your change:

```bash
cd frontend && npm run lint
cd frontend && npm run build
cd backend && venv/bin/python -c "from app.main import app; print(app.title)"
```

For API changes, also check `http://127.0.0.1:8000/api/docs` locally and run a
small smoke test covering registration, login, Designer preset loading, session
creation, and the changed endpoint.

## Security and Secrets

Do not commit real credentials, database URLs, API keys, generated `.env` files,
local SQLite databases, virtual environments, dependency folders, or build
outputs. Use the checked-in `.env.example` files as templates only.

## Biological Safety Scope

Codon output is concept design and teaching-grade simulation. Do not use it as
wet-lab protocol, release guidance, clinical guidance, biosafety approval
material, or production engineering authority.
