# Schemely AI — Engineering, Architecture & Interview Guide

> Living engineering notes for the Schemely AI system-design platform.
>
> Last reviewed against commit `b7fb7250e89a246551332158963d5cbb45c3a4fa` (`update editor and operations`).

---

## 1. Product Mental Model

Schemely is an AI-native system-design IDE. The important distinction is that AI does not generate a disposable image. It generates and modifies a structured, validated diagram model that remains editable through both natural-language prompts and direct drag-and-drop interaction.

The core loop is:

```text
Natural-language prompt
        ↓
Intent classification
        ↓
AI context construction
        ↓
Model generation
        ↓
Syntax/IR sanitization
        ↓
Parsing
        ↓
Validation
        ↓
Bounded repair
        ↓
Graph diff / operations
        ↓
Incremental layout
        ↓
React Flow rendering
        ↓
Manual editing
        ↓
Persistence / collaboration
        ↓
Next AI refinement
```

The central engineering problem is therefore **bidirectional synchronization between human intent, AI output, a canonical graph representation, a textual DSL, and a persistent database representation**.

---

## 2. Current Technology Stack

### Frontend

- React + TypeScript
- Vite
- Tailwind CSS v4
- React Flow
- Zustand
- TanStack Query where applicable
- Monaco editor, lazy-loaded
- Lucide / React icon ecosystem
- Framer Motion / GSAP for selected UI motion
- IndexedDB for offline drafts
- Socket.IO client for presence/collaboration

### Backend

- Node.js
- Express
- TypeScript
- Socket.IO
- Mongoose
- MongoDB
- Redis
- AI provider integrations
- REST APIs

### Infrastructure/development

- Docker Compose
- MongoDB
- Redis
- frontend and backend containers/dev servers

---

# 3. Architecture

## 3.1 High-Level Flow

```text
Browser
  │
  ├── React UI
  │    ├── Dashboard
  │    ├── AI Composer
  │    └── Diagram Editor
  │          ├── DSL / Code editor
  │          ├── React Flow canvas
  │          ├── Properties / styles
  │          └── AI assistant
  │
  ├── REST API ───────────────→ Express
  │                              │
  │                              ├── Controllers
  │                              ├── Domain logic
  │                              ├── AI services
  │                              └── Mongoose
  │                                     │
  │                                     └── MongoDB
  │
  └── Socket.IO ──────────────→ Collaboration server

Express ──→ Redis/cache/queue where required
Express ──→ AI providers
```

### Interview angle

Be able to explain why the browser should not directly own persistence rules, why the backend must enforce workspace/diagram authorization, and why the graph domain should remain independent of React Flow.

---

# 4. Canonical Diagram Model

The diagram is fundamentally a graph:

```text
G = (V, E)
```

where:

- `V` = nodes/components
- `E` = directed relationships

A node contains semantic identity plus visual information:

- stable `id`
- label
- kind
- shape
- icon
- position
- dimensions
- style
- requirement references

An edge contains:

- stable `id`
- source
- target
- optional label
- visual type/style
- marker information

Viewport state is separate from semantic relationships.

### Why this matters

A diagram is not merely pixels. Once it is structured, Schemely can:

- validate it
- critique it
- modify it with AI
- diff it
- serialize it
- persist it
- export it
- preserve manual edits
- support undo/redo

---

# 5. DSL / Syntax Design

The current canonical syntax uses readable architecture notation such as:

```text
[Web Client] --> [API Gateway]
[API Gateway] --> [[PostgreSQL Database]]
[API Gateway] --> [Redis Cache]
{Is request valid?}
[Queue|shape:queue]
[Service|w:220,h:120,shape:rectangle]
```

The parser accepts AI output that may contain markdown fences or conversational text and sanitizes it before parsing.

### Design principle

The DSL should be:

- human-readable
- AI-friendly
- deterministic
- recoverable after malformed model output
- expressive enough for visual editing
- serializable without losing important information

---

# 6. Parser Architecture

The parser pipeline is conceptually:

```text
raw text
  ↓
sanitizeAISyntax
  ↓
extract node/edge tokens
  ↓
construct graph
  ↓
validateParsedGraph
  ↓
applySafeAutoLayout
```

Important parser responsibilities:

### Sanitization

Remove or ignore:

- markdown code fences
- Mermaid-style headers that are not part of the canonical DSL
- conversational preamble/postscript
- empty lines
- irrelevant text

### Node extraction

Support:

