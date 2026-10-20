# Schemely AI System Architecture & Design Decisions

This document details the architecture, data models, integration layers, and critical design decisions of the Schemely AI platform.

---

## 1. System Overview & Architecture Topology

Schemely AI is a collaborative, AI-assisted diagramming platform that translates architectural concepts into visual system topologies (flowcharts, sequence diagrams, mindmaps, ERDs, and network diagrams). It features real-time cursor presence, automated diagram correction/repair, and a node-based editor canvas.

```mermaid
graph TD
    subgraph Client Layer (Vite + React)
        Canvas[React Flow Workspace]
        Zustand[Zustand State Store]
        SocketIO_Client[Socket.IO Client]
    end

    subgraph API & Gateway Layer
        ViteProxy[Vite Dev Proxy]
        Express[Express REST Server]
        SocketIO_Server[Socket.IO Server]
    end

    subgraph Cache & Database Layer
        MongoDB[(MongoDB Atlas)]
        Redis[(Redis Cache & Queue)]
    end

    subgraph AI & Services Layer
        LLM[Groq / OpenAI Providers]
        Storage[AWS S3 Export Bucket]
        Razorpay[Razorpay Payment API]
    end

    Canvas --> Zustand
    SocketIO_Client <-->|WebSocket proxy| SocketIO_Server
    Canvas -->|REST API| ViteProxy
    ViteProxy --> Express
    Express --> MongoDB
    Express --> Redis
    Express --> LLM
    Express --> Storage
    Express --> Razorpay
```

---

## 2. Frontend Architecture & Design Decisions

The frontend is a React application built with TypeScript and Vite. It is designed to run in a single-page app framework, emphasizing visual quality, smoothness, and lightweight operations.

### Key Technologies
*   **Vite**: Dev server, compiler, and build bundler. Configured with a socket proxy to seamlessly route `/api` and `/socket.io` calls to the Express backend.
*   **React Flow**: Renders the infinite zoom-and-pan diagram canvas. Supports custom-defined drag-align nodes (e.g. sequence nodes, flow diagram rectangles, databases, groups).
*   **Zustand**: Handles low-latency state updates (like dragging nodes, changing color styling, adding text coordinates) outside the React render loop to avoid performance lag.
*   **Tailwind CSS v4 & Custom Themes**: Implements a curated premium dark palette (using custom properties like `--color-canvas: #09090b` and `--color-surface: #27272a`). Features custom overlays and border gradients.
*   **GSAP & Framer Motion**: Power UI transitions, dashboard slide-ins, and magnetic button feedback to make the app feel tactile.

---

## 3. Backend Architecture & Design Decisions

The backend is built as a REST API on Node.js using Express. It coordinates operations, manages workspace memberships, handles billing, and executes diagram validations.

### Core Modules
*   **Controllers (`apps/backend/src/controllers/`)**: Separate routing responsibilities for User auth, Workspaces, Projects, Notes, Comments, AI tasks, and Razorpay subscriptions.
*   **Optimistic Concurrency Control**:
    *   To prevent multi-user overrides, `updateDiagram` matches the incoming header `If-Match-Version` with the database state. If they do not match, the server returns a `409 DIAGRAM_VERSION_CONFLICT`.
*   **Centralized Error Handling**:
    *   Errors are standardized into a structural response with a distinct `requestId` (tracked via `X-Request-ID` middleware) and a retry recommendation.
    *   `AIProviderError` maps rate limiting (429), server downtime (503), and internal failures (500) to clean HTTP formats.

---

## 4. Database & Cache Topology (MongoDB & Redis)

### MongoDB Atlas Cluster
MongoDB stores the persistent application schemas.
*   **Diagram Schema**: Maintains title, type, version counts, parent workspace, array of node positions/data, and array of connection edges.
*   **Workspace Schema**: Links users to teams, permissions, and payment plans.
*   **Billing/User Schema**: Tracks user roles, plan tiers (`free`, `pro`), and payment transactions.

### Redis Cache & BullMQ Queue
Redis is used for caching session values and running export tasks in the background.
*   **Connection Resilience**:
    *   The connection client uses lazy connection strategies (`lazyConnect: true`) and limits reconnections to five retries.
    *   **Fallback Mode**: If a local Redis server is not listening on port 6379, the server prints a warning and enters a fallback mode, disabling caching rather than crashing the API. This enables easy offline development.

---

## 5. AI Core, Diagram IR & Repair Mechanics

The AI assistant reads system specifications in natural language and outputs structured nodes/edges.

### Diagram IR (Intermediate Representation)
The system models diagrams as a unified JSON structure (`DiagramIR`) containing:
*   `schemaVersion` (integer)
*   `nodes` (array of semantic coordinates, styles, sizes, and origin sources)
*   `edges` (connections mapping targets, sources, types, and labels)
*   `layout` (viewport zoom/coordinates)

### AI Providers and Repair Logic
*   **AI Provider Registry**: Dynamically configures the provider (e.g. `groq` or a `mock` developer environment test suite).
*   **Diagram Validation & Repair**:
    *   **Constraints Check**: Validates layout bounds and targets.
    *   **Repair Loop**: If the AI-generated diagram violates JSON schema rules or target connection matches, a secondary AI repair prompt corrects syntax and layout errors before sending the payload to the frontend canvas.

---

## 6. Real-Time Collaboration Socket Server

Real-time canvas updates are powered by Socket.IO.
*   **Proxy Tunneling**:
    *   The frontend Vite dev server proxies `/socket.io` websocket connections (`ws: true`) to port `5000`.
*   **Multiplayer Handlers**:
    *   Users joining a workspace diagram room are placed into Socket.IO rooms.
    *   Mouse movements are serialized and broadcast to workspace peers to render active collaboration presence cursors.
