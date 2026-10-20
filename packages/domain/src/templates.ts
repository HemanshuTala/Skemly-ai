/**
 * SCHEMELY AI — BACKEND CANONICAL ARCHITECTURE TEMPLATES
 *
 * Single shared source of truth for architectural templates.
 * Reused across Backend API, Diagram Generation, and Test Suites.
 */

export interface ArchitectureTemplate {
  id: string;
  title: string;
  type: string;
  category: 'microservices' | 'realtime' | 'cloud' | 'data';
  description: string;
  syntax: string;
  nodeCount: number;
}

export const CANONICAL_TEMPLATES: Record<string, ArchitectureTemplate> = {
  ecommerce: {
    id: 'ecommerce',
    title: 'E-Commerce Microservices',
    type: 'flowchart',
    category: 'microservices',
    description: 'API Gateway routing to Auth, Order, and Payment services with PostgreSQL & Redis caching.',
    nodeCount: 7,
    syntax: `[Web / Mobile Client] --> [API Gateway]
[API Gateway] --> [Auth Service]
[API Gateway] --> [Order Service]
[API Gateway] --> [Payment Service]
[Order Service] --> [[PostgreSQL DB]]
[Order Service] --> [Redis Cache]`,
  },
  chat: {
    id: 'chat',
    title: 'Real-Time Chat Engine',
    type: 'sequence',
    category: 'realtime',
    description: 'High-concurrency WebSocket gateway backed by Kafka distributed event log and worker cluster.',
    nodeCount: 5,
    syntax: `[Mobile Client] --> [WebSocket Gateway]
[WebSocket Gateway] --> [Kafka Event Bus|shape:queue]
[Kafka Event Bus] --> [Message Worker]
[Message Worker] --> [[MongoDB Cluster]]`,
  },
  urlShortener: {
    id: 'urlShortener',
    title: 'URL Shortener System',
    type: 'flowchart',
    category: 'cloud',
    description: 'High-throughput redirect service backed by low-latency Redis cache and persistent DB storage.',
    nodeCount: 5,
    syntax: `[User Browser] --> [Load Balancer]
[Load Balancer] --> [Redirect Service]
[Redirect Service] --> [Redis KV Cache]
[Redirect Service] --> [[PostgreSQL DB]]`,
  },
  payment: {
    id: 'payment',
    title: 'Payment Processing Pipeline',
    type: 'flowchart',
    category: 'microservices',
    description: 'Asynchronous transactional payment pipeline using SQS message buffering and ledger storage.',
    nodeCount: 6,
    syntax: `[Checkout Client] --> [API Gateway]
[API Gateway] --> [Payment Ingest]
[Payment Ingest] --> [SQS Queue|shape:queue]
[SQS Queue] --> [Stripe Settlement Worker]
[Stripe Settlement Worker] --> [[Ledger DB]]`,
  },
  notification: {
    id: 'notification',
    title: 'Multi-Channel Notification Hub',
    type: 'flowchart',
    category: 'realtime',
    description: 'Fan-out event processing architecture dispatching Push, Email, and SMS notifications.',
    nodeCount: 7,
    syntax: `[Application Event Ingest] --> [PubSub Topic|shape:queue]
[PubSub Topic] --> [Push Notification Dispatcher]
[PubSub Topic] --> [Email Worker Service]
[PubSub Topic] --> [SMS Gateway Worker]
[Push Notification Dispatcher] --> [FCM / APNs Gateway]
[Email Worker Service] --> [SendGrid API]`,
  },
  eventDriven: {
    id: 'eventDriven',
    title: 'Event-Driven Microservices',
    type: 'flowchart',
    category: 'cloud',
    description: 'Decoupled domain services communicating via event streaming broker with read models.',
    nodeCount: 7,
    syntax: `[Client Ingest API] --> [Event Stream Broker|shape:queue]
[Event Stream Broker] --> [Inventory Projector]
[Event Stream Broker] --> [Billing Worker]
[Event Stream Broker] --> [Analytics Pipeline]
[Inventory Projector] --> [[Read Model DB]]
[Analytics Pipeline] --> [[ClickHouse Warehouse]]`,
  },
};
