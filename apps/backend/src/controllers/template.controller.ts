import { Request, Response, NextFunction } from 'express';
import { Template } from '../models/template.model';
import { ApiError } from '../middleware/errorHandler';
import { diagramService } from '../services/diagram.service';
import { workspaceService } from '../services/workspace.service';

/**
 * §4.8 Template controller logic
 */
export const listTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, type } = req.query;
    const filters: any = {};
    if (category) filters.category = category;
    if (type) filters.diagramType = type;

    // Show built-in ones + user's current workspace custom ones (§TMPL-04)
    const templates = await Template.find({
      $or: [
        { isBuiltIn: true },
        // workspace filter can be added here if authenticated
      ],
      ...filters,
    });
    res.json({ success: true, data: templates });
  } catch (err) {
    next(err);
  }
};

export const createTemplate = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { name, description, category, diagramType, syntax, nodes, edges, workspaceId } = req.body;
    if (workspaceId) {
      await workspaceService.assertWorkspaceEditor(workspaceId, req.userId);
    }
    const template = new Template({
      name,
      description,
      category,
      diagramType,
      syntax,
      nodes,
      edges,
      isBuiltIn: false,
      workspaceId,
      createdBy: req.userId,
    });
    await template.save();
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
};

export const getTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const template = await Template.findById(id);
      if (!template) throw new ApiError(404, 'NOT_FOUND', 'Template not found');
      res.json({ success: true, data: template });
    } catch (err) {
      next(err);
    }
};

export const useTemplate = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { workspaceId, projectId, title } = req.body;
    if (!workspaceId) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'workspaceId is required');
    }

    const template = await Template.findById(id);
    if (!template) throw new ApiError(404, 'NOT_FOUND', 'Template not found');

    await workspaceService.assertWorkspaceAccess(workspaceId, req.userId);

    const diagram = await diagramService.createDiagram(req.userId, workspaceId, {
      title: title || `New ${template.name}`,
      type: template.diagramType as any,
      projectId: projectId || undefined,
      syntax: template.syntax || '',
      nodes: (template.nodes as any) || [],
      edges: (template.edges as any) || [],
    });

    await Template.findByIdAndUpdate(id, { $inc: { usageCount: 1 } });
    res.status(201).json({ success: true, data: diagram });
  } catch (err) {
    next(err);
  }
};

export const deleteTemplate = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const template = await Template.findOneAndDelete({ _id: id, createdBy: req.userId });
        if (!template) throw new ApiError(403, 'FORBIDDEN', 'Access denied');
        res.json({ success: true, message: 'Template deleted' });
    } catch (err) {
        next(err);
    }
};
