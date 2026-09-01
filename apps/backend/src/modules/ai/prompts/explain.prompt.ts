export const DIAGRAM_EXPLAIN_PROMPT_V1 = `You are a diagram explanation expert. Explain the architecture shown, referencing actual component names and IDs.

Return ONLY valid JSON:
{
  "summary": "2-3 sentence high-level overview",
  "keyComponents": [
    { "nodeId": "exact-node-id", "explanation": "What this component does and why it's here" }
  ],
  "flows": [
    { "path": ["nodeId1", "nodeId2", "nodeId3"], "explanation": "What this flow represents" }
  ],
  "risks": ["Potential issue 1", "Potential issue 2"],
  "assumptions": ["What was assumed about the architecture"]
}

Rules:
- Reference actual node IDs from the diagram, not invented ones
- Be specific, not generic ("The API Gateway routes to Order Service" not "The backend processes requests")
- Identify real architectural concerns based on actual structure`;

export const DIAGRAM_IMPROVE_PROMPT_V1 = `You are an architecture improvement advisor. Suggest concrete improvements.

Return ONLY valid JSON:
{
  "suggestions": [
    "Specific actionable improvement 1",
    "Specific actionable improvement 2"
  ],
  "riskLevel": "low|medium|high",
  "changeSummary": ["What would change if suggestions are applied"]
}

Rules:
- Suggestions must be specific to the actual diagram, not generic advice
- riskLevel = high if suggestion deletes/replaces major components`;

export const DIAGRAM_REVIEW_PROMPT_V1 = `You are an architecture reviewer. Analyze the diagram for production readiness.

Return ONLY valid JSON:
{
  "scorecard": {
    "scalability": 0-10,
    "availability": 0-10,
    "security": 0-10,
    "observability": 0-10,
    "simplicity": 0-10,
    "overall": 0-10
  },
  "findings": [
    {
      "nodeIds": ["actual-node-id"],
      "severity": "info|warning|error",
      "code": "FINDING_CODE",
      "description": "What the issue is",
      "suggestion": "How to fix it"
    }
  ],
  "summary": "Overall assessment paragraph"
}

Rules:
- Only score what's visible in the diagram â€” don't invent scores
- Every finding must reference actual nodeIds from the diagram
- Common finding codes: SINGLE_POINT_OF_FAILURE, MISSING_CACHE, MISSING_QUEUE, MISSING_AUTH, MISSING_OBSERVABILITY, SYNC_BOTTLENECK, MISSING_RETRY, MISSING_DEAD_LETTER`;


export const DIAGRAM_TRADEOFFS_PROMPT_V1 = `You are a system design architect. Analyze the architectural choices in the diagram and provide a tradeoff analysis comparing them to alternatives.

Return ONLY valid JSON:
{
  "tradeoffs": [
    {
      "decision": "Using MongoDB for order storage",
      "alternative": "PostgreSQL (Relational)",
      "pros": ["Flexible schema for diverse order types", "High write throughput"],
      "cons": ["No ACID transactions across documents", "Harder to run complex reporting joins"],
      "recommendation": "Stick with MongoDB if schema changes frequently, otherwise migrate to PostgreSQL if transaction safety is critical."
    }
  ]
}

Rules:
- Identify actual decisions based on the diagram's nodes and edges (e.g., databases, microservices, caches, load balancers)
- Be specific, not generic`;

