/**
 * Canonical Diagram IR — Skemly Domain Model
 * Version: 1
 *
 * This is the single source of truth for all diagram data.
 * Framework-independent: no React, no React Flow, no Express.
 *
 * React Flow, export adapters, and AI serializers all derive from this.
 */

// ─── Enums ───────────────────────────────────────────────────────────────────

export type DiagramType =
  | 'flowchart'
  | 'sequence'
  | 'uml'
  | 'erd'
  | 'mindmap'
  | 'system'
  | 'gantt'
  | 'state'
  | 'network'
  | 'orgchart';

export type NodeSource = 'user' | 'ai' | 'template' | 'import';
export type StyleSource = 'default' | 'user' | 'template' | 'ai';
export type EdgeDirection = 'uni' | 'bi';
export type EdgeSync = 'sync' | 'async';
export type CollaboratorRole = 'editor' | 'commenter' | 'viewer';

// ─── Style ───────────────────────────────────────────────────────────────────

export interface NodeStyle {
  fillColor?: string;
  borderColor?: string;
  textColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  borderRadius?: number;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  opacity?: number;
  /** Who last set this style — AI must not overwrite 'user' styles */
  styleSource?: StyleSource;
}

export interface EdgeStyle {
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  animated?: boolean;
  markerStart?: 'arrow' | 'arrowclosed' | 'none';
  markerEnd?: 'arrow' | 'arrowclosed' | 'none';
}

// ─── Position / Size ─────────────────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// ─── Node ────────────────────────────────────────────────────────────────────

export interface DiagramNode {
  id: string;
  kind: string;        // e.g. 'rectangle', 'diamond', 'service', 'database', 'queue'
  label: string;
  description?: string;
  parentId?: string | null;

  position: Point;
  size: Size;
  style: NodeStyle;

  /** Arbitrary extra data (e.g. ERD columns, state actions) */
  data: Record<string, unknown>;

  /** Semantic metadata — used by AI and architecture review */
  semantic: {
    entityType?: string;   // e.g. 'service', 'database', 'queue', 'client', 'cache'
    role?: string;         // e.g. 'api-gateway', 'load-balancer'
    technology?: string;   // e.g. 'Redis', 'PostgreSQL', 'Kafka'
    tags?: string[];
  };

  source: NodeSource;
  locked?: boolean;       // user has locked this node from AI edits
}

// ─── Edge ────────────────────────────────────────────────────────────────────

export interface DiagramEdge {
  id: string;
  source: string;    // nodeId
  target: string;    // nodeId
  sourceHandle?: string;
  targetHandle?: string;

  kind: string;      // e.g. 'default', 'bezier', 'step', 'inheritance', 'association'
  label?: string;

  style: EdgeStyle;
  data: Record<string, unknown>;

  semantic: {
    protocol?: string;          // e.g. 'HTTP', 'gRPC', 'AMQP'
    direction?: EdgeDirection;
    sync?: EdgeSync;
    relation?: string;          // e.g. 'one-to-many', 'uses', 'extends'
  };

  sourceOrigin: NodeSource;
}

// ─── Group ───────────────────────────────────────────────────────────────────

export interface DiagramGroup {
  id: string;
  label: string;
  nodeIds: string[];
  parentGroupId?: string | null;
  style?: Partial<NodeStyle>;
}

// ─── Annotation ──────────────────────────────────────────────────────────────

export interface DiagramAnnotation {
  id: string;
  text: string;
  position: Point;
  attachedToNodeId?: string;
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export interface DiagramLayout {
  type:
    | 'freeform'
    | 'ltr'       // left-to-right dagre
    | 'ttb'       // top-to-bottom dagre
    | 'radial'
    | 'hierarchical'
    | 'sequence'
    | 'swimlane'
    | 'grid';
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

// ─── Theme ───────────────────────────────────────────────────────────────────

export interface DiagramTheme {
  name: string;
  background?: string;
  gridEnabled?: boolean;
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export interface DiagramMetadata {
  createdAt?: string;
  updatedAt?: string;
  version: number;
  tags?: string[];
  description?: string;
}

// ─── Root IR ─────────────────────────────────────────────────────────────────

export interface DiagramIR {
  /** Always 1 for now; bump when breaking changes occur */
  schemaVersion: 1;
  diagramId: string;
  title: string;
  type: DiagramType;
  metadata: DiagramMetadata;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  groups: DiagramGroup[];
  annotations: DiagramAnnotation[];
  layout: DiagramLayout;
  theme: DiagramTheme;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

export function makeDefaultLayout(): DiagramLayout {
  return {
    type: 'freeform',
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}

export function makeDefaultTheme(): DiagramTheme {
  return {
    name: 'dark',
    background: '#09090b',
    gridEnabled: true,
  };
}

export function makeDefaultNodeStyle(): NodeStyle {
  return {
    fillColor: '#27272a',
    borderColor: '#3f3f46',
    textColor: '#ffffff',
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 'normal',
    opacity: 1,
    styleSource: 'default',
  };
}

export function makeDefaultEdgeStyle(): EdgeStyle {
  return {
    strokeColor: '#71717a',
    strokeWidth: 1.5,
    strokeStyle: 'solid',
    animated: false,
    markerEnd: 'arrowclosed',
  };
}
