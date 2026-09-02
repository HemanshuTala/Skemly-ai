/**
 * SCHEMELY AI — CANONICAL DIAGRAM PARSER & SERIALIZER
 *
 * Single source of truth for parsing text-based architecture syntax into React Flow graphs,
 * validating AI responses, merging partial AI updates, and serializing back to text syntax.
 */

import { MarkerType, type Node, type Edge } from 'reactflow';
import { getShapeDefinition, CANONICAL_SHAPES } from './shapeRegistry';

export interface ParsedGraph {
  nodes: Node[];
  edges: Edge[];
}

export function slugifyId(text: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `node-${Math.random().toString(16).slice(2, 6)}`;
}

export interface NodeInfo {
  id?: string;
  label: string;
  kind: string;
  shape?: string;
  width?: number;
  height?: number;
  type: string;
  style?: Record<string, any>;
}

/**
 * Sanitizes raw LLM / AI outputs before parsing.
 * Strips markdown codeblocks (```mermaid, ```markdown, ```diagram),
 * conversational preamble/postscript, and system diagram headers.
 */
export function sanitizeAISyntax(raw: string): string {
  let text = String(raw || '').trim();
  if (!text) return '';

  // Extract content inside code blocks if present
  const codeBlockMatch = text.match(/```(?:mermaid|markdown|diagram|txt|text)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch && codeBlockMatch[1].trim()) {
    text = codeBlockMatch[1].trim();
  }

  const lines = text.split('\n');
  const validLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const isHeader = /^(flowchart|graph|subgraph|end|erdiagram|sequenceDiagram|classdiagram)/i.test(trimmed);
    const isFence = trimmed.startsWith('```');

    if (isFence || isHeader) continue;

    // A valid diagram line MUST contain at least one bracket, brace, parenthesis, arrow, or pipe
    const hasSyntaxTokens = /[\[\{\(\]\}\)]|-->|->|==>|-\.\->|\|/.test(trimmed);
    if (!hasSyntaxTokens) continue;

    validLines.push(trimmed);
  }

  return validLines.join('\n');
}

/**
 * Unwrap node syntax tokens like:
 * - `redis["Redis Cache"]`
 * - `db[("PostgreSQL Database")]`
 * - `[Rectangle|w:200,h:100,shape:rectangle]`
 * - `{Is Valid?}`
 * - `(Start Process)`
 */
