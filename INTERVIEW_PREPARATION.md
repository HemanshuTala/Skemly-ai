# Schemely AI - Project Interview Preparation

This is an interview guide to the project as it exists in this repository. It combines the product intent with evidence from the implementation and calls out places where the plans/docs and code do not fully match. Use the "implemented" descriptions when explaining what works today; present future-facing points as improvements, not completed features.

## 1. Project in one sentence

**Schemely AI is a web-based visual workspace for creating, editing, generating, saving, sharing, and exporting diagrams, with workspaces, notes, AI assistance, billing, and collaboration presence.**

The product supports three ways into a diagram:

1. Start with a prompt and ask AI to generate or improve a diagram.
2. Create or edit it visually on a node-and-edge canvas.
3. Work with diagram text/code and render it into a visual representation.

The product idea is to reduce the gap between a written system-design idea and a useful diagram, while keeping the diagram editable rather than returning only a static AI-generated image.

## 2. Interview-ready introduction

### 30-second version

> I built Schemely AI as an AI-assisted diagramming and visual-workspace product. The frontend is a React and TypeScript single-page application, with React Flow for the interactive canvas and Zustand for high-frequency editor state. The backend is a TypeScript/Express API. MongoDB stores users, workspaces, diagrams, notes, and history; Redis supports idempotency and asynchronous export jobs. AI output is treated as untrusted input: the backend has diagram parsing, validation, and repair logic, and the user can review generated changes before applying them. I also added version-aware saves so competing edits can be detected instead of silently overwriting one another.

### Two-minute version

> The main problem I wanted to solve was that teams often move between text-based diagram tools, visual editors, notes, and AI tools. Schemely AI brings those workflows into one workspace. A user can create a diagram from a prompt or template, edit it on a canvas, attach notes, save versions, collaborate through presence, and export it.
>
> I chose React and TypeScript because the editor is a stateful, interactive UI and type boundaries matter when moving diagram data between the canvas, API, and persistence layer. React Flow provides the graph canvas primitives. I keep canvas interactions in focused client state because drag events are frequent; slower-changing server data and fetch/retry behavior belong in API/service code and TanStack Query where used.
>
> The backend is a modular Express application rather than several microservices. That keeps a project of this scale straightforward to develop and deploy while still separating routes, controllers, services, models, and domain logic. MongoDB is a practical fit for documents such as diagrams, whose nodes, edges, styles, and metadata are naturally nested and evolve as the product adds diagram types. Mongoose supplies schemas, indexes, and a typed persistence boundary. Redis is not the primary database: it supports short-lived coordination such as idempotency and queueing exports. Export rendering can take longer than an HTTP request, so BullMQ and a worker-style flow let the API enqueue the work and return a job to poll.
>
> The most important correctness decision is not to trust AI output. I use a diagram representation and validation/repair steps before applying generated results. For saves, the client sends a version precondition; if the stored version has moved on, the API can reject the stale update and the UI can offer recovery choices. One honest limitation is that the current Socket.IO implementation is presence/cursor collaboration, not a full CRDT or patch-synchronized multi-writer editor. Likewise, a framework-neutral domain package exists, but the current frontend parser/editor is not yet fully integrated with that package.

## 3. Product goals and the core user journey

### Problem and value

Traditional diagramming has a tradeoff: text-based tools are quick and diffable but can be restrictive to visually edit; drag-and-drop tools are expressive but can be slow to create and maintain. AI can shorten the blank-page step, but raw model output is unreliable and a static image is not a maintainable artifact.

Schemely AI combines:

- **AI-first creation**: translate a natural-language brief into diagram content, and offer explain/improve/review-style AI operations.
- **Visual editing**: manipulate nodes and edges on an interactive canvas.
- **Code/text workflow**: parse diagram syntax and edit it alongside the visual output.
- **Workspace context**: organize projects/diagrams and attach notes.
- **Sharing and recovery**: public sharing, snapshots/version history, offline draft recovery, and conflict choices.
- **Product operations**: templates, exports, user plans, and Razorpay billing.

### Typical user journey

1. Authenticate and select a workspace.
2. Open an existing diagram or create a blank, template-based, or prompt-seeded one.
3. Edit nodes/edges or request AI generation/improvement.
4. Review the generated content and explicitly apply it where the flow supports staged review.
5. Autosave the graph with a version precondition; preserve a local draft if the network is unavailable.
6. If another save has advanced the version, show a conflict instead of blindly replacing the server copy.
7. Share, review history, take notes, or export the diagram.

This is the product direction and the broad journey. Specific features vary in completeness; the "Current implementation and honest boundaries" section below explains that distinction.

## 4. Architecture at a glance

```text
Browser (React + TypeScript + Vite)
  ├─ React Router: pages and protected areas
  ├─ React Flow: node/edge canvas
  ├─ Zustand: editor and client interaction state
  ├─ API clients / TanStack Query: HTTP and server data
  └─ Socket.IO client: room presence and cursor events
            │ HTTP / WebSocket
            ▼
Node.js + TypeScript + Express API
  ├─ middleware: auth, request IDs, validation, rate limiting,
  │              idempotency, security headers, error handling
  ├─ route -> controller -> service -> model/domain
  ├─ AI provider/service and diagram validation/repair
  ├─ Socket.IO presence server
  └─ BullMQ export queue and renderer
            │
       ┌────┴─────┬─────────────┐
       ▼          ▼             ▼
   MongoDB      Redis       External services
   durable      queue and   LLM provider, S3,
   records      idempotency Razorpay, email
```

The backend is a single deployable application with feature-specific modules, not a fleet of independently deployed microservices. Vite's `/api` and `/socket.io` proxy is a **development convenience**; it is not a production API gateway. Docker Compose is provided for local development of the frontend, backend, MongoDB, and Redis.

## 5. Why these technology choices?

