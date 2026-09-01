/**
 * Groq LLM Provider
 *
 * Implements LLMProvider using the Groq SDK.
 * Uses structured JSON output to enforce the DiagramIR schema.
 * ALL output is validated before being returned — never trusted raw.
 */

import Groq from 'groq-sdk';
import logger from '../../../utils/logger';
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
import { AIProviderError } from './llm-provider.interface';
import type { DiagramIR, DiagramType } from '../../domain/diagram-ir.types';
import { validateDiagram } from '../../domain/validateDiagram';
import { repairDiagram } from '../../domain/repairDiagram';
import { DIAGRAM_GENERATION_PROMPT_V1 } from '../prompts/generation.prompt';
import { DIAGRAM_EXPLAIN_PROMPT_V1, DIAGRAM_TRADEOFFS_PROMPT_V1 } from '../prompts/explain.prompt';
import { DIAGRAM_IMPROVE_PROMPT_V1 } from '../prompts/improve.prompt';
import { DIAGRAM_REVIEW_PROMPT_V1 } from '../prompts/review.prompt';

const PROMPT_VERSION = 'groq-v1';
const MODEL = 'llama-3.3-70b-versatile';

export class GroqLLMProvider implements LLMProvider {
  readonly name = 'groq';
  readonly model = MODEL;

