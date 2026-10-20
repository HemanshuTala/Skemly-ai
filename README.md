# Schemely AI — AI-Powered Visual Workspace & System Design IDE

**Schemely AI** is a modern, collaborative diagramming and visual workspace powered by AI. It turns natural language descriptions into editable, deterministic, and validated system architectures.

---

## 🚀 Key Features

- **AI-Powered System Design**: Generate complete cloud architectures, microservices topologies, and data pipelines from plain English prompts into deterministic Diagram IR.
- **Bi-directional Canonical Sync**: Seamlessly transition between natural language prompts, text DSL, and manual drag-and-drop canvas editing without destroying user adjustments.
- **Architecture Critic & Validation**: Automated graph validator that inspects your design for single points of failure (SPOF), orphan message queues, direct client-to-database connections, and circular dependencies.
- **Bounded AI Repair Loop**: Automatically fixes structural flaws and disconnected components with a deterministic, bounded repair engine.
- **Real-Time Collaboration**: Multi-user editing with live cursor presence and room synchronization via Socket.io.
- **Enterprise-Grade Export**: High-resolution vector SVG, PNG, and PDF exports with configurable themes and styles.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript 5.5, Vite 6, Tailwind CSS v4, React Flow 11, Framer Motion, Zustand, TanStack Query.
- **Backend**: Node.js, Express, TypeScript, MongoDB (Mongoose), Redis (ioredis), Socket.io.
- **AI Engine**: Structured generation and repair pipelines integrating Groq, OpenAI, and Anthropic.
- **Billing & Subscriptions**: Razorpay integration with Webhook verification for Starter and Basic plans.

---

## 📦 Getting Started

### Prerequisites

- **Node.js** (v20 LTS recommended, or v18+)
- **MongoDB** (local or Atlas instance)
- **Redis** (local or cloud instance)
- **Docker & Docker Compose** (optional, for full-stack containerization)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/HemanshuTala/Skemly-ai.git
   cd Skemly-ai
   ```

2. **Install monorepo dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   - Copy `.env.example` in `apps/backend/` to `apps/backend/.env` and update your MongoDB URI, Redis URL, JWT secrets, and AI API keys.
   - Copy `.env.example` in `apps/frontend/` to `apps/frontend/.env` (pointing `VITE_API_URL` to `http://localhost:5000/api/v1`).

4. **Run Database & Cache Services**:
   ```bash
   docker compose up -d mongo redis
   ```

5. **Start Development Servers**:
   ```bash
   npm run dev
   ```
   - **Frontend**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🏗️ Monorepo Architecture

```text
Schemely-AI/
├── apps/
│   ├── frontend/           # React 18 + Vite + React Flow application
│   │   ├── src/
│   │   │   ├── components/ # Editor, Canvas, Dashboard, Landing UI components
│   │   │   ├── domain/     # Canonical parser, graph diff, operation models
│   │   │   ├── hooks/      # AutoSave, diagram persistence, shortcuts
│   │   │   ├── layouts/    # App and Dashboard layouts
│   │   │   ├── pages/      # Landing, Dashboard, Editor, Auth, Docs pages
│   │   │   └── stores/     # Zustand diagram, canvas, and editor stores
│   └── backend/            # Express REST & Socket.io server
│       └── src/
│           ├── controllers/# Diagram, Project, Auth, Billing controllers
│           ├── models/     # Mongoose Schemas (Diagram, User, Workspace)
│           ├── modules/    # AI pipelines, graph validators, critic rules
│           ├── routes/     # Express API versioned routes
│           └── services/   # AI services, email, billing, export engines
├── architecture/           # System design & API specification documents
└── docker-compose.yml      # Local container orchestration
```