- explicit IDs
- bracket nodes
- decision nodes
- start/end nodes
- database notation
- shape attributes
- dimensions
- style attributes

### Edge extraction

Support normal, labelled and styled relationships where the DSL defines them.

### Validation

Reject or repair:

- empty graphs
- malformed nodes
- missing source/target
- dangling edges
- duplicate node IDs
- invalid coordinates

---

# 7. Deterministic Identity

This is one of the most important correctness properties.

A parser must not use random IDs for semantic entities.

Current deterministic examples:

```text
API Gateway        → api-gateway
Auth Service       → auth-service
PostgreSQL DB      → postgresql-db
```

Duplicate IDs are made deterministic:

```text
auth-service
auth-service-dup-1
auth-service-dup-2
```

### Why randomness is dangerous

If parsing the same AI response twice creates different IDs:

- graph diffing becomes unreliable
- React Flow keys change
- persistence can duplicate nodes
- collaboration becomes harder
- AI modifications can delete/recreate instead of update
- undo/redo becomes less trustworthy

### Interview angle

A strong answer should connect deterministic identity directly to reconciliation, database updates, caching, React rendering, and distributed collaboration.

---

# 8. Graph Validation

Validation is structural, not cosmetic.

At minimum check:

- graph exists
- nodes have IDs
- IDs are unique
- labels are valid
- positions are finite
- edges have source and target
- edge endpoints exist
- unsupported node kinds degrade safely

Validation should be idempotent where practical:

```text
validate(validate(graph)) ≈ validate(graph)
```

A validator should not silently invent large amounts of semantic information.

---

# 9. Repair Loop

AI output is untrusted structured input.

The repair process is bounded. The current direction uses a maximum of three repair iterations.

```text
AI output
   ↓
parse
   ↓
validate
   ├── valid → continue
   └── invalid
          ↓
      repair attempt
          ↓
       validate
          ↓
       max attempts
```

### Why bounded repair?

Without a bound, malformed output can cause:

- infinite loops
- runaway AI cost
- high latency
- repeated degradation

A bounded loop gives predictable failure behavior.

---

# 10. AI Intent Model

The assistant should distinguish read-only reasoning from mutation.

Core intents:

- CREATE
- MODIFY
- EXPLAIN
- CRITIQUE
- LAYOUT
- STYLE
- EXPORT

Examples:

```text
Create a URL shortener architecture → CREATE
Add Redis → MODIFY
Explain the database choice → EXPLAIN
Find scalability problems → CRITIQUE
Arrange the architecture cleanly → LAYOUT
Change the database style → STYLE
Export as SVG → EXPORT
```

### Critical rule

EXPLAIN and CRITIQUE must not silently mutate the graph.

This prevents an AI assistant from changing a user's architecture while they are only asking for information.

---

# 11. AI Context Construction

Do not blindly send the entire frontend state to the model.

Construct compact context from:

- current graph summary
- node identities/labels/kinds
- edges
- relevant requirements
- current DSL
- architecture critique
- recent conversation
- current user request

### Engineering tradeoff

More context can improve reasoning but increases:

- token cost
- latency
- prompt size
- exposure of unnecessary information

The goal is **sufficient context**, not maximum context.

---

# 12. Graph Operations

The latest work introduces a semantic operation model.

Operations include:

```text
ADD_NODE
REMOVE_NODE
UPDATE_NODE
MOVE_NODE
RESIZE_NODE
UPDATE_STYLE
ADD_EDGE
REMOVE_EDGE
UPDATE_EDGE
```

This is a major architectural direction because AI should ideally describe changes rather than replace the entire canvas.

### Example

User:

> Add Redis between API Gateway and User Service.

Desired conceptual operations:

```text
ADD_NODE(redis)
REMOVE_EDGE(gateway -> user-service)   [if replacement is requested]
ADD_EDGE(gateway -> redis)
ADD_EDGE(redis -> user-service)
```

Unrelated nodes and their coordinates remain untouched.

---

# 13. Graph Diffing

The current operation engine compares current and incoming graphs and tries to match nodes by:

1. stable ID
2. normalized label identity

This reduces destructive regeneration.

### Important edge case

Matching edges only by `source -> target` is not enough if the product supports multiple relationships between the same two nodes or relationship-specific labels/styles.

A future hardening pass should consider a semantic edge identity containing the relationship's meaningful attributes when required.

---

# 14. Manual Edit Preservation

One of Schemely's defining behaviors is:

> AI changes what the user asked to change, not everything around it.

