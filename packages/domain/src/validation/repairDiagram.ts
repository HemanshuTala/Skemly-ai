/**
 * Deterministic Repair Engine
 *
 * Fixes recoverable structural issues in a DiagramIR WITHOUT calling the LLM.
 * Called after validation. LLM repair is only a second resort.
 *
 * Every repair is logged with a code so it's auditable.
 */

import type { DiagramIR, DiagramNode, DiagramEdge } from '../diagram/diagram-ir.types';
import { makeDefaultNodeStyle, makeDefaultEdgeStyle } from '../diagram/diagram-ir.types';
import { validateDiagram } from '../validation/validateDiagram';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RepairRecord {
  repairCode: string;
  path: string;
  before: string;
  after: string;
  automated: true;
}

export interface RepairResult {
  diagram: DiagramIR;
  repairs: RepairRecord[];
  remainingErrors: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _counter = 0;
function genId(prefix = 'node'): string {
  return `${prefix}-${Date.now()}-${++_counter}`;
}

function record(code: string, path: string, before: unknown, after: unknown): RepairRecord {
  return {
    repairCode: code,
    path,
    before: JSON.stringify(before),
    after: JSON.stringify(after),
    automated: true,
  };
}

// ─── Individual repairs ───────────────────────────────────────────────────────

function repairNodeIds(nodes: DiagramNode[]): { nodes: DiagramNode[]; repairs: RepairRecord[] } {
  const repairs: RepairRecord[] = [];
  const seenIds = new Set<string>();
  const result: DiagramNode[] = [];

  for (const node of nodes) {
    if (!node.id || node.id.trim() === '') {
      const newId = genId('node');
      repairs.push(record('REGENERATE_MISSING_NODE_ID', `node:${node.label}`, node.id, newId));
      result.push({ ...node, id: newId });
      seenIds.add(newId);
    } else if (seenIds.has(node.id)) {
      const newId = genId(node.id);
      repairs.push(record('REGENERATE_DUPLICATE_NODE_ID', `node:${node.id}`, node.id, newId));
      result.push({ ...node, id: newId });
      seenIds.add(newId);
    } else {
      seenIds.add(node.id);
      result.push(node);
    }
  }

  return { nodes: result, repairs };
}

function repairEdgeIds(edges: DiagramEdge[]): { edges: DiagramEdge[]; repairs: RepairRecord[] } {
  const repairs: RepairRecord[] = [];
  const seenIds = new Set<string>();
  const result: DiagramEdge[] = [];

  for (const edge of edges) {
    if (!edge.id || edge.id.trim() === '') {
      const newId = genId('edge');
      repairs.push(record('REGENERATE_MISSING_EDGE_ID', `edge:${edge.source}->${edge.target}`, edge.id, newId));
      result.push({ ...edge, id: newId });
      seenIds.add(newId);
    } else if (seenIds.has(edge.id)) {
      const newId = genId(edge.id);
      repairs.push(record('REGENERATE_DUPLICATE_EDGE_ID', `edge:${edge.id}`, edge.id, newId));
      result.push({ ...edge, id: newId });
      seenIds.add(newId);
    } else {
      seenIds.add(edge.id);
      result.push(edge);
    }
  }

  return { edges: result, repairs };
}

function repairDanglingEdges(nodes: DiagramNode[], edges: DiagramEdge[]): { edges: DiagramEdge[]; repairs: RepairRecord[] } {
  const repairs: RepairRecord[] = [];
  const nodeIds = new Set(nodes.map(n => n.id));
  const valid: DiagramEdge[] = [];

  for (const edge of edges) {
    const srcMissing = !edge.source || !nodeIds.has(edge.source);
    const tgtMissing = !edge.target || !nodeIds.has(edge.target);
    if (srcMissing || tgtMissing) {
      repairs.push(record(
        'REMOVE_DANGLING_EDGE',
        `edge:${edge.id}`,
        { source: edge.source, target: edge.target },
        'removed'
      ));
    } else {
      valid.push(edge);
    }
  }

  return { edges: valid, repairs };
}

function repairNodePositions(nodes: DiagramNode[]): { nodes: DiagramNode[]; repairs: RepairRecord[] } {
  const repairs: RepairRecord[] = [];
  const result: DiagramNode[] = nodes.map((node, i) => {
    const needsRepair =
      typeof node.position?.x !== 'number' || !isFinite(node.position.x) ||
      typeof node.position?.y !== 'number' || !isFinite(node.position.y);

    if (needsRepair) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const newPos = { x: col * 200 + 50, y: row * 120 + 50 };
      repairs.push(record('REPAIR_INVALID_POSITION', `node:${node.id}.position`, node.position, newPos));
      return { ...node, position: newPos };
    }
    return node;
  });
  return { nodes: result, repairs };
}

