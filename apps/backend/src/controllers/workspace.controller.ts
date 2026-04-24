import { Response, NextFunction } from 'express';
import { Workspace } from '../models/workspace.model';
import { AuditLog } from '../models/audit-log.model';
import { ApiError } from '../middleware/errorHandler';
import { workspaceService } from '../services/workspace.service';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * §4.5 Workspace controller logic
 */
export const listWorkspaces = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workspaces = await Workspace.find({ 'members.userId': req.userId!, deletedAt: null });
    res.json({ success: true, data: workspaces });
  } catch (err) {
    next(err);
  }
};

export const createWorkspace = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, type } = req.body;
    const workspace = new Workspace({
      name,
      type: type || 'personal',
      ownerId: req.userId!,
      members: [{ userId: req.userId!, role: 'owner', joinedAt: new Date() }],
    });
    await workspace.save();
    res.status(201).json({ success: true, data: workspace });
  } catch (err) {
    next(err);
  }
};

export const getWorkspace = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const workspace = await Workspace.findOne({ _id: id, 'members.userId': req.userId!, deletedAt: null });
    if (!workspace) throw new ApiError(404, 'NOT_FOUND', 'Workspace not found');
    res.json({ success: true, data: workspace });
  } catch (err) {
    next(err);
  }
};

export const updateWorkspace = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const workspace = await Workspace.findOneAndUpdate(
      { _id: id, ownerId: req.userId!, deletedAt: null },
      req.body,
      { new: true }
    );
    if (!workspace) throw new ApiError(403, 'FORBIDDEN', 'Access denied');
    res.json({ success: true, data: workspace });
  } catch (err) {
    next(err);
  }
};

export const deleteWorkspace = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const workspace = await Workspace.findOneAndUpdate(
      { _id: id, ownerId: req.userId!, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!workspace) throw new ApiError(403, 'FORBIDDEN', 'Access denied or workspace already deleted');
    res.json({ success: true, message: 'Workspace deleted' });
  } catch (err) {
    next(err);
  }
};

export const getMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const workspace = await Workspace.findOne({
      _id: id,
      'members.userId': req.userId!,
      deletedAt: null,
    }).populate('members.userId', 'name email avatar');
    if (!workspace) throw new ApiError(404, 'NOT_FOUND', 'Workspace not found');
    res.json({ success: true, data: workspace.members });
  } catch (err) {
    next(err);
  }
};

export const inviteMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;
    
    await workspaceService.inviteMember(id, req.userId!, email, role);
    
    res.json({
      success: true,
      message: 'Invitation sent successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const acceptInvite = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invite token is required');
    }

    const workspace = await workspaceService.acceptInvite(token, req.userId!);
    res.json({
      success: true,
      message: 'Invitation accepted successfully',
      data: workspace,
    });
  } catch (err) {
    next(err);
  }
};

export const removeMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, userId } = req.params;
    const workspace = await Workspace.findOneAndUpdate(
      { _id: id, ownerId: req.userId! },
      { $pull: { members: { userId } } },
      { new: true }
    );
    
    if (!workspace) {
      throw new ApiError(403, 'FORBIDDEN', 'Access denied');
    }
    
    await AuditLog.create({
      actorId: req.userId!,
      action: 'member_removed',
      resourceType: 'workspace',
      resourceId: id,
      workspaceId: id,
      metadata: { removedUserId: userId },
      success: true,
    });
    
    res.json({ success: true, message: 'Member removed' });
  } catch (err) {
    next(err);
  }
};

export const updateMemberRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;
    
    await workspaceService.updateMemberRole(id, req.userId!, userId, role);
    
    res.json({
      success: true,
      message: 'Member role updated',
    });
  } catch (err) {
    next(err);
  }
};

export const transferOwnership = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { newOwnerId } = req.body;
    
    await workspaceService.transferOwnership(id, req.userId!, newOwnerId);
    
    res.json({
      success: true,
      message: 'Ownership transferred successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const getActivity = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Check access
    const hasAccess = await workspaceService.checkAccess(id, req.userId!);
    if (!hasAccess) {
      throw new ApiError(403, 'FORBIDDEN', 'Access denied');
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    const activities = await AuditLog.find({ workspaceId: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('actorId', 'name email avatar');
    
    const total = await AuditLog.countDocuments({ workspaceId: id });
    
    res.json({
      success: true,
      data: activities,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
      },
    });
  } catch (err) {
    next(err);
  }
};