If a user manually moves `Payment Service` to a custom location and then asks:

> Add Kafka before Payment Service.

the existing payment position should normally survive.

Likewise preserve:

- dimensions
- manual styles
- unrelated edges
- requirement references
- user-created nodes

unless the user's instruction explicitly requests their modification.

---

# 15. Layout Engineering

The layout system must solve two different problems.

### Initial layout

For newly generated diagrams:

- calculate graph hierarchy
- assign levels
- order nodes
- reduce crossings where practical
- account for node dimensions
- avoid overlap

### Incremental layout

For AI modifications:

- avoid moving the entire graph unnecessarily
- place newly added nodes around their semantic neighbors
- preserve manually positioned nodes
- reflow only affected regions where practical

### Cycle handling

Architecture graphs can legitimately contain cycles. Layout traversal must therefore have cycle guards and must never recursively walk forever.

---

# 16. Canvas Architecture

The editor is based on React Flow.

The canvas should own visual interaction, while domain functions should remain independent.

Recommended separation:

```text
DiagramCanvas
 ├── viewport
 ├── React Flow integration
 ├── selection
 ├── drag/drop
 ├── connections
 ├── keyboard interaction
 └── rendering

Domain
 ├── parser
 ├── serializer
 ├── validator
 ├── graph operations
 ├── critic
 └── layout

Infrastructure
 ├── API
 ├── persistence
 ├── Socket.IO
 └── offline storage
```

This separation makes the system easier to test without mounting the full canvas.

---

# 17. Undo / Redo

History should represent semantic user operations rather than pointer events.

For a drag:

```text
mouse down
 → many visual position updates
 → mouse up
 → ONE history entry
```

For an AI change:

```text
AI request
 → validated operation set
 → ONE logical history entry
```

This keeps history useful and avoids huge memory growth.

---

# 18. Persistence

The persistence architecture combines server state with local recovery.

Normal path:

```text
editor state
 → debounce
 → API update
 → version increment
```

Offline path:

```text
editor state
 → IndexedDB draft
 → reconnect
 → compare versions
 → resolve conflict
```

Before-unload flushing is a best-effort safety mechanism, not a guarantee.

---

# 19. Optimistic Concurrency

The backend uses version-aware updates.

Conceptually:

```text
client has version 7
        ↓
update where version = 7
        ↓
server currently version 8
        ↓
409 DIAGRAM_VERSION_CONFLICT
```

This prevents one client from blindly overwriting a newer version.

### Conflict options

The current UX supports:

- keep local changes
- load server changes

A local backup should be created before destructive resolution.

---

# 20. MongoDB Data Model

The Diagram document contains the persisted architecture and related metadata.

Important fields include:

- workspaceId
- projectId
- title
- type
- syntax
- nodes
- edges
- viewport
- requirements
- AI conversation
- version
- sharing metadata
- thumbnail
- trash state
- collaborators
- stars
- authorship
- nodeCount
- cycle warning
- syntax error
- presentation settings

### Why embed nodes and edges?

For the current product, a diagram is the natural aggregate boundary. Loading a diagram generally requires its graph as a unit.

Embedding avoids reconstructing a diagram from many node documents.

### Tradeoff

Very large diagrams make documents larger and updates more expensive. If the product eventually reaches extremely large graphs or needs fine-grained distributed edits, graph partitioning or operation/event storage can be evaluated.

Do not prematurely introduce that complexity.

---

# 21. MongoDB Indexing

Existing indexes are aimed at common access paths such as:

- workspace + trash state + recent update
- workspace + project + trash state
- public link token
- starred users
- creator + trash state
- auto-delete cleanup
- text search

### Interview question themes

Be ready to explain:

- why compound index order matters
- why indexes speed reads but cost writes/storage
- why a text index should exist only when the query pattern needs it
- why every common query should be checked against its actual filter/sort pattern
- why index design should follow measured access patterns

---

# 22. Workspace Isolation

A frontend can hide diagrams, but it cannot enforce security.

The backend must verify:

```text
authenticated user
        ↓
workspace membership / ownership
        ↓
project membership
        ↓
diagram access
        ↓
requested operation
```

Every diagram mutation should be authorization-aware.

This is especially important for:

- direct diagram IDs
- shared links
- collaborators
- project routes
- trash/restore
- duplicate
- star
- comments

---

# 23. Backend Layering

Prefer:

```text
Route
 ↓
Controller
 ↓
Service / domain logic
 ↓
Repository/model
 ↓
MongoDB
```