function repairNodeSizes(nodes: DiagramNode[]): { nodes: DiagramNode[]; repairs: RepairRecord[] } {
  const repairs: RepairRecord[] = [];
  const defaultSize = { width: 160, height: 50 };
  const result: DiagramNode[] = nodes.map(node => {
    const needsRepair =
      typeof node.size?.width !== 'number' || node.size.width <= 0 ||
      typeof node.size?.height !== 'number' || node.size.height <= 0;
    if (needsRepair) {
      repairs.push(record('REPAIR_INVALID_SIZE', `node:${node.id}.size`, node.size, defaultSize));
      return { ...node, size: defaultSize };
    }
    return node;
  });
  return { nodes: result, repairs };
}

function repairNodeLabels(nodes: DiagramNode[]): { nodes: DiagramNode[]; repairs: RepairRecord[] } {
  const repairs: RepairRecord[] = [];
  const result: DiagramNode[] = nodes.map(node => {
    if (!node.label || typeof node.label !== 'string') {
      const fallback = node.kind || node.id || 'Untitled';
      repairs.push(record('REPAIR_MISSING_LABEL', `node:${node.id}.label`, node.label, fallback));
      return { ...node, label: fallback };
    }
    if (node.label.length > 512) {
      const truncated = node.label.slice(0, 512);
      repairs.push(record('TRUNCATE_LONG_LABEL', `node:${node.id}.label`, `${node.label.length} chars`, `512 chars`));
      return { ...node, label: truncated };
    }
    return node;
  });
  return { nodes: result, repairs };
}

function repairMissingStyles(nodes: DiagramNode[], edges: DiagramEdge[]): { nodes: DiagramNode[]; edges: DiagramEdge[]; repairs: RepairRecord[] } {
  const repairs: RepairRecord[] = [];
  const defaultNode = makeDefaultNodeStyle();
  const defaultEdge = makeDefaultEdgeStyle();

  const repairedNodes = nodes.map(node => {
    if (!node.style || typeof node.style !== 'object') {
      repairs.push(record('REPAIR_MISSING_NODE_STYLE', `node:${node.id}.style`, node.style, 'default'));
      return { ...node, style: { ...defaultNode } };
    }
    return node;
  });

  const repairedEdges = edges.map(edge => {
    if (!edge.style || typeof edge.style !== 'object') {
      repairs.push(record('REPAIR_MISSING_EDGE_STYLE', `edge:${edge.id}.style`, edge.style, 'default'));
      return { ...edge, style: { ...defaultEdge } };
    }
    return edge;
  });

  return { nodes: repairedNodes, edges: repairedEdges, repairs };
}

function repairMissingKind(nodes: DiagramNode[]): { nodes: DiagramNode[]; repairs: RepairRecord[] } {
  const repairs: RepairRecord[] = [];
  const result: DiagramNode[] = nodes.map(node => {
    if (!node.kind || typeof node.kind !== 'string') {
      const fallback = 'rectangle';
      repairs.push(record('REPAIR_MISSING_KIND', `node:${node.id}.kind`, node.kind, fallback));
      return { ...node, kind: fallback };
    }
    return node;
  });
  return { nodes: result, repairs };
}

function repairMissingSemantics(nodes: DiagramNode[], edges: DiagramEdge[]): { nodes: DiagramNode[]; edges: DiagramEdge[]; repairs: RepairRecord[] } {
  const repairs: RepairRecord[] = [];
  const repairedNodes = nodes.map(node => {
    if (!node.semantic || typeof node.semantic !== 'object') {
      repairs.push(record('REPAIR_MISSING_NODE_SEMANTIC', `node:${node.id}.semantic`, node.semantic, '{}'));
      return { ...node, semantic: {} };
    }
    return node;
  });
  const repairedEdges = edges.map(edge => {
    if (!edge.semantic || typeof edge.semantic !== 'object') {
      repairs.push(record('REPAIR_MISSING_EDGE_SEMANTIC', `edge:${edge.id}.semantic`, edge.semantic, '{}'));
      return { ...edge, semantic: {} };
    }
    return edge;
  });
  return { nodes: repairedNodes, edges: repairedEdges, repairs };
}

