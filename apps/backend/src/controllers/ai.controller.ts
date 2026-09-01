import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Diagram } from '../models/diagram.model';
import { User } from '../models/user.model';
import { aiService } from '../services/ai.service';
import { workspaceService } from '../services/workspace.service';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';
import { getAIProvider } from '../modules/ai/providers/provider.registry';
import { DiagramIR, DiagramType } from '../modules/domain/diagram-ir.types';

/**
 * §4.4 AI Features Controller
 * Claude API integration for diagram generation, explanation, and improvement
 */

/**
 * §AI-01 Generate diagram from prompt
 */
export const generateDiagram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { prompt, diagramType = 'flowchart', diagramId } = req.body;
    const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-request-id'];
    const operationId = typeof idempotencyKey === 'string' ? idempotencyKey : crypto.randomUUID();

    // Validate prompt
    aiService.validatePrompt(prompt);

    let existingSyntax: string | undefined;
    let diagram: any = null;

    // If refining existing diagram
    if (diagramId) {
      diagram = await Diagram.findById(diagramId);
      if (!diagram) {
        throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
      }
      await workspaceService.assertWorkspaceEditor(diagram.workspaceId.toString(), req.userId!);
      existingSyntax = diagram.syntax;
    }

    logger.info(`Generating diagram with operationId: ${operationId}`);

    // Generate diagram
    const { syntax, conversationTurn } = await aiService.generateDiagram(
      req.userId!,
      prompt,
      diagramType,
      existingSyntax
    );

    // Update diagram if refining
    if (diagram) {
      // Add to AI conversation history (max 10 turns)
      diagram.aiConversation.push(
        { role: 'user', content: prompt, createdAt: new Date() },
        conversationTurn
      );
      
      if (diagram.aiConversation.length > 10) {
        diagram.aiConversation = diagram.aiConversation.slice(-10);
      }

      diagram.syntax = syntax;
      diagram.lastEditedBy = req.userId!;
      diagram.version += 1;
      await diagram.save();
    }

    res.json({
      success: true,
      data: {
        syntax,
        diagramId: diagram?._id,
      },
      message: 'Diagram generated successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * §AI-01 Stream diagram generation (SSE)
 */
export const streamGenerateDiagram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { prompt, diagramType = 'flowchart', diagramId } = req.body;

    aiService.validatePrompt(prompt);

    let existingSyntax: string | undefined;
    if (diagramId) {
      const diagram = await Diagram.findById(diagramId);
      if (!diagram) {
        throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
      }
      await workspaceService.assertWorkspaceEditor(diagram.workspaceId.toString(), req.userId!);
      existingSyntax = diagram.syntax;
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullSyntax = '';

    try {
      for await (const chunk of aiService.streamDiagramGeneration(
        req.userId!,
        prompt,
        diagramType,
        existingSyntax
      )) {
        fullSyntax += chunk;
        res.write(`data: ${JSON.stringify({ chunk, fullSyntax })}\n\n`);
      }

      res.write(`data: ${JSON.stringify({ done: true, fullSyntax })}\n\n`);
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: 'Generation failed' })}\n\n`);
      res.end();
    }
  } catch (err) {
    next(err);
  }
};

function mapToDiagramIR(diagram: any): DiagramIR {
  return {
    schemaVersion: 1,
    diagramId: diagram._id.toString(),
    title: diagram.title,
    type: (diagram.type || 'system') as DiagramType,
    metadata: { version: diagram.version },
    nodes: (diagram.nodes || []).map((n: any) => ({
      id: n.id,
      kind: n.type || 'rectangle',
      label: n.data?.label || '',
      position: n.position || { x: 0, y: 0 },
      size: { width: n.width || 160, height: n.height || 50 },
      style: n.data?.style || {},
      data: n.data || {},
      semantic: {},
      source: 'user' as const,
    })),
    edges: (diagram.edges || []).map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      kind: e.type || 'default',
      label: e.label,
      style: e.style || {},
      data: {},
      semantic: {},
      sourceOrigin: 'user' as const,
    })),
    groups: [],
    annotations: [],
    layout: { type: 'freeform', viewport: { x: 0, y: 0, zoom: 1 } },
    theme: { name: 'dark' },
  };
}

/**
 * §AI-06 Explain diagram
 */
export const explainDiagram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { diagramId, nodeId, nodeIds } = req.body;

    const diagram = await Diagram.findById(diagramId);
    if (!diagram) {
      throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    }
    await workspaceService.assertWorkspaceAccess(diagram.workspaceId.toString(), req.userId!);

    let focusNodeIds: string[] = [];
    if (Array.isArray(nodeIds)) {
      focusNodeIds = nodeIds;
    } else if (typeof nodeId === 'string' && nodeId.trim() !== '') {
      focusNodeIds = [nodeId];
    }

    const ir = mapToDiagramIR(diagram);
    const requestId = req.headers['x-request-id'] as string || crypto.randomUUID();

    const response = await getAIProvider().explainDiagram({
      diagram: ir,
      focusNodeIds,
      userId: req.userId!,
      operationId: requestId,
    });

    res.json({
      success: true,
      data: { explanation: response.summary, details: response },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * §AI-08 Get improvement suggestions
 */
export const improveDiagram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { diagramId } = req.body;

    const diagram = await Diagram.findById(diagramId);
    if (!diagram) {
      throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    }
    await workspaceService.assertWorkspaceEditor(diagram.workspaceId.toString(), req.userId!);

    const result = await aiService.improveDiagram(req.userId!, diagram);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * §AI-10 Auto-fix syntax errors
 */
export const autofixSyntax = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { syntax, errorMessage } = req.body;

    if (!syntax || !errorMessage) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Syntax and error message are required');
    }

    const result = await aiService.autofixSyntax(req.userId!, syntax, errorMessage);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * §AI-CODE Convert code to diagram
 */
export const codeToDiagram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { code, language = 'javascript', diagramType = 'flowchart' } = req.body;

    if (!code || code.trim().length === 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Code is required');
    }

    if (code.length > 10000) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Code too long. Maximum 10000 characters.');
    }

    const result = await aiService.codeToDiagram(req.userId!, code, language, diagramType);

    res.json({
      success: true,
      data: result,
      message: 'Code converted to diagram successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Review diagram architecture
 */
export const reviewDiagram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { diagramId } = req.body;
    if (!diagramId) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'diagramId is required');
    }

    const diagram = await Diagram.findById(diagramId);
    if (!diagram) {
      throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    }
    await workspaceService.assertWorkspaceAccess(diagram.workspaceId.toString(), req.userId!);

    // Map Mongoose diagram to DiagramIR
    const ir = mapToDiagramIR(diagram);

    const requestId = req.headers['x-request-id'] as string || crypto.randomUUID();
    const reviewResponse = await getAIProvider().reviewDiagram({
      diagram: ir,
      userId: req.userId!,
      operationId: requestId,
    });

    res.json({
      success: true,
      data: {
        scorecard: reviewResponse.scorecard,
        findings: reviewResponse.findings,
        summary: reviewResponse.summary,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Perform tradeoff analysis on architecture choices
 */
export const tradeoffAnalysis = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { diagramId } = req.body;
    if (!diagramId) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'diagramId is required');
    }

    const diagram = await Diagram.findById(diagramId);
    if (!diagram) {
      throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    }
    await workspaceService.assertWorkspaceAccess(diagram.workspaceId.toString(), req.userId!);

    const ir = mapToDiagramIR(diagram);
    const requestId = req.headers['x-request-id'] as string || crypto.randomUUID();

    const response = await getAIProvider().tradeoffAnalysis({
      diagram: ir,
      userId: req.userId!,
      operationId: requestId,
    });

    res.json({
      success: true,
      data: {
        tradeoffs: response.tradeoffs,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get AI usage statistics
 */
export const getAIUsage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.userId!);
    
    if (!user) {
      throw new ApiError(404, 'NOT_FOUND', 'User not found');
    }
    
    res.json({
      success: true,
      data: {
        plan: user.plan,
        usage: user.aiUsage,
        remaining: {
          generate: user.getRemainingAI('generate'),
          explain: user.getRemainingAI('explain'),
          improve: user.getRemainingAI('improve'),
          autofix: user.getRemainingAI('autofix'),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
