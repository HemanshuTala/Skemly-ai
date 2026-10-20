import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseSyntaxToGraph, validateParsedGraph, slugifyId, critiqueArchitecture } from '../diagramParser';
import { diffGraphs, applyOperations } from '../diagramOperations';
import { CANONICAL_TEMPLATES } from '../templates';

describe('Frontend Diagram Domain Engine Tests', () => {
  it('Deterministic ID Test: slugifyId has zero entropy across 100 runs', () => {
    const results = new Set<string>();
    for (let i = 0; i < 100; i++) {
      results.add(slugifyId('Payment Gateway & Auth Service'));
    }
    assert.strictEqual(results.size, 1);
    assert.strictEqual(results.has('payment-gateway-auth-service'), true);

    // Symbols fallback test
    assert.strictEqual(slugifyId('???'), 'node');
  });

  it('Canonical Shared Templates: all presets parse into valid non-empty graphs', () => {
    for (const tmpl of Object.values(CANONICAL_TEMPLATES)) {
      const graph = parseSyntaxToGraph(tmpl.syntax);
      assert.strictEqual(graph.nodes.length, tmpl.nodeCount, `Template ${tmpl.id} node count mismatch`);
      assert.ok(graph.edges.length >= 1, `Template ${tmpl.id} has no edges`);
      const validation = validateParsedGraph(graph);
      assert.strictEqual(validation.valid, true, `Template ${tmpl.id} validation failed: ${JSON.stringify(validation.errors)}`);
    }
  });

  it('Graph Operations Engine: diffGraphs detects additions and updates correctly', () => {
    const current = parseSyntaxToGraph(`[Client] --> [API Gateway]
[API Gateway] --> [Database]`);
    
    // Set a custom manual position for API Gateway
    const gatewayNode = current.nodes.find(n => n.id === 'api-gateway');
    if (gatewayNode) {
      gatewayNode.position = { x: 450, y: 320 };
    }

    const incoming = parseSyntaxToGraph(`[Client] --> [API Gateway]
[API Gateway] --> [Redis Cache]
[API Gateway] --> [Database]`);

    const diff = diffGraphs(current, incoming);
    assert.ok(diff.operations.length > 0, 'Operations should be generated for incoming node');
    assert.strictEqual(diff.summary.addedNodes.length, 1);
    assert.strictEqual(diff.summary.addedEdges.length, 1);

    const merged = applyOperations(current, diff.operations);
    const mergedGateway = merged.nodes.find(n => n.id === 'api-gateway');
    assert.ok(mergedGateway, 'Gateway node must exist in merged graph');
    assert.strictEqual(mergedGateway!.position.x, 450, 'Existing manual X position must be preserved');
    assert.strictEqual(mergedGateway!.position.y, 320, 'Existing manual Y position must be preserved');
  });

  it('Architecture Critic: detects structural hazards and scores appropriately', () => {
    const vulnerable = parseSyntaxToGraph(`[Web Client] --> [[Production Database]]
[Producer Service] --> [Unconsumed Queue|shape:queue]
[Producer-less Queue|shape:queue] --> [Consumer Worker]
[API Gateway] --> [Service A]
[API Gateway] --> [Service B]
[API Gateway] --> [Service C]
[Service A] --> [SPOF Core Service]
[Service B] --> [SPOF Core Service]
[Service C] --> [SPOF Core Service]
[SPOF Core Service] --> [Sink 1]
[SPOF Core Service] --> [Sink 2]
[SPOF Core Service] --> [Sink 3]`);

    const report = critiqueArchitecture(vulnerable);
    assert.ok(report.critiques.some(c => c.title.includes('Direct Client to Database')), 'Should flag direct client to DB');
    assert.ok(report.critiques.some(c => c.title.includes('Unconsumed Message Queue')), 'Should flag unconsumed queue');
    assert.ok(report.critiques.some(c => c.title.includes('Queue Without Ingest Producer')), 'Should flag producer-less queue');
    assert.ok(report.critiques.some(c => c.title.includes('Single Point of Failure')), 'Should flag SPOF bottleneck');
    assert.ok(report.score < 100, 'Score should be penalized for architecture flaws');
  });
});