Controllers should translate HTTP requests into application operations rather than becoming the location for all business logic.

Domain functions should be reusable from tests and AI workflows.

---

# 24. Error Handling

A useful API error contains stable information such as:

- HTTP status
- machine-readable code
- human-readable message
- request ID
- optional safe metadata

Important categories:

- validation failure
- unauthorized
- forbidden
- not found
- conflict
- rate limit
- upstream AI failure
- database failure

Do not expose internal stack traces to clients.

---

# 25. AI Failure Modes

The AI system must assume failure is normal.

Potential failures:

- malformed syntax
- duplicate IDs
- missing edges
- hallucinated node references
- incomplete response
- provider timeout
- rate limit
- model refusal
- provider outage
- overly broad modification
- semantically incorrect architecture

The system should distinguish:

**syntactic validity** from **architectural correctness**.

A graph can parse perfectly and still be a bad architecture.

That is why the architecture critic exists.

---

# 26. Architecture Critic

The critic currently checks patterns including:

- direct client-to-database relationships
- unconsumed queues
- circular dependencies
- isolated components
- databases without meaningful relationships
- potential single points of failure in detectable graph patterns

It returns structured critique data containing severity, explanation, suggestion and affected nodes.

### Important limitation

Graph-only analysis cannot prove production architecture correctness.

For example, a graph cannot reliably know whether a service has three replicas unless replica information is represented in the model.

Therefore critiques should be expressed as:

- detected structural issue
- potential issue
- suggestion

rather than absolute claims when the model lacks evidence.

---

# 27. Architecture Quality Score

A quality score should be explainable.

Possible dimensions:

- connectivity
- dependency health
- queue correctness
- data-layer access
- cycle risk
- isolation
- complexity

The score should be derived from explicit rules and penalties rather than arbitrary numbers.

A user should be able to understand why a score changed.

---

# 28. Templates

Canonical templates are useful for both product UX and testing.

Examples represented in the current work include:

- e-commerce
- chat
- URL shortener
- payment

Templates should have one canonical syntax source where possible.

The same template should not be copied independently into landing page, dashboard, backend seed data and tests.

---

# 29. Thumbnail Architecture

Dashboard cards should not mount a full React Flow canvas for every diagram.

A lightweight thumbnail pipeline is preferable:

```text
graph
 → bounds
 → scale
 → simplified node/edge rendering
 → thumbnail
```

The renderer must handle:

- negative coordinates
- zero/empty bounds
- different node dimensions
- dark/light mode
- large diagrams

This keeps dashboard rendering cheap.

---

# 30. Frontend State Management

Use state according to ownership.

### Local React state

Use for temporary component state such as:

- open/closed dialog
- draft input
- transient UI state

### Zustand

Use for editor state that multiple parts of the editor need:

- selection
- save state
- AI state
- canvas settings
- layout state

### Server state

Use API/query abstractions for data that belongs to the backend:

- diagrams
- projects
- workspaces
- templates

Do not put everything into one global store.

---

# 31. React Performance

Important performance principles:

- keep canvas drag updates local/low-level
- avoid serializing DSL every pointer frame
- memoize expensive node rendering where useful
- use stable callbacks
- lazy-load Monaco
- do not render full React Flow thumbnails on dashboard cards
- avoid importing hundreds of unused icons
- avoid unnecessary global store subscriptions

### Performance reasoning

A diagram editor can easily produce dozens of updates per second during pointer movement. Expensive work such as serialization, persistence or architecture analysis should happen at semantic commit points rather than every frame.

---

# 32. Offline and Browser Persistence

IndexedDB is appropriate for larger structured drafts compared with relying entirely on localStorage.

Useful stored information:

- diagram graph
- syntax
- title
- viewport
- version metadata
- timestamps

BroadcastChannel can synchronize multiple tabs locally.

### Edge cases

- tab closes during save
- browser storage quota
- two tabs edit simultaneously
- server version advances while offline
- stale local draft is older than server state

These cases should be handled explicitly.

---

# 33. Socket.IO Collaboration

Socket.IO is currently used for presence/cursor collaboration.

Cursor data is ephemeral and should not be persisted like diagram state.

A good mental model is:

```text
persistent state → REST/database
transient presence → WebSocket
```

Remote updates should not accidentally become local undo history entries.

Reconnect logic should avoid replaying stale state over newer state.

---

# 34. Export System

The editor supports PNG/SVG/PDF-oriented export paths.

Export must calculate a content bounding box rather than assuming all nodes start at `(0,0)`.

