# Schemely AI Dev Environment

## Server Startup

| Service  | Command       | Port | Directory                    |
|----------|---------------|------|------------------------------|
| Backend  | `npm run dev` | 5000 | `e:\Skemly-ai\apps\backend`  |
| Frontend | `npm run dev` | 5173 | `e:\Skemly-ai\apps\frontend` |

Always start backend before frontend (so the proxy works).

## Infrastructure

### MongoDB
- **Type**: Atlas cloud cluster — **no local install needed**
- URI is in `apps/backend/.env` as `MONGODB_URI`

### Redis
- Expected at `redis://localhost:6379`
- **NOT installed locally** — start via Docker:
  ```
  docker compose up redis -d
  ```
  (from `e:\Skemly-ai`, uses the existing `docker-compose.yml`)
- Backend has **graceful fallback mode** — if Redis is unavailable it logs a warning and continues running without caching. Nothing crashes.

### Docker
- Docker Desktop must be running
- `docker-compose.yml` at root defines: `mongo`, `redis`, `backend`, `frontend` services
- For local dev: only run `redis` (and optionally `mongo`) via docker; run backend+frontend natively

## Vite Proxy (Frontend → Backend)
```ts
// vite.config.ts
proxy: {
  '/api': { target: 'http://localhost:5000', changeOrigin: true },
  '/socket.io': { target: 'http://localhost:5000', ws: true, changeOrigin: true },
}
```
Frontend `axios` baseURL is `/api` — resolves to `http://localhost:5000/api` via the Vite proxy.

## Verifying Everything is Connected

```powershell
# Check Redis
docker ps  # should show skemly-ai-redis-1 Up

# Check backend
# Look for these lines in backend logs:
# ✅ MongoDB connected
# ✅ Redis connected successfully
# 🚀 Server running on http://localhost:5000

# Test API
try { Invoke-WebRequest -Uri "http://localhost:5000/api/v1/auth/me" -Headers @{Authorization="Bearer invalid"} } catch { $_.Exception.Response.StatusCode }
# Expected: Unauthorized (401)

# Run tests
cd e:\Skemly-ai\apps\backend && npm test -- --forceExit
# Expected: 7 passed
```

## Backend Routes
| Route prefix         | Controller           |
|----------------------|----------------------|
| `/api/v1/auth`       | auth.controller      |
| `/api/v1/workspaces` | workspace.controller |
| `/api/v1/diagrams`   | diagram.controller   |
| `/api/v1/ai`         | ai.controller        |
| `/api/v1/export`     | export.controller    |
| `/api/v1/billing`    | billing.controller   |
| `/api/v1/templates`  | template.controller  |
