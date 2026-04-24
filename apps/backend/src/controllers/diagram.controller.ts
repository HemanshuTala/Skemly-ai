import { Request, Response, NextFunction } from 'express';
import { diagramService } from '../services/diagram.service';
import { workspaceService } from '../services/workspace.service';
import { Diagram } from '../models/diagram.model';
import { DiagramVersion } from '../models/diagram-version.model';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * §4.2 Diagram controller logic
 */
export const createDiagram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, type, workspaceId, projectId } = req.body;
    const diagram = await diagramService.createDiagram(req.userId!, workspaceId, {
      title,
      type,
      projectId,
    });
    res.status(201).json({ success: true, data: diagram });
  } catch (err) {
    next(err);
  }
};

export const getDiagram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const diagram = await Diagram.findById(id);
    if (!diagram) throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    await workspaceService.assertWorkspaceAccess(diagram.workspaceId.toString(), req.userId!);
    res.json({ success: true, data: diagram });
  } catch (err) {
    next(err);
  }
};

export const listDiagrams = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { workspaceId, projectId, search, page = 1, limit = 20 } = req.query;
    if (!workspaceId || String(workspaceId).trim() === '') {
      throw new ApiError(400, 'VALIDATION_ERROR', 'workspaceId query parameter is required');
    }
    await workspaceService.assertWorkspaceAccess(String(workspaceId), req.userId!);

    const filters: any = { isTrashed: false };
    filters.workspaceId = workspaceId;
    if (projectId) filters.projectId = projectId;
    if (search) filters.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const diagrams = await Diagram.find(filters)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar');
    
    const total = await Diagram.countDocuments(filters);

    res.json({
      success: true,
      data: diagrams,
      meta: { page: Number(page), limit: Number(limit), total },
    });
  } catch (err) {
    next(err);
  }
};

export const updateDiagram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { createVersion, ...updates } = req.body;
    const diagram = await diagramService.updateDiagram(id, req.userId!, updates, createVersion);
    res.json({ success: true, data: diagram });
  } catch (err) {
    next(err);
  }
};

export const deleteDiagram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await diagramService.moveToTrash(id, req.userId!);
    res.json({ success: true, message: 'Diagram moved to trash' });
  } catch (err) {
    next(err);
  }
};

export const restoreDiagram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await diagramService.restoreFromTrash(id, req.userId!);
    res.json({ success: true, message: 'Diagram restored' });
  } catch (err) {
    next(err);
  }
};

export const starDiagram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const isStarred = await diagramService.toggleStar(id, req.userId!);
    res.json({ success: true, message: isStarred ? 'Diagram starred' : 'Diagram unstarred' });
  } catch (err) {
    next(err);
  }
};

export const unstarDiagram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await diagramService.toggleStar(id, req.userId!);
    res.json({ success: true, message: 'Diagram unstarred' });
  } catch (err) {
    next(err);
  }
};

export const createShareLink = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { expiresAt, password } = req.body;
    const result = await diagramService.generatePublicLink(id, req.userId!, {
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      password,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getPublicDiagram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const password = req.body?.password || req.query?.password;
    
    const diagram = await Diagram.findOne({
      publicLinkToken: token,
      isPublic: true,
    }).select('+publicLinkPasswordHash');
    
    if (!diagram) {
      throw new ApiError(404, 'NOT_FOUND', 'Public link not found');
    }
    
    // Check expiry
    if (diagram.publicLinkExpiresAt && diagram.publicLinkExpiresAt < new Date()) {
      throw new ApiError(404, 'NOT_FOUND', 'Public link expired');
    }
    
    // Check password if set
    if (diagram.publicLinkPasswordHash) {
      if (!password) {
        throw new ApiError(401, 'AUTH_REQUIRED', 'Password required');
      }
      const bcrypt = require('bcryptjs');
      const valid = await bcrypt.compare(password, diagram.publicLinkPasswordHash);
      if (!valid) {
        throw new ApiError(401, 'AUTH_INVALID', 'Invalid password');
      }
    }
    
    // Increment view count
    diagram.publicLinkViewCount += 1;
    await diagram.save();
    
    res.json({ success: true, data: diagram });
  } catch (err) {
    next(err);
  }
};

export const quickSave = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { syntax, nodes, edges } = req.body;
    const diagram = await Diagram.findById(id);
    if (!diagram) throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    await workspaceService.assertWorkspaceAccess(diagram.workspaceId.toString(), req.userId!);

    // Fast atomic update for beacon API - no versioning to keep it fast
    await Diagram.findByIdAndUpdate(id, {
      $set: {
        syntax: syntax ?? diagram.syntax,
        nodes: nodes ?? diagram.nodes,
        edges: edges ?? diagram.edges,
        lastEditedBy: req.userId!,
        updatedAt: new Date(),
      },
      $inc: { version: 1 },
    });
    
    res.json({ success: true, message: 'Saved' });
  } catch (err) {
    next(err);
  }
};

export const saveVersion = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const diagram = await Diagram.findById(id);
    if (!diagram) throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    await workspaceService.assertWorkspaceAccess(diagram.workspaceId.toString(), req.userId!);

    await diagramService.createVersion(diagram, req.userId!, name);
    res.json({ success: true, message: 'Version saved' });
  } catch (err) {
    next(err);
  }
};

export const getVersions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const diagram = await Diagram.findById(id);
    if (!diagram) throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    await workspaceService.assertWorkspaceAccess(diagram.workspaceId.toString(), req.userId!);

    const versions = await DiagramVersion.find({ diagramId: id })
      .sort({ createdAt: -1 })
      .populate('savedBy', 'name email avatar');
    res.json({ success: true, data: versions });
  } catch (err) {
    next(err);
  }
};

export const getVersion = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, versionId } = req.params;
    const diagram = await Diagram.findById(id);
    if (!diagram) throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    await workspaceService.assertWorkspaceAccess(diagram.workspaceId.toString(), req.userId!);

    const version =
      await DiagramVersion.findOne({ _id: versionId, diagramId: id });
    if (!version) throw new ApiError(404, 'NOT_FOUND', 'Version not found');
    res.json({ success: true, data: version });
  } catch (err) {
    next(err);
  }
};

export const restoreVersion = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, versionId } = req.params;
    const diagram = await diagramService.restoreVersion(id, versionId, req.userId!);
    res.json({ success: true, data: diagram, message: 'Version restored' });
  } catch (err) {
    next(err);
  }
};

export const duplicateDiagram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const duplicate = await diagramService.duplicateDiagram(id, req.userId!);
    res.status(201).json({ success: true, data: duplicate });
  } catch (err) {
    next(err);
  }
};

export const trashDiagram = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await diagramService.moveToTrash(id, req.userId!);
    res.json({ success: true, message: 'Diagram moved to trash' });
  } catch (err) {
    next(err);
  }
};

export const revokeShareLink = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await diagramService.revokePublicLink(id, req.userId!);
    res.json({ success: true, message: 'Public link revoked' });
  } catch (err) {
    next(err);
  }
};
