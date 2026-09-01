# Skemly API Endpoints Catalog & Frontend Connection Map

This catalog acts as the single source of truth for all REST API endpoints exposed by the Skemly backend (`/api/v1`) and how the frontend maps to them.

---

## 1. Authentication Module (`/api/v1/auth`)
Base route: `http://localhost:5000/api/v1/auth`

| HTTP Method | Path | Authentication | Description | Frontend Store/Page |
|:---|:---|:---|:---|:---|
| **POST** | `/register` | Public (Rate-limited) | Register a new user account | `RegisterPage.tsx` -> `authStore.ts` |
| **POST** | `/login` | Public (Rate-limited) | Sign in with email and password | `LoginPage.tsx` -> `authStore.ts` |
| **POST** | `/logout` | Bearer Token | Revoke access tokens and sign out | `Navbar` -> `authStore.ts` |
| **POST** | `/refresh-token` | Cookies (refresh) | Request a new access token | `api.ts` Response Interceptor |
| **POST** | `/forgot-password` | Public (Rate-limited) | Trigger password reset email | `ForgotPasswordPage.tsx` |
| **POST** | `/reset-password` | Public | Reset password with token | `ResetPasswordPage.tsx` |
| **POST** | `/verify-email` | Public | Confirm user email address | `VerifyEmailPage.tsx` |
| **GET** | `/me` | Bearer Token | Get current authenticated user profile | `authStore.ts` -> `fetchUser()` |
| **PUT** | `/me` | Bearer Token | Update name, avatar, or preferences | `SettingsPage.tsx` |
| **DELETE** | `/sessions/:sessionId`| Bearer Token | Revoke specific active user session | `SettingsPage.tsx` (Sessions Tab) |
| **GET** | `/google` | OAuth | Initiate Google authentication | `LoginPage.tsx` (Google Button) |
| **GET** | `/github` | OAuth | Initiate GitHub authentication | `LoginPage.tsx` (GitHub Button) |
| **GET** | `/providers/status` | Public | Check if OAuth providers are configured | `DebugPage.tsx` |

---

## 2. Workspace Module (`/api/v1/workspaces`)
Base route: `http://localhost:5000/api/v1/workspaces`

| HTTP Method | Path | Authentication | Description | Frontend Store/Page |
|:---|:---|:---|:---|:---|
| **GET** | `/` | Bearer Token | List all workspaces for user | `workspaceStore.ts` -> `fetchWorkspaces()` |
| **POST** | `/` | Bearer Token | Create a new team/personal workspace | `CreateWorkspaceModal.tsx` |
| **GET** | `/:id` | Bearer Token | Get workspace details | `workspaceStore.ts` |
| **PUT** | `/:id` | Bearer Token | Rename or update workspace icon | `WorkspaceSettingsPage.tsx` |
| **DELETE** | `/:id` | Bearer Token | Delete workspace (owner only) | `WorkspaceSettingsPage.tsx` |
| **GET** | `/:id/members` | Bearer Token | List members of a workspace | `WorkspaceMembersTab.tsx` |
| **POST** | `/:id/invite` | Bearer Token | Invite user by email | `InviteMemberModal.tsx` |
| **POST** | `/invitations/accept` | Bearer Token | Accept an active invitation | `WorkspaceList.tsx` / Accept URL |
| **DELETE** | `/:id/members/:userId`| Bearer Token | Remove member from workspace | `WorkspaceMembersTab.tsx` |
| **PUT** | `/:id/members/:userId/role`| Bearer Token| Change member role (viewer -> editor) | `WorkspaceMembersTab.tsx` |
| **POST** | `/:id/transfer-ownership`| Bearer Token| Transfer workspace ownership | `WorkspaceSettingsPage.tsx` |
| **GET** | `/:id/activity` | Bearer Token | Retrieve audit log of user activities | `WorkspaceDashboard.tsx` |

---

## 3. Project Module (`/api/v1/workspaces/:wsId/projects`)
Base route: `http://localhost:5000/api/v1/workspaces/:wsId/projects`

| HTTP Method | Path | Authentication | Description | Frontend Store/Page |
|:---|:---|:---|:---|:---|
| **GET** | `/` | Bearer Token | List projects inside workspace | `projectStore.ts` -> `fetchProjects()` |
| **POST** | `/` | Bearer Token | Create a new project folder | `CreateProjectModal.tsx` |
| **PUT** | `/:id` | Bearer Token | Rename or edit project properties | `ProjectSettings.tsx` |
| **DELETE** | `/:id` | Bearer Token | Delete project and move diagrams to root| `ProjectSettings.tsx` |

---

## 4. Diagram Module (`/api/v1/diagrams`)
Base route: `http://localhost:5000/api/v1/diagrams`