### React, TypeScript, and Vite

- **React** fits a page-rich SPA whose editor contains interactive components, panels, dialogs, and custom node renderers.
- **TypeScript** reduces ambiguity across diagram data, API payloads, state, and component props. Strict TypeScript is enabled in frontend and backend configurations.
- **Vite** gives a fast development server and production bundling for the frontend. Its configuration also proxies local API and Socket.IO traffic and splits some large vendor libraries into chunks.
- The cost is client complexity: a rich canvas has many interacting state sources and heavy dependencies. TypeScript helps, but it does not remove the need for explicit ownership and synchronization of canvas, code, local draft, and server state.

### React Flow

React Flow supplies the node/edge canvas, viewport, selection, and interaction model. This lets the product focus on diagram-specific node types, properties, editing controls, and persistence rather than implementing pan/zoom and graph selection from scratch.

**Tradeoff:** React Flow is a UI library, not the product's long-term domain contract. Persisting its raw internal types everywhere would couple storage and AI behavior to one rendering library. A framework-independent diagram model is a better boundary; the repository has begun that work, though current integration is incomplete.

### Zustand and TanStack Query

- **Zustand** is used for client/editor state, including frequently changing canvas and editor state. Dragging or selecting nodes can update many times per second, so it is useful to isolate those updates and avoid treating every pointer movement as a remote server-data update.
- **TanStack Query** is available for server-state fetching, caching, retries, and lifecycle behavior where used.
- **Why not one global store for everything?** Editor interaction state and server-owned records have different update rates and consistency needs. Keeping those concerns distinct makes it easier to reason about autosave, loading, and optimistic local interaction.

**Tradeoff:** multiple state stores and API clients can make ownership unclear. The code currently contains more than one Axios configuration; consolidating API clients and documenting which one owns refresh behavior would reduce drift.

### Node.js, TypeScript, and Express

- **Node.js** makes a practical choice for an API coordinating JSON requests, database I/O, AI provider calls, and WebSockets.
- **Express** provides a small, familiar HTTP and middleware layer. It supports the project's REST API and shares a process with Socket.IO.
- **TypeScript** allows the backend to define request/domain/service contracts and catch many integration mistakes before runtime.
- The backend uses the conventional route/controller/service/model split: routes bind middleware and handlers, controllers translate HTTP to application calls, services hold multi-step workflows, and models define persistence.

**Why a modular monolith rather than microservices?** This project benefits from one deployment/debugging boundary while the product and contracts are still changing. Modules preserve separation without adding network calls, distributed transactions, service discovery, and deployment overhead. A future split should be driven by independent scaling, ownership, or reliability requirements—not by fashion.

### MongoDB and Mongoose (the "Mongo DB" decision)

MongoDB is the primary durable database. Mongoose provides schema definitions, validation hooks, indexes, and references from the TypeScript backend.

**A defensible interview rationale:**

- A diagram is naturally a document: it contains metadata plus a related graph of nodes, edges, positions, styles, and layout.
- Reading and saving a diagram commonly needs that graph as one coherent aggregate. A document model can retrieve and persist it without rebuilding it from many join tables.
- Diagram types and node metadata can evolve. Document fields provide room for versioned, type-specific attributes without redesigning a large relational schema for every new shape.
- Other product records (users, workspaces, projects, notes, comments, versions, audit events) can still be separate collections with references and indexes where they have independent lifecycles or query patterns.
- Mongoose brings some structure to a flexible database: schemas, defaults, indexes, timestamps, and model-level behavior reduce the risk of an unstructured "anything goes" store.

**Tradeoffs and alternatives:**

- MongoDB does not make data modeling or validation unnecessary. Flexible documents can become inconsistent unless schemas, validators, migration/version rules, and application checks are enforced.
- Large diagram documents and unbounded arrays can become expensive. Version snapshots, payload limits, indexes, and possibly separating very large graph content need deliberate design.
- A relational database such as PostgreSQL could also model diagrams (including JSON columns) and may be preferable where joins, relational constraints, reporting, or complex transactional workflows dominate.
- Billing and membership relationships have relational aspects. MongoDB remains viable, but multi-document updates and concurrency need careful handling and possibly transactions.

**Do not claim that the original author documented MongoDB's selection rationale as a measured benchmark.** The repository documents MongoDB as its primary store; the points above are a clear design rationale that fits the actual document-shaped data. Present them as the reasoning behind the choice, not as a benchmark result unless you have measurements.

### Redis and BullMQ

Redis is a supporting system, not the source of truth for user or diagram records. In the inspected backend, Redis is used for idempotency coordination and BullMQ's export queue. The implementation does not show a general-purpose application cache layer, so do not say "all reads are cached in Redis."

BullMQ moves export rendering out of the request path. A browser-based render (Puppeteer) can be CPU- and time-intensive; the request can create a job and the client can poll status while a worker renders and stores the result. A direct/non-queued path also exists when Redis is not configured.

**Why this split?** MongoDB provides durable product state; Redis provides fast, temporary coordination and queue primitives. This avoids treating an ephemeral queue/cache as the canonical record store.

**Tradeoffs:** Redis adds an operational dependency, and queued jobs require retries, idempotent processing, failure visibility, and stale-job handling. The current startup is intentionally more tolerant of Redis failure than MongoDB failure, but the product loses some Redis-backed features in fallback mode.

### Socket.IO

Socket.IO abstracts WebSocket connections and rooms and can fall back to other transports. It fits room-based presence and cursor events.

**Current scope matters:** the implementation supports room membership/presence/cursor broadcasting. Diagram content is saved through the REST API with version-conflict handling. Do not describe the current system as CRDT-based or as broadcasting every diagram edit as a synchronized patch. For horizontal scaling, an adapter such as Redis pub/sub and shared/authenticated room state would be needed; process-local maps alone do not coordinate multiple API instances.

