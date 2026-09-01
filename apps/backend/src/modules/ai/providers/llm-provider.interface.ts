/**
 * LLM Provider Interface
 *
 * The rest of the backend must not import Groq SDK directly.
 * All AI operations go through this interface.
 * Enables: mock provider, fallback provider, future providers.
 */

import type { DiagramIR, DiagramType } from '../../domain/diagram-ir.types';
import type { ValidationResult } from '../../domain/validateDiagram';

// ─── Request / Response types ─────────────────────────────────────────────────

export interface GenerateDiagramRequest {
  prompt: string;
  diagramType?: DiagramType | null;
  existingDiagram?: DiagramIR | null;
  contextHints?: string[];
  userId: string;
  operationId: string;
}

export interface GenerateDiagramResponse {
  diagram: DiagramIR;
  intent: {
    requestedType: DiagramType | null;
    confidence: number;
    assumptions: string[];
    clarificationsNeeded: string[];
  };
  changeSummary: string[];
  warnings: string[];
  promptVersion: string;
  model: string;
  provider: string;
  latencyMs: number;
  tokenUsage?: { prompt: number; completion: number; total: number };
}

export interface ExplainDiagramRequest {
  diagram: DiagramIR;
  focusNodeIds?: string[];
  userId: string;
  operationId: string;
}

export interface ExplainDiagramResponse {
  summary: string;
  keyComponents: Array<{ nodeId: string; explanation: string }>;
  flows: Array<{ path: string[]; explanation: string }>;
  risks: string[];
  assumptions: string[];
  promptVersion: string;
  model: string;
  provider: string;
  latencyMs: number;
}

export interface ImproveDiagramRequest {
  diagram: DiagramIR;
  intent:
    | 'readability'
    | 'architecture'
    | 'complexity'
    | 'scalability'
    | 'security'
    | 'reliability'
    | 'naming'
    | 'simplify'
    | 'interview-ready';
  userId: string;
  operationId: string;
}

export interface ImproveDiagramResponse {
  suggestions: string[];
  proposedPatches?: import('./patch.types').DiagramPatch[];
  riskLevel: 'low' | 'medium' | 'high';
  changeSummary: string[];
  promptVersion: string;
  model: string;
  provider: string;
  latencyMs: number;
}

export interface RepairDiagramRequest {
  diagram: DiagramIR;
  validationResult: ValidationResult;
  userId: string;
  operationId: string;
}

export interface RepairDiagramResponse {
  diagram: DiagramIR;
  repairSummary: string[];
  promptVersion: string;
  model: string;
  provider: string;
  latencyMs: number;
}

export interface ReviewDiagramRequest {
  diagram: DiagramIR;
  userId: string;
  operationId: string;
}

export interface ReviewDiagramResponse {
  scorecard: {
    scalability: number;
    availability: number;
    security: number;
    observability: number;
    simplicity: number;
    overall: number;
  };
  findings: Array<{
    nodeIds: string[];
    severity: 'info' | 'warning' | 'error';
    code: string;
    description: string;
    suggestion: string;
  }>;
  summary: string;
  promptVersion: string;
  model: string;
  provider: string;
  latencyMs: number;
}

export interface TradeoffAnalysisRequest {
  diagram: DiagramIR;
  userId: string;
  operationId: string;
}

export interface TradeoffItem {
  decision: string;
  alternative: string;
  pros: string[];
  cons: string[];
  recommendation: string;
}

export interface TradeoffAnalysisResponse {
  tradeoffs: TradeoffItem[];
  promptVersion: string;
  model: string;
  provider: string;
  latencyMs: number;
}

export interface ClassifyIntentRequest {
  prompt: string;
  operationId: string;
}

export interface ClassifyIntentResponse {
  diagramType: DiagramType;
  confidence: number;
  alternativeTypes: DiagramType[];
  extractedEntities: string[];
  promptVersion: string;
  latencyMs: number;
}

// ─── Provider Interface ───────────────────────────────────────────────────────

export interface LLMProvider {
  readonly name: string;
  readonly model: string;

  /** Check if provider is available */
  isAvailable(): boolean;

  /** Generate a diagram from natural language */
  generateDiagram(request: GenerateDiagramRequest): Promise<GenerateDiagramResponse>;

  /** Explain an existing diagram */
  explainDiagram(request: ExplainDiagramRequest): Promise<ExplainDiagramResponse>;

  /** Improve an existing diagram */
  improveDiagram(request: ImproveDiagramRequest): Promise<ImproveDiagramResponse>;

  /** Use LLM as second-line repair (only when deterministic repair fails) */
  repairDiagram(request: RepairDiagramRequest): Promise<RepairDiagramResponse>;

  /** Architecture review with findings mapped to actual nodes */
  reviewDiagram(request: ReviewDiagramRequest): Promise<ReviewDiagramResponse>;

  /** Classify user intent before diagram generation */
  classifyIntent(request: ClassifyIntentRequest): Promise<ClassifyIntentResponse>;

  /** Perform tradeoff analysis on diagram architecture */
  tradeoffAnalysis(request: TradeoffAnalysisRequest): Promise<TradeoffAnalysisResponse>;
}

// ─── Error types ──────────────────────────────────────────────────────────────

export type AIProviderErrorCode =
  | 'AI_UNAVAILABLE'
  | 'AI_TIMEOUT'
  | 'AI_RATE_LIMITED'
  | 'AI_QUOTA_EXCEEDED'
  | 'AI_INVALID_RESPONSE'
  | 'AI_SCHEMA_VIOLATION'
  | 'AI_PROVIDER_ERROR';

export class AIProviderError extends Error {
  constructor(
    public readonly code: AIProviderErrorCode,
    message: string,
    public readonly retryable: boolean = false,
    public readonly retryAfterMs?: number
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}