Important cases:

- negative x/y positions
- large graphs
- selection-only export
- background modes
- node dimensions
- labels
- edge labels

SVG should remain vector where possible. Rasterization is more expensive for high-resolution PNG/PDF paths.

---

# 35. Security Review Topics

For interviews, think through:

- authentication vs authorization
- workspace isolation
- public-link security
- password hashing
- expiration
- rate limiting
- request IDs
- input validation
- prompt injection
- AI output sanitization
- XSS through diagram labels
- unsafe HTML/SVG export
- file/image validation
- sensitive logs

A diagram label is user/model-controlled data and must never become executable markup.

---

# 36. Testing Strategy

Testing should mirror architecture layers.

## Domain tests

- parser
- serializer
- validator
- repair
- intent
- critic
- graph diff
- operations
- templates

## Store tests

- create
- update
- conflict
- delete
- restore
- star

## API tests

- authorization
- validation
- conflict
- not found
- persistence

## Integration tests

Examples:

```text
prompt → graph
canvas edit → graph → save
AI modification → diff → merge
offline edit → reconnect → conflict
```

---

# 37. Edge-Case Catalogue

Use this list when debugging or preparing for interviews.

### Parser

- empty input
- only prose
- markdown fenced output
- missing closing bracket
- duplicate IDs
- labels containing punctuation
- unknown node kind
- duplicate edges
- dangling edges
- self loops
- cyclic graph
- extremely long label
- invalid dimensions

### AI

- provider timeout
- provider rate limit
- partial streaming response
- malformed response
- prompt injection inside labels
- request asks for impossible operation
- request refers to a nonexistent node
- request ambiguously matches multiple nodes

### Canvas

- 250+ nodes
- multi-select drag
- resize during selection
- delete node with many edges
- reconnect edge
- zoom extremes
- negative coordinates
- browser resize
- keyboard shortcut while typing

### Persistence

- network loss during save
- two tabs editing
- stale version
- browser close
- IndexedDB unavailable
- duplicate save request

### Database

- diagram not found
- unauthorized diagram ID
- trashed diagram access
- stale version update
- very large diagram document
- text search with empty query

---

# 38. Current Known Architectural Follow-Ups

The latest commit adds the graph-operation model and more deterministic parser behavior, but several areas deserve another engineering pass before calling the core platform finished.

## High priority

1. **Unify frontend and backend domain contracts.**
   They currently have mirrored parser/operation implementations. Mirroring can drift. Shared contracts or a carefully defined compatibility boundary should be considered.

2. **Harden graph diffing.**
   Current edge matching is primarily endpoint-based. Multiple relationships between the same endpoints, edge labels, styles and handles need explicit semantics.

3. **Validate operations before application.**
   Operation application should reject invalid dependencies rather than relying only on a final graph cleanup.

4. **Complete true incremental layout.**
   Initial layout is strong, but AI modification should minimize movement of unrelated user-positioned nodes.

5. **Finish large-component refactoring.**
   The editor canvas has been reduced, but it remains an important architectural hotspot. Keep visual React Flow concerns separate from domain logic.

6. **Strengthen end-to-end AI modification tests.**
   Unit tests prove pieces work. The most valuable next tests are complete prompt → operation → graph → persistence flows.

## Medium priority

7. Improve semantic node matching when labels are similar.
8. Add richer edge identity if the DSL supports parallel relationships.
9. Improve explainability of architecture score penalties.
10. Add large-graph performance benchmarks.
11. Add browser-level tests for drag/drop, AI modification and recovery.
12. Verify all frontend/backend response types remain aligned.

## Later

- worker-based large graph layout
- vector-native PDF pipeline
- richer collaboration conflict resolution
- storage quota UX
- advanced architecture metadata such as replicas, regions and protocols

Do not add these early unless product requirements justify them.

---

# 39. Interview Discussion Map

When someone asks about Schemely, think in these areas rather than memorizing isolated answers.

## Product architecture

- Why React Flow?
- Why a DSL?
- Why a graph IR?
- Why AI + visual editing instead of AI image generation?
- Why keep the backend authoritative?

## Frontend

- How do you prevent drag lag?
- How do you avoid unnecessary React renders?
- How do you manage global vs local state?
- How do you lazy-load Monaco?
- How do you render 250+ nodes?
- How do you preserve user changes during AI updates?

## Algorithms

- How does parsing work?
- How do you detect cycles?
- How does hierarchical layout work?
- How do you reduce edge crossings?
- How do you calculate bounding boxes?
- What is the complexity of your graph operations?