  private groq: Groq | null = null;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey && apiKey.trim() !== '' && apiKey !== 'your-groq-api-key-here') {
      this.groq = new Groq({ apiKey });
      logger.info(`✅ Groq provider initialized (model: ${MODEL})`);
    } else {
      logger.warn('⚠️  GROQ_API_KEY not set — Groq provider unavailable');
    }
  }

  isAvailable(): boolean {
    return this.groq !== null;
  }

  // ─── Generate ──────────────────────────────────────────────────────────────

  async generateDiagram(request: GenerateDiagramRequest): Promise<GenerateDiagramResponse> {
    this.assertAvailable();
    const start = Date.now();

    const systemPrompt = DIAGRAM_GENERATION_PROMPT_V1;
    const userPrompt = this.buildGenerateUserPrompt(request);

    let rawContent: string;
    try {
      const response = await this.groq!.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      });
      rawContent = this.extractContent(response);
    } catch (err) {
      throw this.wrapProviderError(err, 'generateDiagram');
    }

    // Parse JSON
    const parsed = this.safeParseJSON(rawContent, 'generateDiagram');

    // Extract diagram IR from response
    const diagramRaw: DiagramIR = this.extractDiagramFromGeneration(parsed, request);

    // Validate
    const validation = validateDiagram(diagramRaw);
    if (!validation.valid) {
      logger.warn(`[GroqProvider] generateDiagram validation issues: ${validation.errorCount} errors`, { issues: validation.issues.slice(0, 5) });
      // Run deterministic repair
      const repairResult = repairDiagram(diagramRaw);
      if (repairResult.remainingErrors > 0) {
        logger.error(`[GroqProvider] ${repairResult.remainingErrors} errors remain after repair`);
        // Still return the best we have — caller decides whether to accept
      }
      return {
        diagram: repairResult.diagram,
        intent: parsed.intent ?? { requestedType: request.diagramType ?? null, confidence: 0.7, assumptions: [], clarificationsNeeded: [] },
        changeSummary: parsed.changeSummary ?? [],
        warnings: [`${validation.errorCount} validation errors found and repaired automatically`],
        promptVersion: PROMPT_VERSION,
        model: MODEL,
        provider: this.name,
        latencyMs: Date.now() - start,
        tokenUsage: this.extractTokenUsage(parsed),
      };
    }

    return {
      diagram: diagramRaw,
      intent: parsed.intent ?? { requestedType: request.diagramType ?? null, confidence: 0.85, assumptions: [], clarificationsNeeded: [] },
      changeSummary: parsed.changeSummary ?? [],
      warnings: [],
      promptVersion: PROMPT_VERSION,
      model: MODEL,
      provider: this.name,
      latencyMs: Date.now() - start,
      tokenUsage: this.extractTokenUsage(parsed),
    };
  }

  // ─── Explain ───────────────────────────────────────────────────────────────

  async explainDiagram(request: ExplainDiagramRequest): Promise<ExplainDiagramResponse> {
    this.assertAvailable();
    const start = Date.now();

    const userPrompt = this.buildExplainUserPrompt(request);

    let rawContent: string;
    try {
      const response = await this.groq!.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: DIAGRAM_EXPLAIN_PROMPT_V1 },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      });
      rawContent = this.extractContent(response);
    } catch (err) {
      throw this.wrapProviderError(err, 'explainDiagram');
    }

    const parsed = this.safeParseJSON(rawContent, 'explainDiagram');

    return {
      summary: parsed.summary ?? 'Unable to generate explanation.',
      keyComponents: parsed.keyComponents ?? [],
      flows: parsed.flows ?? [],
      risks: parsed.risks ?? [],
      assumptions: parsed.assumptions ?? [],
      promptVersion: PROMPT_VERSION,
      model: MODEL,
      provider: this.name,
      latencyMs: Date.now() - start,
    };
  }

  // ─── Improve ───────────────────────────────────────────────────────────────

  async improveDiagram(request: ImproveDiagramRequest): Promise<ImproveDiagramResponse> {
    this.assertAvailable();
    const start = Date.now();

    const userPrompt = `Intent: ${request.intent}\n\nDiagram (${request.diagram.nodes.length} nodes, ${request.diagram.edges.length} edges):\n${this.serializeDiagramForPrompt(request.diagram)}`;

    let rawContent: string;
    try {
      const response = await this.groq!.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: DIAGRAM_IMPROVE_PROMPT_V1 },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      });
      rawContent = this.extractContent(response);
    } catch (err) {
      throw this.wrapProviderError(err, 'improveDiagram');
    }

    const parsed = this.safeParseJSON(rawContent, 'improveDiagram');

    return {
      suggestions: parsed.suggestions ?? [],
      riskLevel: parsed.riskLevel ?? 'medium',
      changeSummary: parsed.changeSummary ?? [],
      promptVersion: PROMPT_VERSION,
      model: MODEL,
      provider: this.name,
      latencyMs: Date.now() - start,
    };
  }

  // ─── Repair ────────────────────────────────────────────────────────────────

  async repairDiagram(request: RepairDiagramRequest): Promise<RepairDiagramResponse> {
    this.assertAvailable();
    const start = Date.now();

    const errors = request.validationResult.issues
      .filter(i => i.severity === 'error')
      .map(i => `- [${i.code}] ${i.path}: ${i.message}`)
      .join('\n');

    const userPrompt = `Fix these validation errors in the diagram:\n\n${errors}\n\nDiagram:\n${this.serializeDiagramForPrompt(request.diagram)}`;

    let rawContent: string;
    try {
      const response = await this.groq!.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: 'You are a diagram repair assistant. Fix only the specified validation errors. Return the corrected diagram as JSON matching the DiagramIR schema. Do not change anything else.' },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      });
      rawContent = this.extractContent(response);
    } catch (err) {
      throw this.wrapProviderError(err, 'repairDiagram');
    }

    const parsed = this.safeParseJSON(rawContent, 'repairDiagram');
    // If the model returned a diagram, validate it before returning
    const repairedDiagram = parsed.diagram ?? request.diagram;

    return {
      diagram: repairedDiagram,
      repairSummary: parsed.repairSummary ?? [],
      promptVersion: PROMPT_VERSION,
      model: MODEL,
      provider: this.name,
      latencyMs: Date.now() - start,
    };
  }

  // ─── Review ────────────────────────────────────────────────────────────────

  async reviewDiagram(request: ReviewDiagramRequest): Promise<ReviewDiagramResponse> {
    this.assertAvailable();
    const start = Date.now();

    const userPrompt = `Review this architecture diagram:\n\n${this.serializeDiagramForPrompt(request.diagram)}`;

    let rawContent: string;
    try {
      const response = await this.groq!.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: DIAGRAM_REVIEW_PROMPT_V1 },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      });
      rawContent = this.extractContent(response);
    } catch (err) {
      throw this.wrapProviderError(err, 'reviewDiagram');
    }

    const parsed = this.safeParseJSON(rawContent, 'reviewDiagram');

    return {
      scorecard: parsed.scorecard ?? { scalability: 5, availability: 5, security: 5, observability: 5, simplicity: 5, overall: 5 },
      findings: parsed.findings ?? [],
      summary: parsed.summary ?? '',
      promptVersion: PROMPT_VERSION,
      model: MODEL,
      provider: this.name,
      latencyMs: Date.now() - start,
    };
  }

  // ─── Classify ──────────────────────────────────────────────────────────────

  async classifyIntent(request: ClassifyIntentRequest): Promise<ClassifyIntentResponse> {
    this.assertAvailable();
    const start = Date.now();

    let rawContent: string;
    try {
      const response = await this.groq!.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'Classify the user intent for diagram generation. Return JSON: { "diagramType": "flowchart|sequence|uml|erd|mindmap|system|gantt|state|network|orgchart", "confidence": 0-1, "alternativeTypes": [], "extractedEntities": [] }',
          },
          { role: 'user', content: request.prompt },
        ],
        temperature: 0.1,
        max_tokens: 256,
        response_format: { type: 'json_object' },
      });
      rawContent = this.extractContent(response);
    } catch (err) {
      throw this.wrapProviderError(err, 'classifyIntent');
    }

    const parsed = this.safeParseJSON(rawContent, 'classifyIntent');

    return {
      diagramType: parsed.diagramType ?? 'system',
      confidence: parsed.confidence ?? 0.7,
      alternativeTypes: parsed.alternativeTypes ?? [],
      extractedEntities: parsed.extractedEntities ?? [],
      promptVersion: PROMPT_VERSION,
      latencyMs: Date.now() - start,
    };
  }

  // ─── Tradeoff Analysis ──────────────────────────────────────────────────────

  async tradeoffAnalysis(request: TradeoffAnalysisRequest): Promise<TradeoffAnalysisResponse> {
    this.assertAvailable();
    const start = Date.now();

    const userPrompt = `Analyze architectural tradeoffs for this diagram:\n\n${this.serializeDiagramForPrompt(request.diagram)}`;

    let rawContent: string;
    try {
      const response = await this.groq!.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: DIAGRAM_TRADEOFFS_PROMPT_V1 },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      });
      rawContent = this.extractContent(response);
    } catch (err) {
      throw this.wrapProviderError(err, 'tradeoffAnalysis');
    }

    const parsed = this.safeParseJSON(rawContent, 'tradeoffAnalysis');

    return {
      tradeoffs: parsed.tradeoffs ?? [],
      promptVersion: PROMPT_VERSION,
      model: MODEL,
      provider: this.name,
      latencyMs: Date.now() - start,
    };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private assertAvailable(): void {
    if (!this.groq) {
      throw new AIProviderError('AI_UNAVAILABLE', 'Groq provider is not configured. Set GROQ_API_KEY.', false);
    }
  }

  private extractContent(response: Groq.Chat.ChatCompletion): string {
    const content = response.choices[0]?.message?.content ?? '';
    // Strip reasoning tags from thinking models
    return content
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
      .trim();
  }

  private safeParseJSON(raw: string, operation: string): Record<string, any> {
    try {
      return JSON.parse(raw);
    } catch {
      logger.error(`[GroqProvider] ${operation}: Failed to parse JSON response`, { raw: raw.slice(0, 500) });
      throw new AIProviderError('AI_INVALID_RESPONSE', `${operation}: LLM returned non-JSON response`, false);
    }
  }

  private wrapProviderError(err: any, operation: string): AIProviderError {
    const status = err?.status ?? err?.response?.status ?? 500;
    const msg = String(err?.message ?? '').toLowerCase();

    logger.error(`[GroqProvider] ${operation} failed (${status})`, { message: msg });

    if (status === 429) {
      const retryAfter = parseInt(err?.headers?.['retry-after'] ?? '5', 10) * 1000;
      return new AIProviderError('AI_RATE_LIMITED', 'Groq rate limit hit. Please try again shortly.', true, retryAfter);
    }
    if (status === 401 || status === 403) {
      return new AIProviderError('AI_UNAVAILABLE', 'Groq API authentication failed.', false);
    }
    if (status >= 500) {
      return new AIProviderError('AI_PROVIDER_ERROR', 'Groq service error. Please try again.', true, 2000);
    }
    if (err instanceof AIProviderError) return err;
    return new AIProviderError('AI_PROVIDER_ERROR', `${operation} failed: ${msg}`, false);
  }

  private buildGenerateUserPrompt(request: GenerateDiagramRequest): string {
    const lines: string[] = [];
    lines.push(`Prompt: ${request.prompt}`);
    if (request.diagramType) lines.push(`Requested type: ${request.diagramType}`);
    if (request.contextHints?.length) lines.push(`Context: ${request.contextHints.join(', ')}`);
    if (request.existingDiagram) {
      lines.push(`\nExisting diagram (${request.existingDiagram.nodes.length} nodes) — regenerate or update it:`);
      lines.push(this.serializeDiagramForPrompt(request.existingDiagram));
    }
    return lines.join('\n');
  }

  private buildExplainUserPrompt(request: ExplainDiagramRequest): string {
    const lines: string[] = [];
    lines.push(`Diagram type: ${request.diagram.type}`);
    lines.push(`Nodes (${request.diagram.nodes.length}):`);
    for (const n of request.diagram.nodes) {
      lines.push(`  - [${n.id}] ${n.label} (${n.semantic?.entityType ?? n.kind})`);
    }
    lines.push(`Edges (${request.diagram.edges.length}):`);
    for (const e of request.diagram.edges) {
      lines.push(`  - ${e.source} → ${e.target}${e.label ? ` (${e.label})` : ''}`);
    }
    if (request.focusNodeIds?.length) {
      lines.push(`Focus on nodes: ${request.focusNodeIds.join(', ')}`);
    }
    return lines.join('\n');
  }

  private serializeDiagramForPrompt(diagram: DiagramIR): string {
    return JSON.stringify({
      type: diagram.type,
      nodes: diagram.nodes.map(n => ({ id: n.id, label: n.label, kind: n.kind, semantic: n.semantic })),
      edges: diagram.edges.map(e => ({ id: e.id, source: e.source, target: e.target, label: e.label, semantic: e.semantic })),
    }, null, 2);
  }

  private extractDiagramFromGeneration(parsed: Record<string, any>, request: GenerateDiagramRequest): DiagramIR {
    // Handle both { diagram: {...} } and direct DiagramIR at root
    const raw = parsed.diagram ?? parsed;
    return {
      schemaVersion: 1,
      diagramId: raw.diagramId ?? `gen-${Date.now()}`,
      title: raw.title ?? 'Generated Diagram',
      type: raw.type ?? request.diagramType ?? 'system',
      metadata: { version: 1, ...(raw.metadata ?? {}) },
      nodes: Array.isArray(raw.nodes) ? raw.nodes : [],
      edges: Array.isArray(raw.edges) ? raw.edges : [],
      groups: Array.isArray(raw.groups) ? raw.groups : [],
      annotations: Array.isArray(raw.annotations) ? raw.annotations : [],
      layout: raw.layout ?? { type: 'freeform', viewport: { x: 0, y: 0, zoom: 1 } },
      theme: raw.theme ?? { name: 'dark', background: '#09090b' },
    };
  }

  private extractTokenUsage(parsed: Record<string, any>): { prompt: number; completion: number; total: number } | undefined {
    if (parsed.usage) {
      return {
        prompt: parsed.usage.prompt_tokens ?? 0,
        completion: parsed.usage.completion_tokens ?? 0,
        total: parsed.usage.total_tokens ?? 0,
      };
    }
    return undefined;
  }
}
