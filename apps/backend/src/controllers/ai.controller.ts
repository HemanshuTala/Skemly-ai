import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { Diagram } from '../models/diagram.model';
import { User } from '../models/user.model';
import { ApiError } from '../middleware/errorHandler';
import { workspaceService } from '../services/workspace.service';
import logger from '../utils/logger';

/**
 * §4.4 AI Features Controller
 * Claude API integration for diagram generation, explanation, and improvement
 */

/**
 * §AI-01 Generate diagram from prompt
 */
export const generateDiagram = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { prompt, diagramType = 'flowchart', diagramId } = req.body;

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
      await workspaceService.assertWorkspaceEditor(diagram.workspaceId.toString(), req.userId);
      existingSyntax = diagram.syntax;
    }

    // Generate diagram
    const { syntax, conversationTurn } = await aiService.generateDiagram(
      req.userId,
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
      diagram.lastEditedBy = req.userId;
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
export const streamGenerateDiagram = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { prompt, diagramType = 'flowchart', diagramId } = req.body;

    aiService.validatePrompt(prompt);

    let existingSyntax: string | undefined;
    if (diagramId) {
      const diagram = await Diagram.findById(diagramId);
      if (!diagram) {
        throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
      }
      await workspaceService.assertWorkspaceEditor(diagram.workspaceId.toString(), req.userId);
      existingSyntax = diagram.syntax;
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullSyntax = '';

    try {
      for await (const chunk of aiService.streamDiagramGeneration(
        req.userId,
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

/**
 * §AI-06 Explain diagram
 */
export const explainDiagram = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { diagramId, nodeId } = req.body;

    const diagram = await Diagram.findById(diagramId);
    if (!diagram) {
      throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    }
    await workspaceService.assertWorkspaceAccess(diagram.workspaceId.toString(), req.userId);

    const explanation = await aiService.explainDiagram(req.userId, diagram, nodeId);

    res.json({
      success: true,
      data: { explanation },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * §AI-08 Get improvement suggestions
 */
export const improveDiagram = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { diagramId } = req.body;

    const diagram = await Diagram.findById(diagramId);
    if (!diagram) {
      throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    }
    await workspaceService.assertWorkspaceEditor(diagram.workspaceId.toString(), req.userId);

    const result = await aiService.improveDiagram(req.userId, diagram);

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
export const autofixSyntax = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { syntax, errorMessage } = req.body;

    if (!syntax || !errorMessage) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Syntax and error message are required');
    }

    const result = await aiService.autofixSyntax(req.userId, syntax, errorMessage);

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
export const codeToDiagram = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { code, language = 'javascript', diagramType = 'flowchart' } = req.body;

    if (!code || code.trim().length === 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Code is required');
    }

    if (code.length > 10000) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Code too long. Maximum 10000 characters.');
    }

    const result = await aiService.codeToDiagram(req.userId, code, language, diagramType);

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
 * Get AI usage statistics
 */
export const getAIUsage = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.userId);
    
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
