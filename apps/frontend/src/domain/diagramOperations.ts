/**
 * SCHEMELY AI — CANONICAL DIAGRAM OPERATIONS & GRAPH DIFF ENGINE
 *
 * Domain-level operation model for representing semantic changes to the diagram IR.
 * Powers incremental AI updates, two-way sync, and undo/redo operations.
 */

import { Node, Edge } from 'reactflow';
import { slugifyId } from './diagramParser';

export type DiagramOperationType =
  | 'ADD_NODE'
  | 'REMOVE_NODE'
  | 'UPDATE_NODE'
  | 'MOVE_NODE'
  | 'RESIZE_NODE'
  | 'UPDATE_STYLE'
  | 'ADD_EDGE'
  | 'REMOVE_EDGE'
  | 'UPDATE_EDGE';

export interface DiagramOperation {
  type: DiagramOperationType;
  nodeId?: string;
  edgeId?: string;
  payload?: any;
}

export interface GraphDiffSummary {
  addedNodes: string[];
  removedNodes: string[];
  updatedNodes: string[];
  addedEdges: string[];
  removedEdges: string[];
  preservedNodeCount: number;
}

/**
 * Computes semantic operations between current graph and incoming target graph.
 * Matches nodes by ID or normalized label slug to prevent destructive recreations.
 */
export function diffGraphs(
  current: { nodes: Node[]; edges: Edge[] },
  incoming: { nodes: Node[]; edges: Edge[] }
): { operations: DiagramOperation[]; summary: GraphDiffSummary } {
  const operations: DiagramOperation[] = [];

  const currentNodeMap = new Map<string, Node>();
  const currentSlugMap = new Map<string, Node>();
  current.nodes.forEach((n) => {
    currentNodeMap.set(n.id, n);
    const slug = slugifyId(String(n.data?.label || n.id));
    currentSlugMap.set(slug, n);
  });

  const incomingNodeMap = new Map<string, Node>();
  const incomingSlugMap = new Map<string, Node>();
  incoming.nodes.forEach((n) => {
    incomingNodeMap.set(n.id, n);
    const slug = slugifyId(String(n.data?.label || n.id));
    incomingSlugMap.set(slug, n);
  });

  const addedNodes: string[] = [];
  const removedNodes: string[] = [];
  const updatedNodes: string[] = [];
  let preservedNodeCount = 0;

  // 1. Detect Added or Updated Nodes
  incoming.nodes.forEach((inNode) => {
    const inSlug = slugifyId(String(inNode.data?.label || inNode.id));
    const matched = currentNodeMap.get(inNode.id) || currentSlugMap.get(inSlug);

    if (!matched) {
      operations.push({
        type: 'ADD_NODE',
        nodeId: inNode.id,
        payload: inNode,
      });
      addedNodes.push(String(inNode.data?.label || inNode.id));
    } else {
      preservedNodeCount++;
      // Check if metadata/kind changed
      const labelChanged = inNode.data?.label && inNode.data.label !== matched.data?.label;
      const kindChanged = inNode.data?.kind && inNode.data.kind !== matched.data?.kind;
      if (labelChanged || kindChanged) {
        operations.push({
          type: 'UPDATE_NODE',
          nodeId: matched.id,
          payload: {
            ...inNode.data,
            // preserve existing user position unless explicitly moved
          },
        });
        updatedNodes.push(String(inNode.data?.label || matched.data?.label || matched.id));
      }
    }
  });

  // 2. Detect Removed Nodes
  current.nodes.forEach((currNode) => {
    const currSlug = slugifyId(String(currNode.data?.label || currNode.id));
    const matched = incomingNodeMap.get(currNode.id) || incomingSlugMap.get(currSlug);

    if (!matched) {
      operations.push({
        type: 'REMOVE_NODE',
        nodeId: currNode.id,
      });
      removedNodes.push(String(currNode.data?.label || currNode.id));
    }
  });

  // 3. Edges Diffing
  const currentEdgeKeySet = new Set<string>();
  current.edges.forEach((e) => {
    currentEdgeKeySet.add(`${e.source}->${e.target}`);
  });

  const incomingEdgeKeySet = new Set<string>();
  const addedEdges: string[] = [];
  const removedEdges: string[] = [];

  incoming.edges.forEach((e) => {
    const key = `${e.source}->${e.target}`;
    incomingEdgeKeySet.add(key);
    if (!currentEdgeKeySet.has(key)) {
      operations.push({
        type: 'ADD_EDGE',
        edgeId: e.id,
        payload: e,
      });
      addedEdges.push(key);
    }
  });

  current.edges.forEach((e) => {
    const key = `${e.source}->${e.target}`;
    if (!incomingEdgeKeySet.has(key)) {
      operations.push({
        type: 'REMOVE_EDGE',
        edgeId: e.id,
        payload: e,
      });
      removedEdges.push(key);
    }
  });

  return {
    operations,
    summary: {
      addedNodes,
      removedNodes,
      updatedNodes,
      addedEdges,
      removedEdges,
      preservedNodeCount,
    },
  };
}

