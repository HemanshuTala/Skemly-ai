/**
 * SCHEMELY AI — CANONICAL DIAGRAM PARSER & SERIALIZER
 *
 * Single source of truth for parsing text-based architecture syntax into React Flow graphs,
 * validating AI responses, merging partial AI updates, and serializing back to text syntax.
 */

export interface Node {
  id: string;
  type?: string;
  position: { x: number; y: number };
  width?: number | null;
  height?: number | null;
  data: {
    label: string;
    kind?: string;
    shape?: string;
    icon?: string;
    style?: Record<string, any>;
    [key: string]: any;
  };
  style?: Record<string, any>;
  [key: string]: any;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  style?: Record<string, any>;
  markerEnd?: any;
  [key: string]: any;
}

export const MarkerType = {
  ArrowClosed: 'arrowclosed',
};

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

  const hasPipe = cleaned.includes('|');
  const explicitIdMatch = !hasPipe
    ? cleaned.match(/^([a-zA-Z0-9_-]+)\s*([\[\(\{].*[\}\)\]])$/)
    : null;

  let explicitId: string | undefined;
  if (explicitIdMatch) {
    explicitId = explicitIdMatch[1];
    cleaned = explicitIdMatch[2].trim();
  }

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
      kind,
      shape,
      width,
      height,
      type: isResizable ? 'resizableShape' : 'diagramNode',
      style: Object.keys(style).length > 0 ? style : undefined,
    };
  }

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

  cleaned = cleaned.trim().replace(/^["']|["']$/g, '');
  if (!cleaned) cleaned = 'Node';

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

    if (seenIds.has(nodeId)) {
      errors.push(`Duplicate node ID '${nodeId}' deduplicated`);
      let dupIndex = 1;
      let candidateId = `${nodeId}-dup-${dupIndex}`;
      while (seenIds.has(candidateId)) {
        dupIndex++;
        candidateId = `${nodeId}-dup-${dupIndex}`;
      }
      nodeId = candidateId;
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

export function parseSyntaxToGraph(syntax: string): ParsedGraph {
  const sanitized = sanitizeAISyntax(syntax);
  if (!sanitized) return { nodes: [], edges: [] };

  let fixedSyntax = sanitized;

  fixedSyntax = fixedSyntax.replace(/\[{2,}([a-zA-Z0-9_ \-]+)\|([^\]]*)\]/g, (_m, label, attrs) => {
    return `[${label.trim()}|${attrs}]`;
  });

  const lines = fixedSyntax
    .split('\n')
    .flatMap((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) return [];

      if (trimmed.match(/^\[[^\]]+\|/) && !trimmed.endsWith(']')) {
        return [trimmed + ']'];
      }

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

    const isResizable = info.type === 'resizableShape';
    const width = info.width || 160;
    const height = info.height || 60;

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
          fillColor: info.style?.fillColor || '#18181b',
          strokeColor: info.style?.strokeColor || '#3f3f46',
          strokeWidth: 2,
          fontSize: 14,
          color: info.style?.color || '#ffffff',
        },
      },
    };

    nodeById.set(nodeId, node);
    return node;
  };

  lines.forEach((line) => {
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

export function mergeAIGraphUpdate(existingGraph: ParsedGraph, aiSyntax: string): ParsedGraph {
  const parsedAI = parseSyntaxToGraph(aiSyntax);
  const validation = validateParsedGraph(parsedAI);

  if (!validation.valid || validation.graph.nodes.length === 0) {
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
    const matched = existingNodeMap.get(aiNode.id) || existingLabelMap.get(labelKey);

    if (matched) {
      mergedNodes.push({
        ...aiNode,
        id: matched.id,
        position: { ...matched.position },
        width: matched.width || aiNode.width,
        height: matched.height || aiNode.height,
        data: {
          ...aiNode.data,
          style: { ...(aiNode.data?.style || {}), ...(matched.data?.style || {}) },
        },
      });
    } else {
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

  const mergedNodeIds = new Set(mergedNodes.map((n) => n.id));
  const mergedEdges: Edge[] = [];

  validation.graph.edges.forEach((e) => {
    if (mergedNodeIds.has(e.source) && mergedNodeIds.has(e.target)) {
      mergedEdges.push(e);
    }
  });

  (existingGraph.edges || []).forEach((e) => {
    if (mergedNodeIds.has(e.source) && mergedNodeIds.has(e.target)) {
      if (!mergedEdges.some((me) => me.source === e.source && me.target === e.target)) {
        mergedEdges.push(e);
      }
    }
  });

  return { nodes: mergedNodes, edges: mergedEdges };
}

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

  nodes.forEach((n) => {
    if (connectedNodeIds.has(n.id)) return;
    lines.push(formatNodeRef(n));
  });

  return lines.join('\n');
}

export interface ArchitectureCritiqueItem {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  reason: string;
  suggestion: string;
  affectedNodeIds: string[];
}

export interface ArchitectureReport {
  score: number;
  critiques: ArchitectureCritiqueItem[];
  nodeCount: number;
  edgeCount: number;
  hasCycle: boolean;
}

/**
 * Architecture Critic & Reasoning Engine:
 * Analyzes Diagram IR to detect direct Client-to-DB calls, unconsumed queues, circular dependencies,
 * isolated nodes, and calculates an overall Architecture Quality Score (0-100%).
 */
export function critiqueArchitecture(graph: ParsedGraph): ArchitectureReport {
  const critiques: ArchitectureCritiqueItem[] = [];
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];

  const inEdges = new Map<string, Edge[]>();
  const outEdges = new Map<string, Edge[]>();
  const nodeMap = new Map<string, Node>();

  nodes.forEach((n) => {
    nodeMap.set(n.id, n);
    inEdges.set(n.id, []);
    outEdges.set(n.id, []);
  });

  edges.forEach((e) => {
    inEdges.get(e.target)?.push(e);
    outEdges.get(e.source)?.push(e);
  });

  // 1. Direct Client-to-Database Connection
  nodes.forEach((n) => {
    const label = String(n.data?.label || '').toLowerCase();
    const kind = String(n.data?.kind || '').toLowerCase();
    const isClient = label.includes('client') || label.includes('frontend') || label.includes('mobile') || label.includes('browser') || kind === 'actor';

    if (isClient) {
      const outgoing = outEdges.get(n.id) || [];
      outgoing.forEach((e) => {
        const target = nodeMap.get(e.target);
        if (!target) return;
        const targetLabel = String(target.data?.label || '').toLowerCase();
        const targetKind = String(target.data?.kind || '').toLowerCase();
        const isDb = targetLabel.includes('db') || targetLabel.includes('database') || targetLabel.includes('postgres') || targetLabel.includes('mongo') || targetKind === 'database' || targetKind === 'storage';

        if (isDb) {
          critiques.push({
            id: `crit-client-db-${n.id}-${target.id}`,
            severity: 'HIGH',
            title: 'Direct Client to Database Connection',
            reason: `Client component '${n.data.label}' connects directly to Database '${target.data.label}' without an API Gateway or backend security layer.`,
            suggestion: 'Route client requests through an API Gateway or backend microservice with authentication.',
            affectedNodeIds: [n.id, target.id],
          });
        }
      });
    }
  });

  // 2. Unconsumed Messaging Queue
  nodes.forEach((n) => {
    const label = String(n.data?.label || '').toLowerCase();
    const kind = String(n.data?.kind || '').toLowerCase();
    const isQueue = label.includes('queue') || label.includes('kafka') || label.includes('rabbitmq') || label.includes('pubsub') || kind === 'queue';

    if (isQueue) {
      const outgoing = outEdges.get(n.id) || [];
      if (outgoing.length === 0) {
        critiques.push({
          id: `crit-unconsumed-queue-${n.id}`,
          severity: 'MEDIUM',
          title: 'Unconsumed Message Queue',
          reason: `Queue '${n.data.label}' receives messages but has no downstream consumer worker attached.`,
          suggestion: 'Connect a worker or consumer service to process messages from this queue.',
          affectedNodeIds: [n.id],
        });
      }
    }
  });

  // 3. Isolated Standalone Component
  nodes.forEach((n) => {
    const incoming = inEdges.get(n.id) || [];
    const outgoing = outEdges.get(n.id) || [];
    if (incoming.length === 0 && outgoing.length === 0 && nodes.length > 1) {
      critiques.push({
        id: `crit-isolated-node-${n.id}`,
        severity: 'LOW',
        title: 'Isolated Component',
        reason: `Node '${n.data.label}' is disconnected from the rest of the architecture.`,
        suggestion: 'Add connections to define how this component interacts with adjacent services.',
        affectedNodeIds: [n.id],
      });
    }
  });

  // 4. Circular Service Dependencies
  let hasCycle = false;
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(nodeId: string, path: string[]) {
    if (inStack.has(nodeId)) {
      hasCycle = true;
      const cycleStart = path.indexOf(nodeId);
      const cyclePath = path.slice(cycleStart);
      const cycleNames = cyclePath.map((id) => nodeMap.get(id)?.data?.label || id).join(' -> ');
      critiques.push({
        id: `crit-cycle-${cyclePath.join('-')}`,
        severity: 'HIGH',
        title: 'Circular Dependency Detected',
        reason: `Circular call chain detected: ${cycleNames} -> ${nodeMap.get(nodeId)?.data?.label || nodeId}.`,
        suggestion: 'Break circular service calls by introducing an event bus, queue, or decoupled service interface.',
        affectedNodeIds: cyclePath,
      });
      return;
    }
    if (visited.has(nodeId)) return;

    visited.add(nodeId);
    inStack.add(nodeId);
    path.push(nodeId);

    const outgoing = outEdges.get(nodeId) || [];
    outgoing.forEach((e) => dfs(e.target, path));

    path.pop();
    inStack.delete(nodeId);
  }

  nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      dfs(n.id, []);
    }
  });

  let score = 100;
  critiques.forEach((c) => {
    if (c.severity === 'HIGH') score -= 15;
    else if (c.severity === 'MEDIUM') score -= 8;
    else if (c.severity === 'LOW') score -= 3;
  });
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    critiques,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    hasCycle,
  };
}

