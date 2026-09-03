# Schemely Documentation

This folder contains the engineering/interview knowledge base for the Schemely AI system-design platform.

## Documents

- `SKEMLY_ENGINEERING_INTERVIEW_GUIDE.md` — architecture, frontend, backend, database, AI, parser, graph operations, performance, reliability, security, edge cases, and interview discussion map.

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
- autosave/reload works
- offline draft recovery works
- stale-version conflict works
- export works
- collaboration presence does not corrupt graph state

## Important remaining engineering checks

The latest commit materially improves the core, but the following should be treated as verification/hardening work rather than assumed complete:

1. Frontend and backend parser/operation implementations are mirrored and can drift; establish a deliberate shared-contract strategy.
2. Graph diffing currently relies heavily on node identity/label slug and endpoint-based edge identity; explicitly define semantics for ambiguous labels and parallel edges.
3. Validate operation batches before mutation and provide transactional/rollback behavior where an operation batch cannot be safely applied.
4. Add end-to-end prompt → AI → parse → diff → apply → save tests.
5. Run browser-level interaction tests for the real editor.
6. Run large-graph performance benchmarks.
7. Verify every API response type against the frontend service normalization/types.
8. Re-audit authorization on every diagram/workspace/project mutation route.
9. Confirm Docker startup does not rely on unnecessary repeated `npm install` work in production-oriented workflows.
10. Keep architecture documentation synchronized with implementation changes.
