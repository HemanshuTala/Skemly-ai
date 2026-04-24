import { Response, NextFunction } from 'express';
import { Project } from '../models/project.model';
import { ApiError } from '../middleware/errorHandler';
import { workspaceService } from '../services/workspace.service';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * §4.5 Project controller — scoped to workspace membership and editor role for writes
 */
export const createProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { wsId } = req.params;
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Project name is required');
    }

    await workspaceService.assertWorkspaceEditor(wsId, (req as AuthRequest).userId!);

    const { icon, color } = req.body;
    const project = new Project({
      workspaceId: wsId,
      name,
      icon,
      color,
      createdBy: req.userId!,
    });
    await project.save();
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

export const listProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { wsId } = req.params;
    await workspaceService.assertWorkspaceAccess(wsId, req.userId!);

    const projects = await Project.find({ workspaceId: wsId });
    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { wsId, id } = req.params;
    await workspaceService.assertWorkspaceEditor(wsId, (req as AuthRequest).userId!);

    const project = await Project.findOne({ _id: id, workspaceId: wsId });
    if (!project) {
      throw new ApiError(404, 'NOT_FOUND', 'Project not found');
    }

    const updated = await Project.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { wsId, id } = req.params;
    await workspaceService.assertWorkspaceEditor(wsId, (req as AuthRequest).userId!);

    const project = await Project.findOneAndDelete({ _id: id, workspaceId: wsId });
    if (!project) {
      throw new ApiError(404, 'NOT_FOUND', 'Project not found');
    }
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};
