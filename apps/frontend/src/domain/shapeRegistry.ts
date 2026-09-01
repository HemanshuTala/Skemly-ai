// E:\Skemly-ai\apps\frontend\src\domain\shapeRegistry.ts
/**
 * SCHEMELY AI — CANONICAL SHAPE REGISTRY
 * Single source of truth for shape definitions, geometries, default dimensions,
 * palette previews, and canvas/export rendering definitions.
 */

export type ShapeKind =
  | 'process'
  | 'rectangle'
  | 'decision'
  | 'diamond'
  | 'startend'
  | 'pill'
  | 'database'
  | 'cylinder'
  | 'entity'
  | 'table'
  | 'queue'
  | 'actor'
  | 'io'
  | 'circle'
  | 'group';

export interface ShapeDefinition {
  id: ShapeKind;
  label: string;
  category: 'core' | 'data' | 'flow' | 'actors' | 'infrastructure';
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  borderRadius: number;
  fillColor: string;
  borderColor: string;
  textColor: string;
  description: string;
  iconName: string;
}

export const CANONICAL_SHAPES: Record<string, ShapeDefinition> = {
  process: {
    id: 'process',
    label: 'Process Block',
    category: 'core',
    defaultWidth: 168,
    defaultHeight: 56,
    minWidth: 100,
    minHeight: 40,
    borderRadius: 8,
    fillColor: '#131317',
    borderColor: '#3f3f46',
    textColor: '#f4f4f5',
    description: 'Standard operational or processing component',
    iconName: 'Box',
  },
  rectangle: {
    id: 'rectangle',
    label: 'Rectangle / Service',
    category: 'core',
    defaultWidth: 168,
    defaultHeight: 56,
    minWidth: 100,
    minHeight: 40,
    borderRadius: 8,
    fillColor: '#131317',
    borderColor: '#3f3f46',
    textColor: '#f4f4f5',
    description: 'Service or generic module container',
    iconName: 'Square',
  },
  decision: {
    id: 'decision',
    label: 'Decision Diamond',
    category: 'flow',
    defaultWidth: 130,
    defaultHeight: 130,
    minWidth: 80,
    minHeight: 80,
    borderRadius: 4,
    fillColor: '#18181c',
    borderColor: '#eab308',
    textColor: '#fef08a',
    description: 'Conditional routing or branching point',
    iconName: 'Diamond',
  },
  diamond: {
    id: 'diamond',
    label: 'Decision Diamond',
    category: 'flow',
    defaultWidth: 130,
    defaultHeight: 130,
    minWidth: 80,
    minHeight: 80,
    borderRadius: 4,
    fillColor: '#18181c',
    borderColor: '#eab308',
    textColor: '#fef08a',
    description: 'Conditional routing or branching point',
    iconName: 'Diamond',
  },
  startend: {
    id: 'startend',
    label: 'Start / End Terminal',
    category: 'flow',
    defaultWidth: 160,
    defaultHeight: 48,
    minWidth: 100,
    minHeight: 36,
    borderRadius: 999,
    fillColor: '#18181c',
    borderColor: '#22c55e',
    textColor: '#86efac',
    description: 'Workflow entry point or terminal state',
    iconName: 'ToggleRight',
  },
  pill: {
    id: 'pill',
    label: 'Pill Container',
    category: 'flow',
    defaultWidth: 160,
    defaultHeight: 48,
    minWidth: 100,
    minHeight: 36,
    borderRadius: 999,
    fillColor: '#18181c',
    borderColor: '#22c55e',
    textColor: '#86efac',
    description: 'Rounded pill container or status chip',
    iconName: 'ToggleRight',
  },
  database: {
    id: 'database',
    label: 'Database Cylinder',
    category: 'data',
    defaultWidth: 160,
    defaultHeight: 70,
    minWidth: 110,
    minHeight: 50,
    borderRadius: 6,
    fillColor: '#18181c',
    borderColor: '#3b82f6',
    textColor: '#93c5fd',
    description: 'Relational or NoSQL data store',
    iconName: 'Database',
  },
  cylinder: {
    id: 'cylinder',
    label: 'Database Cylinder',
    category: 'data',
    defaultWidth: 160,
    defaultHeight: 70,
    minWidth: 110,
    minHeight: 50,
    borderRadius: 6,
    fillColor: '#18181c',
    borderColor: '#3b82f6',
    textColor: '#93c5fd',
    description: 'Relational or NoSQL data store',
    iconName: 'Database',
  },
  entity: {
    id: 'entity',
    label: 'Entity / Schema Table',
    category: 'data',
    defaultWidth: 180,
    defaultHeight: 80,
    minWidth: 120,
    minHeight: 60,
    borderRadius: 8,
    fillColor: '#18181c',
    borderColor: '#a855f7',
    textColor: '#e9d5ff',
    description: 'Domain entity or data model schema',
    iconName: 'Table',
  },
  queue: {
    id: 'queue',
    label: 'Message Queue',
    category: 'infrastructure',
    defaultWidth: 170,
    defaultHeight: 54,
    minWidth: 110,
    minHeight: 40,
    borderRadius: 8,
    fillColor: '#18181c',
    borderColor: '#f97316',
    textColor: '#fed7aa',
    description: 'Asynchronous message broker or event queue',
    iconName: 'Layers',
  },
  actor: {
    id: 'actor',
    label: 'User / Actor',
    category: 'actors',
    defaultWidth: 140,
    defaultHeight: 64,
    minWidth: 90,
    minHeight: 50,
    borderRadius: 12,
    fillColor: '#18181c',
    borderColor: '#ec4899',
    textColor: '#fbcfe8',
    description: 'Human user, client application, or external agent',
    iconName: 'User',
  },
  io: {
    id: 'io',
    label: 'Data I/O Parallelogram',
    category: 'data',
    defaultWidth: 168,
    defaultHeight: 56,
    minWidth: 100,
    minHeight: 40,
    borderRadius: 6,
    fillColor: '#18181c',
    borderColor: '#06b6d4',
    textColor: '#a5f3fc',
    description: 'External data input/output stream',
    iconName: 'Tag',
  },
  circle: {
    id: 'circle',
    label: 'Circle Node',
    category: 'core',
    defaultWidth: 90,
    defaultHeight: 90,
    minWidth: 60,
    minHeight: 60,
    borderRadius: 999,
    fillColor: '#131317',
    borderColor: '#3f3f46',
    textColor: '#f4f4f5',
    description: 'Circular junction or state node',
    iconName: 'Circle',
  },
};

/**
 * Get canonical shape definition by ID with fallback to standard process block.
 */
export function getShapeDefinition(kindOrShape?: string): ShapeDefinition {
  const key = (kindOrShape || '').toLowerCase().trim();
  return CANONICAL_SHAPES[key] || CANONICAL_SHAPES.process;
}

/**
 * Get default dimensions for a given shape ID.
 */
export function getDefaultNodeDimensions(kindOrShape?: string): { width: number; height: number } {
  const def = getShapeDefinition(kindOrShape);
  return { width: def.defaultWidth, height: def.defaultHeight };
}