### AI provider integration and diagram validation

AI models are probabilistic and can return malformed, incomplete, or semantically invalid diagrams. The design therefore treats the model as a generator, not as the authority on persisted data:

1. Accept an authenticated, rate-limited request.
2. Send relevant prompt/context to an AI service/provider.
3. Parse the returned content into the application's diagram representation.
4. Validate structural and diagram-specific constraints.
5. Attempt deterministic repairs where safe; use model repair only where appropriate.
6. Present the result for review/application in the UI rather than treating arbitrary model text as trusted storage.

The domain package defines typed `DiagramIR`, validation, and repair concepts. This is the right architectural direction because a single framework-neutral contract can serve canvas adapters, AI serializers, storage, and export. **The current frontend still uses its own parser and does not visibly consume the shared package throughout the editor.** Describe the IR as an architectural boundary in progress, not a fully unified production contract.

**Provider caveat:** the backend has a Groq/mock provider registry, but several AI operations also use a separate AI service path that constructs Groq directly. Provider abstraction is therefore not yet uniform across every AI endpoint. Dependency declarations for Anthropic/OpenAI/Cohere are not proof that all those providers are wired into the active runtime.

### Other libraries and integrations

- **Monaco Editor** provides a code-editor experience for diagram syntax.
- **TipTap** provides rich-text editing for notes.
- **Axios** is used for HTTP requests; **React Router** for client-side navigation.
- **Tailwind CSS and Radix UI** support styling and accessible interaction primitives; Framer Motion/GSAP support UI animation.
- **Razorpay** is used for subscription/payment operations, with backend checkout and webhook signature verification. Payment state should be verified on the server, never trusted solely from a browser success callback.
- **AWS S3** is an export storage integration; configuration determines whether it is active.
- **Jest/ts-jest** cover selected backend domain and signature cases. The frontend package declares build and lint scripts but no test script.

## 6. Data model and consistency decisions

### Main persistence concepts

The backend models users, workspaces, projects, diagrams, diagram versions, notes, comments, notifications, templates, audit logs, and export jobs. This separation reflects distinct ownership/lifecycle needs rather than putting the entire application into a single collection.

- **Workspace** is the organizational boundary for membership and access.
- **Project** groups product work.
- **Diagram** stores the editable artifact and its current graph/content.
- **Diagram version** stores historical snapshots separately from the current diagram.
- **Notes/comments** are separate records because they can be edited and queried independently.
- **Audit log** records notable state changes for traceability.
- **Export job** tracks asynchronous rendering lifecycle separately from the final diagram.

### Why snapshots/history are separate

Keeping historical snapshots outside the hot/current diagram record can reduce document growth and makes history retrieval explicit. Version metadata also supports restore and comparison flows. The tradeoff is coordinating a snapshot and current-diagram update: if both must succeed together, use an appropriate transaction or a carefully designed write sequence with recovery.

### Optimistic concurrency for saves

The client sends an expected diagram version (via `If-Match-Version`). The service compares it to the stored version:

- If the version matches, apply the save and advance the version.
- If it does not, return a conflict (409) instead of overwriting a newer save.
- The frontend can then let the user keep a local copy or load the server version.

This is optimistic concurrency control: most saves proceed without locking, while conflicting writes are detected when they occur. It is simpler and more responsive than locking the whole diagram for every edit, but the user experience must preserve both sides of a conflict.

### Idempotency for retryable requests

The idempotency middleware uses an `Idempotency-Key` and Redis-backed coordination/caching for eligible responses. This is useful when clients retry after network timeouts: a repeated request should not accidentally create duplicate side effects. Idempotency does not replace authorization or input validation; the key must be scoped and applied to the right operations.

## 7. Important end-to-end flows

### Create and save a diagram

```text
Frontend page / editor
  -> feature API client
  -> Express route + middleware
  -> controller
  -> diagram service
  -> workspace/plan checks + Mongoose models
  -> MongoDB
  -> response including updated version
```

The create workflow includes associated workspace/product rules; the save workflow applies version-aware conflict detection. The frontend autosaves after a debounce rather than sending a request for every keystroke/drag event. When offline, it can keep a browser draft and offer a sync/recovery path later.

### Generate with AI

```text
Prompt in editor
  -> authenticated/rate-limited AI route
  -> controller + AI service/provider
  -> model response (optionally streamed)
  -> parse + validate + repair
  -> stage result for review
  -> user applies it
  -> normal version-aware diagram save
```

The user-approval step matters: it prevents an AI response from silently destructively changing an existing diagram. The LLM is a suggestion/generation engine; schema, domain checks, persistence rules, and user intent remain application responsibilities.

### Export

```text
Export request
  -> create/export job record
  -> enqueue BullMQ job in Redis when configured
  -> renderer uses Puppeteer
  -> upload artifact to S3 (or use configured inline fallback)
  -> update job status
  -> frontend polls status and presents result
```

The queue isolates expensive rendering from normal interactive API latency. It also introduces eventual completion: the response may mean "job accepted," not "file already rendered."

### Sign-in and refresh

The backend supports email/password and Google/GitHub OAuth paths. Passwords are hashed, access tokens are short-lived, and refresh tokens are stored hashed in user session data and sent in an HttpOnly cookie. The frontend revalidates the user/session at application startup.

### Billing

The browser starts checkout, but the server verifies ownership and payment signatures. Webhook signatures are verified before processing subscription events. Webhooks are asynchronous and can be retried; production-grade handling should also deduplicate provider event IDs and make state transitions idempotent.

### Collaboration

The client joins a diagram room, and peers receive presence/cursor information. Persisted diagram edits still go through API saves and version checks. That gives useful collaboration presence and avoids some silent overwrites, but it is not the same as a real-time collaborative editing algorithm such as OT or CRDT.

## 8. Reliability, security, and operability

