// AI Prompt Templates for Diagram Generation
// Optimized for high-quality diagram output using prompt engineering best practices

export interface AIPromptTemplate {
  id: string;
  name: string;
  description: string;
  category: 'flowchart' | 'architecture' | 'data' | 'uml' | 'sequence' | 'mindmap' | 'custom';
  systemPrompt: string;
  userPromptTemplate: string;
  exampleInput: string;
  exampleOutput: string;
  icon: string;
}

export const DIAGRAM_SYSTEM_BASE = `You are an expert diagram generator specializing in Skemly's text-based diagram syntax. Your task is to convert natural language descriptions into precise, well-structured diagram code.

RULES:
1. Use clear, descriptive node labels
2. Keep node names concise (1-3 words preferred)
3. Use appropriate node types:
   - (Label) for start/end points
   - [Label] for processes/tasks
   - {Label} for decisions/questions
   - [[Label]] for databases/storage
   - >Label] for input/output
4. Connect nodes with --> arrows
5. Use -- Label --> for labeled connections
6. Group related nodes logically
7. Add comments with // for complex sections
8. Ensure the diagram flows top-to-bottom or left-to-right
9. Use meaningful colors when appropriate (will be auto-applied)
10. Validate all connections are complete

OUTPUT FORMAT:
Respond ONLY with the diagram code. No markdown formatting, no explanations, just the raw diagram syntax that can be directly copied into the editor.`;