export function extractNodeInfo(raw: string): NodeInfo {
  let cleaned = String(raw || '').trim();
  if (!cleaned) {
    return { label: 'Node', kind: 'node', type: 'diagramNode' };
  }

  // Check for explicit ID prefix: e.g. `redis["Redis Cache"]` or `api[API Gateway]`
  const hasPipe = cleaned.includes('|');
  const explicitIdMatch = !hasPipe
    ? cleaned.match(/^([a-zA-Z0-9_-]+)\s*([\[\(\{].*[\}\)\]])$/)
    : null;

  let explicitId: string | undefined;
  if (explicitIdMatch) {
    explicitId = explicitIdMatch[1];
    cleaned = explicitIdMatch[2].trim();
  }

  // Handle shape attributes inside pipe: `[Label|w:120,h:80,shape:rectangle,fill:#18181b]`
  if (cleaned.startsWith('[') && cleaned.endsWith(']') && cleaned.includes('|')) {
    const content = cleaned.slice(1, -1).trim();
    const pipeIdx = content.indexOf('|');
    const label = content.slice(0, pipeIdx).trim() || 'Node';
    const attrStr = content.slice(pipeIdx + 1).trim();

    let width: number | undefined;
    let height: number | undefined;
    let shape: string | undefined;
    let kind: string = 'node';
    const style: Record<string, any> = {};

    attrStr.split(',').forEach((attr) => {
      const [k, v] = attr.split(':').map((s) => s.trim());
      if (!k || !v) return;
      if (k === 'w') width = parseInt(v, 10);
      else if (k === 'h') height = parseInt(v, 10);
      else if (k === 'shape') shape = v;
      else if (k === 'kind') kind = v;
      else if (k === 'fill') style.fillColor = v;
      else if (k === 'stroke') style.strokeColor = v;
      else if (k === 'color') style.color = v;
    });

    const isResizable = !!shape || kind === 'resizableShape';
    return {
      id: explicitId || slugifyId(label),
      label,
      kind: kind !== 'node' ? kind : shape && CANONICAL_SHAPES[shape] ? shape : 'node',
      shape,
      width,
      height,
      type: isResizable ? 'resizableShape' : 'diagramNode',
      style: Object.keys(style).length > 0 ? style : undefined,
    };
  }

  // Standard bracket forms: {Decision}, (StartEnd), [[Database]], [Process]
  let kind = 'node';
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    kind = 'decision';
    cleaned = cleaned.slice(1, -1);
  } else if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    kind = 'startend';
    cleaned = cleaned.slice(1, -1);
  } else if (cleaned.startsWith('[[') && cleaned.endsWith(']]')) {
    kind = 'database';
    cleaned = cleaned.slice(2, -2);
  } else if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
    cleaned = cleaned.slice(1, -1);
  }

  // Strip leading/trailing quotes if present
  cleaned = cleaned.trim().replace(/^["']|["']$/g, '');
  if (!cleaned) cleaned = 'Node';

  // Infer kind from canonical registry if label matches a shape name
  const lower = cleaned.toLowerCase();
  if (kind === 'node') {
    if (lower.includes('database') || lower.includes('postgres') || lower.includes('mysql') || lower.includes('mongodb') || lower.includes('redis') || lower.includes('db')) {
      kind = 'database';
    } else if (lower.includes('queue') || lower.includes('kafka') || lower.includes('rabbitmq') || lower.includes('sqs')) {
      kind = 'queue';
    } else if (lower.includes('table') || lower.includes('schema') || lower.includes('entity')) {
      kind = 'entity';
    } else if (lower.includes('actor') || lower.includes('user') || lower.includes('client')) {
      kind = 'actor';
    } else if (lower.includes('start') || lower.includes('end') || lower.includes('stop')) {
      kind = 'startend';
    }
  }

  return {
    id: explicitId || slugifyId(cleaned),
    label: cleaned,
    kind,
    type: 'diagramNode',
  };
}

/**
 * Validates node & edge integrity of a parsed graph.
 * Deduplicates node IDs and strips dangling edges.
 */
export function validateParsedGraph(graph: ParsedGraph): { valid: boolean; errors: string[]; graph: ParsedGraph } {
  const errors: string[] = [];
  if (!graph || !Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    return { valid: false, errors: ['Graph contains no nodes'], graph: { nodes: [], edges: [] } };
  }

  const seenIds = new Set<string>();
  const validNodes: Node[] = [];

  graph.nodes.forEach((node, index) => {
    let nodeId = String(node.id || `n-${index}`).trim();
    if (!nodeId) nodeId = `n-${index}`;

    // Deduplicate duplicate node IDs
    if (seenIds.has(nodeId)) {
      errors.push(`Duplicate node ID '${nodeId}' deduplicated`);
      nodeId = `${nodeId}-${Math.random().toString(16).slice(2, 6)}`;
    }
    seenIds.add(nodeId);

    const pos = node.position || { x: 0, y: 0 };
    const safeX = Number.isFinite(pos.x) ? pos.x : 0;
    const safeY = Number.isFinite(pos.y) ? pos.y : 0;

    validNodes.push({
      ...node,
      id: nodeId,
      position: { x: safeX, y: safeY },
      data: {
        ...node.data,
        label: String(node.data?.label || nodeId).trim(),
      },
    });
  });

  const nodeSet = new Set(validNodes.map((n) => n.id));
  const validEdges: Edge[] = [];

  (graph.edges || []).forEach((edge) => {
    if (!edge.source || !edge.target) {
      errors.push(`Edge '${edge.id}' missing source or target`);
      return;
    }
    if (!nodeSet.has(edge.source) || !nodeSet.has(edge.target)) {
      errors.push(`Dangling edge '${edge.id}' (${edge.source} -> ${edge.target}) removed`);
      return;
    }
    validEdges.push(edge);
  });

  return {
    valid: validNodes.length > 0,
    errors,
    graph: { nodes: validNodes, edges: validEdges },
  };
}

/**
 * Main parser: converts raw AI or user syntax string into React Flow nodes and edges.
 * Sanitizes AI prompt output, repairs malformed brackets, deduplicates IDs, and applies safe auto-layout.
 */
export function parseSyntaxToGraph(syntax: string): ParsedGraph {
  const sanitized = sanitizeAISyntax(syntax);
  if (!sanitized) return { nodes: [], edges: [] };

  let fixedSyntax = sanitized;

  // Pre-process: fix duplicate brackets like [[Rectangle|...]] -> [Rectangle|...]
  fixedSyntax = fixedSyntax.replace(/\[{2,}([a-zA-Z0-9_ \-]+)\|([^\]]*)\]/g, (_m, label, attrs) => {
    return `[${label.trim()}|${attrs}]`;
  });

  const lines = fixedSyntax
    .split('\n')
    .flatMap((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) return [];

      // Auto-close missing bracket at end of attribute token
      if (trimmed.match(/^\[[^\]]+\|/) && !trimmed.endsWith(']')) {
        return [trimmed + ']'];
      }

      // Split comma-separated connections outside brackets: e.g. "A --> B, C --> D"
      if (trimmed.includes('-->') && trimmed.includes(',')) {
        const parts: string[] = [];
        let depth = 0;
        let current = '';
        for (const ch of trimmed) {
          if (ch === '[' || ch === '(' || ch === '{') depth++;
          else if (ch === ']' || ch === ')' || ch === '}') depth--;
          if (ch === ',' && depth === 0) {
            if (current.trim()) parts.push(current.trim());
            current = '';
          } else {
            current += ch;
          }
        }
        if (current.trim()) parts.push(current.trim());
        if (parts.length > 1) return parts;
      }
      return [trimmed];
    })
    .filter(Boolean);

  const nodeById = new Map<string, Node>();
  const edges: Edge[] = [];

  const ensureNode = (rawToken: string): Node | null => {
    const info = extractNodeInfo(rawToken);
    const nodeId = info.id || slugifyId(info.label);

    if (nodeById.has(nodeId)) {
      return nodeById.get(nodeId)!;
    }

    const shapeDef = getShapeDefinition(info.kind);
    const isResizable = info.type === 'resizableShape';

    const width = info.width || shapeDef.defaultWidth;
    const height = info.height || shapeDef.defaultHeight;

    const node: Node = {
      id: nodeId,
      type: isResizable ? 'resizableShape' : 'diagramNode',
      position: { x: 0, y: 0 },
      width,
      height,
      data: {
        label: info.label,
        kind: info.kind,
        ...(info.shape ? { shape: info.shape } : {}),
        style: {
          fillColor: info.style?.fillColor || shapeDef.fillColor,
          strokeColor: info.style?.strokeColor || shapeDef.borderColor,
          strokeWidth: 2,
          fontSize: 14,
          color: info.style?.color || shapeDef.textColor,
          borderRadius: shapeDef.borderRadius,
        },
      },
    };

    nodeById.set(nodeId, node);
    return node;
  };

  lines.forEach((line) => {
    // Check for edge connection patterns: -->, -- label -->, ==>, -.->
    const edgeMatch = line.match(/^(.+?)\s*(?:--\s*(.+?)\s*-->|==\s*(.+?)\s*==>|-\.\s*(.+?)\s*\.->|==>|-\.-\.>|-->)\s*(.+)$/);

    if (edgeMatch) {
      const fromToken = edgeMatch[1].trim();
      const toToken = edgeMatch[edgeMatch.length - 1].trim();
      const label = (edgeMatch[2] || edgeMatch[3] || edgeMatch[4] || '').trim();

      const fromNode = ensureNode(fromToken);
      const toNode = ensureNode(toToken);

      if (fromNode && toNode) {
        let style: any = { stroke: '#3f3f46', strokeWidth: 2 };
        if (line.includes('==>')) style.strokeWidth = 3.5;
        else if (line.includes('-.->') || line.includes('.->')) style.strokeDasharray = '5 5';

        const edgeId = `e-${fromNode.id}-${toNode.id}`;
        if (!edges.some((e) => e.source === fromNode.id && e.target === toNode.id)) {
          edges.push({
            id: edgeId,
            source: fromNode.id,
            target: toNode.id,
            type: 'smoothstep',
            style,
            markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: '#a1a1aa' },
            ...(label ? { label } : {}),
          });
        }
      }
    } else {
      ensureNode(line);
    }
  });

  const rawGraph: ParsedGraph = { nodes: Array.from(nodeById.values()), edges };
  const validated = validateParsedGraph(rawGraph);

  const laidOutGraph = applySafeAutoLayout(validated.graph.nodes, validated.graph.edges);
  return laidOutGraph;
}