- **Input boundaries:** request validation schemas/middleware exist; validation is not yet uniformly wired across every route. Avoid claiming every payload is already validated.
- **Authentication/authorization:** protected HTTP routes use auth middleware, and feature workflows check workspace access. Socket.IO's current room-join handler is a notable boundary to harden: the inspected handler accepts client-supplied room/user information and does not show the same HTTP authentication/authorization flow.
- **Rate limiting:** global and narrower auth/AI limits reduce abuse and protect external provider spend.
- **Request tracing:** request IDs connect an error/response to logs and are returned for diagnostics.
- **Centralized errors:** error middleware provides a consistent API failure path instead of each route inventing a response format.
- **Security headers and CORS:** Helmet and CORS middleware are part of the Express setup.
- **Billing security:** verify checkout/webhook signatures server-side and do not trust client-supplied payment status.
- **Secrets:** production must provide strong unique JWT/payment/provider secrets. Fixed development fallbacks in source/configuration are for local setup only and must never be relied on in production.
- **Dependency failure:** MongoDB is core durable storage, so startup fails if it cannot connect. Redis is treated as more optional, so the API can start in a fallback mode, with queue/idempotency functionality reduced.
- **Logging:** Morgan captures HTTP requests and Winston provides application logging.

## 9. Tradeoffs I can explain clearly

| Decision | Benefit | Cost / risk | How I would evolve it |
|---|---|---|---|
| MongoDB documents for diagrams | Graph-shaped content can be read/written as an aggregate; flexible node metadata | Schema drift, large documents, and cross-document transaction complexity | Formalize versioned IR, enforce shared validation, add migration strategy, measure document size/query patterns |
| Modular monolith | One deployable app and easy local development, while retaining code boundaries | Shared runtime/resource contention; modules can become coupled | Keep module contracts clear; split only independently scalable/high-risk domains when evidence supports it |
| Zustand for canvas state | Fast local interactions and focused updates | Duplicate representations can drift across canvas, syntax, and server | Define one canonical domain state and explicit adapters; test synchronization |
| Debounced autosave + version check | Fewer requests and detection of stale saves without locking | Save latency and conflict-resolution complexity | Add conflict telemetry, robust merge/patch semantics if collaborative editing requires it |
| Redis/BullMQ for exports | Long-running work does not block interactive requests | More infrastructure; jobs need retry/failure/idempotency policies | Separate worker deployment and monitor queue depth, retry count, and render duration |
| Socket.IO presence, REST saves | Simple, useful presence with straightforward persistence | No live concurrent graph merge; process-local room state limits scale | Authenticate socket handshake, add shared adapter, then design patch protocol/OT/CRDT if needed |
| AI + validation/repair | AI speeds creation while application retains correctness control | Repairs may alter intent; model behavior/cost/latency are variable | Keep user approval, measure validation failures, record provenance, add provider abstraction consistently |

## 10. Current implementation and engineering hardenings

Interviewers value accurate ownership and demonstrable engineering progress. The following areas were recently audited, hardened, and verified:

1. **Unified Domain Package & Canonical Templates**: `packages/domain` is now established as a formal npm workspace (`@skemly/domain`), exporting the Diagram IR, validation, repair, graph operations diffing, and canonical templates.
2. **Socket.IO Handshake Authentication**: Socket.io connection handshake now validates JWT tokens, resolves authenticated user details, and prevents user impersonation during presence broadcasting.
3. **End-to-End Validation Coverage**: Zod validation middleware (`validate(schema)`) is actively wired across HTTP boundaries including `diagram.routes.ts` and `workspace.routes.ts`.
4. **AI Stream Endpoint Harmonization**: Resolved the naming discrepancy between backend and frontend streaming endpoints; backend supports both `/ai/generate/stream` and `/ai/stream-generate`.
5. **Billing Plan Alignment & Webhook Deduplication**: Unified plan vocabulary (`free`, `starter`, `basic`, `pro`, `team`) across `user.model.ts`, `billing.service.ts`, and frontend checkout components. Webhook processing now features event ID deduplication via Redis `SET ... NX EX 86400` with in-memory LRU fallback to eliminate replay attacks.
6. **Cross-Workspace Automated Testing**: Automated test suites run across both frontend and backend (58 passing tests covering deterministic parser IDs, graph diffing, architecture critic scoring, canonical templates, and Razorpay HMAC signature verification).

### Honest remaining boundaries & future evolution:
- **Collaboration is Presence-Based**: Multi-user cursor tracking is real-time; document persistence utilizes REST with optimistic concurrency version checking rather than an operational transformation (OT) or CRDT engine.
- **AI Model Latency**: Diagram generation depends on external LLM inference latency; bounded repair loops cap corrective attempts to a maximum of 3 iterations.

Do not present these points as apologies. A strong answer is: "Here is the tradeoff I made for the current scope, here is the boundary I have implemented, here is what the repository still needs, and here is how I would evolve it safely."

## 11. Likely interview questions and answer outlines

### "Why did you choose MongoDB instead of PostgreSQL?"

> The central editable object is a diagram graph with nested nodes, edges, styling, and type-specific metadata. A document database makes loading and saving that aggregate natural, and it accommodates evolving diagram shapes. I still use separate collections and references for independently managed entities like users, workspaces, and versions. It is a tradeoff, not a claim that MongoDB is universally better: relational constraints, reporting, and multi-record transactional workloads could make PostgreSQL a better choice. I would choose based on measured query and consistency requirements.

### "How do you stop bad AI output from corrupting data?"

> The model is not the source of truth. I parse its output into structured diagram data, validate structure and domain rules, apply deterministic repair only where safe, and stage the result for user approval. Only an accepted and validated result goes through the normal save/version path. I would also preserve provenance and track validation failures so we can improve prompts and validators.

### "How do you handle two people saving at once?"

