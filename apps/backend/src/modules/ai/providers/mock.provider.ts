/**
 * Mock LLM Provider
 *
 * Returns deterministic, valid DiagramIR responses.
 * Used for: local development, CI, E2E tests, demos, offline mode.
 *
 * Set AI_PROVIDER=mock in .env to activate.
 */

import type {
  LLMProvider,
  GenerateDiagramRequest,
  GenerateDiagramResponse,
  ExplainDiagramRequest,
  ExplainDiagramResponse,
  ImproveDiagramRequest,
  ImproveDiagramResponse,
  RepairDiagramRequest,
  RepairDiagramResponse,
  ReviewDiagramRequest,
  ReviewDiagramResponse,
  ClassifyIntentRequest,
  ClassifyIntentResponse,
  TradeoffAnalysisRequest,
  TradeoffAnalysisResponse,
} from './llm-provider.interface';
import type { DiagramIR, DiagramType } from '../../domain/diagram-ir.types';
import type { DiagramPatch } from '../../domain/patch.types';
import {
  makeDefaultNodeStyle,
  makeDefaultEdgeStyle,
  makeDefaultLayout,
  makeDefaultTheme,
} from '../../domain/diagram-ir.types';

const PROMPT_VERSION = 'mock-v1';

function makeMockDiagram(prompt: string, type: DiagramType = 'flowchart'): DiagramIR {
  return {
    schemaVersion: 1,
    diagramId: `mock-${Date.now()}`,
    title: `Mock: ${prompt.slice(0, 40)}`,
    type,
    metadata: { version: 1 },
    nodes: [
      {
        id: 'node-1',
        kind: 'rectangle',
        label: 'Client',
        position: { x: 50, y: 100 },
        size: { width: 140, height: 50 },
        style: { ...makeDefaultNodeStyle(), styleSource: 'ai' },
        data: {},
        semantic: { entityType: 'client' },
        source: 'ai',
      },
      {
        id: 'node-2',
        kind: 'rectangle',
        label: 'API Service',
        position: { x: 300, y: 100 },
        size: { width: 140, height: 50 },
        style: { ...makeDefaultNodeStyle(), styleSource: 'ai' },
        data: {},
        semantic: { entityType: 'service' },
        source: 'ai',
      },
      {
        id: 'node-3',
        kind: 'cylinder',
        label: 'Database',
        position: { x: 550, y: 100 },
        size: { width: 140, height: 60 },
        style: { ...makeDefaultNodeStyle(), styleSource: 'ai' },
        data: {},
        semantic: { entityType: 'database' },
        source: 'ai',
      },
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        kind: 'default',
        label: 'HTTP Request',
        style: { ...makeDefaultEdgeStyle() },
        data: {},
        semantic: { protocol: 'HTTP', sync: 'sync' },
        sourceOrigin: 'ai',
      },
      {
        id: 'edge-2',
        source: 'node-2',
        target: 'node-3',
        kind: 'default',
        label: 'Query',
        style: { ...makeDefaultEdgeStyle() },
        data: {},
        semantic: { protocol: 'SQL', sync: 'sync' },
        sourceOrigin: 'ai',
      },
    ],
    groups: [],
    annotations: [],
    layout: makeDefaultLayout(),
    theme: makeDefaultTheme(),
  };
}

export class MockLLMProvider implements LLMProvider {
  readonly name = 'mock';
  readonly model = 'mock-model';

  isAvailable(): boolean {
    return true;
  }

  async generateDiagram(request: GenerateDiagramRequest): Promise<GenerateDiagramResponse> {
    const start = Date.now();
    await delay(200); // Simulate async

    const diagram = makeMockDiagram(request.prompt, request.diagramType ?? 'system');

    return {
      diagram,
      intent: {
        requestedType: request.diagramType ?? 'system',
        confidence: 0.95,
        assumptions: [
          'Mock provider — no LLM involved',
          'Returns a standard 3-node system diagram',
        ],
        clarificationsNeeded: [],
      },
      changeSummary: [`Created a mock ${diagram.type} diagram with 3 nodes`],
      warnings: ['This is a mock response. Set AI_PROVIDER=groq for real generation.'],
      promptVersion: PROMPT_VERSION,
      model: this.model,
      provider: this.name,
      latencyMs: Date.now() - start,
    };
  }

