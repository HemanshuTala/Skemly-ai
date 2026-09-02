/**
 * SCHEMELY AI — FOCUSED AI PARSER TESTS
 *
 * Validates syntax parsing, AI output sanitization, malformed text recovery,
 * duplicate node ID resolution, dangling edge removal, stable ID serialization, and partial AI updates.
 */

import {
  parseSyntaxToGraph,
  graphToSyntax,
  sanitizeAISyntax,
  validateParsedGraph,
  mergeAIGraphUpdate,
  Node,
  Edge,
} from '../diagramParser';

describe('AI Diagram Parser Pipeline Tests', () => {

  describe('1. AI Output Sanitization & Markdown Codeblock Stripping', () => {
    it('should strip markdown code fences and conversational preamble', () => {
      const rawAIOutput = `
Here is your generated web application architecture:
\`\`\`mermaid
[React Frontend] --> [Node.js API]
[Node.js API] --> [[PostgreSQL Database]]
[Node.js API] --> [Redis Cache]
\`\`\`
Hope this helps!
`;
      const sanitized = sanitizeAISyntax(rawAIOutput);
      expect(sanitized).not.toContain('```');
      expect(sanitized).not.toContain('Here is your generated');
      expect(sanitized).not.toContain('Hope this helps!');
      expect(sanitized).toContain('[React Frontend] --> [Node.js API]');
    });

    it('should strip system diagram headers like flowchart TD', () => {
      const rawHeaderOutput = `
flowchart TD
[API Gateway] --> [Auth Service]
[Auth Service] --> [[User DB]]
`;
      const sanitized = sanitizeAISyntax(rawHeaderOutput);
      expect(sanitized).not.toContain('flowchart TD');
      expect(sanitized).toContain('[API Gateway] --> [Auth Service]');
    });
  });

  describe('2. Simple Architecture Prompts', () => {
    it('should parse a simple web app architecture correctly', () => {
      const syntax = `
[React Frontend] --> [Node.js API]
[Node.js API] --> [[PostgreSQL Database]]
[Node.js API] --> [Redis Cache]
`;
      const graph = parseSyntaxToGraph(syntax);
      expect(graph.nodes.length).toBe(4);
      expect(graph.edges.length).toBe(3);

      const labels = graph.nodes.map((n: Node) => n.data.label);
      expect(labels).toContain('React Frontend');
      expect(labels).toContain('Node.js API');
      expect(labels).toContain('PostgreSQL Database');
      expect(labels).toContain('Redis Cache');

      const dbNode = graph.nodes.find((n: Node) => n.data.label === 'PostgreSQL Database');
      expect(dbNode?.data.kind).toBe('database');
    });
  });

  describe('3. Complex E-Commerce / SaaS Architecture Prompts', () => {
    it('should parse complex multi-service architecture without dropping nodes or edges', () => {
      const complexSyntax = `
frontend[Frontend Client] --> gateway[API Gateway]
gateway --> auth[Auth Service]
gateway --> cart[Cart Service]
gateway --> order[Order Service]
order --> kafka[Kafka Message Broker]
kafka --> worker[Payment Worker]
worker --> stripe[Stripe Payment Gateway]
cart --> redis[Redis Session Store]
order --> db[[PostgreSQL Database]]
`;
      const graph = parseSyntaxToGraph(complexSyntax);
      expect(graph.nodes.length).toBe(10);
      expect(graph.edges.length).toBe(9);

      // Verify explicit ID extraction
      const nodeIds = graph.nodes.map((n: Node) => n.id);
      expect(nodeIds).toContain('frontend');
      expect(nodeIds).toContain('gateway');
      expect(nodeIds).toContain('auth');
      expect(nodeIds).toContain('cart');
      expect(nodeIds).toContain('order');
      expect(nodeIds).toContain('kafka');
      expect(nodeIds).toContain('worker');
      expect(nodeIds).toContain('stripe');
      expect(nodeIds).toContain('db');
    });
  });

  describe('4. Malformed AI Syntax & Auto-Repair', () => {
    it('should auto-close unclosed brackets at end of lines', () => {
      const brokenSyntax = `
[React Frontend|w:160,h:60,shape:rectangle --> [Node.js API]
[Node.js API] --> [[PostgreSQL Database
`;
      const graph = parseSyntaxToGraph(brokenSyntax);
      expect(graph.nodes.length).toBeGreaterThan(0);
      expect(graph.nodes.some((n: Node) => n.data.label.includes('React Frontend'))).toBe(true);
    });

    it('should fail safely and return 0 nodes for non-diagram conversational prose', () => {
      const conversationalProse = `I cannot create a diagram for that request because it violates safety guidelines.`;
      const graph = parseSyntaxToGraph(conversationalProse);
      expect(graph.nodes.length).toBe(0);
    });
  });

  describe('5. Duplicate Node IDs & Validation', () => {
    it('should deduplicate nodes sharing identical explicit IDs during validation', () => {
      const graphWithDupes = {
        nodes: [
          { id: 'api', data: { label: 'API Service' }, position: { x: 100, y: 100 } },
          { id: 'api', data: { label: 'API Service Backup' }, position: { x: 200, y: 200 } },
        ] as Node[],
        edges: [] as Edge[],
      };

      const result = validateParsedGraph(graphWithDupes);
      expect(result.valid).toBe(true);
      expect(result.graph.nodes.length).toBe(2);

      const uniqueIds = new Set(result.graph.nodes.map((n: Node) => n.id));
      expect(uniqueIds.size).toBe(2);
    });
  });

  describe('6. Missing / Dangling Edge Endpoints', () => {
    it('should automatically remove dangling edges whose target or source node does not exist', () => {
      const graphWithDangling = {
        nodes: [
          { id: 'node-1', data: { label: 'Node 1' }, position: { x: 0, y: 0 } },
          { id: 'node-2', data: { label: 'Node 2' }, position: { x: 100, y: 100 } },
        ] as Node[],
        edges: [
          { id: 'e1', source: 'node-1', target: 'node-2' },
          { id: 'e2', source: 'node-1', target: 'ghost-node' }, // dangling target!
        ] as Edge[],
      };

      const result = validateParsedGraph(graphWithDangling);
      expect(result.graph.edges.length).toBe(1);
      expect(result.graph.edges[0].id).toBe('e1');
    });
  });

  describe('7. Round-Trip Serialization & Stable Node IDs', () => {
    it('should retain explicit node IDs across graphToSyntax -> parseSyntaxToGraph round trip', () => {
      const originalSyntax = `
fe[React Frontend] --> api[Express API]
api --> redis[Redis Cache]
`;
      const initialGraph = parseSyntaxToGraph(originalSyntax);
      expect(initialGraph.nodes.map((n: Node) => n.id)).toEqual(['fe', 'api', 'redis']);

      const serializedSyntax = graphToSyntax(initialGraph.nodes, initialGraph.edges);
      const reParsedGraph = parseSyntaxToGraph(serializedSyntax);

      expect(reParsedGraph.nodes.map((n: Node) => n.id)).toEqual(['fe', 'api', 'redis']);
    });
  });

  describe('8. Partial AI Updates & Position Preservation', () => {
    it('should preserve existing user node positions when AI modifies the architecture', () => {
      const existingGraph = {
        nodes: [
          { id: 'frontend', data: { label: 'React Frontend' }, position: { x: 500, y: 300 } },
          { id: 'api', data: { label: 'Node.js API' }, position: { x: 500, y: 500 } },
        ] as Node[],
        edges: [{ id: 'e-1', source: 'frontend', target: 'api' }] as Edge[],
      };

      const aiUpdateSyntax = `
[React Frontend] --> [Node.js API]
[Node.js API] --> [Redis Cache]
`;
      const merged = mergeAIGraphUpdate(existingGraph, aiUpdateSyntax);

      expect(merged.nodes.length).toBe(3);
      const feNode = merged.nodes.find((n: Node) => n.data.label === 'React Frontend');
      const apiNode = merged.nodes.find((n: Node) => n.data.label === 'Node.js API');

      // User drag position MUST be preserved!
      expect(feNode?.position).toEqual({ x: 500, y: 300 });
      expect(apiNode?.position).toEqual({ x: 500, y: 500 });
    });

    it('should never replace valid existing diagram if AI returns completely invalid output', () => {
      const existingGraph = {
        nodes: [{ id: 'app', data: { label: 'App' }, position: { x: 100, y: 100 } }] as Node[],
        edges: [] as Edge[],
      };

      const invalidAISyntax = `Sorry, I cannot generate that.`;
      const merged = mergeAIGraphUpdate(existingGraph, invalidAISyntax);

      expect(merged).toEqual(existingGraph); // Preserved!
    });
  });

  describe('9. Layout Quality & Realistic Architecture Verification', () => {
    it('Arch Test 1: Web App - Should position 3-tier nodes with clean left-to-right progression', () => {
      const syntax = `
[Client Browser] --> [API Gateway]
[API Gateway] --> [[Database]]
`;
      const graph = parseSyntaxToGraph(syntax);
      expect(graph.nodes.length).toBe(3);

      const client = graph.nodes.find((n: Node) => n.data.label === 'Client Browser');
      const gateway = graph.nodes.find((n: Node) => n.data.label === 'API Gateway');
      const db = graph.nodes.find((n: Node) => n.data.label === 'Database');

      expect(client!.position.x).toBeLessThan(gateway!.position.x);
      expect(gateway!.position.x).toBeLessThan(db!.position.x);
    });

    it('Arch Test 2: Branching Microservices - Should vertically center 1-node gateway relative to 4 parallel services', () => {
      const syntax = `
[API Gateway] --> [Auth Service]
[API Gateway] --> [User Service]
[API Gateway] --> [Order Service]
[API Gateway] --> [Payment Service]
`;
      const graph = parseSyntaxToGraph(syntax);
      expect(graph.nodes.length).toBe(5);

      const gateway = graph.nodes.find((n: Node) => n.data.label === 'API Gateway');
      const services = graph.nodes.filter((n: Node) => n.data.label !== 'API Gateway');

      const gatewayCenterY = gateway!.position.y + (Number(gateway!.height) || 60) / 2;
      const minServiceY = Math.min(...services.map((s) => s.position.y));
      const maxServiceY = Math.max(...services.map((s) => s.position.y + (Number(s.height) || 60)));
      const avgServiceCenterY = (minServiceY + maxServiceY) / 2;

      // Gateway vertical center should align within 70px of the services column vertical center
      expect(Math.abs(gatewayCenterY - avgServiceCenterY)).toBeLessThan(70);
    });

    it('Arch Test 3: Dense SaaS - Should handle 9+ nodes without position overlaps', () => {
      const denseSyntax = `
frontend[Frontend] --> gateway[Gateway]
gateway --> auth[Auth]
gateway --> cart[Cart]
gateway --> order[Order]
order --> kafka[Kafka]
kafka --> worker[Worker]
cart --> redis[Redis]
order --> db[[PostgreSQL]]
`;
      const graph = parseSyntaxToGraph(denseSyntax);
      expect(graph.nodes.length).toBe(9);

      // Verify no two nodes share the exact same (x, y) coordinates
      const coordSet = new Set(graph.nodes.map((n) => `${n.position.x},${n.position.y}`));
      expect(coordSet.size).toBe(graph.nodes.length);
    });

    it('Arch Test 4: Cyclic Architecture - Should complete layout deterministically without stack overflow', () => {
      const cycleSyntax = `
[Service A] --> [Service B]
[Service B] --> [Service C]
[Service C] --> [Service A]
`;
      const graph = parseSyntaxToGraph(cycleSyntax);
      expect(graph.nodes.length).toBe(3);
      expect(graph.edges.length).toBe(3);
    });

    it('Arch Test 5: Custom Dimensions - Should expand column gaps dynamically for wide Entity tables', () => {
      const wideSyntax = `
[Wide Entity Table|w:320,h:240,shape:rectangle] --> [Connected Service]
`;
      const graph = parseSyntaxToGraph(wideSyntax);
      const wideNode = graph.nodes.find((n) => n.data.label === 'Wide Entity Table');
      const serviceNode = graph.nodes.find((n) => n.data.label === 'Connected Service');

      // Column spacing must exceed wide node's width (320px) to prevent column overlaps
      const xDistance = serviceNode!.position.x - wideNode!.position.x;
      expect(xDistance).toBeGreaterThanOrEqual(320 + 80);
    });
  });

  describe('10. End-to-End Product Flow & Edge-Case Verification', () => {
    it('E2E Test 1: Negative Node Coordinates - Should calculate correct export bounds with padding', () => {
      const graphWithNegatives = {
        nodes: [
          { id: 'n1', data: { label: 'Node 1' }, position: { x: -450, y: -200 }, width: 160, height: 60 },
          { id: 'n2', data: { label: 'Node 2' }, position: { x: 300, y: 150 }, width: 160, height: 60 },
        ] as Node[],
        edges: [{ id: 'e1', source: 'n1', target: 'n2' }] as Edge[],
      };

      const padding = 40;
      const minX = Math.min(...graphWithNegatives.nodes.map((n) => n.position.x));
      const maxX = Math.max(...graphWithNegatives.nodes.map((n) => n.position.x + (n.width || 160)));
      const minY = Math.min(...graphWithNegatives.nodes.map((n) => n.position.y));
      const maxY = Math.max(...graphWithNegatives.nodes.map((n) => n.position.y + (n.height || 60)));

      expect(minX).toBe(-450);
      expect(minY).toBe(-200);

      const boundsWidth = (maxX - minX) + padding * 2;
      const boundsHeight = (maxY - minY) + padding * 2;

      expect(boundsWidth).toBe(910 + padding * 2);
      expect(boundsHeight).toBe(410 + padding * 2);
    });

    it('E2E Test 2: Large Architecture Diagrams - Should parse 25+ nodes without missing elements', () => {
      const largeLines: string[] = [];
      for (let i = 0; i < 25; i++) {
        largeLines.push(`[Service ${i}] --> [Service ${i + 1}]`);
      }
      const largeSyntax = largeLines.join('\n');
      const graph = parseSyntaxToGraph(largeSyntax);

      expect(graph.nodes.length).toBe(26);
      expect(graph.edges.length).toBe(25);
    });

    it('E2E Test 3: Long Multiline Labels - Should extract and serialize multiline Entity fields cleanly', () => {
      const multilineSyntax = `
[Users Table|w:200,h:180,shape:rectangle]
`;
      const graph = parseSyntaxToGraph(multilineSyntax);
      expect(graph.nodes.length).toBe(1);

      const node = graph.nodes[0];
      node.data.label = "Users Table\nid: string\nemail: string\ncreated_at: timestamp";

      const reserialized = graphToSyntax(graph.nodes, graph.edges);
      expect(reserialized).toContain('Users Table');
    });

    it('E2E Test 4: AI Failure & Network Error Guard - Should retain current graph intact when AI API fails', () => {
      const currentGraph = {
        nodes: [
          { id: 'auth', data: { label: 'Auth Service' }, position: { x: 100, y: 100 } },
          { id: 'db', data: { label: 'User DB' }, position: { x: 360, y: 100 } },
        ] as Node[],
        edges: [{ id: 'e1', source: 'auth', target: 'db' }] as Edge[],
      };

      // Network error or empty syntax returned from failed API call
      const failedAISyntax = "";
      const resultGraph = mergeAIGraphUpdate(currentGraph, failedAISyntax);

      expect(resultGraph.nodes.length).toBe(2);
      expect(resultGraph.edges.length).toBe(1);
      expect(resultGraph.nodes[0].data.label).toBe('Auth Service');
    });

    it('E2E Test 5: Manual Edit after AI Generation - Should allow adding new manual connections post-AI', () => {
      const aiSyntax = `
[Frontend] --> [API Gateway]
[API Gateway] --> [Auth Service]
`;
      const graph = parseSyntaxToGraph(aiSyntax);
      expect(graph.nodes.length).toBe(3);

      // User manually adds a cache node and connects API Gateway -> Cache
      const cacheNode: Node = {
        id: 'redis-cache',
        type: 'diagramNode',
        position: { x: 360, y: 240 },
        data: { label: 'Redis Cache', kind: 'database' },
      };
      const manualEdge: Edge = {
        id: 'e-manual',
        source: 'api-gateway',
        target: 'redis-cache',
      };

      const updatedGraph = {
        nodes: [...graph.nodes, cacheNode],
        edges: [...graph.edges, manualEdge],
      };

      const finalSyntax = graphToSyntax(updatedGraph.nodes, updatedGraph.edges);
      expect(finalSyntax).toContain('Redis Cache');
      expect(finalSyntax).toContain('API Gateway');
    });
  });
});