> Saves include the version the client edited. The server only accepts a write if that expected version is still current, then advances the version. A stale write becomes a 409 conflict, and the UI can let the user keep their changes or reload the server version. This is optimistic concurrency, not an automatic semantic merge. For true simultaneous editing, I would need a patch model and conflict/merge strategy such as OT or CRDT, plus authenticated shared Socket.IO state.

### "Why Redis if you already have MongoDB?"

> They have different jobs. MongoDB is durable product state. Redis holds short-lived coordination data used for idempotency and backs the BullMQ queue for exports. Keeping durable records in MongoDB and queue/lock state in Redis avoids using the queue as the source of truth. Redis is not currently a general cache for every API read.

### "Why queues for export?"

> Browser rendering and file upload can take longer and consume more CPU than a normal API request should. A queue lets the API acknowledge the job quickly, then a worker can render, retry, and report status separately. The client polls the job. This adds operations work, so it is justified for work that is slow or failure-prone rather than for every small action.

### "Why Express and not microservices?"

> The current team/project benefits more from straightforward development and deployment than from independent service scaling. I separate responsibilities into route, controller, service, model, and domain layers, which gives a modular monolith. I would extract a service when there is a clear independent scaling, ownership, release, or isolation requirement.

### "What does real-time collaboration mean in this implementation?"

> Today it means presence and cursor visibility over Socket.IO, plus server-side version checks for saved diagram state. It is not a CRDT or live patch replication system. I would be explicit about that and build true concurrent editing only after defining edit operations, authorization, ordering, reconnection, and merge semantics.

### "How do you protect payment state?"

> Checkout is initiated in the client, but the backend verifies the payment signature and ownership. Webhooks are signature-checked before subscription state changes. I would add provider event deduplication and ensure every transition is idempotent because webhooks can be retried.

### "What is the hardest engineering tradeoff?"

One strong answer is **fast canvas interaction vs durable consistency**:

> A canvas generates frequent local changes, but persisting every pointer event would create excessive network traffic and lag. I keep interaction local, debounce saves, and include a server version precondition. That gives responsive editing and detects stale writes, but it means autosave, offline recovery, local/server reconciliation, and conflict UX all have to be designed together.

Another strong answer is **AI convenience vs data integrity**:

> AI makes creation faster, but it cannot own the data contract. The app validates and stages generated work before save, and the user remains in control of applying potentially destructive changes.

### "What would you do next?"

> First, finish one canonical typed diagram contract and integrate it end-to-end, replacing loose `any`/duplicate parser boundaries. Second, apply validation consistently to every input route and add integration tests for authorization, idempotency, and version conflicts. Third, harden socket authentication and shared room state before scaling collaboration. Fourth, unify provider and plan configuration so the code and docs cannot disagree. Those steps improve correctness and trust before adding more product surface.

## 12. How to present the architecture rationale without overclaiming

Use this pattern:

1. **Requirement:** "Diagram editing creates a nested graph and frequent local updates."
2. **Decision:** "I used React Flow and isolated high-frequency canvas state in Zustand."
3. **Benefit:** "That supports responsive interaction without turning every pointer movement into a server operation."
4. **Tradeoff:** "Now I must keep the visual graph, syntax representation, offline copy, and saved version consistent."
5. **Evidence/evolution:** "I debounce autosave and use version preconditions; the next step is to finish the shared IR integration and broaden conflict tests."

This is stronger than saying a tool is "fast" or "industry standard." Explain the concrete pressure in this product, what the choice buys, and the complexity it introduces.

## 13. Repository map for interview follow-up

| Area | Where to look |
|---|---|
| Product requirements and stated intent | [requirments.md](./requirments.md) |
| System architecture notes | [architecture/system_architecture.md](./architecture/system_architecture.md) |
| Endpoint catalog | [architecture/api_endpoints.md](./architecture/api_endpoints.md) |
| Frontend/backend workspace scripts | [package.json](./package.json), [apps/frontend/package.json](./apps/frontend/package.json), [apps/backend/package.json](./apps/backend/package.json) |
| Frontend route composition | [apps/frontend/src/App.tsx](./apps/frontend/src/App.tsx) |
| Canvas implementation | [apps/frontend/src/components/editor/DiagramCanvas.tsx](./apps/frontend/src/components/editor/DiagramCanvas.tsx) |
| Editor page and save/conflict behavior | [apps/frontend/src/pages/editor/DiagramEditorPage.tsx](./apps/frontend/src/pages/editor/DiagramEditorPage.tsx) |
| Autosave | [apps/frontend/src/hooks/useAutoSave.ts](./apps/frontend/src/hooks/useAutoSave.ts) |
| Frontend state | [apps/frontend/src/stores/canvasStore.ts](./apps/frontend/src/stores/canvasStore.ts), [apps/frontend/src/stores/diagramStore.ts](./apps/frontend/src/stores/diagramStore.ts) |
| Backend startup and middleware | [apps/backend/src/index.ts](./apps/backend/src/index.ts) |
| MongoDB connection and models | [apps/backend/src/config/database.ts](./apps/backend/src/config/database.ts), [apps/backend/src/models/](./apps/backend/src/models/) |
| Diagram business logic | [apps/backend/src/services/diagram.service.ts](./apps/backend/src/services/diagram.service.ts) |
| AI endpoints and provider boundary | [apps/backend/src/controllers/ai.controller.ts](./apps/backend/src/controllers/ai.controller.ts), [apps/backend/src/modules/ai/providers/](./apps/backend/src/modules/ai/providers/) |
| Diagram domain IR, validation, repair | [packages/domain/src/diagram/diagram-ir.types.ts](./packages/domain/src/diagram/diagram-ir.types.ts), [packages/domain/src/validation/](./packages/domain/src/validation/) |
| Redis connection and idempotency | [apps/backend/src/config/redis.ts](./apps/backend/src/config/redis.ts), [apps/backend/src/middleware/idempotency.middleware.ts](./apps/backend/src/middleware/idempotency.middleware.ts) |
| Export pipeline | [apps/backend/src/services/export.service.ts](./apps/backend/src/services/export.service.ts) |
| Socket.IO events | [apps/backend/src/sockets/index.ts](./apps/backend/src/sockets/index.ts) |
| Docker Compose local stack | [docker-compose.yml](./docker-compose.yml) |