/**
 * Cycle-safe, height-aware hierarchical layout algorithm with barycenter edge crossing reduction
 * and dynamic column centering.
 */
export function applySafeAutoLayout(nodes: Node[], edges: Edge[]): ParsedGraph {
  if (nodes.length === 0) return { nodes: [], edges: [] };

  const nodeMap = new Map<string, Node>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const incoming = new Map<string, number>();
  const adj = new Map<string, string[]>();

  nodes.forEach((n) => {
    incoming.set(n.id, 0);
    adj.set(n.id, []);
  });

  edges.forEach((e) => {
    incoming.set(e.target, (incoming.get(e.target) ?? 0) + 1);
    adj.set(e.source, [...(adj.get(e.source) ?? []), e.target]);
  });

  // Calculate topological depth using BFS with cycle detection guard
  const depth = new Map<string, number>();
  const visit = (id: string, d: number, visitedPath: Set<string>) => {
    if (visitedPath.has(id)) return; // Cycle guard
    visitedPath.add(id);

    depth.set(id, Math.max(depth.get(id) ?? 0, d));
    const neighbors = adj.get(id) ?? [];
    neighbors.forEach((next) => visit(next, d + 1, new Set(visitedPath)));
  };

  const roots = nodes.filter((n) => (incoming.get(n.id) ?? 0) === 0);
  if (roots.length === 0 && nodes.length > 0) {
    roots.push(nodes[0]);
  }

  roots.forEach((r) => visit(r.id, 0, new Set()));

  // Architectural layer hints for nodes where topological depth is undefined
  nodes.forEach((n) => {
    if (!depth.has(n.id)) {
      const kind = n.data?.kind || 'node';
      const label = (n.data?.label || '').toLowerCase();

      if (kind === 'actor' || kind === 'startend' || label.includes('user') || label.includes('client')) {
        depth.set(n.id, 0);
      } else if (kind === 'database' || kind === 'entity' || label.includes('db') || label.includes('cache')) {
        depth.set(n.id, 3);
      } else if (kind === 'queue' || label.includes('kafka') || label.includes('queue')) {
        depth.set(n.id, 2);
      } else {
        depth.set(n.id, 1);
      }
    }
  });

  // Group nodes into column levels
  const levelsMap = new Map<number, Node[]>();
  nodes.forEach((n) => {
    const d = depth.get(n.id) ?? 0;
    const list = levelsMap.get(d) ?? [];
    list.push(n);
    levelsMap.set(d, list);
  });

  const sortedLevels = Array.from(levelsMap.keys()).sort((a, b) => a - b);

  // Measure maximum column height across all levels to calculate centering baseline
  const levelHeights = sortedLevels.map((levelIdx) => {
    const levelNodes = levelsMap.get(levelIdx) ?? [];
    return levelNodes.reduce((sum, n) => sum + (Number(n.height) || 60) + 40, 0);
  });

  const maxTotalHeight = Math.max(...levelHeights, 300);
  const baselineCenterY = maxTotalHeight / 2;

  let currentX = 80;

  sortedLevels.forEach((levelIdx, colIndex) => {
    const levelNodes = levelsMap.get(levelIdx) ?? [];

    // Sort nodes in column using barycenter Y-position of parent nodes to minimize edge crossings
    if (colIndex > 0) {
      levelNodes.sort((a, b) => {
        const aIncomingEdges = edges.filter((e) => e.target === a.id);
        const bIncomingEdges = edges.filter((e) => e.target === b.id);

        const getAvgParentY = (edgeList: Edge[]) => {
          if (edgeList.length === 0) return 0;
          const sumY = edgeList.reduce((acc, e) => {
            const parent = nodeMap.get(e.source);
            return acc + (parent ? parent.position.y : 0);
          }, 0);
          return sumY / edgeList.length;
        };

        const aY = getAvgParentY(aIncomingEdges);
        const bY = getAvgParentY(bIncomingEdges);

        if (aY !== bY) return aY - bY;
        return String(a.data?.label || a.id).localeCompare(String(b.data?.label || b.id));
      });
    } else {
      levelNodes.sort((a, b) => String(a.data?.label || a.id).localeCompare(String(b.data?.label || b.id)));
    }

    // Calculate vertical start Y so column is centered relative to max baseline
    const columnHeight = levelNodes.reduce((sum, n) => sum + (Number(n.height) || 60) + 40, 0);
    let currentY = Math.max(60, baselineCenterY - columnHeight / 2);

    let maxColWidth = 160;

    levelNodes.forEach((node) => {
      const nodeW = Number(node.width) || 160;
      const nodeH = Number(node.height) || 60;
      maxColWidth = Math.max(maxColWidth, nodeW);

      node.position = {
        x: Math.round(currentX),
        y: Math.round(currentY),
      };

      currentY += nodeH + 40; // 40px vertical gap
    });

    currentX += maxColWidth + 120; // Dynamic column gap: width + 120px
  });

  return { nodes, edges };
}