| HTTP Method | Path | Authentication | Description | Frontend Store/Page |
|:---|:---|:---|:---|:---|
| **GET** | `/` | Bearer Token | List active diagrams | `diagramStore.ts` -> `fetchDiagrams()` |
| **POST** | `/` | Bearer Token | Create new empty diagram/canvas | `DiagramNewPage.tsx` |
| **GET** | `/public/:token` | Optional Auth | View public shared diagram | `PublicDiagramPage.tsx` |
| **GET** | `/:id` | Bearer Token | Get specific diagram canvas node tree | `DiagramEditorPage.tsx` |
| **PUT** | `/:id` | Bearer Token (OCC) | Update nodes, edges, version (OCC matches) | `DiagramEditorPage.tsx` -> `diagramStore.ts` |
| **DELETE** | `/:id` | Bearer Token | Hard delete diagram | `DashboardPage.tsx` |
| **POST** | `/:id/duplicate` | Bearer Token | Clone a diagram | `DashboardPage.tsx` |
| **POST** | `/:id/star` | Bearer Token | Add diagram to starred list | `DashboardPage.tsx` / Editor |
| **DELETE** | `/:id/star` | Bearer Token | Remove diagram from starred list | `DashboardPage.tsx` / Editor |
| **POST** | `/:id/trash` | Bearer Token | Soft-delete to Trash bin | `DashboardPage.tsx` / Editor |
| **POST** | `/:id/restore` | Bearer Token | Restore diagram from Trash bin | `TrashTab.tsx` |
| **POST** | `/:id/share` | Bearer Token | Generate public sharing access token | `ShareModal.tsx` |
| **DELETE** | `/:id/share` | Bearer Token | Revoke public sharing access token | `ShareModal.tsx` |
| **GET** | `/:id/versions` | Bearer Token | List manual/auto save checkpoints | `HistoryPanel.tsx` |
| **POST** | `/:id/versions` | Bearer Token | Save a named version checkpoint | `HistoryPanel.tsx` |
| **GET** | `/:id/versions/:vId` | Bearer Token | Fetch nodes/edges of historical version | `HistoryPanel.tsx` |
| **POST** | `/:id/versions/:vId/restore`| Bearer Token| Restore diagram to specific checkpoint | `HistoryPanel.tsx` |

---

## 5. Comment Module (`/api/v1/diagrams/:id/comments`)
Base route: `http://localhost:5000/api/v1/diagrams/:id/comments`

| HTTP Method | Path | Authentication | Description | Frontend Store/Page |
|:---|:---|:---|:---|:---|
| **GET** | `/` | Bearer Token | Get comment list for diagram | `CommentSection.tsx` |
| **POST** | `/` | Bearer Token | Post a new comment | `CommentSection.tsx` |
| **PUT** | `/:commentId` | Bearer Token | Edit comment body | `CommentSection.tsx` |
| **DELETE** | `/:commentId` | Bearer Token | Delete comment | `CommentSection.tsx` |
| **POST** | `/:commentId/resolve`| Bearer Token| Mark comment thread resolved | `CommentSection.tsx` |
| **POST** | `/:commentId/reply`| Bearer Token| Reply to an existing comment | `CommentSection.tsx` |

---

## 6. AI Module (`/api/v1/ai`)
Base route: `http://localhost:5000/api/v1/ai`

| HTTP Method | Path | Authentication | Description | Frontend Store/Page |
|:---|:---|:---|:---|:---|
| **POST** | `/generate` | Bearer Token | Generate diagram from natural text prompt | `DiagramNewPage.tsx` / AI Panel |
| **POST** | `/generate/stream`| Bearer Token | Stream generated text/JSON chunks | `AIStreamPanel.tsx` |
| **POST** | `/code-to-diagram`| Bearer Token | Parse code snippets into diagram nodes | `CodeImportModal.tsx` |
| **POST** | `/explain` | Bearer Token | Explain architectural tradeoffs of selection| `AIPanel.tsx` (Explain) |
| **POST** | `/improve` | Bearer Token | Enhance layout, spacing, and styles via LLM| `AIPanel.tsx` (Optimize) |
| **POST** | `/autofix` | Bearer Token | Repair syntax/structural bugs | `AIPanel.tsx` (Autofix) |
| **POST** | `/review` | Bearer Token | Generate standard review scorecards | `ArchitectureReviewModal.tsx` |
| **POST** | `/tradeoffs` | Bearer Token | Perform comparative architecture tradeoff reviews | `TradeoffAnalysisModal.tsx` |
| **GET** | `/usage` | Bearer Token | Get current workspace AI query token usage | `BillingPage.tsx` |

---

