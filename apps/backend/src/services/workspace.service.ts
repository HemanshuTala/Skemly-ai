import crypto from 'crypto';
import { Workspace, IWorkspace } from '../models/workspace.model';
import { User } from '../models/user.model';
import { AuditLog } from '../models/audit-log.model';
import { ApiError } from '../middleware/errorHandler';
import { emailService } from './email.service';
import logger from '../utils/logger';

/**
 * §4.5 Workspace Service
 * Handles workspace operations, invitations, and member management
 */
class WorkspaceService {
  /**
   * Create personal workspace for new user (auto-created on registration)
   */
  async createPersonalWorkspace(userId: string, userName: string): Promise<IWorkspace> {
    const workspace = new Workspace({
      name: `${userName}'s Workspace`,
      type: 'personal',
      ownerId: userId,
      members: [{ userId, role: 'owner', joinedAt: new Date() }],
      plan: 'free',
    });
    await workspace.save();
    
    await AuditLog.create({
      actorId: userId,
      action: 'workspace_created',
      resourceType: 'workspace',
      resourceId: workspace._id.toString(),
      workspaceId: workspace._id,
      success: true,
    });
    
    return workspace;
  }

  /**
   * §COLLAB-01 Invite member to workspace by email
   */
  async inviteMember(
    workspaceId: string,
    invitedBy: string,
    email: string,
    role: 'admin' | 'editor' | 'commenter' | 'viewer'
  ): Promise<void> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new ApiError(404, 'NOT_FOUND', 'Workspace not found');
    }

    // Check if inviter has permission (owner or admin)
    const inviter = workspace.members.find(m => m.userId.toString() === invitedBy);
    if (!inviter || !['owner', 'admin'].includes(inviter.role)) {
      throw new ApiError(403, 'FORBIDDEN', 'Only owners and admins can invite members');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const invitee = await User.findOne({ email: normalizedEmail });
    if (invitee) {
      const already = workspace.members.some((m) => m.userId.toString() === invitee._id.toString());
      if (already) {
        throw new ApiError(409, 'CONFLICT', 'User is already a member');
      }
    }

    // Check if already invited
    const existingInvite = workspace.pendingInvites.find(inv => inv.email === normalizedEmail);
    if (existingInvite) {
      throw new ApiError(409, 'CONFLICT', 'User already invited');
    }

    // Generate invite token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const inviterUser = await User.findById(invitedBy);
    const inviterName = inviterUser?.name || 'A teammate';

    workspace.pendingInvites.push({
      email: normalizedEmail,
      role,
      token,
      tokenHash,
      invitedBy: invitedBy as any,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      sentAt: new Date(),
    });

    await workspace.save();

    // Send invitation email
    const emailSent = await emailService.sendWorkspaceInvite(normalizedEmail, workspace.name, token, inviterName);
    if (!emailSent) {
      workspace.pendingInvites = workspace.pendingInvites.filter((inv) => inv.tokenHash !== tokenHash);
      await workspace.save();
      throw new ApiError(502, 'EMAIL_FAILED', 'Invitation email could not be sent. Please verify SMTP settings.');
    }

    await AuditLog.create({
      actorId: invitedBy,
      action: 'member_invited',
      resourceType: 'workspace',
      resourceId: workspaceId,
      workspaceId,
      metadata: { email: normalizedEmail, role },
      success: true,
    });
  }

  /**
   * Accept workspace invitation
   */
  async acceptInvite(token: string, userId: string): Promise<IWorkspace> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const workspace = await Workspace.findOne({
      'pendingInvites.tokenHash': tokenHash,
      'pendingInvites.expiresAt': { $gt: new Date() },
    });

    if (!workspace) {
      throw new ApiError(400, 'AUTH_INVALID', 'Invalid or expired invitation');
    }

    const invite = workspace.pendingInvites.find(inv => inv.tokenHash === tokenHash);
    if (!invite) {
      throw new ApiError(400, 'AUTH_INVALID', 'Invitation not found');
    }

    const user = await User.findById(userId).select('email');
    if (!user || user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new ApiError(403, 'FORBIDDEN', 'This invitation was sent to a different email');
    }

    const alreadyMember = workspace.members.some((m) => m.userId.toString() === userId);
    if (alreadyMember) {
      workspace.pendingInvites = workspace.pendingInvites.filter((inv) => inv.tokenHash !== tokenHash);
      await workspace.save();
      return workspace;
    }

    // Add user as member
    workspace.members.push({
      userId: userId as any,
      role: invite.role as any,
      invitedBy: invite.invitedBy,
      joinedAt: new Date(),
    });

    // Remove pending invite
    workspace.pendingInvites = workspace.pendingInvites.filter(
      inv => inv.tokenHash !== tokenHash
    );

    await workspace.save();

    await AuditLog.create({
      actorId: userId,
      action: 'member_invited',
      resourceType: 'workspace',
      resourceId: workspace._id.toString(),
      workspaceId: workspace._id,
      metadata: { role: invite.role },
      success: true,
    });

    return workspace;
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    workspaceId: string,
    actorId: string,
    targetUserId: string,
    newRole: 'admin' | 'editor' | 'commenter' | 'viewer'
  ): Promise<void> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new ApiError(404, 'NOT_FOUND', 'Workspace not found');
    }

    // Check actor permission
    const actor = workspace.members.find(m => m.userId.toString() === actorId);
    if (!actor || !['owner', 'admin'].includes(actor.role)) {
      throw new ApiError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    // Find target member
    const targetMember = workspace.members.find(m => m.userId.toString() === targetUserId);
    if (!targetMember) {
      throw new ApiError(404, 'NOT_FOUND', 'Member not found');
    }

    // Cannot change owner role
    if (targetMember.role === 'owner') {
      throw new ApiError(403, 'FORBIDDEN', 'Cannot change owner role');
    }

    const oldRole = targetMember.role;
    targetMember.role = newRole;
    await workspace.save();

    await AuditLog.create({
      actorId,
      action: 'member_role_changed',
      resourceType: 'workspace',
      resourceId: workspaceId,
      workspaceId,
      metadata: { targetUserId, oldRole, newRole },
      success: true,
    });
  }

  /**
   * §SHARE-07 Transfer ownership
   */
  async transferOwnership(
    workspaceId: string,
    currentOwnerId: string,
    newOwnerId: string
  ): Promise<void> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new ApiError(404, 'NOT_FOUND', 'Workspace not found');
    }

    if (workspace.ownerId.toString() !== currentOwnerId) {
      throw new ApiError(403, 'FORBIDDEN', 'Only owner can transfer ownership');
    }

    const newOwner = workspace.members.find(m => m.userId.toString() === newOwnerId);
    if (!newOwner) {
      throw new ApiError(404, 'NOT_FOUND', 'New owner must be a member');
    }

    // Update roles
    const currentOwner = workspace.members.find(m => m.userId.toString() === currentOwnerId);
    if (currentOwner) currentOwner.role = 'admin';
    newOwner.role = 'owner';
    workspace.ownerId = newOwnerId as any;

    await workspace.save();

    await AuditLog.create({
      actorId: currentOwnerId,
      action: 'workspace_transferred',
      resourceType: 'workspace',
      resourceId: workspaceId,
      workspaceId,
      metadata: { newOwnerId },
      success: true,
    });
  }

  /**
   * Check if user has access to workspace
   */
  async checkAccess(workspaceId: string, userId: string): Promise<boolean> {
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      'members.userId': userId,
      deletedAt: null,
    });
    return !!workspace;
  }

  /** Throws 403 if user is not a workspace member (and workspace exists). */
  async assertWorkspaceAccess(workspaceId: string, userId: string): Promise<void> {
    const ok = await this.checkAccess(workspaceId, userId);
    if (!ok) {
      throw new ApiError(403, 'FORBIDDEN', 'Access denied to workspace');
    }
  }

  /** Throws 403 if user cannot edit workspace content (owner, admin, editor). */
  async assertWorkspaceEditor(workspaceId: string, userId: string): Promise<void> {
    const role = await this.getUserRole(workspaceId, userId);
    if (!role || !['owner', 'admin', 'editor'].includes(role)) {
      throw new ApiError(403, 'FORBIDDEN', 'Insufficient permissions');
    }
  }

  /**
   * Get user's role in workspace
   */
  async getUserRole(
    workspaceId: string,
    userId: string
  ): Promise<'owner' | 'admin' | 'editor' | 'commenter' | 'viewer' | null> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return null;
    
    const member = workspace.members.find(m => m.userId.toString() === userId);
    return member ? member.role : null;
  }
}

export const workspaceService = new WorkspaceService();