export type AIIntent = 'CREATE' | 'MODIFY' | 'EXPLAIN' | 'CRITIQUE';

/**
 * Classifies user AI prompt intent into mutating (CREATE, MODIFY) vs. read-only (EXPLAIN, CRITIQUE).
 * Read-only intents return isMutating = false to prevent accidental diagram modifications.
 */
export function classifyAIIntent(prompt: string): { intent: AIIntent; isMutating: boolean } {
  const p = (prompt || '').trim().toLowerCase();

  if (
    p.startsWith('what is') ||
    p.startsWith('explain') ||
    p.startsWith('how does') ||
    p.startsWith('why is') ||
    p.includes('explain this') ||
    p.includes('what does this do')
  ) {
    return { intent: 'EXPLAIN', isMutating: false };
  }

  if (
    p.startsWith('review') ||
    p.startsWith('critique') ||
    p.startsWith('check security') ||
    p.includes('find bottlenecks') ||
    p.includes('quality score')
  ) {
    return { intent: 'CRITIQUE', isMutating: false };
  }

  if (
    p.startsWith('add ') ||
    p.startsWith('remove ') ||
    p.startsWith('delete ') ||
    p.startsWith('replace ') ||
    p.startsWith('connect ') ||
    p.startsWith('disconnect ') ||
    p.includes('between ')
  ) {
    return { intent: 'MODIFY', isMutating: true };
  }

  return { intent: 'CREATE', isMutating: true };
}