/**
 * Merges partial AI updates into an existing user diagram graph.
 * PRESERVES existing node positions (x, y), styles, dimensions, and untouched edges.
 * Never replaces a valid diagram with an invalid / empty AI output.
 */
export function mergeAIGraphUpdate(existingGraph: ParsedGraph, aiSyntax: string): ParsedGraph {
  const parsedAI = parseSyntaxToGraph(aiSyntax);
  const validation = validateParsedGraph(parsedAI);

  // If AI generation yielded no valid nodes, keep existing graph!
  if (!validation.valid || validation.graph.nodes.length === 0) {
    console.warn('[mergeAIGraphUpdate] Invalid AI syntax output; preserving existing diagram');
    return existingGraph;
  }

  const existingNodeMap = new Map<string, Node>();
  const existingLabelMap = new Map<string, Node>();

  (existingGraph.nodes || []).forEach((n) => {
    existingNodeMap.set(n.id, n);
    const labelKey = slugifyId(String(n.data?.label || n.id));
    existingLabelMap.set(labelKey, n);
  });

  const mergedNodes: Node[] = [];

  validation.graph.nodes.forEach((aiNode) => {
    const labelKey = slugifyId(String(aiNode.data?.label || aiNode.id));

    // Try finding matching existing node by ID first, then by normalized label
    const matched = existingNodeMap.get(aiNode.id) || existingLabelMap.get(labelKey);

    if (matched) {
      // Retain existing user position and style!
      mergedNodes.push({
        ...aiNode,
        id: matched.id, // Preserve stable ID!
        position: { ...matched.position },
        width: matched.width || aiNode.width,
        height: matched.height || aiNode.height,
        data: {
          ...aiNode.data,
          style: { ...(aiNode.data?.style || {}), ...(matched.data?.style || {}) },
        },
      });
    } else {
      // New node added by AI: place near parent or at default offset
      const parentEdge = validation.graph.edges.find((e) => e.target === aiNode.id);
      const parentNode = parentEdge ? mergedNodes.find((n) => n.id === parentEdge.source) : null;

      const x = parentNode ? parentNode.position.x + 260 : 100 + mergedNodes.length * 50;
      const y = parentNode ? parentNode.position.y : 100 + mergedNodes.length * 80;

      mergedNodes.push({
        ...aiNode,
        position: { x, y },
      });
    }
  });

  // Preserve existing edges that connect valid merged nodes
  const mergedNodeIds = new Set(mergedNodes.map((n) => n.id));
  const mergedEdges: Edge[] = [];

  validation.graph.edges.forEach((e) => {
    if (mergedNodeIds.has(e.source) && mergedNodeIds.has(e.target)) {
      mergedEdges.push(e);
    }
  });

  // Retain existing edges if both endpoints still exist in merged nodes
  (existingGraph.edges || []).forEach((e) => {
    if (mergedNodeIds.has(e.source) && mergedNodeIds.has(e.target)) {
      if (!mergedEdges.some((me) => me.source === e.source && me.target === e.target)) {
        mergedEdges.push(e);
      }
    }
  });

  return { nodes: mergedNodes, edges: mergedEdges };
}