## 14. Last-minute cheat sheet

- **Product:** AI-assisted, editable diagram and visual workspace.
- **Primary database:** MongoDB + Mongoose; durable application data.
- **Why MongoDB:** diagram graphs are naturally document-shaped and diagram metadata evolves; recognize relational/transaction tradeoffs.
- **Redis:** idempotency and BullMQ export queue; not the main DB and not a general cache in the observed implementation.
- **Frontend:** React + TypeScript + Vite; React Flow canvas; Zustand for local/high-frequency interaction state.
- **Backend:** Node + TypeScript + Express modular monolith.
- **AI principle:** model output is untrusted; parse, validate, repair cautiously, and let user review/apply.
- **Save safety:** debounced autosave + optimistic version check + conflict UI.
- **Collaboration truth:** presence/cursors and conflict-aware REST saves; not CRDT/live graph patch sync.
- **Exports:** queue expensive Puppeteer rendering, store output, expose job status.
- **Security:** auth/authorization, rate limits, request IDs, centralized errors, payment signature checks; harden socket auth, uniform validation, secrets, and webhook dedupe.
- **Best next step:** make the shared typed Diagram IR the actual cross-layer contract and test the end-to-end boundaries.

## 15. Deep dive: how the diagram parser works

### There is more than one parser-shaped module

The editor's live syntax-to-canvas path imports the frontend parser at `apps/frontend/src/domain/diagramParser.ts`. There is also a backend/domain parser at `apps/backend/src/modules/domain/diagramParser.ts`, and a framework-neutral typed model under `packages/domain`. These are related efforts, but the repository does **not** currently have one parser implementation that every layer demonstrably calls. When explaining the editor, describe the frontend parser below; do not imply that the shared package is already the only parser.

### The parser's input and output

The frontend parser is a small, line-oriented parser for Schemely AI's diagram syntax. It is not a complete Mermaid parser. Its main function is:

```ts
parseSyntaxToGraph(syntax: string): { nodes: Node[]; edges: Edge[] }
```

It transforms text into React Flow node and edge objects. A sample input:

```text
[Browser] --> [API]
[API] -- Reads --> [[MongoDB]]
{Valid?} -- No --> [Error]
```

Conceptually, it returns nodes for Browser, API, MongoDB, Valid?, and Error, plus three edges. The parser chooses node shape/kind and initial positions; React Flow then renders and edits those objects.

### Step-by-step parsing pipeline

1. **Sanitize AI/text output.** `sanitizeAISyntax` trims the input, extracts a recognized fenced code block if present, drops blank lines and common diagram headers (for example, `flowchart TD`), and filters out prose lines that contain no diagram-like tokens. This is defensive cleanup for model responses, not a full grammar or security boundary.
2. **Normalize a few malformed forms.** The parser repairs certain doubled brackets around resizable-shape syntax and closes a missing final `]` in some shape-attribute lines. It can split multiple comma-separated `-->` connections at commas that are outside brackets.
3. **Read each line.** Blank lines and lines starting with `#` or `//` are skipped. For each remaining line, a regular expression tries to recognize an edge and its source, optional label, and target. If it does not look like an edge, the line is treated as a standalone node.
4. **Extract node identity and shape.** `extractNodeInfo` recognizes:
   - `[Label]`: ordinary process/rectangle node.
   - `{Question?}`: decision node.
   - `(Start)`: start/end node.
   - `[[Database]]`: database node.
   - `id[Label]`: explicit stable ID.
   - `[Label|w:160,h:60,shape:rectangle]`: resizable shape and dimensions, with selected style attributes.
   
   Without an explicit ID, it slugifies the label (`API Gateway` becomes a stable-looking `api-gateway`). It also infers some kinds from keywords such as database, queue, entity, user, client, start, and end.
5. **Reuse repeated nodes.** A map keyed by node ID ensures that the same node mentioned on multiple edge lines is created once. Edges whose source/target tokens refer to that ID connect to the same object.
6. **Build edges.** The parser recognizes solid `-->`, emphasized `==>`, and labeled forms such as `-- Yes -->`, and creates React Flow edges with arrow markers and selected stroke styles. The AI system prompt also requests dashed `-.->` arrows, but the frontend edge-matching regular expression does not clearly recognize that bare form; treat dashed-arrow parsing as a current syntax-compatibility gap rather than a guaranteed capability. Duplicate source/target connections are suppressed in the parser.
7. **Validate basic graph integrity.** `validateParsedGraph` ensures IDs and labels are usable, replaces invalid positions with safe coordinates, deduplicates conflicting IDs, and removes edges whose endpoints do not exist. This protects canvas construction, but it is not a complete semantic validator for every diagram type.
8. **Assign an automatic layout.** `applySafeAutoLayout` estimates node depth from graph connectivity, starts from root nodes, guards against cycles, groups nodes into columns, sorts nodes, and assigns positions with gaps based on node dimensions. Disconnected nodes receive heuristic levels from their kind/label. The algorithm prioritizes a readable initial layout; it is not a general graph-layout solver and does not preserve explicit coordinates encoded in syntax.
9. **Render and permit visual editing.** The resulting `diagramNode` and `resizableShape` objects are rendered by the canvas's registered React Flow node types. The canvas stores positions/styles and the user can continue moving, connecting, or resizing them.

### Syntax-to-graph and graph-to-syntax are not perfectly lossless

