# Schemely AI � Production-Grade Upgrade Plan

> Saved: 2026-08-28. Master implementation specification.

## Priority Order

### P0 � Reliability (START HERE)
1. repository inspection + baseline
2. test harness setup
3. Diagram IR (canonical typed model)
4. Schema validation (Zod)
5. Domain validation (graph invariants)
6. Deterministic repair engine
7. AI provider abstraction (GroqProvider / MockProvider)
8. AI structured output (JSON schema mode)
9. Preview/patch architecture
10. Save/conflict safety (optimistic concurrency)

### P1 � Architecture
11. Split DiagramCanvas.tsx (104KB -> modular)
12. Split PropertiesPanel.tsx (54KB)
13. Split ShapePalette.tsx (67KB)
14. Modular backend (feature folders)
15. Centralized API schemas/errors
16. Auth/authorization hardening
17. Idempotency (Idempotency-Key header)
18. Redis production strategy (Upstash)
19. Background jobs (export, AI heavy ops)
20. Export service refactor (43KB)

### P2 � Product Intelligence
21. System design review (SPOF, missing cache, etc.)
22. Requirements traceability
23. Architecture health dashboard
24. Tradeoff analysis
25. Interview mode
26. Multiple diagram views from one model
27. Contextual AI (selection-aware)
28. 20+ professional templates

### P3 � Scale / Polish
29. Collaboration (patch-based Socket.IO)
30. Offline drafts (IndexedDB)
31. Observability (OpenTelemetry)
32. Large graph mode (progressive rendering)
33. Mobile read-only
34. Visual regression tests
35. Performance/load tests
36. Progressive feature rollout (feature flags)

## Progress
- [x] P0-1: Repository inspection + baseline
- [x] P0-2: Test harness (Jest + ts-jest integrated, validation and repair test suites passing)
- [x] P0-3: Diagram IR
- [x] P0-4: Schema validation (domain/validateDiagram.ts)
- [x] P0-5: Domain validation (per-type validators)
- [x] P0-6: Deterministic repair (domain/repairDiagram.ts)
- [x] P0-7: AI provider abstraction (LLMProvider interface + registry)
- [x] P0-8: AI structured output (Groq JSON mode + validation loop)
- [x] P0-9: Preview/patch architecture (endpoints and controllers integrated)
- [x] P0-10: Save/conflict safety (optimistic concurrency version header)
- [x] P1-11: Split DiagramCanvas.tsx (FlowchartNode extracted, canvas reduced)
- [x] P1-12: Split PropertiesPanel.tsx (Common presets and inputs isolated)
- [x] P1-13: Split ShapePalette.tsx (Static metadata and icon mapping extracted)
- [x] P1-15: Centralized errors & request tracing (requestIdMiddleware and error contracts)
- [x] P1-16: Auth/authorization hardening (standardized FRONTEND_URL mail link fallback)
- [x] P1-17: Idempotency (x-request-id & Idempotency-Key support)
- [x] P1-18: Redis production strategy (non-blocking connectRedis failsafe)
- [x] P1-19: Background jobs (BullMQ job queues)
- [x] P1-20: Export service refactor (split 43KB file into S3Service, ExportRenderer, and ExportService)
- [x] P2-1: System design review integration (ArchitectureReviewModal wired)
- [x] P2-24: Tradeoff analysis (TradeoffAnalysisModal & tradeoffAnalysis endpoints wired)
- [x] P2-27: Contextual AI (selection-aware explain passing focus nodes)
- [x] P2-28: 20+ professional templates (built-in automatic database template seeder)
- [x] Billing reliability: remove frontend test-key fallback and enforce checkout/webhook signature verification
- [x] UI polish: restore Tailwind `max-w-*` sizing by moving app spacing tokens outside the `--spacing-*` namespace
- [x] UI polish: use native SVG motion for the landing architecture preview without invalid DOM-property warnings
- [x] UI polish: establish consistent responsive spacing, accessible focus states, reduced-motion behavior, and violet-accented shared controls
- [x] UI polish: refresh navigation, auth, dashboard, projects, templates, workspace, and settings page hierarchy
- [x] UI polish: keep dashboard/account routes usable on mobile while preserving the compact-screen editor guidance
- [x] UI polish: add a responsive diagram-start chooser with blank, prompt-led AI, and canonical-template paths while retaining query-driven creation links
- [x] UI polish: refresh the editor toolbar, canvas controls, palette, and panel framing without changing React Flow state/performance boundaries
- [x] AI safety UX: stage generated and improved syntax for review, and only mutate the diagram after an explicit apply action
- [x] Documentation UX: make the docs navigation responsive and align code examples/AI guidance with the editor's actual syntax and review flow
- [x] Shared diagram UX: keep the live/read-only status and controls usable at narrow viewport widths

## Core Principle
> The LLM is a planner/generator, not the source of truth.
> The application, schema, validators and persistence layer own correctness.

## Architecture Pipeline
`
User intent -> Intent extraction -> Diagram type selection
-> Typed Diagram IR -> LLM generation -> Schema validation
-> Graph validation -> Semantic validation -> Deterministic repair
-> Optional LLM repair -> Layout engine -> Preview/diff
-> User approval -> Persistent diagram document -> Version + audit event
`

## Mandatory Coding Rules (enforced throughout)
1. TypeScript strict mode
2. No any except documented integration boundaries
3. No new giant files (500-800 line max per component)
4. No controller business logic
5. No direct DB calls from UI
6. No LLM output directly persisted (always validate first)
7. No unvalidated user/object IDs
8. No silent destructive AI operations
9. No secrets in source
10. No tests depending on execution order
