/**
 * Serializes a React Flow graph back to text syntax preserving node IDs and custom shape attributes.
 */
export function graphToSyntax(nodes: Node[], edges: Edge[]): string {
  const nodeMap = new Map<string, Node>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const formatNodeRef = (n: Node): string => {
    const data = (n.data as any) || {};
    const label = String(data.label || n.id).trim();
    const kind = String(data.kind || 'node');
    const shape = data.shape;
    const isResizable = n.type === 'resizableShape';
    const style = data.style || {};

    const cleanLabel = label.replace(/^[\[({]+/, '').replace(/[\])}]+$/, '');

    // Check if ID is different from slugified label
    const needsExplicitId = n.id !== slugifyId(cleanLabel);
    const idPrefix = needsExplicitId ? `${n.id}` : '';

    if (isResizable) {
      const shapeAttr = shape || 'rectangle';
      const w = n.width ? Math.round(Number(n.width)) : undefined;
      const h = n.height ? Math.round(Number(n.height)) : undefined;
      const dimStr = w && h ? `w:${w},h:${h},` : '';

      const styleParts: string[] = [];
      if (style.fillColor && style.fillColor !== '#18181b' && style.fillColor !== '#ffffff') styleParts.push(`fill:${style.fillColor}`);
      if (style.strokeColor && style.strokeColor !== '#3f3f46' && style.strokeColor !== '#000000') styleParts.push(`stroke:${style.strokeColor}`);
      if (style.color && style.color !== '#ffffff') styleParts.push(`color:${style.color}`);
      const styleStr = styleParts.length > 0 ? styleParts.join(',') + ',' : '';

      return `${idPrefix}[${cleanLabel}|${dimStr}${styleStr}shape:${shapeAttr}]`;
    }

    if (kind === 'decision') return `${idPrefix}{${cleanLabel}}`;
    if (kind === 'startend') return `${idPrefix}(${cleanLabel})`;
    if (kind === 'database') return `${idPrefix}[[${cleanLabel}]]`;

    return `${idPrefix}[${cleanLabel}]`;
  };

  const lines: string[] = [];
  const connectedNodeIds = new Set<string>();

  edges.forEach((e) => {
    const fromNode = nodeMap.get(e.source);
    const toNode = nodeMap.get(e.target);
    if (!fromNode || !toNode) return;

    connectedNodeIds.add(e.source);
    connectedNodeIds.add(e.target);

    const fromRef = formatNodeRef(fromNode);
    const toRef = formatNodeRef(toNode);
    const label = String(e.label || '').trim();

    if (label) {
      lines.push(`${fromRef} -- ${label} --> ${toRef}`);
    } else {
      lines.push(`${fromRef} --> ${toRef}`);
    }
  });

  // Preserve unconnected standalone nodes
  nodes.forEach((n) => {
    if (connectedNodeIds.has(n.id)) return;
    lines.push(formatNodeRef(n));
  });

  return lines.join('\n');
}
