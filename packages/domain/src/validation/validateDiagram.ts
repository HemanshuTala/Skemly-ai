/**
 * Diagram Domain Validator
 *
 * Enforces structural and semantic invariants on DiagramIR objects.
 * Framework-independent — can be used in both frontend and backend.
 *
 * NEVER blindly accept LLM output without running it through here.
 */

import type { DiagramIR, DiagramNode, DiagramEdge, DiagramType } from '../diagram/diagram-ir.types';

// ─── Result Types ─────────────────────────────────────────────────────────────

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  code: string;
  severity: ValidationSeverity;
  path: string;
  message: string;
  recoverable: boolean;
  nodeId?: string;
  edgeId?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function issue(
  code: string,
  severity: ValidationSeverity,
  path: string,
  message: string,
  recoverable: boolean,
  extra?: Partial<Pick<ValidationIssue, 'nodeId' | 'edgeId'>>
): ValidationIssue {
  return { code, severity, path, message, recoverable, ...extra };
}

function buildResult(issues: ValidationIssue[]): ValidationResult {
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  return { valid: errorCount === 0, issues, errorCount, warningCount };
}

// ─── Node validators ─────────────────────────────────────────────────────────

function validateNodes(nodes: DiagramNode[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const path = `nodes[${i}]`;

    // ID presence
    if (!node.id || typeof node.id !== 'string' || node.id.trim() === '') {
      issues.push(issue('NODE_MISSING_ID', 'error', `${path}.id`, `Node at index ${i} has no id`, true));
      continue;
    }

    // Duplicate IDs
    if (seenIds.has(node.id)) {
      issues.push(issue('NODE_DUPLICATE_ID', 'error', `${path}.id`, `Duplicate node id: "${node.id}"`, true, { nodeId: node.id }));
    } else {
      seenIds.add(node.id);
    }

    // Label
    if (!node.label || typeof node.label !== 'string') {
      issues.push(issue('NODE_MISSING_LABEL', 'warning', `${path}.label`, `Node "${node.id}" has no label`, true, { nodeId: node.id }));
    } else if (node.label.length > 512) {
      issues.push(issue('NODE_LABEL_TOO_LONG', 'warning', `${path}.label`, `Node "${node.id}" label exceeds 512 chars`, true, { nodeId: node.id }));
    }

    // Position
    if (typeof node.position?.x !== 'number' || !isFinite(node.position.x) ||
        typeof node.position?.y !== 'number' || !isFinite(node.position.y)) {
      issues.push(issue('NODE_INVALID_POSITION', 'error', `${path}.position`, `Node "${node.id}" has invalid position`, true, { nodeId: node.id }));
    }

    // Size
    if (typeof node.size?.width !== 'number' || node.size.width <= 0 ||
        typeof node.size?.height !== 'number' || node.size.height <= 0) {
      issues.push(issue('NODE_INVALID_SIZE', 'error', `${path}.size`, `Node "${node.id}" has invalid size (must be > 0)`, true, { nodeId: node.id }));
    }

    // Kind
    if (!node.kind || typeof node.kind !== 'string') {
      issues.push(issue('NODE_MISSING_KIND', 'warning', `${path}.kind`, `Node "${node.id}" has no kind`, true, { nodeId: node.id }));
    }
  }

  return issues;
}

// ─── Edge validators ─────────────────────────────────────────────────────────

function validateEdges(edges: DiagramEdge[], nodeIds: Set<string>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const path = `edges[${i}]`;

    // ID
    if (!edge.id || typeof edge.id !== 'string' || edge.id.trim() === '') {
      issues.push(issue('EDGE_MISSING_ID', 'error', `${path}.id`, `Edge at index ${i} has no id`, true));
      continue;
    }

    // Duplicate
    if (seenIds.has(edge.id)) {
      issues.push(issue('EDGE_DUPLICATE_ID', 'error', `${path}.id`, `Duplicate edge id: "${edge.id}"`, true, { edgeId: edge.id }));
    } else {
      seenIds.add(edge.id);
    }

    // Source presence
    if (!edge.source) {
      issues.push(issue('EDGE_MISSING_SOURCE', 'error', `${path}.source`, `Edge "${edge.id}" has no source`, false, { edgeId: edge.id }));
    } else if (!nodeIds.has(edge.source)) {
      issues.push(issue('EDGE_SOURCE_NOT_FOUND', 'error', `${path}.source`, `Edge "${edge.id}" source "${edge.source}" not found`, true, { edgeId: edge.id }));
    }

    // Target presence
    if (!edge.target) {
      issues.push(issue('EDGE_MISSING_TARGET', 'error', `${path}.target`, `Edge "${edge.id}" has no target`, false, { edgeId: edge.id }));
    } else if (!nodeIds.has(edge.target)) {
      issues.push(issue('EDGE_TARGET_NOT_FOUND', 'error', `${path}.target`, `Edge "${edge.id}" target "${edge.target}" not found`, true, { edgeId: edge.id }));
    }

    // Self-loop warning (not necessarily invalid, but worth flagging)
    if (edge.source && edge.target && edge.source === edge.target) {
      issues.push(issue('EDGE_SELF_LOOP', 'warning', path, `Edge "${edge.id}" is a self-loop on node "${edge.source}"`, true, { edgeId: edge.id }));
    }
  }

  return issues;
}

