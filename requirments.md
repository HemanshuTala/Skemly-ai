# Skemly SaaS — Full Product Requirements Document (PRD)
**Version:** 1.0  
**Stack:** MERN (MongoDB, Express, React, Node.js) + Supporting Services  
**Type:** AI-Powered Visual Workspace for Developers & Teams

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Market Context](#2-market-context)
3. [Target Users & Personas](#3-target-users--personas)
4. [Feature Requirements](#4-feature-requirements)
5. [System Architecture](#5-system-architecture)
6. [Tech Stack — Detailed](#6-tech-stack--detailed)
7. [Database Schema](#7-database-schema)
8. [API Design](#8-api-design)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [AI Integration Requirements](#10-ai-integration-requirements)
11. [Real-Time Collaboration](#11-real-time-collaboration)
12. [Export System](#12-export-system)
13. [Billing & Subscription](#13-billing--subscription)
14. [Security Requirements](#14-security-requirements)
15. [Performance Requirements](#15-performance-requirements)
16. [Edge Cases & Error Handling](#16-edge-cases--error-handling)
17. [Non-Functional Requirements](#17-non-functional-requirements)
18. [Development Roadmap](#18-development-roadmap)
19. [Third-Party Services](#19-third-party-services)
20. [Environment & DevOps](#20-environment--devops)

---

## 1. Product Overview

### 1.1 Product Name
**Skemly**

### 1.2 One-Liner
> "AI-powered visual workspace: write code, get diagrams, collaborate in real-time."

### 1.3 Core Value Proposition
- Write Mermaid-like syntax → auto-render diagram (code-first)
- OR drag-drop visually (visual-first)
- OR prompt AI → get diagram (AI-first)
- Attach Notion-like notes to any diagram
- Collaborate in real-time with your team
- Export to PNG, SVG, PDF, or raw syntax

### 1.4 Product Pillars
| Pillar | Description |
|--------|-------------|
| Code-First | Write text syntax, see live diagram |
| Visual-First | Drag-drop nodes, edges, shapes |
| AI-First | Natural language → diagram or improvement suggestions |
| Notes | Rich text blocks attached to diagrams |
| Collaboration | Real-time multi-user editing |
| Developer-Grade | Fast, keyboard-friendly, API access |

---

## 2. Market Context

### 2.1 Market Size
- Diagram software market: ~$843M (2024) → ~$1.78B by 2032
- CAGR: ~9.8%
- Developer tools market (adjacent): $28B+ and growing rapidly

### 2.2 Competitive Landscape

| Tool | Strengths | Weaknesses |
|------|-----------|------------|
| Miro | Collaboration, templates | No code-based diagramming, heavy |
| Lucidchart | Professional diagrams | Expensive, no AI, no code mode |
| Draw.io | Free, widely used | Poor UX, no AI, outdated interface |
| Mermaid | Code-based, fast | No visual editor, no AI, no notes |
| Figma | Design-grade visuals | Not for diagramming/notes |
| Notion | Notes + embeds | No real diagram engine |

### 2.3 Differentiation
This product is the **only tool** combining:
- Code → Diagram (Mermaid-like parser)
- Visual drag-drop editing (Draw.io-like)
- AI generation (prompt → diagram)
- Notion-style notes (embedded alongside diagrams)
- Real-time collaboration (Figma/Miro-like)

---

## 3. Target Users & Personas

### Persona 1: Developer (Primary)
- **Name:** Arjun, Software Engineer
- **Use case:** System design docs, architecture diagrams, ERDs, sequence diagrams
- **Pain:** Mermaid is powerful but has no visual editor; Draw.io is slow with no AI
- **Wants:** Fast, keyboard-friendly, code + visual hybrid, shareable links

### Persona 2: Startup/Product Team
- **Name:** Priya, Product Manager
- **Use case:** User flows, product roadmaps, stakeholder presentations
- **Pain:** Context-switching between Figma, Notion, Miro
- **Wants:** One tool with notes + diagrams + sharing

### Persona 3: Student/Researcher
- **Name:** Ravi, CS Student
- **Use case:** DSA diagrams, flowcharts, study notes, project submissions
- **Pain:** Can't afford expensive tools; free tools are ugly
- **Wants:** Free tier, clean UI, export to PDF

### Persona 4: Designer/Analyst
- **Name:** Sara, UX Designer
- **Use case:** User journey maps, wireframe annotations
- **Pain:** Figma doesn't support code-based or AI generation
- **Wants:** Beautiful output, shareable, embeddable

---

## 4. Feature Requirements

### 4.1 Authentication Module

#### Requirements
- [AUTH-01] Email + Password registration with email verification
- [AUTH-02] Google OAuth 2.0 login
- [AUTH-03] GitHub OAuth login (developer-focused)
- [AUTH-04] Forgot password / reset via email token
- [AUTH-05] JWT access tokens (15 min expiry) + refresh tokens (7 days, stored in HttpOnly cookie)
- [AUTH-06] Auto token refresh without user logout
- [AUTH-07] Logout invalidates refresh token server-side
- [AUTH-08] Session management — show active sessions, revoke device
- [AUTH-09] Rate limit login attempts: max 5 fails → 15-min lockout
- [AUTH-10] Optional 2FA via TOTP (Google Authenticator)

#### Edge Cases
- User tries to register with email already registered via Google OAuth → merge accounts or show message
- User changes email → re-verify new email, keep old email active until confirmed
- OAuth token expires mid-session → silently refresh or re-prompt login
- Account with unverified email tries to access premium features → block with message

---

### 4.2 Diagram Engine

#### 4.2.1 Diagram Types Supported
| Type | Description |
|------|-------------|
| Flowchart | Decisions, processes, start/end nodes |
| Sequence Diagram | Actor-to-actor message flow |
| UML Class Diagram | Classes, relationships, methods |
| Entity Relationship Diagram (ERD) | Tables, foreign keys |
| Mind Map | Hierarchical tree from center |
| System Design | Services, databases, queues, API gateways |
| Gantt Chart | Timeline / project schedule |
| State Machine | States and transitions |
| Network Diagram | Servers, routers, connections |
| Org Chart | Hierarchical people/roles |

#### 4.2.2 Code-First (Syntax) Mode

**Requirements:**
- [DIAG-01] Custom syntax parser (inspired by Mermaid, but extensible)
- [DIAG-02] Live preview — diagram re-renders on every keystroke (debounced 300ms)
- [DIAG-03] Syntax error highlighting in editor with line numbers
- [DIAG-04] Syntax error shown inline (not as crash — partial render if possible)
- [DIAG-05] Autocomplete for node types, arrow types, keywords
- [DIAG-06] Support Mermaid-compatible syntax as import option
- [DIAG-07] Code editor: Monaco Editor (same as VS Code)
- [DIAG-08] Keyboard shortcuts (Ctrl+Enter to render, Ctrl+/ for comment)

**Syntax Design (custom):**
```
# Flowchart example
[Start] --> [Process A]
[Process A] --> {Decision}
{Decision} -- Yes --> [End]
{Decision} -- No --> [Process A]

# Sequence example
@sequence
User -> Server: Login Request
Server -> DB: Check credentials
DB --> Server: User data
Server --> User: JWT Token
```

**Edge Cases:**
- Empty diagram → show placeholder hint, no crash
- Circular references → render with warning, detect and highlight cycle
- Extremely large diagrams (500+ nodes) → warn user, enable lazy rendering
- Invalid arrow syntax → show error, render last valid state
- Unicode characters in node labels → must be supported
- Emoji in labels → supported in SVG render
- Special characters (`<`, `>`, `&`) in labels → escape properly in SVG

#### 4.2.3 Visual (Drag-Drop) Editor

**Requirements:**
- [VIS-01] Canvas with infinite scroll/pan (using React Flow or custom canvas)
- [VIS-02] Add node: click empty area → pick type from context menu
- [VIS-03] Connect nodes: drag from port → drop on target node
- [VIS-04] Resize nodes by dragging handles
- [VIS-05] Multi-select with Shift+click or drag-box
- [VIS-06] Move selected nodes together
- [VIS-07] Copy/paste nodes (Ctrl+C / Ctrl+V)
- [VIS-08] Undo/Redo (Ctrl+Z / Ctrl+Y), history up to 50 states
- [VIS-09] Snap-to-grid toggle
- [VIS-10] Auto-layout button (Dagre/ELK layout algorithm)
- [VIS-11] Zoom in/out (scroll wheel), zoom to fit (Ctrl+Shift+F)
- [VIS-12] Node styling: color, border, text size, shape
- [VIS-13] Edge styling: label, arrow type, curve/straight/step
- [VIS-14] Minimap for large diagrams
- [VIS-15] Right-click context menu on node (edit, delete, duplicate, add note)
- [VIS-16] Double-click node → inline text edit
- [VIS-17] Sync with code editor (visual changes update code, code changes update visual)

**Edge Cases:**
- User drops edge on same source node → detect self-loop, render as arc
- Node text overflow → truncate with ellipsis, show full on hover tooltip
- Canvas lost reference after undo/redo → graceful restore
- User pastes external image into canvas → prompt to insert as image node
- Two users moving same node simultaneously → last-write-wins with visual indicator
- Network disconnects during visual edit → queue changes locally, sync on reconnect

---

### 4.3 Notes System (Notion-like)

#### Requirements
- [NOTE-01] Each diagram has an associated Notes document
- [NOTE-02] Rich text editor (TipTap or Slate.js)
- [NOTE-03] Supported blocks: Heading 1/2/3, Paragraph, Bullet list, Numbered list, Checklist, Code block, Quote, Divider, Table, Image embed, Diagram embed (embed another diagram inline)
- [NOTE-04] Slash command (`/`) to insert blocks
- [NOTE-05] Markdown shortcuts (`**bold**`, `# heading`, `` `code` ``)
- [NOTE-06] Inline formatting: bold, italic, underline, strikethrough, code, link, color
- [NOTE-07] Notes auto-save every 5 seconds + on blur
- [NOTE-08] Notes version history (last 30 versions per document)
- [NOTE-09] Notes can be published as a public read-only page
- [NOTE-10] Notes can link to other diagrams in the workspace

**Edge Cases:**
- User pastes raw HTML from browser → strip dangerous tags, sanitize
- User pastes code with triple backtick → detect and convert to code block
- Embed of deleted diagram → show "Diagram not found" placeholder
- Notes with 50,000+ characters → paginate or virtualize rendering
- Concurrent edits to notes by two users → OT (Operational Transform) or CRDT merge

---

### 4.4 AI Features

#### 4.4.1 Prompt → Diagram
- [AI-01] Text input → AI returns diagram syntax → auto-render
- [AI-02] Context selector: user picks diagram type before prompting
- [AI-03] AI response is streamed (show diagram appearing token by token in code panel)
- [AI-04] User can refine with follow-up: "add a database node" → AI patches existing diagram
- [AI-05] AI tracks conversation context per diagram (up to 10 turns)

**Example prompts:**
- "Create a system design for a food delivery app"
- "Add a payment service that connects to Order Service"
- "Convert this to a sequence diagram"

#### 4.4.2 AI Explain
- [AI-06] User selects a diagram → AI explains what it represents in plain English
- [AI-07] User selects a node → AI explains that specific component

#### 4.4.3 AI Improve
- [AI-08] AI analyzes diagram → suggests layout improvements, missing nodes, naming inconsistencies
- [AI-09] Suggestions shown as non-intrusive sidebar cards (accept/reject each)

#### 4.4.4 AI Auto-Fix Syntax
- [AI-10] If user has a syntax error → AI suggests corrected syntax
- [AI-11] Show diff between original and fixed syntax

#### 4.4.5 AI Limits (by Plan)
| Feature | Free | Pro | Team |
|---------|------|-----|------|
| Prompt → Diagram | 5/month | 100/month | Unlimited |
| AI Explain | 10/month | Unlimited | Unlimited |
| AI Improve | 3/month | 50/month | Unlimited |
| AI Auto-Fix | 3/month | Unlimited | Unlimited |

**Edge Cases:**
- AI returns invalid syntax → auto-validate and retry once, then show raw with error
- AI response exceeds token limit → truncate gracefully, tell user to simplify prompt
- AI API timeout → show retry button, don't lose user's prompt
- User sends harmful/irrelevant prompt ("write me a poem") → filter and redirect
- AI usage limit reached mid-month → show upgrade prompt, allow current action to complete

---

### 4.5 Workspace & Organization

#### Requirements
- [WS-01] User has one Personal Workspace (always exists)
- [WS-02] User can create/join Team Workspaces (Team plan)
- [WS-03] Workspace contains: Projects → Diagrams + Notes
- [WS-04] Project: folder-like container, custom name + icon + color
- [WS-05] Diagrams can be moved between projects (drag or menu)
- [WS-06] Search across all diagrams and notes in workspace (full-text)
- [WS-07] Recent diagrams section (last 10 opened)
- [WS-08] Starred/favorited diagrams
- [WS-09] Trash: deleted diagrams go to trash, auto-purge after 30 days
- [WS-10] Restore from trash within 30 days
- [WS-11] Workspace activity log (who created/edited/deleted what, with timestamp)

**Edge Cases:**
- User deletes project with 50 diagrams → move all to trash individually
- Restore diagram whose project was also deleted → restore to root of workspace
- Search with special characters → sanitize query, use indexed search
- Workspace with 1000+ diagrams → paginate and virtualize list

---

### 4.6 Collaboration

#### Requirements
- [COLLAB-01] Invite collaborators to workspace by email
- [COLLAB-02] Invite to specific diagram via link (view or edit permissions)
- [COLLAB-03] Real-time cursor presence: see other users' cursors on canvas
- [COLLAB-04] Real-time name tags floating above each collaborator's cursor
- [COLLAB-05] Real-time sync: diagram changes propagate within 200ms
- [COLLAB-06] Offline indicator: user goes offline → shown as greyed-out in presence
- [COLLAB-07] Comments on diagrams: click anywhere on canvas → add comment
- [COLLAB-08] Comment threads: reply to comments, resolve, re-open
- [COLLAB-09] @ mentions in comments notify the mentioned user via email
- [COLLAB-10] Version history: save named snapshots ("v1.0 - MVP design")
- [COLLAB-11] Restore to any version snapshot
- [COLLAB-12] Guest access (view only) via public link — no account required

**Edge Cases:**
- Two users edit the same node simultaneously → merge or last-write-wins with notification
- User A deletes node that User B is currently editing → User B gets "Node deleted" notification, their panel clears
- Workspace owner leaves → require transfer of ownership before leaving
- Collaborator with edit access exports diagram → allowed (export is read operation)
- Guest link shared publicly → add option to password-protect or expiry-date public links

---

### 4.7 Export System

#### Requirements
- [EXP-01] Export diagram as PNG (transparent or white background)
- [EXP-02] Export as SVG (scalable, clean)
- [EXP-03] Export as PDF (single page or multi-page for large diagrams)
- [EXP-04] Export as diagram syntax (raw code — `.dgrm` custom format or `.mermaid`)
- [EXP-05] Export Notes as Markdown (`.md`)
- [EXP-06] Export Notes as PDF (styled)
- [EXP-07] Copy diagram as image to clipboard (one-click)
- [EXP-08] Embed code: generate `<iframe>` snippet for embedding in Notion, Confluence, etc.
- [EXP-09] Export resolution options: 1x, 2x (retina), 4x
- [EXP-10] Watermark on Free plan exports; no watermark on Pro/Team

**Edge Cases:**
- Export of very large diagram (3000+ nodes) → server-side render, not client-side
- User exports while unsaved changes exist → export current state (with note)
- SVG export with external fonts → embed fonts inline in SVG
- PDF export of diagram with notes → diagram on page 1, notes following

---

### 4.8 Templates Library

#### Requirements
- [TMPL-01] Built-in template gallery (20+ templates at launch)
- [TMPL-02] Categories: System Design, Flowcharts, UML, ERD, Org Charts, Mind Maps
- [TMPL-03] User can save any diagram as a personal template
- [TMPL-04] Team plan: share templates across team workspace
- [TMPL-05] Template preview before importing
- [TMPL-06] One-click "Use this template" → creates new diagram from it

**Launch Templates (examples):**
- Microservices architecture
- REST API sequence flow
- User authentication flow
- E-commerce ERD
- CI/CD pipeline
- TCP/IP network stack
- Agile sprint board (Gantt)
- React component tree

---

### 4.9 Sharing & Permissions

#### Permission Levels
| Role | Can View | Can Edit | Can Comment | Can Invite | Can Delete Workspace |
|------|----------|----------|-------------|------------|----------------------|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ❌ |
| Editor | ✅ | ✅ | ✅ | ❌ | ❌ |
| Commenter | ✅ | ❌ | ✅ | ❌ | ❌ |
| Viewer | ✅ | ❌ | ❌ | ❌ | ❌ |

#### Requirements
- [SHARE-01] Share entire workspace with role assignment
- [SHARE-02] Share individual diagram with overriding role
- [SHARE-03] Public link: view-only, no login required
- [SHARE-04] Link expiry: optional expiry date on shared links
- [SHARE-05] Password protection on shared links
- [SHARE-06] Revoke access: remove collaborator from workspace or diagram
- [SHARE-07] Transfer ownership to another member

---

### 4.10 Notifications

#### Requirements
- [NOTIF-01] In-app notification bell with unread count
- [NOTIF-02] Email notifications (configurable per user)
- [NOTIF-03] Events that trigger notifications:
  - Invited to workspace/diagram
  - Comment on your diagram
  - @mention in comment
  - Collaborator accepted/declined invite
  - Diagram shared with you
  - AI generation complete (if async)
  - Plan upgraded/downgraded
  - Payment failed
- [NOTIF-04] User can disable specific notification types
- [NOTIF-05] Digest mode: batch non-urgent emails into daily digest

**Edge Cases:**
- Notification for deleted diagram → link to "Diagram not found" page gracefully
- User unsubscribes from emails → honor immediately, no more emails
- Spam protection: max 1 email per event type per 5 minutes per user

---

## 5. System Architecture

### 5.1 High-Level Architecture (HLA)

```
┌─────────────────────────────────────────────────┐
│                   CLIENT LAYER                    │
│  React SPA (Vite)  +  Mobile PWA support          │
└──────────────────────┬──────────────────────────-─┘
                       │ HTTPS / WSS
┌──────────────────────▼──────────────────────────-─┐
│                   API GATEWAY                      │
│  Nginx (reverse proxy, rate limiting, SSL termina) │
└───────┬──────────────┬────────────────────────────┘
        │              │
┌───────▼──────┐ ┌─────▼──────────────────────┐
│  REST API     │ │   WebSocket Server          │
│  Node/Express │ │   Socket.io                 │
└───────┬───────┘ └─────┬──────────────────────┘
        │               │
┌───────▼───────────────▼──────────────────────────┐
│               SERVICE LAYER                        │
│  Auth  │  Diagram  │  Notes  │  AI  │  Export     │
└──────────────────────┬───────────────────────────┘
                       │
        ┌──────────────┼───────────────────┐
        │              │                   │
┌───────▼───┐ ┌────────▼──────┐ ┌─────────▼────┐
│  MongoDB   │ │  Redis Cache  │ │  S3 Storage  │
│  (main DB) │ │  (sessions,   │ │  (exports,   │
│            │ │   real-time)  │ │   images)    │
└────────────┘ └───────────────┘ └──────────────┘
                       │
              ┌────────▼────────┐
              │  AI Service      │
              │  Claude/OpenAI   │
              │  API             │
              └──────────────────┘
```

### 5.2 Low-Level Architecture (LLA) — Key Flows

#### Diagram Save Flow
```
User edits canvas
  → Debounce 500ms
  → Serialize diagram to JSON
  → POST /api/diagrams/:id (if autosave)
  → Save to MongoDB
  → Emit "diagram:updated" via Socket.io to other collaborators
  → Other clients receive event → apply patch to their canvas
```

#### AI Generation Flow
```
User submits prompt
  → POST /api/ai/generate
  → Backend calls Claude API (streaming)
  → Stream chunks via SSE to client
  → Client accumulates syntax string
  → Parse + render diagram in real-time
  → On stream complete → auto-save diagram
```

---

## 6. Tech Stack — Detailed

### 6.1 Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| React.js | UI framework | 18+ |
| Vite | Build tool (faster than CRA) | 5+ |
| TypeScript | Type safety | 5+ |
| TailwindCSS | Styling | 3+ |
| React Flow | Diagram canvas (nodes/edges) | 11+ |
| Monaco Editor | Code editor (VS Code-like) | Latest |
| TipTap | Rich text notes editor | 2+ |
| Zustand | Global state management | 4+ |
| React Query (TanStack) | Server state, caching, refetch | 5+ |
| Socket.io Client | Real-time collaboration | 4+ |
| Framer Motion | Animations | 10+ |
| React Router v6 | Client-side routing | 6+ |
| Axios | HTTP client | 1+ |
| date-fns | Date formatting | 3+ |
| html-to-image | Client-side PNG/SVG export | Latest |
| jsPDF | Client-side PDF generation | Latest |

### 6.2 Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| Node.js | Runtime | 20 LTS |
| Express.js | HTTP framework | 4+ |
| TypeScript | Type safety | 5+ |
| Socket.io | WebSocket server | 4+ |
| Mongoose | MongoDB ODM | 8+ |
| Redis (ioredis) | Caching, sessions, pub/sub | 4+ |
| Bull / BullMQ | Job queues (export, email) | Latest |
| Passport.js | OAuth strategies | Latest |
| jsonwebtoken | JWT creation/verification | 9+ |
| bcryptjs | Password hashing | 2+ |
| Joi / Zod | Input validation | Latest |
| Multer | File upload handling | Latest |
| Nodemailer | Email sending | Latest |
| Morgan | HTTP request logging | Latest |
| Winston | Application logging | 3+ |
| Helmet | Security HTTP headers | Latest |
| express-rate-limit | Rate limiting middleware | Latest |
| cors | CORS configuration | Latest |

### 6.3 Database

| Technology | Purpose |
|------------|---------|
| MongoDB Atlas | Primary database — documents, diagrams, users |
| Redis | Session store, rate limit counters, real-time room data, pub/sub |

### 6.4 Cloud & Storage

| Service | Purpose |
|---------|---------|
| AWS S3 / Cloudflare R2 | Store exported files (PNG, PDF, SVG) |
| Cloudflare CDN | Serve static assets, cache exports |
| AWS SES / Resend.com | Transactional emails |

### 6.5 AI Services

| Service | Purpose |
|---------|---------|
| Anthropic Claude API | Diagram generation, explanation, improvement |
| OpenAI API | Fallback / alternative |

### 6.6 DevOps

| Tool | Purpose |
|------|---------|
| Docker + Docker Compose | Full-stack containerisation — frontend, backend, MongoDB, Redis all run via `docker-compose up` |
| GitHub Actions | CI/CD pipelines (lint → test → build → deploy) |
| AWS EC2 / Railway / Render | Backend hosting |
| Vercel / Netlify | Frontend hosting |
| Nginx | Reverse proxy, SSL termination, rate limiting |
| PM2 | Node process manager (production) |
| Sentry | Error monitoring |
| PostHog / Mixpanel | Product analytics |
| Uptime Robot | Uptime monitoring |

### 6.7 Payment

| Service | Purpose |
|---------|---------|
| Razorpay | Subscription billing, invoices, webhooks (India-first, global support) |

---

## 7. Database Schema

### 7.1 Users Collection
```json
{
  "_id": "ObjectId",
  "email": "string (unique, indexed)",
  "emailVerified": "boolean",
  "emailVerificationToken": "string | null",
  "password": "string (bcrypt hashed) | null",
  "oauthProviders": [
    {
      "provider": "google | github",
      "providerId": "string",
      "accessToken": "string (encrypted)"
    }
  ],
  "name": "string",
  "avatar": "string (URL)",
  "plan": "free | pro | team",
  "planExpiresAt": "Date | null",
  "razorpayContactId": "string | null",
  "razorpaySubscriptionId": "string | null",
  "twoFactorEnabled": "boolean",
  "twoFactorSecret": "string | null (encrypted)",
  "aiUsage": {
    "generate": { "count": "number", "resetAt": "Date" },
    "explain": { "count": "number", "resetAt": "Date" },
    "improve": { "count": "number", "resetAt": "Date" },
    "autofix": { "count": "number", "resetAt": "Date" }
  },
  "preferences": {
    "theme": "light | dark | system",
    "defaultDiagramType": "string",
    "editorFontSize": "number",
    "notifications": {
      "email": "boolean",
      "inApp": "boolean",
      "digest": "boolean"
    }
  },
  "activeSessions": [
    { "refreshToken": "string (hashed)", "deviceInfo": "string", "createdAt": "Date", "lastUsedAt": "Date" }
  ],
  "lastLoginAt": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 7.2 Workspaces Collection
```json
{
  "_id": "ObjectId",
  "name": "string",
  "type": "personal | team",
  "ownerId": "ObjectId (ref: Users)",
  "members": [
    {
      "userId": "ObjectId (ref: Users)",
      "role": "owner | admin | editor | commenter | viewer",
      "invitedBy": "ObjectId",
      "joinedAt": "Date"
    }
  ],
  "pendingInvites": [
    {
      "email": "string",
      "role": "string",
      "token": "string",
      "expiresAt": "Date"
    }
  ],
  "settings": {
    "defaultMemberRole": "editor | commenter | viewer",
    "allowPublicLinks": "boolean"
  },
  "plan": "free | pro | team",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 7.3 Projects Collection
```json
{
  "_id": "ObjectId",
  "workspaceId": "ObjectId (ref: Workspaces)",
  "name": "string",
  "icon": "string (emoji or icon key)",
  "color": "string (hex)",
  "createdBy": "ObjectId (ref: Users)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 7.4 Diagrams Collection
```json
{
  "_id": "ObjectId",
  "workspaceId": "ObjectId (ref: Workspaces)",
  "projectId": "ObjectId (ref: Projects) | null",
  "title": "string",
  "type": "flowchart | sequence | uml | erd | mindmap | system | gantt | state | network | orgchart",
  "syntax": "string (raw code)",
  "nodes": [
    {
      "id": "string",
      "type": "string",
      "position": { "x": "number", "y": "number" },
      "data": { "label": "string", "style": "object" },
      "width": "number",
      "height": "number"
    }
  ],
  "edges": [
    {
      "id": "string",
      "source": "string",
      "target": "string",
      "label": "string",
      "type": "string",
      "style": "object"
    }
  ],
  "viewport": { "x": "number", "y": "number", "zoom": "number" },
  "aiConversation": [
    { "role": "user | assistant", "content": "string", "createdAt": "Date" }
  ],
  "version": "number (auto-increment on save)",
  "isPublic": "boolean",
  "publicLinkToken": "string | null",
  "publicLinkExpiresAt": "Date | null",
  "publicLinkPassword": "string | null (hashed)",
  "thumbnail": "string (URL to S3 thumbnail)",
  "isTrashed": "boolean",
  "trashedAt": "Date | null",
  "collaborators": [
    {
      "userId": "ObjectId",
      "role": "editor | commenter | viewer",
      "addedAt": "Date"
    }
  ],
  "starredBy": ["ObjectId (ref: Users)"],
  "createdBy": "ObjectId (ref: Users)",
  "lastEditedBy": "ObjectId (ref: Users)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 7.5 DiagramVersions Collection
```json
{
  "_id": "ObjectId",
  "diagramId": "ObjectId (ref: Diagrams)",
  "version": "number",
  "name": "string | null (user-named snapshot)",
  "syntax": "string",
  "nodes": "array",
  "edges": "array",
  "savedBy": "ObjectId (ref: Users)",
  "createdAt": "Date"
}
```

### 7.6 Notes Collection
```json
{
  "_id": "ObjectId",
  "diagramId": "ObjectId (ref: Diagrams, unique)",
  "workspaceId": "ObjectId",
  "content": "object (TipTap JSON document)",
  "contentText": "string (plain text for search indexing)",
  "isPublic": "boolean",
  "version": "number",
  "createdBy": "ObjectId",
  "lastEditedBy": "ObjectId",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 7.7 Comments Collection
```json
{
  "_id": "ObjectId",
  "diagramId": "ObjectId (ref: Diagrams)",
  "parentId": "ObjectId | null (for thread replies)",
  "authorId": "ObjectId (ref: Users)",
  "content": "string",
  "position": { "x": "number", "y": "number" },
  "resolved": "boolean",
  "resolvedBy": "ObjectId | null",
  "resolvedAt": "Date | null",
  "mentions": ["ObjectId (ref: Users)"],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 7.8 Notifications Collection
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: Users)",
  "type": "string (enum of notification types)",
  "title": "string",
  "message": "string",
  "link": "string | null",
  "read": "boolean",
  "emailSent": "boolean",
  "metadata": "object",
  "createdAt": "Date"
}
```

### 7.9 Templates Collection
```json
{
  "_id": "ObjectId",
  "name": "string",
  "description": "string",
  "category": "string",
  "thumbnail": "string (URL)",
  "diagramType": "string",
  "syntax": "string",
  "nodes": "array",
  "edges": "array",
  "isBuiltIn": "boolean",
  "workspaceId": "ObjectId | null (null = global built-in)",
  "createdBy": "ObjectId",
  "usageCount": "number",
  "createdAt": "Date"
}
```

---

## 8. API Design

### 8.1 Base URL
```
https://api.yourdomain.com/v1
```

### 8.2 Standard Response Format
```json
{
  "success": true,
  "data": {},
  "message": "string",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### 8.3 Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": []
  }
}
```

### 8.4 API Endpoints

#### Auth
```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh-token
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/verify-email
GET    /auth/me
PUT    /auth/me
POST   /auth/google
POST   /auth/github
POST   /auth/2fa/setup
POST   /auth/2fa/verify
DELETE /auth/sessions/:sessionId
```

#### Workspaces
```
GET    /workspaces
POST   /workspaces
GET    /workspaces/:id
PUT    /workspaces/:id
DELETE /workspaces/:id
GET    /workspaces/:id/members
POST   /workspaces/:id/invite
DELETE /workspaces/:id/members/:userId
PUT    /workspaces/:id/members/:userId/role
POST   /workspaces/:id/transfer-ownership
GET    /workspaces/:id/activity
```

#### Projects
```
GET    /workspaces/:wsId/projects
POST   /workspaces/:wsId/projects
PUT    /workspaces/:wsId/projects/:id
DELETE /workspaces/:wsId/projects/:id
```

#### Diagrams
```
GET    /diagrams?workspaceId=&projectId=&page=&limit=&search=
POST   /diagrams
GET    /diagrams/:id
PUT    /diagrams/:id
DELETE /diagrams/:id
POST   /diagrams/:id/duplicate
POST   /diagrams/:id/star
DELETE /diagrams/:id/star
POST   /diagrams/:id/trash
POST   /diagrams/:id/restore
GET    /diagrams/:id/versions
POST   /diagrams/:id/versions (save named snapshot)
GET    /diagrams/:id/versions/:versionId
POST   /diagrams/:id/versions/:versionId/restore
GET    /diagrams/public/:token (public view)
POST   /diagrams/:id/share (generate public link)
DELETE /diagrams/:id/share
```

#### Notes
```
GET    /notes/:diagramId
PUT    /notes/:diagramId
GET    /notes/:diagramId/versions
POST   /notes/:diagramId/publish
DELETE /notes/:diagramId/publish
```

#### Comments
```
GET    /diagrams/:id/comments
POST   /diagrams/:id/comments
PUT    /diagrams/:id/comments/:commentId
DELETE /diagrams/:id/comments/:commentId
POST   /diagrams/:id/comments/:commentId/resolve
POST   /diagrams/:id/comments/:commentId/reply
```

#### AI
```
POST   /ai/generate
POST   /ai/explain
POST   /ai/improve
POST   /ai/autofix
GET    /ai/usage
```

#### Export
```
POST   /export/png
POST   /export/svg
POST   /export/pdf
POST   /export/syntax
GET    /export/status/:jobId
GET    /export/download/:fileId
```

#### Templates
```
GET    /templates?category=&type=
POST   /templates (save custom)
GET    /templates/:id
DELETE /templates/:id
POST   /templates/:id/use
```

#### Billing
```
GET    /billing/plans
GET    /billing/subscription
POST   /billing/subscribe
POST   /billing/cancel
POST   /billing/portal (Razorpay customer portal / self-serve)
POST   /billing/webhook (Razorpay webhook endpoint)
```

#### Notifications
```
GET    /notifications
POST   /notifications/read-all
PUT    /notifications/:id/read
DELETE /notifications/:id
PUT    /notifications/preferences
```

#### Search
```
GET    /search?q=&workspaceId=&type=diagrams|notes|all
```

---

## 9. Authentication & Authorization

### 9.1 Token Strategy
- **Access Token:** JWT, signed with RS256, 15-minute expiry, contains `userId`, `workspaceIds`, `plan`
- **Refresh Token:** Random UUID, stored hashed in DB, 7-day expiry, sent as HttpOnly SameSite=Strict cookie
- **Verification Tokens:** Crypto random 32-byte hex, stored hashed in DB, 24-hour expiry

### 9.2 Authorization Middleware
Every protected route goes through:
1. `authenticateToken` — validates JWT
2. `checkWorkspaceAccess(role)` — checks user's role in target workspace
3. `checkDiagramAccess(role)` — checks user's role for specific diagram
4. `checkPlanFeature(feature)` — checks if user's plan allows the feature
5. `checkAIUsage(type)` — checks and increments AI usage counter

### 9.3 Row-Level Security Rules
- Users can ONLY read/write resources in workspaces they are members of
- Public diagram token bypasses auth for read-only
- AI endpoints require plan check BEFORE calling AI API
- Export endpoints for large files require plan check

---

## 10. AI Integration Requirements

### 10.1 Claude API Usage

#### System Prompt for Diagram Generation
```
You are a diagram generation assistant. Convert user descriptions into valid diagram syntax.
Output ONLY the raw syntax, no explanation, no markdown code blocks, no preamble.
Use this syntax format: [define format here].
Supported types: flowchart, sequence, uml, erd, mindmap, system, gantt, state, network, orgchart.
If the user's request is unclear, generate a reasonable interpretation.
```

#### Streaming Implementation
- Use `stream: true` in Claude API request
- Forward SSE chunks to client via `text/event-stream`
- Client accumulates chunks → renders live
- On stream end → validate syntax → save to DB

### 10.2 AI Context Management
- Store last 10 AI conversation turns per diagram
- Include current diagram syntax in every request for context
- Truncate old context if token limit approached (keep last 5 turns)

### 10.3 AI Rate Limiting
- Server-side counter per user per month (stored in Redis)
- Check BEFORE calling AI API — don't waste tokens on over-limit users
- Reset counters on 1st of each month (via cron job)

### 10.4 AI Error Handling
| Error | Response |
|-------|----------|
| API timeout (>30s) | Return 504, show retry button |
| Invalid syntax returned | Auto-retry once with "fix syntax" prompt |
| Rate limit from AI provider | Return 429, message: "AI service busy, retry in X seconds" |
| Token limit exceeded | Return 400, message: "Prompt too long, please simplify" |
| Content filter triggered | Return 400, message: "Request not allowed" |

---

## 11. Real-Time Collaboration

### 11.1 Socket.io Rooms
- Room naming: `diagram:${diagramId}`
- User joins room on diagram open, leaves on close/disconnect
- Max 50 concurrent users per room (Team plan); 5 (Pro); 1 (Free, no collaboration)

### 11.2 Events (Client → Server)
```
diagram:join       { diagramId, userId, userInfo }
diagram:leave      { diagramId }
diagram:patch      { diagramId, patch, version }  // JSON patch RFC6902
cursor:move        { diagramId, x, y }
node:lock          { diagramId, nodeId }
node:unlock        { diagramId, nodeId }
```

### 11.3 Events (Server → Client)
```
diagram:patch      { patch, version, authorId }
diagram:full-sync  { diagram }  // on join, or after conflict
cursor:update      { userId, x, y, userInfo }
user:joined        { userInfo }
user:left          { userId }
node:locked        { nodeId, lockedBy }
node:unlocked      { nodeId }
conflict:detected  { message }
```

### 11.4 Conflict Resolution
- **Optimistic updates:** Client applies patch locally immediately
- **Version vector:** Each save increments `diagram.version`
- **Conflict detected:** Server rejects patch if `version` doesn't match current
- **Resolution:** Server sends `diagram:full-sync` with current state, client re-renders
- **Node locking:** Optional — lock a node while editing to prevent conflicts

### 11.5 Offline Handling
- Detect offline via `navigator.onLine` + socket disconnect event
- Queue changes locally (in-memory array)
- On reconnect → send queued patches sequentially
- If version mismatch after reconnect → full sync + notify user "Diagram updated by others"

---

## 12. Export System

### 12.1 Client-Side Exports (Fast, for small diagrams)
- PNG/SVG: Use `html-to-image` on the canvas DOM element
- PDF of notes: Use `jsPDF` + `html2canvas`
- Raw syntax: Direct string download

### 12.2 Server-Side Exports (For large diagrams / Pro/Team)
- PNG/SVG/PDF: Puppeteer headless browser renders diagram → screenshot
- Job queued via BullMQ → processed by worker → file uploaded to S3 → URL returned
- Client polls `/export/status/:jobId` until complete

### 12.3 Watermark Logic
```
if (user.plan === 'free') {
  addWatermark(export, "Made with Skemly — skemly.com")
}
```

---

## 13. Billing & Subscription

### 13.1 Plans

| Feature | Free | Pro ($9/mo) | Team ($19/user/mo) |
|---------|------|-------------|---------------------|
| Diagrams | 10 | Unlimited | Unlimited |
| AI Generate | 5/mo | 100/mo | Unlimited |
| Collaborators | 0 | 3 | Unlimited |
| Version history | 5 versions | 30 versions | Unlimited |
| Export watermark | Yes | No | No |
| Custom templates | 0 | 10 | Unlimited |
| File storage | 50 MB | 2 GB | 10 GB |
| Support | Community | Email | Priority |

### 13.2 Razorpay Integration
- Create Razorpay Contact + Customer on user registration
- Plans + Items created in Razorpay Dashboard
- Use Razorpay Checkout (hosted / embedded) for plan upgrade flow
- Razorpay Subscription Portal (or custom page) for manage/cancel subscription
- Webhooks to handle: `subscription.activated`, `subscription.charged`, `subscription.halted`, `subscription.cancelled`, `payment.failed`

### 13.3 Plan Enforcement
- Plan stored in DB and in JWT (refreshed on token renewal)
- Plan limits checked server-side on every relevant API call
- Soft limit: warn user at 80% usage ("You've used 80% of your AI credits")
- Hard limit: block at 100%, show upgrade prompt

### 13.4 Trial
- Pro: 14-day free trial on signup (credit card required for trial activation)
- Team: 30-day free trial for new team workspaces

---

## 14. Security Requirements

### 14.1 Input Validation
- All API inputs validated with Zod schemas
- Max lengths enforced: diagram title 200 chars, notes 500,000 chars, prompt 2000 chars
- File uploads: validate MIME type + magic bytes (not just extension)
- SQL/NoSQL injection prevention via Mongoose schema types + never pass raw user strings to `$where`

### 14.2 Authentication Security
- Passwords: bcrypt cost factor 12
- Refresh tokens: stored as SHA-256 hash in DB (never raw)
- HttpOnly + SameSite=Strict cookies for refresh token
- CSRF protection on non-GET endpoints (use `csurf` or double-submit cookie pattern)
- All auth tokens are revocable (stored in DB, checked on use)

### 14.3 API Security
- Helmet.js: sets secure HTTP headers (HSTS, X-Frame-Options, CSP, etc.)
- CORS: allow only specific origins (frontend domain + localhost in dev)
- Rate limiting via `express-rate-limit` + Redis store:
  - Auth endpoints: 10 req/min per IP
  - AI endpoints: 20 req/min per user
  - General API: 100 req/min per user
- Request size limit: 10 MB max body

### 14.4 Data Security
- Encryption at rest: MongoDB Atlas encryption + field-level encryption for OAuth tokens, 2FA secrets
- Encryption in transit: HTTPS everywhere, WSS for WebSocket
- S3 buckets: private by default, presigned URLs for access (15-min expiry)
- PII: store only necessary user data, allow account deletion (GDPR Article 17)
- Audit log: record sensitive actions (login, plan change, permission change, delete)

### 14.5 Public Link Security
- Tokens are cryptographically random (64-byte hex)
- Optional password hashing (bcrypt) stored alongside token
- Rate limit public link access: 100 views/hour per IP per link
- Public links do NOT expose user's email or internal IDs

---

## 15. Performance Requirements

### 15.1 Load Targets
| Metric | Target |
|--------|--------|
| Page initial load (TTI) | < 2 seconds on 4G |
| Diagram render (100 nodes) | < 500ms |
| Diagram render (1000 nodes) | < 2 seconds |
| API response time (p95) | < 300ms |
| WebSocket latency | < 200ms |
| AI generation (first token) | < 3 seconds |

### 15.2 Optimization Strategies
- **Frontend:** Code splitting per route, lazy load heavy libs (Monaco, React Flow), image compression
- **Backend:** Index MongoDB on `workspaceId`, `createdBy`, `isTrashed`, `updatedAt`; Redis caching for frequently read data (templates, user plan)
- **Real-time:** Redis pub/sub for horizontal Socket.io scaling (multiple Node processes)
- **Large diagrams:** Virtualize node rendering (only render visible viewport)
- **Thumbnails:** Auto-generate diagram thumbnail on save (server-side Puppeteer → S3), serve via CDN

### 15.3 Database Indexes
```javascript
// Diagrams
{ workspaceId: 1, isTrashed: 1, updatedAt: -1 }
{ workspaceId: 1, projectId: 1, isTrashed: 1 }
{ publicLinkToken: 1 }
{ "starredBy": 1 }

// Users
{ email: 1 } // unique
{ razorpayContactId: 1 }

// Notifications
{ userId: 1, read: 1, createdAt: -1 }

// Comments
{ diagramId: 1, parentId: 1, createdAt: 1 }
```

---

## 16. Edge Cases & Error Handling

### 16.1 Diagram Engine Edge Cases
| Scenario | Handling |
|----------|----------|
| Syntax parse error | Show error line, render last valid state |
| Circular reference in graph | Detect cycle, render with warning badge |
| 500+ nodes | Show performance warning, offer to enable simplified view |
| Empty diagram | Show placeholder "Start typing or drag a node" |
| Self-loop edge | Render as curved arc on same node |
| Node with no label | Render with "(unnamed)" placeholder |
| Duplicate node IDs in code | Deduplicate, warn user |
| Unicode / RTL text in labels | Render correctly, test with Arabic/Hebrew |

### 16.2 Collaboration Edge Cases
| Scenario | Handling |
|----------|----------|
| Network split: 2 users diverge | On reconnect: full-sync to server state, notify user |
| User deletes node being edited by another | Other user's panel closes, shows toast "Node was deleted" |
| Owner deletes workspace while members active | Notify all members, redirect to home |
| Max collaborators reached | Show "Upgrade to add more" message |
| WebSocket reconnection | Auto-reconnect with exponential backoff, re-join room |

### 16.3 AI Edge Cases
| Scenario | Handling |
|----------|----------|
| AI returns no content | Retry once, then show "AI couldn't generate a diagram" |
| AI returns markdown code block | Strip ` ```mermaid ``` ` wrapper, use inner content |
| Prompt in non-English | AI will respond; if diagram syntax has issues, show error |
| Very long diagram syntax as context | Truncate to last 4000 tokens before sending |
| AI API key invalid/expired | Fallback to secondary provider; alert admin via Sentry |

### 16.4 Payment Edge Cases
| Scenario | Handling |
|----------|----------|
| Payment fails | Razorpay fires `payment.failed` webhook → email user, grace period 3 days, then downgrade to Free |
| Subscription cancelled mid-month | Keep Pro access until period ends, then downgrade |
| Refund issued | Razorpay fires `refund.created` webhook → downgrade plan |
| Workspace exceeds free diagram limit | Block new diagram creation, show upgrade prompt |
| Team member removed during billing cycle | No proration by default, adjust on next cycle |

### 16.5 File & Storage Edge Cases
| Scenario | Handling |
|----------|----------|
| S3 upload fails | Retry 3x with backoff, return error to user if all fail |
| File storage limit reached | Block export to S3, suggest clearing old exports |
| Export job times out | Mark job as failed, notify user, allow retry |
| Corrupt diagram JSON in DB | Return empty diagram with error toast, log to Sentry |

---

## 17. Non-Functional Requirements

### 17.1 Accessibility
- WCAG 2.1 AA compliance
- Keyboard-navigable canvas (Tab through nodes, Enter to edit)
- Screen reader support for notes editor
- Color contrast ratios met for all text
- Focus indicators on all interactive elements

### 17.2 Internationalization (i18n)
- UI strings externalized (i18next)
- Date/time formatted per user locale
- RTL layout support (Phase 2)
- Currency formatting per locale for billing

### 17.3 Scalability
- Backend: stateless Node.js processes, horizontally scalable
- Socket.io: Redis adapter for multi-instance pub/sub
- MongoDB: Atlas auto-scaling or Atlas Serverless
- Queue workers: separate process, scalable independently

### 17.4 Availability
- Target: 99.9% uptime (< 9 hours downtime/year)
- Database: MongoDB Atlas replication (3-node replica set)
- Graceful degradation: if AI service down → disable AI features with message, not full outage

### 17.5 Compliance
- GDPR: right to access, right to delete, data portability (export all data)
- CCPA: do not sell data
- Cookie consent banner
- Privacy Policy + Terms of Service pages
- Data Processing Agreement (DPA) for Team/Enterprise customers

---

## 18. Development Roadmap

### Phase 1: Foundation (Weeks 1–4)
- [ ] Monorepo setup (Nx or Turborepo)
- [ ] Docker Compose: MongoDB + Redis
- [ ] Express server: base structure, middleware, error handler
- [ ] Auth: register, login, JWT, refresh token, email verification
- [ ] React app: Vite + TypeScript + Tailwind setup
- [ ] Auth pages: Login, Register, Forgot Password
- [ ] Dashboard layout (sidebar, header)
- [ ] Diagram CRUD: create, list, open, delete
- [ ] Basic canvas: React Flow with drag-drop nodes and edges
- [ ] Save diagram to MongoDB

### Phase 2: Core Diagram (Weeks 5–8)
- [ ] Monaco Editor integration (code panel)
- [ ] Custom syntax parser (tokenizer + AST → React Flow nodes/edges)
- [ ] Live sync: code panel ↔ visual canvas (bidirectional)
- [ ] Diagram types: flowchart, sequence, UML, ERD
- [ ] Undo/redo (Zustand history)
- [ ] Auto-layout (Dagre)
- [ ] Notes editor (TipTap) linked to each diagram
- [ ] Export: PNG, SVG (client-side)
- [ ] Version history (auto-save versions)
- [ ] Templates: 10 built-in templates

### Phase 3: AI Features (Weeks 9–12)
- [ ] Claude API integration
- [ ] Prompt → diagram (streaming SSE)
- [ ] AI refine: follow-up conversation per diagram
- [ ] AI explain selected node
- [ ] AI improve (suggestions panel)
- [ ] AI auto-fix syntax errors
- [ ] AI usage counters (Redis)
- [ ] AI usage UI (show remaining credits)

### Phase 4: Collaboration (Weeks 13–16)
- [ ] Socket.io server with room management
- [ ] Real-time diagram sync (JSON patch)
- [ ] Cursor presence (live cursors)
- [ ] Comments on canvas
- [ ] Invite collaborators by email
- [ ] Permission roles system
- [ ] Public share link

### Phase 5: Billing & Launch (Weeks 17–20)
- [ ] Razorpay integration: plans, checkout (hosted/embedded), webhooks
- [ ] Plan enforcement on all features
- [ ] Email notifications (Nodemailer + templates)
- [ ] Notification center (in-app)
- [ ] Search (MongoDB full-text)
- [ ] Trash + restore
- [ ] Workspace activity log
- [ ] Server-side export (Puppeteer + BullMQ + S3)
- [ ] GDPR: account deletion, data export
- [ ] Landing page
- [ ] Error monitoring (Sentry)
- [ ] Analytics (PostHog)
- [ ] Beta launch

### Phase 6: Growth (Weeks 21+)
- [ ] Mobile PWA optimization
- [ ] API access for developers (API keys)
- [ ] Zapier / Make.com integration
- [ ] Confluence / Notion embed support
- [ ] Enterprise SSO (SAML)
- [ ] Custom domain for public pages
- [ ] AI-powered diagram search ("find all diagrams with a payment service")

---

## 19. Third-Party Services

| Service | Purpose | Alternatives |
|---------|---------|-------------|
| MongoDB Atlas | Database | Self-hosted MongoDB |
| Redis Cloud / Upstash | Cache + pub/sub | Self-hosted Redis |
| Anthropic Claude API | AI generation | OpenAI GPT-4o |
| Razorpay | Payments (India-first, global) | Paddle, LemonSqueezy |
| AWS S3 / Cloudflare R2 | File storage | Supabase Storage |
| AWS SES / Resend | Transactional email | SendGrid, Postmark |
| Cloudflare | CDN + DDoS protection | AWS CloudFront |
| Sentry | Error monitoring | Rollbar, Datadog |
| PostHog | Product analytics | Mixpanel, Amplitude |
| GitHub Actions | CI/CD | CircleCI, GitLab CI |
| Vercel | Frontend hosting | Netlify, Cloudflare Pages |
| AWS EC2 / Railway | Backend hosting | Render, Fly.io |
| Docker + Docker Compose | Full-stack containerisation (dev & prod) | Podman |

---

## 20. Environment & DevOps

### 20.1 Environment Variables (Backend)
```env
NODE_ENV=development|production
PORT=5000

# MongoDB
MONGODB_URI=mongodb+srv://...

# Redis
REDIS_URL=redis://...

# JWT
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# AI
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=... (fallback)

# Email
EMAIL_FROM=noreply@yourdomain.com
RESEND_API_KEY=...

# Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
AWS_REGION=...

# Razorpay
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
RAZORPAY_PRO_PLAN_ID=...
RAZORPAY_TEAM_PLAN_ID=...

# App
FRONTEND_URL=https://yourdomain.com
ENCRYPTION_KEY=... (32-byte hex for field-level encryption)
```

### 20.2 CI/CD Pipeline (GitHub Actions)
```
On PR:
  → Lint (ESLint + Prettier)
  → Type check (tsc --noEmit)
  → Unit tests (Jest)
  → Build check

On merge to main:
  → All PR checks
  → Integration tests
  → Deploy frontend to Vercel
  → Deploy backend to EC2/Railway
  → Run DB migrations
  → Notify team on Slack
```

### 20.3 Folder Structure
```
/
├── apps/
│   ├── frontend/          # React + Vite
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   │   ├── canvas/
│   │   │   │   ├── editor/
│   │   │   │   ├── notes/
│   │   │   │   ├── ai/
│   │   │   │   └── ui/
│   │   │   ├── hooks/
│   │   │   ├── stores/      # Zustand
│   │   │   ├── services/    # API calls
│   │   │   ├── types/
│   │   │   └── utils/
│   └── backend/           # Node + Express
│       ├── src/
│       │   ├── routes/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── models/      # Mongoose
│       │   ├── middleware/
│       │   ├── jobs/        # BullMQ workers
│       │   ├── sockets/     # Socket.io handlers
│       │   ├── utils/
│       │   └── types/
├── packages/
│   ├── shared-types/      # Shared TypeScript types
│   ├── diagram-parser/    # Custom syntax parser (shared)
│   └── ui/                # Shared React components (optional)
├── docker-compose.yml
├── .github/
│   └── workflows/
└── README.md
```

---

## Appendix A: Diagram Syntax Specification (v1.0)

### Node Types
| Syntax | Shape | Use Case |
|--------|-------|---------|
| `[Label]` | Rectangle | Process, step |
| `{Label}` | Diamond | Decision |
| `(Label)` | Rounded rect | Start/End |
| `((Label))` | Circle | Event |
| `[/Label/]` | Parallelogram | Input/Output |
| `[[Label]]` | Double rect | Subprocess |
| `>Label]` | Arrow shape | Manual input |

### Edge Types
| Syntax | Arrow | Meaning |
|--------|-------|---------|
| `-->` | Solid arrow | Flow |
| `---` | Solid line | Association |
| `-.->`| Dashed arrow | Optional/async |
| `==>` | Thick arrow | Critical path |
| `-- Label -->` | Labeled arrow | Conditional |

### Sequence Syntax
```
@sequence
Actor1 -> Actor2: Message
Actor2 --> Actor1: Response
Actor1 ->> Actor3: Async call
note over Actor2: Note text
```

---

## Appendix B: Error Codes

| Code | HTTP Status | Meaning |
|------|------------|---------|
| `AUTH_REQUIRED` | 401 | No valid token |
| `AUTH_EXPIRED` | 401 | Token expired |
| `FORBIDDEN` | 403 | No permission |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input |
| `PLAN_LIMIT_REACHED` | 402 | Feature requires upgrade |
| `AI_LIMIT_REACHED` | 429 | Monthly AI quota used |
| `RATE_LIMITED` | 429 | Too many requests |
| `AI_UNAVAILABLE` | 503 | AI service down |
| `CONFLICT` | 409 | Version conflict / resource exists |
| `INTERNAL_ERROR` | 500 | Server error |

---

*Document version: 1.0 | Last updated: March 2026*
*This document covers all MVP + Growth phase requirements. Review and update before each phase kick-off.*
