/**
 * Diagram Patch Types
 *
 * Patches are the unit of change for AI operations and collaboration.
 * Instead of replacing the full diagram, patches describe atomic mutations.
 */

import type { DiagramNode, DiagramEdge, DiagramTheme, Point } from './diagram-ir.types';

export type DiagramPatch =
  | { op: 'addNode'; node: DiagramNode }
  | { op: 'updateNode'; id: string; changes: Partial<DiagramNode> }
  | { op: 'removeNode'; id: string }
  | { op: 'addEdge'; edge: DiagramEdge }
  | { op: 'updateEdge'; id: string; changes: Partial<DiagramEdge> }
  | { op: 'removeEdge'; id: string }
  | { op: 'moveNode'; id: string; position: Point }
  | { op: 'setTitle'; title: string }
  | { op: 'setTheme'; theme: DiagramTheme };