// ─── Main entry ───────────────────────────────────────────────────────────────

/**
 * Attempt to deterministically fix recoverable issues in a DiagramIR.
 * Always validate after repairing.
 *
 * Returns the (possibly modified) diagram, a list of repairs made,
 * and the count of remaining errors that couldn't be fixed.
 */
export function repairDiagram(input: DiagramIR): RepairResult {
  const allRepairs: RepairRecord[] = [];

  // Work on a deep clone to avoid mutating the input
  let diagram: DiagramIR = JSON.parse(JSON.stringify(input));

  // Ensure arrays exist
  if (!Array.isArray(diagram.nodes)) diagram.nodes = [];
  if (!Array.isArray(diagram.edges)) diagram.edges = [];
  if (!Array.isArray(diagram.groups)) diagram.groups = [];
  if (!Array.isArray(diagram.annotations)) diagram.annotations = [];

  // 1. Fix node IDs first (edges reference them)
  const nodeIdResult = repairNodeIds(diagram.nodes);
  diagram.nodes = nodeIdResult.nodes;
  allRepairs.push(...nodeIdResult.repairs);

  // 2. Fix edge IDs
  const edgeIdResult = repairEdgeIds(diagram.edges);
  diagram.edges = edgeIdResult.edges;
  allRepairs.push(...edgeIdResult.repairs);

  // 3. Remove dangling edges (referencing nodes that don't exist)
  const danglingResult = repairDanglingEdges(diagram.nodes, diagram.edges);
  diagram.edges = danglingResult.edges;
  allRepairs.push(...danglingResult.repairs);

  // 4. Fix positions
  const posResult = repairNodePositions(diagram.nodes);
  diagram.nodes = posResult.nodes;
  allRepairs.push(...posResult.repairs);

  // 5. Fix sizes
  const sizeResult = repairNodeSizes(diagram.nodes);
  diagram.nodes = sizeResult.nodes;
  allRepairs.push(...sizeResult.repairs);

  // 6. Fix labels
  const labelResult = repairNodeLabels(diagram.nodes);
  diagram.nodes = labelResult.nodes;
  allRepairs.push(...labelResult.repairs);

  // 7. Fix kinds
  const kindResult = repairMissingKind(diagram.nodes);
  diagram.nodes = kindResult.nodes;
  allRepairs.push(...kindResult.repairs);

  // 8. Fix styles
  const styleResult = repairMissingStyles(diagram.nodes, diagram.edges);
  diagram.nodes = styleResult.nodes;
  diagram.edges = styleResult.edges;
  allRepairs.push(...styleResult.repairs);

  // 9. Fix semantics
  const semResult = repairMissingSemantics(diagram.nodes, diagram.edges);
  diagram.nodes = semResult.nodes;
  diagram.edges = semResult.edges;
  allRepairs.push(...semResult.repairs);

  // 10. Ensure required top-level fields
  if (!diagram.schemaVersion) {
    allRepairs.push(record('REPAIR_SCHEMA_VERSION', 'schemaVersion', diagram.schemaVersion, 1));
    diagram.schemaVersion = 1;
  }
  if (!diagram.title) {
    allRepairs.push(record('REPAIR_MISSING_TITLE', 'title', diagram.title, 'Untitled Diagram'));
    diagram.title = 'Untitled Diagram';
  }
  if (!diagram.layout) {
    diagram.layout = { type: 'freeform', viewport: { x: 0, y: 0, zoom: 1 } };
  }
  if (!diagram.theme) {
    diagram.theme = { name: 'dark', background: '#09090b' };
  }
  if (!diagram.metadata) {
    diagram.metadata = { version: 1 };
  }

  // Re-validate to count remaining errors
  const finalValidation = validateDiagram(diagram);

  return {
    diagram,
    repairs: allRepairs,
    remainingErrors: finalValidation.errorCount,
  };
}
