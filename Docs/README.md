# Schemely AI Documentation

This folder contains the engineering/interview knowledge base for the Schemely AI system-design platform.

## Documents

- `SCHEMELY_ENGINEERING_INTERVIEW_GUIDE.md` — architecture, frontend, backend, database, AI, parser, graph operations, performance, reliability, security, edge cases, and interview discussion map.

## Current repository baseline

Latest reviewed commit: `b7fb7250e89a246551332158963d5cbb45c3a4fa` — `update editor and operations`.

The immediately preceding product commits were:

1. `56396fa84c4247063d299fa8012b3aefc3ce0cb5` — `update landing and dashboard`
2. `7aef0277d60a3fbbe68bac8459bea0e310965068` — `complete ai parser and drawing tool improvements`
3. `3ef2fa2d6a2511b8b5cdb181dcd7d1f3c9d61e67` — `complete ai development`

## Verification note

GitHub inspection confirms the latest editor/operation changes and deterministic parser work. This environment can inspect and modify the public GitHub repository, but it cannot execute the repository's Docker containers, browser, frontend dev server, backend process, or local MongoDB/Redis runtime. Therefore runtime verification must be performed from a machine with the repository checked out and Docker/Node available.

## Recommended local verification

```bash
npm install
npm run build
npm test --workspaces
npm run services
npm run dev
```

For the complete stack:

```bash
docker compose up --build
```

Then verify:

- frontend: `http://localhost:5173`
- backend: `http://localhost:5000`
- MongoDB container is healthy/reachable
- Redis container is reachable
- login/dashboard flow works
- create diagram works
- prompt-generated diagram works
- drag/drop and connections work
- AI modification preserves manual positions
- undo/redo works
- offline recovery and persistence work