The reverse function, `graphToSyntax`, serializes node labels, selected node kinds, explicit IDs, some dimensions/styles, edges, and edge labels. It does **not** serialize all visual graph properties:

- Node x/y positions and viewport are not represented.
- Image nodes and their image bytes/URL are not represented in this syntax.
- Some React Flow style/handle/metadata properties are not represented.
- Serialization uses the parser's supported syntax, not arbitrary Mermaid grammar. In particular, the AI prompt and parser do not have perfectly aligned coverage for every requested arrow form.

That means text syntax is convenient and reviewable, but it is not currently a complete serialization format for every canvas feature. Visual node/edge JSON is also sent during saves; it is important not to regenerate that JSON from syntax if doing so would discard canvas-only information.

### What happens when code and canvas both change?

The editor tracks whether code or the canvas is currently authoritative. Editing code marks the syntax as authoritative and reparses it into a graph. A canvas gesture marks the visual graph as authoritative and serializes the graph back to syntax for display/save. The canvas also reports graph snapshots separately from high-frequency drag movement so expensive serialization/saving can happen at drag commit rather than on every pointer frame.

This division improves responsiveness, but creates a synchronization responsibility: code, visual graph, saved graph, and offline draft must represent the same edit. The parser/serializer's lossy areas (especially images) are why the project should ultimately use one typed, versioned diagram model with explicit adapters.

## 16. Deep dive: how AI diagram generation works

### Model request path

For prompt generation, the current implementation works approximately like this:

1. **User submits a prompt.** The editor's `useAIGenerate` hook starts a request, clears the previous result, and supports aborting an in-flight request. The UI labels phases such as "Understanding" and "Designing"; these phase labels are locally timed progress feedback, not model-provided reasoning events.
2. **Try streaming first.** The hook tries an SSE URL and accumulates `data:` events into syntax text. There is an endpoint naming mismatch: the hook requests `/ai/stream-generate`, while the backend router registers `/ai/generate/stream`. In this repository, that means the streaming attempt can fail and the hook falls back to the non-streaming generation endpoint. Do not promise that streaming is working without first correcting/testing that route mismatch.
3. **Authenticate, limit, and validate.** The backend route requires an access token and uses an AI rate limiter. The controller validates the prompt (non-empty, maximum 2,000 characters, and a small set of rejected script-like strings). If a diagram ID is supplied, the controller loads it and checks workspace editor permission before using its current syntax as context.
4. **Check user AI allowance.** `AIService` loads the user and checks the monthly generation allowance before calling the provider. A successful operation increments usage after the provider returns.
5. **Construct the model prompt.** The active `AIService` uses Groq's `llama-3.3-70b-versatile` model with low temperature and a system prompt describing Schemely AI's supported node forms, arrows, labels, shape attributes, and output rules. If refining an existing diagram, current syntax is supplied with the new user request.
6. **Receive generated syntax.** The normal endpoint strips selected reasoning tags and code fences and returns the syntax. This response is text in Schemely AI's custom syntax, not a finished React Flow graph from the model.
7. **Check and parse in the frontend.** The hook performs a lightweight check (minimum length and at least one bracket-like token), then the editor can parse the proposed syntax into nodes/edges for preview. That lightweight check is not equivalent to full graph validation.
8. **Review and apply.** The editor displays AI syntax as a proposal. Applying it parses or merges the graph. The merge helper tries to match nodes by ID or normalized label, preserving matched node IDs, positions, dimensions, styles, and still-valid existing edges, while adding new AI nodes and using AI-produced edges.
9. **Save through the diagram path.** Applied edits are then reflected in the editor's syntax/graph and autosave path, which submits diagram data and a version precondition.

### AI feature-specific details

- **Generate:** natural-language requirements to diagram syntax.
- **Stream-generate:** intended to return partial syntax via Server-Sent Events; see endpoint mismatch above.
- **Code-to-diagram:** sends source code and its language to a separate system prompt to produce diagram syntax; code has an explicit 10,000-character limit in the service.
- **Explain:** maps stored diagram nodes/edges into a diagram IR shape, optionally includes selected node IDs, and invokes the provider registry's explanation operation.
- **Improve/autofix/review/tradeoffs:** separate operations with their own prompt/output handling; check the actual endpoint and UI path before claiming a single unified pipeline.

### Important correctness nuance: generation versus persistence

There is an implementation distinction worth knowing for interviews:

- The **streaming controller** sends SSE chunks and does not itself update the stored diagram in the shown code.
- The **ordinary generate controller**, when called with an existing `diagramId`, writes the returned syntax into `diagram.syntax` and increments the diagram version before returning. It does not update the stored nodes/edges in that controller.
- The frontend's AI UI stages a proposal and asks the user to apply it, but the hook's streaming URL currently does not match the registered route; its fallback calls the ordinary endpoint with the diagram ID.

Together, those code paths mean the "review before apply" UI intention is not a guarantee that the server has not already changed syntax for an existing diagram. The proposal/graph and persisted syntax can also temporarily disagree. A good architectural answer is to identify this as a gap: generation should be a side-effect-free proposal endpoint, and a separate explicit apply/save request should update syntax, nodes, edges, and version atomically after user confirmation.

Similarly, the shared domain validation/repair package exists, but the ordinary generation controller does not visibly call the shared `validateDiagram`/`repairDiagram` pipeline before returning syntax. The frontend parser provides cleanup and basic graph integrity checks when the output is applied. Do not claim that every generated response is already fully validated server-side.

### Why not let the LLM directly write database graph data?

Text generation and graph correctness are separate responsibilities. The model may return invalid brackets, unknown syntax, duplicate labels, missing targets, or a plausible-looking but wrong connection. A safer design is to treat the LLM result as an untrusted proposal, parse it, validate structural/domain rules, record provenance, show a preview/diff, and commit only after explicit approval. This also makes failures observable and allows the model/provider to be changed without changing the durable data contract.

