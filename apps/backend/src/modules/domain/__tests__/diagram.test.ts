import { validateDiagram } from '../validateDiagram';
import { repairDiagram } from '../repairDiagram';
import type { DiagramIR } from '../diagram-ir.types';

describe('Diagram IR Validation & Repair Tests', () => {
  const makeBaseDiagram = (): DiagramIR => ({
    schemaVersion: 1,
    diagramId: 'test-123',
    title: 'Test Diagram',
    type: 'flowchart',
    metadata: { version: 1 },
    nodes: [
      {
        id: 'node-1',
        kind: 'rectangle',
        label: 'Start Node',
        position: { x: 100, y: 100 },
        size: { width: 150, height: 50 },
        style: {},
        data: {},
        semantic: {},
        source: 'user',
      },
      {
        id: 'node-2',
        kind: 'rectangle',
        label: 'End Node',
        position: { x: 300, y: 100 },
        size: { width: 150, height: 50 },
        style: {},
        data: {},
        semantic: {},
        source: 'user',
      },
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        kind: 'default',
        label: 'Transition',
        style: {},
        data: {},
        semantic: {},
        sourceOrigin: 'user',
      },
    ],
    groups: [],
    annotations: [],
    layout: { type: 'freeform', viewport: { x: 0, y: 0, zoom: 1 } },
    theme: { name: 'dark' },
  });

  describe('validateDiagram', () => {
    it('should validate a correct DiagramIR with no issues', () => {
      const diag = makeBaseDiagram();
      const res = validateDiagram(diag);
      expect(res.valid).toBe(true);
      expect(res.errorCount).toBe(0);
    });

    it('should flag duplicate node IDs as error', () => {
      const diag = makeBaseDiagram();
      diag.nodes.push({
        id: 'node-1', // duplicate
        kind: 'rectangle',
        label: 'Duplicate',
        position: { x: 200, y: 200 },
        size: { width: 100, height: 50 },
        style: {},
        data: {},
        semantic: {},
        source: 'user',
      });
      const res = validateDiagram(diag);
      expect(res.valid).toBe(false);
      expect(res.issues.some(i => i.code === 'NODE_DUPLICATE_ID')).toBe(true);
    });

    it('should flag dangling edge targets as error', () => {
      const diag = makeBaseDiagram();
      diag.edges.push({
        id: 'edge-bad',
        source: 'node-1',
        target: 'non-existent-node', // bad target
        kind: 'default',
        style: {},
        data: {},
        semantic: {},
        sourceOrigin: 'user',
      });
      const res = validateDiagram(diag);
      expect(res.valid).toBe(false);
      expect(res.issues.some(i => i.code === 'EDGE_TARGET_NOT_FOUND')).toBe(true);
    });

    it('should flag sequence diagram unknown participants', () => {
      const diag = makeBaseDiagram();
      diag.type = 'sequence';
      diag.edges.push({
        id: 'seq-edge',
        source: 'node-1',
        target: 'unknown-participant',
        kind: 'default',
        style: {},
        data: {},
        semantic: {},
        sourceOrigin: 'user',
      });
      const res = validateDiagram(diag);
      expect(res.valid).toBe(false);
      expect(res.issues.some(i => i.code === 'SEQ_UNKNOWN_PARTICIPANT')).toBe(true);
    });
  });

  describe('repairDiagram', () => {
    it('should fix invalid node positions and sizes', () => {
      const diag = makeBaseDiagram();
      diag.nodes[0].position = { x: NaN, y: 100 }; // invalid position
      diag.nodes[1].size = { width: -50, height: 50 }; // invalid size

      const res = repairDiagram(diag);
      expect(res.diagram.nodes[0].position.x).toBeDefined();
      expect(isNaN(res.diagram.nodes[0].position.x)).toBe(false);
      expect(res.diagram.nodes[1].size.width).toBeGreaterThan(0);
      expect(res.repairs.some(r => r.repairCode === 'REPAIR_INVALID_POSITION')).toBe(true);
      expect(res.repairs.some(r => r.repairCode === 'REPAIR_INVALID_SIZE')).toBe(true);
    });

    it('should remove dangling edges during repair', () => {
      const diag = makeBaseDiagram();
      diag.edges.push({
        id: 'edge-bad',
        source: 'node-1',
        target: 'dangling-node',
        kind: 'default',
        style: {},
        data: {},
        semantic: {},
        sourceOrigin: 'user',
      });

      const res = repairDiagram(diag);
      expect(res.diagram.edges.length).toBe(1); // bad edge removed
      expect(res.repairs.some(r => r.repairCode === 'REMOVE_DANGLING_EDGE')).toBe(true);
    });

    it('should resolve duplicate node IDs', () => {
      const diag = makeBaseDiagram();
      diag.nodes.push({
        id: 'node-1', // duplicate ID
        kind: 'rectangle',
        label: 'Node 1 Clone',
        position: { x: 500, y: 500 },
        size: { width: 100, height: 50 },
        style: {},
        data: {},
        semantic: {},
        source: 'user',
      });

      const res = repairDiagram(diag);
      const uniqueIds = new Set(res.diagram.nodes.map(n => n.id));
      expect(uniqueIds.size).toBe(3); // All IDs unique now
      expect(res.repairs.some(r => r.repairCode === 'REGENERATE_DUPLICATE_NODE_ID')).toBe(true);
    });
  });
});