  async explainDiagram(request: ExplainDiagramRequest): Promise<ExplainDiagramResponse> {
    const start = Date.now();
    await delay(100);

    return {
      summary: `[MOCK] This diagram has ${request.diagram.nodes.length} nodes and ${request.diagram.edges.length} edges.`,
      keyComponents: request.diagram.nodes.slice(0, 3).map(n => ({
        nodeId: n.id,
        explanation: `[MOCK] ${n.label} — a ${n.semantic?.entityType ?? n.kind} component.`,
      })),
      flows: [],
      risks: ['[MOCK] This is a mock explanation.'],
      assumptions: ['Mock provider active'],
      promptVersion: PROMPT_VERSION,
      model: this.model,
      provider: this.name,
      latencyMs: Date.now() - start,
    };
  }

  async improveDiagram(request: ImproveDiagramRequest): Promise<ImproveDiagramResponse> {
    const start = Date.now();
    await delay(150);

    return {
      suggestions: [
        '[MOCK] Add error handling paths',
        '[MOCK] Consider adding a cache layer',
        '[MOCK] Add observability (logging/tracing)',
      ],
      riskLevel: 'low',
      changeSummary: ['[MOCK] Improvement suggestions generated'],
      promptVersion: PROMPT_VERSION,
      model: this.model,
      provider: this.name,
      latencyMs: Date.now() - start,
    };
  }

  async repairDiagram(request: RepairDiagramRequest): Promise<RepairDiagramResponse> {
    const start = Date.now();
    await delay(100);

    return {
      diagram: request.diagram,
      repairSummary: ['[MOCK] No LLM repair applied in mock mode'],
      promptVersion: PROMPT_VERSION,
      model: this.model,
      provider: this.name,
      latencyMs: Date.now() - start,
    };
  }

  async reviewDiagram(request: ReviewDiagramRequest): Promise<ReviewDiagramResponse> {
    const start = Date.now();
    await delay(150);

    return {
      scorecard: {
        scalability: 7,
        availability: 6,
        security: 5,
        observability: 4,
        simplicity: 8,
        overall: 6,
      },
      findings: [
        {
          nodeIds: [],
          severity: 'info',
          code: 'MOCK_FINDING',
          description: '[MOCK] Architecture review is mocked.',
          suggestion: 'Use a real AI provider for actual analysis.',
        },
      ],
      summary: '[MOCK] Architecture review complete.',
      promptVersion: PROMPT_VERSION,
      model: this.model,
      provider: this.name,
      latencyMs: Date.now() - start,
    };
  }

  async classifyIntent(request: ClassifyIntentRequest): Promise<ClassifyIntentResponse> {
    const start = Date.now();
    await delay(50);

    // Simple heuristic for mock
    let type: DiagramType = 'system';
    const p = request.prompt.toLowerCase();
    if (p.includes('flow') || p.includes('process')) type = 'flowchart';
    else if (p.includes('sequence') || p.includes('api')) type = 'sequence';
    else if (p.includes('database') || p.includes('entity') || p.includes('erd')) type = 'erd';
    else if (p.includes('state') || p.includes('status')) type = 'state';
    else if (p.includes('uml') || p.includes('class')) type = 'uml';

    return {
      diagramType: type,
      confidence: 0.8,
      alternativeTypes: ['system', 'flowchart'],
      extractedEntities: [],
      promptVersion: PROMPT_VERSION,
      latencyMs: Date.now() - start,
    };
  }

  async tradeoffAnalysis(request: TradeoffAnalysisRequest): Promise<TradeoffAnalysisResponse> {
    const start = Date.now();
    await delay(100);

    return {
      tradeoffs: [
        {
          decision: 'Sync HTTP communication between WebTier and AppTier',
          alternative: 'Message Broker (Async Pub/Sub)',
          pros: ['Simple to implement', 'Low complexity', 'Immediate response feedback'],
          cons: ['Tight coupling', 'Potential bottleneck under high traffic load', 'No failure retry buffering'],
          recommendation: 'Keep HTTP for now, but migrate to Pub/Sub when request volume scales beyond 10,000 requests/minute.'
        }
      ],
      promptVersion: PROMPT_VERSION,
      model: this.model,
      provider: this.name,
      latencyMs: Date.now() - start,
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
