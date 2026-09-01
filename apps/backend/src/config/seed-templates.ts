import mongoose from 'mongoose';
import { Template } from '../models/template.model';
import logger from '../utils/logger';

const SYSTEM_USER_ID = new mongoose.Types.ObjectId('000000000000000000000000');

interface TemplateSeed {
  name: string;
  description: string;
  category: 'System Design' | 'Flowchart' | 'UML' | 'ERD' | 'Mind Map' | 'Org Chart';
  diagramType: string;
  syntax: string;
}

const TEMPLATE_SEEDS: TemplateSeed[] = [
  {
    name: '3-Tier Web Architecture',
    description: 'Classic client-server architecture with presentation, application, and database tiers.',
    category: 'System Design',
    diagramType: 'system',
    syntax: `[User|shape:actor]
[CDN|shape:cloud]
[LoadBalancer|shape:proc,icon:server]
[WebTier|shape:proc,icon:ui]
[AppTier|shape:proc,icon:service]
[Database|shape:database]
[Cache|shape:database]

User -> CDN: HTTPS Request
CDN -> LoadBalancer: Forward requests
LoadBalancer -> WebTier: Distribute traffic
WebTier -> AppTier: API request
AppTier -> Cache: Read cache
AppTier -> Database: Read/Write
`
  },
  {
    name: 'Microservices with API Gateway',
    description: 'Modern microservices pattern using a centralized API gateway routing requests.',
    category: 'System Design',
    diagramType: 'system',
    syntax: `[Client|shape:mobile]
[APIGateway|shape:proc,icon:lock]
[AuthService|shape:proc,icon:key]
[OrderService|shape:proc,icon:shopping-cart]
[PaymentService|shape:proc,icon:credit-card]
[OrderDB|shape:database]

Client -> APIGateway: API Call
APIGateway -> AuthService: Validate Token
APIGateway -> OrderService: Route to Orders
APIGateway -> PaymentService: Route to Payments
OrderService -> OrderDB: Save Order
`
  },
  {
    name: 'CI/CD Pipeline Workflow',
    description: 'Deployment pipeline covering commit, build, test, and container deployment stages.',
    category: 'Flowchart',
    diagramType: 'flowchart',
    syntax: `[Commit|shape:startend]
[TriggerBuild|shape:proc]
[RunTests|shape:proc]
[BuildPassed|shape:decision]
[PublishImage|shape:proc]
[DeployStaging|shape:proc]
[Rollback|shape:proc]

Commit -> TriggerBuild
TriggerBuild -> RunTests
RunTests -> BuildPassed
BuildPassed -- Yes --> PublishImage
BuildPassed -- No --> Rollback
PublishImage -> DeployStaging
`
  },
  {
    name: 'E-Commerce Database Schema',
    description: 'Simplified ERD showing Users, Orders, OrderItems, and Products relationships.',
    category: 'ERD',
    diagramType: 'erd',
    syntax: `[User|shape:entity]
id: string
email: string
name: string

[Order|shape:entity]
id: string
userId: string
totalAmount: number
status: string

[OrderItem|shape:entity]
id: string
orderId: string
productId: string
quantity: number

[Product|shape:entity]
id: string
name: string
price: number

User -> Order: 1 to many
Order -> OrderItem: 1 to many
Product -> OrderItem: 1 to many
`
  },
  {
    name: 'GitOps Continuous Deployment',
    description: 'GitOps workflow showing git commits triggering automated pull deployments in Kubernetes.',
    category: 'System Design',
    diagramType: 'system',
    syntax: `[Developer|shape:actor]
[GitRepo|shape:proc,icon:github]
[ArgoCD|shape:proc,icon:log]
[K8sCluster|shape:cloud]

Developer -> GitRepo: Push manifest changes
ArgoCD -> GitRepo: Poll config updates
ArgoCD -> K8sCluster: Sync state (pull-based)
`
  },
  {
    name: 'OAuth 2.0 Auth Code Flow',
    description: 'Step-by-step sequence diagram for OAuth 2.0 login with authentication code and tokens.',
    category: 'UML',
    diagramType: 'sequence',
    syntax: `[User|shape:actor]
[ClientApp|shape:proc,icon:smartphone]
[AuthServer|shape:proc,icon:shield]
[ResourceServer|shape:proc,icon:database]

User -> ClientApp: Click "Login with OAuth"
ClientApp -> AuthServer: Redirect User for Auth
User -> AuthServer: Input Credentials
AuthServer -> ClientApp: Redirect with Auth Code
ClientApp -> AuthServer: Exchange Code for Access Token
AuthServer -> ClientApp: Return Token
ClientApp -> ResourceServer: Fetch User Data (with Token)
ResourceServer -> ClientApp: Return Protected Resources
`
  },
  {
    name: 'Pub/Sub Messaging System',
    description: 'Asynchronous event decoupling using a message broker (RabbitMQ/Kafka) with publishers/subscribers.',
    category: 'System Design',
    diagramType: 'system',
    syntax: `[Publisher|shape:proc,icon:server]
[MessageBroker|shape:queue]
[WorkerA|shape:proc,icon:cpu]
[WorkerB|shape:proc,icon:cpu]
[Dlq|shape:queue]

Publisher -> MessageBroker: Publish Event
MessageBroker -> WorkerA: Push to Consumer A
MessageBroker -> WorkerB: Push to Consumer B
WorkerA -- Fail --> Dlq: Dead Letter Queue
`
  },
  {
    name: 'CQRS Architecture Pattern',
    description: 'Segregation of read and write models with event synchronization between command and query databases.',
    category: 'System Design',
    diagramType: 'system',
    syntax: `[UI|shape:proc,icon:ui]
[CommandAPI|shape:proc,icon:settings]
[QueryAPI|shape:proc,icon:search]
[WriteDB|shape:database]
[ReadDB|shape:database]
[SyncService|shape:proc,icon:refresh-cw]

UI -> CommandAPI: Write actions
CommandAPI -> WriteDB: Persist write model
WriteDB -> SyncService: CDC / Trigger
SyncService -> ReadDB: Update read model
UI -> QueryAPI: Read requests
QueryAPI -> ReadDB: Fetch read model
`
  },
  {
    name: 'Load Balancer and Auto-Scaling Group',
    description: 'Incoming requests balanced across dynamic scaling EC2 server instances.',
    category: 'System Design',
    diagramType: 'system',
    syntax: `[Internet|shape:cloud]
[LoadBalancer|shape:proc,icon:server]
[InstanceA|shape:proc,icon:cpu]
[InstanceB|shape:proc,icon:cpu]
[InstanceC|shape:proc,icon:cpu]

Internet -> LoadBalancer: Incoming Traffic
LoadBalancer -> InstanceA: Route connection
LoadBalancer -> InstanceB: Route connection
LoadBalancer -> InstanceC: Route connection (Auto-Scaled)
`
  },
  {
    name: 'SaaS Billing State Machine',
    description: 'Lifecycle stages of a subscription payment flow (Active, Overdue, Cancelled).',
    category: 'Flowchart',
    diagramType: 'flowchart',
    syntax: `[Trial|shape:startend]
[Active|shape:proc]
[PastDue|shape:decision]
[GracePeriod|shape:proc]
[Cancelled|shape:startend]

Trial -> Active: Payment succeeds
Active -> PastDue: Card fails
PastDue -- Grace Period --> GracePeriod
PastDue -- Retries exhausted --> Cancelled
GracePeriod -> Active: Card updated
GracePeriod -> Cancelled: Grace period expires
`
  },
  {
    name: 'Kubernetes Cluster Topography',
    description: 'Overview of Control Plane services managing worker node pods and deployments.',
    category: 'System Design',
    diagramType: 'system',
    syntax: `[APIServer|shape:proc,icon:lock]
[etcd|shape:database]
[Scheduler|shape:proc,icon:settings]
[Kubelet|shape:proc,icon:box]
[PodA|shape:proc,icon:layers]
[PodB|shape:proc,icon:layers]

APIServer -> etcd: Read/write cluster state
Scheduler -> APIServer: Register pods
Kubelet -> APIServer: Fetch node workloads
Kubelet -> PodA: Manage lifecycle
Kubelet -> PodB: Manage lifecycle
`
  },
  {
    name: 'Read-Through Cache Architecture',
    description: 'Caching layer resolving query requests and lazy-loading cache misses from backend databases.',
    category: 'System Design',
    diagramType: 'system',
    syntax: `[ClientApp|shape:proc,icon:smartphone]
[CacheLayer|shape:database]
[Database|shape:database]

ClientApp -> CacheLayer: Check Key
CacheLayer -- Cache Hit --> ClientApp: Return Data
CacheLayer -- Cache Miss --> Database: Fetch Original Data
Database -> CacheLayer: Populate Key
Database -> ClientApp: Return Data
`
  },
  {
    name: 'Serverless REST API Layout',
    description: 'Stateless serverless backend utilizing cloud routing gateways and AWS Lambda functions.',
    category: 'System Design',
    diagramType: 'system',
    syntax: `[Gateway|shape:cloud]
[LambdaAuth|shape:proc,icon:shield]
[LambdaOrders|shape:proc,icon:box]
[DynamoDB|shape:database]

Gateway -> LambdaAuth: Verify Authorization
Gateway -> LambdaOrders: Process request
LambdaOrders -> DynamoDB: Save order records
`
  },
  {
    name: 'Blue/Green Deployment Pipeline',
    description: 'Flipping routing headers between active green and idle blue server stacks.',
    category: 'Flowchart',
    diagramType: 'flowchart',
    syntax: `[Router|shape:decision]
[BlueStack|shape:proc,icon:server]
[GreenStack|shape:proc,icon:server]
[Deployment|shape:proc]

Router -- Active (v1.0) --> BlueStack
Deployment -> GreenStack: Upload v1.1 build
Deployment -- Sanity Check Pass --> Router: Re-route traffic
Router -- Active (v1.1) --> GreenStack
`
  },
  {
    name: 'DNS Resolution Workflow',
    description: 'Detailed route mapping during local client browser DNS lookup sequence.',
    category: 'UML',
    diagramType: 'sequence',
    syntax: `[Browser|shape:smartphone]
[Resolver|shape:proc,icon:server]
[RootDNS|shape:database]
[TLDDNS|shape:database]
[AuthDNS|shape:database]

Browser -> Resolver: Resolve "skemly.com"
Resolver -> RootDNS: Ask Root Servers (.)
RootDNS -> Resolver: Refer to .com TLD
Resolver -> TLDDNS: Ask .com Servers
TLDDNS -> Resolver: Refer to skemly.com NS
Resolver -> AuthDNS: Ask skemly.com Nameservers
AuthDNS -> Resolver: Return 192.168.1.1 IP
Resolver -> Browser: Return IP to client
`
  },
  {
    name: 'Mind Map brainstorming',
    description: 'Quick core ideas expansion template for system brainstorms.',
    category: 'Mind Map',
    diagramType: 'flowchart',
    syntax: `[CoreIdea|shape:circle]
[TechStack|shape:proc]
[Features|shape:proc]
[Security|shape:proc]
[Databases|shape:proc]

CoreIdea -> TechStack
CoreIdea -> Features
CoreIdea -> Security
CoreIdea -> Databases
`
  },
  {
    name: 'Org Chart structural template',
    description: 'Corporate organizational model mapping executive team structures.',
    category: 'Org Chart',
    diagramType: 'flowchart',
    syntax: `[CEO|shape:proc,icon:user]
[CTO|shape:proc,icon:user]
[CFO|shape:proc,icon:user]
[VPEngineering|shape:proc,icon:user]
[FinanceDirector|shape:proc,icon:user]

CEO -> CTO
CEO -> CFO
CTO -> VPEngineering
CFO -> FinanceDirector
`
  },
  {
    name: 'Event Sourcing Architecture',
    description: 'State tracking via append-only logs publishing records to read processors.',
    category: 'System Design',
    diagramType: 'system',
    syntax: `[Commands|shape:proc,icon:settings]
[EventStore|shape:database]
[EventBus|shape:queue]
[Projector|shape:proc,icon:cpu]
[ReadStore|shape:database]

Commands -> EventStore: Append state change
EventStore -> EventBus: Publish Event
EventBus -> Projector: Consume Event
Projector -> ReadStore: Update current state
`
  },
  {
    name: 'Secure JWT Auth Flow',
    description: 'Authentication sequence showing secure access and refresh token distribution.',
    category: 'UML',
    diagramType: 'sequence',
    syntax: `[ClientApp|shape:smartphone]
[AuthAPI|shape:proc,icon:lock]
[UserDB|shape:database]

ClientApp -> AuthAPI: Send credentials (POST /login)
AuthAPI -> UserDB: Verify credentials
UserDB -> AuthAPI: OK
AuthAPI -> ClientApp: Send HTTP-Only Cookie (Refresh) + JSON Access Token
ClientApp -> AuthAPI: API Request (Auth Bearer header)
`
  },
  {
    name: 'Database Failover & Recovery',
    description: 'Active master database replication triggering hot-standby promotion when master crashes.',
    category: 'System Design',
    diagramType: 'system',
    syntax: `[AppServer|shape:proc,icon:server]
[MasterDB|shape:database]
[ReplicaDB|shape:database]
[HealthMonitor|shape:proc,icon:activity]

AppServer -> MasterDB: Read / Write queries
MasterDB -> ReplicaDB: Async Replication
HealthMonitor -> MasterDB: Heartbeat poll
HealthMonitor -- Master Fails --> ReplicaDB: Promote to Master
AppServer -> ReplicaDB: Re-route database traffic
`
  }
];

export async function seedTemplates(): Promise<void> {
  try {
    const count = await Template.countDocuments({ isBuiltIn: true });
    if (count >= TEMPLATE_SEEDS.length) {
      logger.info(`ℹ️  Built-in templates already seeded (${count} templates).`);
      return;
    }

    logger.info(`🌱 Seeding ${TEMPLATE_SEEDS.length} built-in templates...`);
    
    // Clear existing built-in templates to avoid duplicates
    await Template.deleteMany({ isBuiltIn: true });

    const preparedSeeds = TEMPLATE_SEEDS.map((s) => ({
      ...s,
      isBuiltIn: true,
      thumbnail: null,
      nodes: [],
      edges: [],
      createdBy: SYSTEM_USER_ID,
      workspaceId: null,
      usageCount: 0,
    }));

    await Template.insertMany(preparedSeeds);
    logger.info('✅ Seeded built-in templates successfully.');
  } catch (error) {
    logger.error('❌ Error seeding built-in templates:', error);
  }
}