/**
 * Applies a list of operations to a graph, producing a new graph state.
 * Validates dependencies to ensure zero dangling edges.
 */
export function applyOperations(
  graph: { nodes: Node[]; edges: Edge[] },
  operations: DiagramOperation[]
): { nodes: Node[]; edges: Edge[] } {
  const nodeMap = new Map<string, Node>(graph.nodes.map((n) => [n.id, { ...n }]));
  const edgeMap = new Map<string, Edge>(graph.edges.map((e) => [e.id, { ...e }]));

  for (const op of operations) {
    switch (op.type) {
      case 'ADD_NODE':
        if (op.nodeId && op.payload) {
          nodeMap.set(op.nodeId, op.payload);
        }
        break;

      case 'REMOVE_NODE':
        if (op.nodeId) {
          nodeMap.delete(op.nodeId);
          // Auto remove attached edges
          for (const [edgeId, edge] of edgeMap.entries()) {
            if (edge.source === op.nodeId || edge.target === op.nodeId) {
              edgeMap.delete(edgeId);
            }
          }
        }
        break;

      case 'UPDATE_NODE':
        if (op.nodeId && nodeMap.has(op.nodeId)) {
          const existing = nodeMap.get(op.nodeId)!;
          nodeMap.set(op.nodeId, {
            ...existing,
            data: {
              ...existing.data,
              ...op.payload,
            },
          });
        }
        break;

      case 'MOVE_NODE':
        if (op.nodeId && nodeMap.has(op.nodeId) && op.payload?.position) {
          const existing = nodeMap.get(op.nodeId)!;
          nodeMap.set(op.nodeId, {
            ...existing,
            position: op.payload.position,
          });
        }
        break;

      case 'RESIZE_NODE':
        if (op.nodeId && nodeMap.has(op.nodeId) && op.payload) {
          const existing = nodeMap.get(op.nodeId)!;
          nodeMap.set(op.nodeId, {
            ...existing,
            width: op.payload.width ?? existing.width,
            height: op.payload.height ?? existing.height,
          });
        }
        break;

      case 'UPDATE_STYLE':
        if (op.nodeId && nodeMap.has(op.nodeId) && op.payload) {
          const existing = nodeMap.get(op.nodeId)!;
          nodeMap.set(op.nodeId, {
            ...existing,
            data: {
              ...existing.data,
              style: {
                ...(existing.data?.style || {}),
                ...op.payload,
              },
            },
          });
        }
        break;

      case 'ADD_EDGE':
        if (op.edgeId && op.payload) {
          // Only add if source and target exist
          if (nodeMap.has(op.payload.source) && nodeMap.has(op.payload.target)) {
            edgeMap.set(op.edgeId, op.payload);
          }
        }
        break;

      case 'REMOVE_EDGE':
        if (op.edgeId) {
          edgeMap.delete(op.edgeId);
        }
        break;

      case 'UPDATE_EDGE':
        if (op.edgeId && edgeMap.has(op.edgeId) && op.payload) {
          const existing = edgeMap.get(op.edgeId)!;
          edgeMap.set(op.edgeId, {
            ...existing,
            ...op.payload,
          });
        }
        break;
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values()),
  };
}