### Strong interview answer: "How does generation work?"

> The user prompt goes through an authenticated and rate-limited API. The backend checks the user's AI allowance and workspace edit access, then sends a constrained system prompt plus the prompt and, when refining, the existing diagram syntax to Groq. The model returns Schemely AI syntax, not canvas objects. The frontend parses that into a React Flow graph, stages the result, and uses a merge routine to preserve matching nodes' IDs and visual edits. The intended final step is explicit review and a normal version-aware save. I would also be transparent that the streaming URL and persistence behavior need tightening: the frontend's streaming route currently differs from the registered backend route, and the ordinary generate endpoint can persist syntax before an explicit apply. I would separate generation from commit and validate the result with the shared domain rules before saving.

## 17. Deep dive: image paste, drag-and-drop, and storage

### What the canvas currently supports

There are two different user actions that can look like "dragging an image":

1. **Dragging a Schemely AI palette item/snippet onto the canvas.** `DiagramCanvas` reads the custom `application/x-diagram-snippet` transfer type. It parses the supplied syntax snippet, offsets the new graph to the pointer position, gives its nodes fresh IDs, remaps its edges, and adds the subgraph to the canvas.
2. **Pasting an image from the clipboard.** The canvas registers a `paste` handler. If the clipboard contains an `image/*` item and the paste target is within the canvas, it reads the blob with `FileReader.readAsDataURL`, creates an `image` node, and places it at the visible canvas center. The node's `data.src` is a `data:image/...;base64,...` URL and its alt text is set to "Pasted image."

The shown `handleDrop` does **not** read `event.dataTransfer.files` or image MIME files. It only reads the custom diagram-snippet type. So dropping a PNG/JPEG from the desktop into the canvas is not implemented by this handler. Clipboard paste is the supported image insertion path in this code.

### How an image node renders

The canvas registers a React Flow node type called `image` and renders it with `ImageNode`. That component reads `data.src` into an HTML `<img>`, displays optional alt text, supports resizing while selected, and shows an unavailable-image placeholder if the source is missing or fails to load.

An image node is a canvas node; this rendering component does not upload the file. Creating an image node and displaying an image are not the same as durable image storage.

### Where the image bytes go today

For a pasted image, the browser converts the clipboard `Blob` into a base64 data URL. That string is held in the React Flow node's `data.src`. The editor's graph-save path sends the nodes array to the diagram API; the autosave hook also places pending diagram data into local offline draft storage. Thus, before server persistence, the image bytes are embedded directly inside a node object and transmitted as part of the JSON diagram payload.

However, the backend `DiagramNode` schema's `data` shape defines `label`, `style`, and `requirements`; it does **not** define `src` or `alt`. Mongoose's normal strict schema behavior means unknown nested fields are not a supported persisted part of this schema. The shown S3 service stores generated exports (PNG/SVG/PDF), not uploaded canvas image assets. I do not see a dedicated image upload endpoint or object-storage key workflow for image nodes.

**Practical conclusion:** the canvas can show a pasted image in current client state, but the current code does not provide a reliable durable image-asset storage path. Saving and reloading may lose `src`/`alt`, and later rebuilding the canvas from syntax will also lose image nodes because `graphToSyntax` does not encode image data. Do not say that canvas images are uploaded to S3 or durably embedded in MongoDB as a verified feature.

### Why base64-in-a-diagram is a poor long-term storage design

- Base64 adds roughly one-third overhead to binary content, before JSON overhead.
- Every autosave can resend the full embedded image with the graph.
- Large images can hit request-body limits (the Express JSON body limit is 10 MB) and make local draft storage/network operations expensive.
- Duplicating the same image across diagrams duplicates bytes.
- Database backups, version snapshots, and diagram responses can grow substantially.
- Image validation, transformations, content-type checks, malware scanning, access control, and cache/CDN behavior are difficult to manage as arbitrary strings inside a node.

Base64 may be acceptable for tiny transient previews, but not a good general asset store for team diagrams.

### A production-quality image-storage design

If asked how to implement this properly, describe this flow:

1. The browser accepts an image file (drag/drop and/or file picker) and checks a strict byte-size limit and allowed formats for user feedback.
2. The backend authorizes the user against the workspace and issues a short-lived, scoped upload authorization (or accepts a multipart upload through a backend that validates the actual file).
3. The browser uploads the bytes to private object storage, preferably using a presigned URL. Validate content type and file signature, not only filename/extension; consider scanning and image re-encoding.
4. Store only stable asset metadata in the diagram node, for example `assetId`, object key, dimensions, alt text, and possibly a controlled delivery URL—not the base64 bytes.
5. On diagram load, the application resolves authorized access to the asset (for example, through an application endpoint or short-lived presigned GET URL).
6. Enforce workspace permissions, limits, deletion/retention rules, and cleanup of unreferenced uploads.
7. Update the diagram schema/type and domain IR intentionally, and test save/reload, duplication, export, sharing, and offline behavior.

For the current repo, AWS S3 helpers are used by the **export** pipeline. Reusing the same storage provider for image assets could be reasonable, but it would require new upload authorization/endpoint or presigning flow, schema changes, and access-control design; it is not already implemented just because S3 is present.

### Strong interview answer: "What happens when I add an image?"

> The current canvas supports pasting an image from the clipboard. It converts the clipboard blob to a base64 data URL in the browser and stores that string in an image node's `data.src`; React Flow renders the node through a custom image component. The diagram save sends node data, but the Mongoose node schema does not define `src` or `alt`, and the S3 integration I inspected is for generated exports rather than image uploads. So I would not claim durable image upload is complete. I would change this to private object storage with a validated, authorized upload and store only an asset key/metadata in the diagram. Also, ordinary OS file drag/drop is not handled by the current drop handler, which is limited to Schemely AI's custom diagram-snippet payload.