## AI systems

- How do you prevent malformed AI output?
- How do you detect intent?
- How do you preserve existing graph state?
- How do you avoid hallucinated relationships?
- Why is repair bounded?
- How do you evaluate AI reliability?

## Backend

- How is authorization enforced?
- How does optimistic concurrency work?
- How do you structure controllers/services/domain logic?
- How do you handle AI provider failure?
- How do you make updates idempotent?

## Database

- Why MongoDB?
- Why embed nodes and edges?
- Which indexes matter?
- What happens with very large diagrams?
- How would you scale reads?
- How would you migrate the schema?

## Distributed systems

- How does Socket.IO collaboration work?
- What is persisted vs ephemeral?
- What happens after reconnect?
- How do you resolve conflicts?
- How would you scale WebSocket rooms?

## Reliability

- How do you recover offline work?
- How do you handle stale versions?
- How do you test AI failure?
- How do you verify exports?
- How do you prevent data loss?

## Security

- How do you protect workspace data?
- How do you handle public links?
- How do you sanitize AI-generated labels?
- How do you prevent prompt injection from becoming executable behavior?

---

# 40. Example Interview Walkthrough

If asked:

> "Walk me through what happens when a user says: Add Redis between the API Gateway and User Service."

Think through the complete system:

```text
1. UI captures prompt.
2. Intent classifier identifies MODIFY.
3. Current graph + relevant context is prepared.
4. AI receives the request and architecture context.
5. AI produces a structured target/change description.
6. Output is sanitized.
7. Parser converts it into a graph representation if syntax is used.
8. Graph is validated.
9. Repair runs only if necessary and within a bounded limit.
10. Existing nodes are matched by stable identity/semantic label.
11. Graph diff produces semantic operations.
12. Operations are validated.
13. New Redis node and required edges are applied.
14. Existing manual positions/styles are preserved.
15. Affected region is laid out.
16. React Flow renders the result.
17. Graph becomes dirty.
18. Autosave persists it with version checking.
19. Backend rejects stale versions with a conflict response if necessary.
20. UI reports the actual change summary.
```

That is the core Schemely engineering story.

---

# 41. How to Explain the Main Design Decision

The strongest conceptual explanation is:

> "I did not want AI to generate a picture and stop there. I designed the product around a structured diagram intermediate representation. That gives me deterministic identity, validation, graph diffing, incremental AI modifications, manual-edit preservation, persistence, collaboration and export. React Flow is the visual projection of that model, not the model itself."

This explains why the architecture contains a parser, serializer, validator, operation engine and critic instead of one large AI-to-canvas function.

---

# 42. Engineering Principles Used

1. **Single source of truth** for diagram semantics.
2. **Deterministic identity** for reconciliation.
3. **Validate before mutate.**
4. **AI output is untrusted input.**
5. **Read-only AI should remain read-only.**
6. **Preserve explicit user intent.**
7. **Prefer semantic operations over full replacement.**
8. **Persist with optimistic concurrency.**
9. **Keep ephemeral collaboration data separate from durable state.**
10. **Measure before optimizing.**
11. **Avoid premature distributed complexity.**
12. **Keep frontend rendering concerns separate from domain algorithms.**

---

# 43. Practical Debugging Checklist

When a diagram is wrong:

```text
[ ] Was the AI intent classified correctly?
[ ] Was the AI context correct?
[ ] Was the response sanitized?
[ ] Did parsing create the expected nodes?
[ ] Are IDs deterministic?
[ ] Did validation remove something?
[ ] Did repair change the syntax?
[ ] Did graph diff match the correct existing nodes?
[ ] Did operations preserve manual state?
[ ] Did layout move unexpected nodes?
[ ] Did React Flow receive the expected graph?
[ ] Did autosave persist the same graph?
[ ] Did the backend accept the correct version?
[ ] Did reload reproduce the same graph?
```

This separates symptoms from root causes.

---

# 44. Current Status Note

This guide describes the architecture visible in the repository at the latest reviewed commit. It is intentionally a living document.

When implementation changes, update the relevant section rather than allowing documentation to describe an older system.

The most important future milestone is not adding more UI. It is making the full path:

```text
Prompt ↔ Graph ↔ DSL ↔ Persistence
```

fully deterministic, testable and recoverable.

Once that loop is strong, additional diagram types, richer architecture semantics, collaboration and advanced AI capabilities can be added without replacing the foundation.