export interface RepairResult {
  repaired: boolean;
  iterations: number;
  syntax: string;
  reasons: string[];
}

/**
 * AI Syntax Repair Loop:
 * Bounded repair algorithm with a strict cap of max 3 iterations.
 * Repairs dangling edges, deduplicates IDs, and strips broken tokens without infinite looping.
 */
export function repairAISyntaxLoop(
  rawSyntax: string,
  maxIterations = 3
): RepairResult {
  let currentSyntax = rawSyntax;
  let iterations = 0;
  const reasons: string[] = [];

  while (iterations < maxIterations) {
    iterations++;
    const sanitized = sanitizeAISyntax(currentSyntax);
    const graph = parseSyntaxToGraph(sanitized);
    const validation = validateParsedGraph(graph);

    if (validation.valid && validation.errors.length === 0) {
      return {
        repaired: true,
        iterations,
        syntax: sanitized,
        reasons,
      };
    }

    if (validation.errors.length > 0) {
      reasons.push(`Iteration ${iterations}: ${validation.errors.join(', ')}`);
    }

    if (validation.graph.nodes.length > 0) {
      currentSyntax = graphToSyntax(validation.graph.nodes, validation.graph.edges);
    } else {
      break;
    }
  }

  return {
    repaired: false,
    iterations,
    syntax: currentSyntax,
    reasons,
  };
}


