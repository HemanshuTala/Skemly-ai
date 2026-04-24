import { exportService } from './export.service';

type DiagramFixture = {
  name: string;
  diagram: {
    nodes: Array<Record<string, unknown>>;
    edges: Array<Record<string, unknown>>;
    syntax?: string;
  };
};

const fixtures: DiagramFixture[] = [
  {
    name: 'ci-cd-decision',
    diagram: {
      nodes: [
        { id: 'source-repo', type: 'diagramNode', position: { x: 0, y: 0 }, data: { label: 'Source Repo', kind: 'node' } },
        { id: 'ci-build', type: 'diagramNode', position: { x: 230, y: 0 }, data: { label: 'CI Build', kind: 'node' } },
        { id: 'tests', type: 'diagramNode', position: { x: 490, y: -40 }, data: { label: 'Tests Pass?', kind: 'decision' } },
        { id: 'docker-build', type: 'diagramNode', position: { x: 760, y: 0 }, data: { label: 'Docker Build', kind: 'node' } },
      ],
      edges: [
        { id: 'e1', source: 'source-repo', target: 'ci-build', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'e2', source: 'ci-build', target: 'tests', sourceHandle: 'right', targetHandle: 'left', label: 'run' },
        { id: 'e3', source: 'tests', target: 'docker-build', sourceHandle: 'right', targetHandle: 'left', label: 'Yes' },
      ],
    },
  },
  {
    name: 'mixed-shapes',
    diagram: {
      nodes: [
        { id: 'start', type: 'diagramNode', position: { x: 0, y: 0 }, data: { label: 'Start', kind: 'startend' } },
        { id: 'entity', type: 'diagramNode', position: { x: 240, y: 0 }, data: { label: 'Users\\nid: uuid\\nemail: text', kind: 'entity' } },
        { id: 'io', type: 'diagramNode', position: { x: 520, y: 0 }, data: { label: 'Input', kind: 'io' } },
        { id: 'db', type: 'diagramNode', position: { x: 760, y: 0 }, data: { label: 'DB', kind: 'database' } },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'entity', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'e2', source: 'entity', target: 'io', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'e3', source: 'io', target: 'db', sourceHandle: 'right', targetHandle: 'left' },
      ],
    },
  },
  {
    name: 'ai-dense-sample',
    diagram: {
      syntax: `[Client] --> [Gateway]
[Gateway] --> {Rate Limit OK?}
{Rate Limit OK?} -- Yes --> [Auth Service]
{Rate Limit OK?} -- No --> [Reject]
[Auth Service] --> [[Users DB]]
[Auth Service] --> [Token Cache]
[Token Cache] --> [Gateway]`,
      nodes: [],
      edges: [],
    },
  },
];

export function runExportParityChecks(): void {
  const svc = exportService as any;
  for (const fixture of fixtures) {
    const graph = svc.buildExportGraph(fixture.diagram);
    if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
      throw new Error(`Fixture ${fixture.name} failed: graph mapping is invalid`);
    }
    if (graph.width <= 0 || graph.height <= 0) {
      throw new Error(`Fixture ${fixture.name} failed: invalid graph bounds`);
    }
    const svg = svc.generateDiagramSVG(graph, false);
    if (typeof svg !== 'string' || !svg.includes('<svg')) {
      throw new Error(`Fixture ${fixture.name} failed: svg not generated`);
    }
    const markerCount = (svg.match(/marker-end=/g) || []).length;
    if (graph.edges.length > 0 && markerCount === 0) {
      throw new Error(`Fixture ${fixture.name} failed: edge markers missing`);
    }
  }
}

export { fixtures as exportParityFixtures };