## 7. Export Module (`/api/v1/export`)
Base route: `http://localhost:5000/api/v1/export`

| HTTP Method | Path | Authentication | Description | Frontend Store/Page |
|:---|:---|:---|:---|:---|
| **POST** | `/png` | Bearer Token | Export diagram to high-resolution PNG image | `ExportModal.tsx` |
| **POST** | `/svg` | Bearer Token | Export diagram to raw XML SVG vector | `ExportModal.tsx` |
| **POST** | `/pdf` | Bearer Token | Export diagram canvas to print PDF | `ExportModal.tsx` |
| **POST** | `/syntax` | Bearer Token | Export diagram code (JSON/Ir representation) | `ExportModal.tsx` |
| **GET** | `/status/:jobId`| Bearer Token | Check active export background worker status| `ExportModal.tsx` (Polling) |
| **GET** | `/download/:fileId`| Bearer Token| Download finalized artifact from AWS S3 | `ExportModal.tsx` |

---

## 8. Billing Module (`/api/v1/billing`)
Base route: `http://localhost:5000/api/v1/billing`

| HTTP Method | Path | Authentication | Description | Frontend Store/Page |
|:---|:---|:---|:---|:---|
| **GET** | `/plans` | Public | List available subscription tiers | `BillingPage.tsx` |
| **GET** | `/subscription` | Bearer Token | Get workspace current billing status | `BillingPage.tsx` |
| **POST** | `/subscribe` | Bearer Token | Create Razorpay order for subscription | `BillingPage.tsx` (Upgrade) |
| **POST** | `/verify-payment`| Bearer Token | Confirm Razorpay payment signature | `BillingPage.tsx` (Callback) |
| **POST** | `/cancel` | Bearer Token | Cancel auto-renewal of subscription | `BillingPage.tsx` |
| **POST** | `/portal` | Bearer Token | Generate customer support billing portal url | `BillingPage.tsx` |
| **POST** | `/webhook` | Signature | Handle asynchronous payment updates | Razorpay System Callback |

---

## 9. Notes Module (`/api/v1/notes`)
Base route: `http://localhost:5000/api/v1/notes`

| HTTP Method | Path | Authentication | Description | Frontend Store/Page |
|:---|:---|:---|:---|:---|
| **GET** | `/:diagramId` | Bearer Token | Fetch wiki markdown associated with canvas | `NotesPanel.tsx` |
| **PUT** | `/:diagramId` | Bearer Token | Save new notes markdown | `NotesPanel.tsx` |
| **GET** | `/:diagramId/versions`| Bearer Token| View history of notes changes | `NotesHistoryPanel.tsx` |
| **POST** | `/:diagramId/publish`| Bearer Token| Publish note to public workspace view | `NotesPanel.tsx` |
| **DELETE** | `/:diagramId/publish`| Bearer Token| Make note private again | `NotesPanel.tsx` |

---

## 10. Notifications Module (`/api/v1/notifications`)
Base route: `http://localhost:5000/api/v1/notifications`

| HTTP Method | Path | Authentication | Description | Frontend Store/Page |
|:---|:---|:---|:---|:---|
| **GET** | `/` | Bearer Token | Retrieve user unread/read messages | `NotificationBell.tsx` |
| **PUT** | `/:id/read` | Bearer Token | Mark a single notification read | `NotificationBell.tsx` |
| **POST** | `/read-all` | Bearer Token | Mark all notifications read | `NotificationBell.tsx` |
| **DELETE** | `/:id` | Bearer Token | Delete notification | `NotificationBell.tsx` |
| **PUT** | `/preferences`| Bearer Token | Set user notification levels (email, push) | `SettingsPage.tsx` |

---

## 11. Search Module (`/api/v1/search`)
Base route: `http://localhost:5000/api/v1/search`

| HTTP Method | Path | Authentication | Description | Frontend Store/Page |
|:---|:---|:---|:---|:---|
| **GET** | `/` | Bearer Token | Unified search across diagrams, workspaces | `CommandPalette.tsx` |

---

## 12. Template Module (`/api/v1/templates`)
Base route: `http://localhost:5000/api/v1/templates`

| HTTP Method | Path | Authentication | Description | Frontend Store/Page |
|:---|:---|:---|:---|:---|
| **GET** | `/` | Public | List all templates | `TemplatesPage.tsx` |
| **POST** | `/` | Bearer Token | Create custom reusable template | `TemplatesPage.tsx` |
| **GET** | `/:id` | Public | Fetch specific template metadata | `TemplateDetails.tsx` |
| **DELETE** | `/:id` | Bearer Token | Delete user-created template | `TemplatesPage.tsx` |
| **POST** | `/:id/use` | Bearer Token | Clone template into active workspace | `TemplatesPage.tsx` |