// ─── Structural warnings ──────────────────────────────────────────────────────

function validateConnectivity(nodes: DiagramNode[], edges: DiagramEdge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const connectedIds = new Set<string>();
  for (const e of edges) {
    connectedIds.add(e.source);
    connectedIds.add(e.target);
  }
  for (const node of nodes) {
    if (!connectedIds.has(node.id)) {
      issues.push(issue(
        'WARN_ORPHAN_NODE',
        'warning',
        `node:${node.id}`,
        `Node "${node.label || node.id}" is not connected to any edge`,
        true,
        { nodeId: node.id }
      ));
    }
  }
  return issues;
}

// ─── Sequence-specific ───────────────────────────────────────────────────────

function validateSequenceDiagram(diagram: DiagramIR): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  // Participants = all nodes in a sequence diagram
  const participantIds = new Set(diagram.nodes.map(n => n.id));
  for (const edge of diagram.edges) {
    if (edge.source && !participantIds.has(edge.source)) {
      issues.push(issue('SEQ_UNKNOWN_PARTICIPANT', 'error', `edge:${edge.id}`, `Sequence edge references unknown participant "${edge.source}"`, true, { edgeId: edge.id }));
    }
    if (edge.target && !participantIds.has(edge.target)) {
      issues.push(issue('SEQ_UNKNOWN_PARTICIPANT', 'error', `edge:${edge.id}`, `Sequence edge references unknown participant "${edge.target}"`, true, { edgeId: edge.id }));
    }
  }
  return issues;
}

// ─── ERD-specific ────────────────────────────────────────────────────────────

const VALID_CARDINALITIES = new Set(['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many', '1:1', '1:N', 'N:1', 'N:M']);

function validateERD(diagram: DiagramIR): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const edge of diagram.edges) {
    const rel = edge.semantic?.relation;
    if (rel && !VALID_CARDINALITIES.has(rel)) {
      issues.push(issue('ERD_INVALID_CARDINALITY', 'warning', `edge:${edge.id}`, `ERD edge "${edge.id}" has invalid cardinality "${rel}"`, true, { edgeId: edge.id }));
    }
  }
  return issues;
}

// ─── State-specific ──────────────────────────────────────────────────────────

function validateStateDiagram(diagram: DiagramIR): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const stateIds = new Set(diagram.nodes.map(n => n.id));
  for (const edge of diagram.edges) {
    if (edge.source && !stateIds.has(edge.source)) {
      issues.push(issue('STATE_UNKNOWN_SOURCE', 'error', `edge:${edge.id}`, `State transition references unknown state "${edge.source}"`, true, { edgeId: edge.id }));
    }
    if (edge.target && !stateIds.has(edge.target)) {
      issues.push(issue('STATE_UNKNOWN_TARGET', 'error', `edge:${edge.id}`, `State transition references unknown state "${edge.target}"`, true, { edgeId: edge.id }));
    }
  }
  return issues;
}

// ─── Semantic validators dispatch ─────────────────────────────────────────────

const SEMANTIC_VALIDATORS: Partial<Record<DiagramType, (d: DiagramIR) => ValidationIssue[]>> = {
  sequence: validateSequenceDiagram,
  erd: validateERD,
  state: validateStateDiagram,
};

// ─── Main entry ───────────────────────────────────────────────────────────────

/**
 * Validate a DiagramIR object.
 * Returns a result with all issues found.
 * Call this on every AI response before persisting.
 */
export function validateDiagram(diagram: DiagramIR): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Top-level checks
  if (!diagram.diagramId || typeof diagram.diagramId !== 'string') {
    issues.push(issue('DIAGRAM_MISSING_ID', 'error', 'diagramId', 'Diagram has no id', false));
  }
  if (!diagram.title || typeof diagram.title !== 'string') {
    issues.push(issue('DIAGRAM_MISSING_TITLE', 'warning', 'title', 'Diagram has no title', true));
  }
  if (!diagram.type) {
    issues.push(issue('DIAGRAM_MISSING_TYPE', 'error', 'type', 'Diagram type is required', false));
  }
  if (!Array.isArray(diagram.nodes)) {
    issues.push(issue('DIAGRAM_INVALID_NODES', 'error', 'nodes', 'nodes must be an array', false));
    return buildResult(issues);
  }
  if (!Array.isArray(diagram.edges)) {
    issues.push(issue('DIAGRAM_INVALID_EDGES', 'error', 'edges', 'edges must be an array', false));
    return buildResult(issues);
  }

  // Node validation
  issues.push(...validateNodes(diagram.nodes));

  // Build valid node ID set for edge validation
  const nodeIds = new Set(diagram.nodes.filter(n => n.id).map(n => n.id));

  // Edge validation
  issues.push(...validateEdges(diagram.edges, nodeIds));

  // Connectivity warnings
  if (diagram.nodes.length > 1) {
    issues.push(...validateConnectivity(diagram.nodes, diagram.edges));
  }

  // Semantic/type-specific validation
  const semanticValidator = SEMANTIC_VALIDATORS[diagram.type];
  if (semanticValidator) {
    issues.push(...semanticValidator(diagram));
  }

  return buildResult(issues);
}

/**
 * Quick check — returns true if diagram passes all error-level checks.
 */
export function isDiagramValid(diagram: DiagramIR): boolean {
  return validateDiagram(diagram).valid;
}