export const AI_PROMPT_TEMPLATES: AIPromptTemplate[] = [
  {
    id: 'flowchart-process',
    name: 'Process Flowchart',
    description: 'Standard flowchart for business processes, algorithms, or workflows',
    category: 'flowchart',
    systemPrompt: `${DIAGRAM_SYSTEM_BASE}

FOCUS: Process flowcharts with clear decision points, loops, and sequential steps.

NODE TYPE GUIDELINES:
- Start with (Start) and end with (End)
- Use [Verb + Noun] format for actions: [Validate Input], [Process Payment]
- Use {Yes/No Question} format for decisions: {Valid?}, {Approved?}
- Include error paths and success paths
- Show loops for retry logic`,
    userPromptTemplate: `Create a flowchart for: {description}

Requirements:
- Include all decision points
- Show both success and error paths
- Add any retry loops if applicable
- Keep node labels concise`,
    exampleInput: 'User login process with validation, 2FA check, and error handling',
    exampleOutput: `(Start) --> [Enter Credentials]
[Enter Credentials] --> {Valid Format?}
{Valid Format?} -- No --> [Show Error] --> (End)
{Valid Format?} -- Yes --> [Check Database]
[Check Database] --> {User Found?}
{User Found?} -- No --> [Show Error] --> (End)
{User Found?} -- Yes --> [Verify Password]
[Verify Password] --> {Password Match?}
{Password Match?} -- No --> {Attempts < 3?}
{Attempts < 3?} -- Yes --> [Increment Counter] --> [Enter Credentials]
{Attempts < 3?} -- No --> [Lock Account] --> (End)
{Password Match?} -- Yes --> {2FA Enabled?}
{2FA Enabled?} -- No --> [Create Session] --> [Dashboard] --> (End)
{2FA Enabled?} -- Yes --> [Send 2FA Code]
[Send 2FA Code] --> [Verify 2FA]
[Verify 2FA] --> {Code Valid?}
{Code Valid?} -- No --> [Show Error] --> (End)
{Code Valid?} -- Yes --> [Create Session] --> [Dashboard] --> (End)`,
    icon: 'GitBranch',
  },
  {
    id: 'system-architecture',
    name: 'System Architecture',
    description: 'High-level system design with microservices, databases, and APIs',
    category: 'architecture',
    systemPrompt: `${DIAGRAM_SYSTEM_BASE}

FOCUS: System architecture diagrams showing services, databases, external APIs, and data flow.

NODE TYPE GUIDELINES:
- Use [Service Name] for microservices
- Use [[Database Name]] for databases
- Use external icons for third-party services (prefix with cloud_)
- Group related services visually
- Show API gateway patterns
- Include load balancers where applicable
- Show data flow direction clearly`,
    userPromptTemplate: `Design a system architecture for: {description}

Include:
- Frontend clients (web, mobile, etc.)
- API Gateway / Load Balancer
- Core microservices
- Databases (specify type: SQL, NoSQL, Cache)
- External integrations
- Message queues if async processing needed`,
    exampleInput: 'E-commerce platform with user service, product catalog, order processing, payment, and notification system',
    exampleOutput: `[Client Apps] --> [CDN]
[CDN] --> [Load Balancer]
[Load Balancer] --> [API Gateway]

[API Gateway] --> [Auth Service]
[API Gateway] --> [User Service]
[API Gateway] --> [Product Service]
[API Gateway] --> [Cart Service]
[API Gateway] --> [Order Service]

[User Service] --> [[User DB]]
[Product Service] --> [[Product DB]]
[Product Service] --> [[Redis Cache]]
[Cart Service] --> [[Redis Cart]]
[Order Service] --> [[Order DB]]

[Order Service] --> [Payment Gateway]
[Payment Service] --> [[Payment DB]]
[Payment Gateway] --> [Stripe API]
[Payment Gateway] --> [PayPal API]

[Order Service] --> [Message Queue]
[Message Queue] --> [Notification Service]
[Notification Service] --> [Email Service]
[Notification Service] --> [SMS Gateway]
[Notification Service] --> [Push Service]

[Inventory Service] --> [Product Service]
[Inventory Service] --> [[Inventory DB]]
[Order Service] --> [Inventory Service]`,
    icon: 'Server',
  },
  {
    id: 'erd-database',
    name: 'Database ERD',
    description: 'Entity Relationship Diagram showing tables, relationships, and keys',
    category: 'data',
    systemPrompt: `${DIAGRAM_SYSTEM_BASE}

FOCUS: Entity Relationship Diagrams with tables, relationships, primary/foreign keys, and cardinality.

NODE TYPE GUIDELINES:
- Use [[TableName]] for database tables
- Show relationships with --> arrows
- Label relationships with cardinality: 1--1, 1--*, *--*
- Include key fields in brackets: id, name, email, etc.
- Group related tables together
- Show junction tables for many-to-many`,
    userPromptTemplate: `Create an ERD for: {description}

Requirements:
- Define all tables with primary keys
- Show foreign key relationships
- Indicate cardinality (1:1, 1:N, M:N)
- Include important fields for each table
- Show junction tables where needed`,
    exampleInput: 'Blog platform with users, posts, categories, tags, comments, and likes',
    exampleOutput: `[[Users]] --> 1--* [[Posts]]
[[Users]] --> 1--* [[Comments]]
[[Users]] --> 1--* [[Likes]]

[[Posts]] --> *--1 [[Categories]]
[[Posts]] --> 1--* [[Comments]]
[[Posts]] --> 1--* [[Likes]]
[[Posts]] --> *--* [[Tags]]

[[Posts]] --> *--* [[Post_Tags]]
[[Post_Tags]] --> *--1 [[Tags]]

[[Comments]] --> *--1 [[Users]]
[[Comments]] --> 1--* [[Comments]]

[[Users]] [id, username, email, created_at]
[[Posts]] [id, user_id, category_id, title, content, published, created_at]
[[Categories]] [id, name, slug]
[[Comments]] [id, post_id, user_id, parent_id, content, created_at]
[[Tags]] [id, name, slug]
[[Post_Tags]] [post_id, tag_id]
[[Likes]] [id, user_id, post_id, created_at]`,
    icon: 'Database',
  },
  {
    id: 'sequence-diagram',
    name: 'Sequence Diagram',
    description: 'Show interactions between actors/objects over time',
    category: 'sequence',
    systemPrompt: `${DIAGRAM_SYSTEM_BASE}

FOCUS: Sequence diagrams showing actors, objects, lifelines, and message flows.

SYNTAX:
- Use actor: prefix for human actors
- Use participant: prefix for system objects
- Use ->> for solid arrows (synchronous)
- Use -->> for dashed arrows (return/async)
- Activate/deactivate lifelines with activate/deactivate
- Group with alt/opt/loop/par blocks`,
    userPromptTemplate: `Create a sequence diagram for: {description}

Include:
- All participating actors and objects
- Message flows in chronological order
- Activation bars for method execution
- Return messages
- Alternative paths (if/else) where applicable
- Loop constructs if needed`,
    exampleInput: 'OAuth2 authentication flow between user, browser, auth server, and resource server',
    exampleOutput: `actor: User
participant: Browser
participant: AuthServer
participant: ResourceServer

User ->> Browser: Click Login
Browser ->> AuthServer: GET /authorize\n(client_id, redirect_uri)
AuthServer -->> Browser: Login Page

User ->> Browser: Enter Credentials
Browser ->> AuthServer: POST /login\n(username, password)

activate AuthServer
AuthServer ->> AuthServer: Validate User
AuthServer -->> Browser: Redirect + Auth Code
deactivate AuthServer

Browser ->> AuthServer: POST /token\n(auth_code, client_secret)

activate AuthServer
AuthServer ->> AuthServer: Verify Code
AuthServer ->> ResourceServer: GET /user_info
ResourceServer -->> AuthServer: User Data
AuthServer -->> Browser: Access Token
deactivate AuthServer

Browser ->> ResourceServer: GET /api/data\n(Authorization: Bearer token)
ResourceServer -->> Browser: Protected Data`,
    icon: 'Activity',
  },
  {
    id: 'mindmap',
    name: 'Mind Map',
    description: 'Hierarchical idea visualization with central topic and branches',
    category: 'mindmap',
    systemPrompt: `${DIAGRAM_SYSTEM_BASE}

FOCUS: Mind maps with central topic, main branches, and sub-branches.

SYNTAX:
- Use ((Central Topic)) for the root
- Use indentation (2 spaces) for hierarchy
- Use [Branch] for main branches
- Use (Sub-branch) for sub-items
- Keep related ideas grouped
- Use verbs for actions, nouns for concepts`,
    userPromptTemplate: `Create a mind map for: {description}

Structure:
- Central topic in the middle
- 4-6 main branches radiating out
- 2-4 sub-branches per main branch
- Use concise labels (1-3 words)`,
    exampleInput: 'Project planning phases from initiation to deployment',
    exampleOutput: `((Project Management))
  [Initiation]
    (Define Scope)
    (Stakeholders)
    (Feasibility)
    (Budget Estimate)
  [Planning]
    (Work Breakdown)
    (Timeline)
    (Resource Plan)
    (Risk Analysis)
  [Execution]
    (Task Assignment)
    (Daily Standups)
    (Progress Tracking)
    (Quality Checks)
  [Monitoring]
    (KPI Dashboard)
    (Burndown Chart)
    (Risk Review)
    (Change Control)
  [Closure]
    (Deliverables)
    (Documentation)
    (Lessons Learned)
    (Team Release)`,
    icon: 'GitMerge',
  },
  {
    id: 'class-diagram',
    name: 'Class Diagram',
    description: 'UML class diagram with inheritance, associations, and methods',
    category: 'uml',
    systemPrompt: `${DIAGRAM_SYSTEM_BASE}

FOCUS: UML class diagrams showing classes, attributes, methods, and relationships.

SYNTAX:
- Use class ClassName { ... } format
- List attributes with type: - name: string
- List methods with params: + method(): returnType
- Use <|-- for inheritance (arrow points to parent)
- Use <-- for association
- Use <--* for composition
- Use <--o for aggregation
- Label associations with : label`,
    userPromptTemplate: `Create a class diagram for: {description}

Requirements:
- Define all classes with attributes
- Include key methods
- Show inheritance relationships
- Show associations with cardinality
- Use proper visibility (+ public, - private, # protected)`,
    exampleInput: 'E-commerce domain with users, products, orders, shopping cart, and payment',
    exampleOutput: `class User {
  - id: UUID
  - email: string
  - passwordHash: string
  - name: string
  + login(): boolean
  + logout(): void
  + updateProfile(): void
}

class Product {
  - id: UUID
  - name: string
  - price: decimal
  - stock: int
  + getPrice(): decimal
  + isAvailable(): boolean
}

class Cart {
  - id: UUID
  - userId: UUID
  - items: CartItem[]
  + addItem(product, qty): void
  + removeItem(itemId): void
  + getTotal(): decimal
  + checkout(): Order
}

class CartItem {
  - id: UUID
  - productId: UUID
  - quantity: int
  - price: decimal
}

class Order {
  - id: UUID
  - userId: UUID
  - items: OrderItem[]
  - status: OrderStatus
  - total: decimal
  + cancel(): void
  + processPayment(): Payment
}

class OrderItem {
  - productId: UUID
  - quantity: int
  - price: decimal
}

class Payment {
  - id: UUID
  - orderId: UUID
  - amount: decimal
  - status: PaymentStatus
  + process(): boolean
  + refund(): boolean
}

User <|-- Cart : 1 <-- 1
Cart <|-- CartItem : 1 <-- *
Cart --> Order : checkout
Order <|-- OrderItem : 1 <-- *
Order --> Payment : 1 <-- 1
User --> Order : 1 <-- *`,
    icon: 'Box',
  },
  {
    id: 'gantt-chart',
    name: 'Gantt Chart',
    description: 'Project timeline with tasks, dependencies, and milestones',
    category: 'custom',
    systemPrompt: `${DIAGRAM_SYSTEM_BASE}

FOCUS: Gantt charts showing project tasks, durations, dependencies, and milestones.

SYNTAX:
- Use ganttchart directive
- Define date format
- Use section for phases
- Task format: Task name : status, start, duration
- Status: done, active, crit (critical), milestone
- Dependencies with after keyword`,
    userPromptTemplate: `Create a Gantt chart for: {description}

Include:
- Project phases as sections
- Tasks with realistic durations
- Dependencies between tasks
- Critical path marking
- Milestones for key deliverables`,
    exampleInput: 'Software development project with design, development, testing, and deployment phases over 3 months',
    exampleOutput: `ganttchart
  title Software Development Project
  dateFormat YYYY-MM-DD

  section Planning
  Requirements    :done, 2024-01-01, 7d
  Architecture    :done, after Requirements, 5d
  UI/UX Design    :done, after Architecture, 10d
  
  section Development
  Sprint 1        :active, after UI/UX Design, 14d
  Sprint 2        :after Sprint 1, 14d
  Sprint 3        :crit, after Sprint 2, 14d
  Integration     :crit, after Sprint 3, 7d
  
  section Testing
  Unit Tests      :after Sprint 1, 21d
  Integration Tests :after Integration, 7d
  UAT             :crit, after Integration Tests, 5d
  Bug Fixes       :crit, after UAT, 5d
  
  section Deployment
  Deploy Staging  :milestone, after Bug Fixes, 2d
  Final Review    :milestone, after Deploy Staging, 3d
  Production      :milestone, after Final Review, 2d`,
    icon: 'Clock',
  },
];

// Helper to format prompt with user input
export function formatPrompt(template: AIPromptTemplate, userDescription: string): string {
  return template.userPromptTemplate.replace('{description}', userDescription);
}

// Get templates by category
export function getTemplatesByCategory(category: AIPromptTemplate['category']) {
  return AI_PROMPT_TEMPLATES.filter(t => t.category === category);
}

// Get all categories with their templates
export function getCategories() {
  const categories = [...new Set(AI_PROMPT_TEMPLATES.map(t => t.category))];
  return categories.map(cat => ({
    id: cat,
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    templates: getTemplatesByCategory(cat),
  }));
}

// Suggested prompts for quick access
export const SUGGESTED_PROMPTS = [
  'User registration and login flow with email verification',
  'Microservices architecture for a SaaS application',
  'Database schema for a social media platform',
  'Payment processing flow with multiple gateways',
  'CI/CD pipeline from commit to production',
  'OAuth2 authentication sequence',
  'Kubernetes deployment architecture',
  'Event-driven architecture with message queues',
];
