import crypto from 'crypto';
import { Diagram, IDiagram } from '../models/diagram.model';
import { DiagramVersion } from '../models/diagram-version.model';
import { Note } from '../models/note.model';
import { Workspace } from '../models/workspace.model';
import { User, PLAN_LIMITS } from '../models/user.model';
import { AuditLog } from '../models/audit-log.model';
import { ApiError } from '../middleware/errorHandler';
import { workspaceService } from './workspace.service';
import logger from '../utils/logger';

/**
 * §4.2 Diagram Service
 * Handles diagram CRUD, versioning, sharing, and collaboration
 */
class DiagramService {
  /**
   * Create new diagram with plan limit enforcement
   */
  async createDiagram(
    userId: string,
    workspaceId: string,
    data: Partial<IDiagram>
  ): Promise<IDiagram> {
    // Check workspace access
    const hasAccess = await workspaceService.checkAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new ApiError(403, 'FORBIDDEN', 'Access denied to workspace');
    }

    // Get user plan and check diagram limit
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found');

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new ApiError(404, 'NOT_FOUND', 'Workspace not found');

    // Check diagram count limit
    const diagramCount = await Diagram.countDocuments({
      workspaceId,
      isTrashed: false,
    });

    const limit = PLAN_LIMITS[user.plan].diagrams;
    if (limit !== Infinity && diagramCount >= limit) {
      throw new ApiError(402, 'PLAN_LIMIT_REACHED', `Diagram limit reached. Upgrade to create more diagrams.`);
    }

    // Create diagram
    const diagram = new Diagram({
      ...data,
      workspaceId,
      createdBy: userId,
      lastEditedBy: userId,
      version: 1,
    });

    await diagram.save();

    // Create associated note document
    await Note.create({
      diagramId: diagram._id,
      workspaceId,
      content: {},
      contentText: '',
      createdBy: userId,
    });

    // Update workspace diagram count
    workspace.diagramCount += 1;
    await workspace.save();

    await AuditLog.create({
      actorId: userId,
      action: 'diagram_created',
      resourceType: 'diagram',
      resourceId: diagram._id.toString(),
      workspaceId,
      success: true,
    });

    return diagram;
  }

  /**
   * Update diagram with version tracking
   */
  async updateDiagram(
    diagramId: string,
    userId: string,
    updates: Partial<IDiagram>,
    createVersion = false
  ): Promise<IDiagram> {
    const allowedUpdates: any = {};
    if (updates.title !== undefined) allowedUpdates.title = updates.title;
    if (updates.description !== undefined) allowedUpdates.description = updates.description;
    if (updates.syntax !== undefined) allowedUpdates.syntax = updates.syntax;
    if (updates.notes !== undefined) allowedUpdates.notes = updates.notes;
    if (updates.paperColor !== undefined) allowedUpdates.paperColor = updates.paperColor;
    if (updates.showGrid !== undefined) allowedUpdates.showGrid = updates.showGrid;
    if (updates.showRuler !== undefined) allowedUpdates.showRuler = updates.showRuler;
    if (updates.archived !== undefined) allowedUpdates.archived = updates.archived;
    if (updates.folder !== undefined) allowedUpdates.folder = updates.folder;
    if (updates.tags !== undefined) allowedUpdates.tags = updates.tags;
    if (updates.nodes !== undefined) allowedUpdates.nodes = updates.nodes;
    if (updates.edges !== undefined) allowedUpdates.edges = updates.edges;

    // Use $set for regular fields and $inc for version
    const diagram = await Diagram.findByIdAndUpdate(
      diagramId,
      {
        $set: {
          ...allowedUpdates,
          lastEditedBy: userId,
        },
        $inc: { version: 1 },
      },
      { new: true, runValidators: true }
    );
    if (!diagram) throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');

    // Save version if requested (after main update to avoid conflicts)
    if (createVersion) {
      await this.createVersion(diagram, userId, updates.title as string);
    }

    return diagram;
  }

  /**
   * §COLLAB-10 Create named version snapshot
   */
  async createVersion(
    diagram: IDiagram,
    userId: string,
    versionName?: string
  ): Promise<void> {
    const role = await workspaceService.getUserRole(
      diagram.workspaceId.toString(),
      userId
    );
    if (!role || !['owner', 'admin', 'editor'].includes(role)) {
      throw new ApiError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found');

    // Check version limit based on plan
    const versionLimit = PLAN_LIMITS[user.plan].versionHistory;
    if (versionLimit !== Infinity) {
      const versionCount = await DiagramVersion.countDocuments({
        diagramId: diagram._id,
      });

      if (versionCount >= versionLimit) {
        // Delete oldest version
        const oldest = await DiagramVersion.findOne({ diagramId: diagram._id })
          .sort({ createdAt: 1 });
        if (oldest) await oldest.deleteOne();
      }
    }

    await DiagramVersion.create({
      diagramId: diagram._id,
      workspaceId: diagram.workspaceId,
      version: diagram.version,
      name: versionName || null,
      isAutoSave: !versionName,
      syntax: diagram.syntax,
      nodes: diagram.nodes,
      edges: diagram.edges,
      viewport: diagram.viewport,
      savedBy: userId,
    });
  }

  /**
   * §COLLAB-11 Restore diagram to specific version
   */
  async restoreVersion(
    diagramId: string,
    versionId: string,
    userId: string
  ): Promise<IDiagram> {
    const diagram = await Diagram.findById(diagramId);
    if (!diagram) {
      throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    }

    const version = await DiagramVersion.findById(versionId);
    if (!version || version.diagramId.toString() !== diagramId) {
      throw new ApiError(404, 'NOT_FOUND', 'Version not found');
    }

    // Check access
    const role = await workspaceService.getUserRole(
      diagram.workspaceId.toString(),
      userId
    );
    if (!role || !['owner', 'admin', 'editor'].includes(role)) {
      throw new ApiError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    // Save current state as version before restoring
    await this.createVersion(diagram, userId, `Before restore to v${version.version}`);

    // Restore
    diagram.syntax = version.syntax;
    diagram.nodes = version.nodes as any;
    diagram.edges = version.edges as any;
    diagram.viewport = version.viewport;
    diagram.lastEditedBy = userId as any;
    diagram.version += 1;
    await diagram.save();

    return diagram;
  }

  /**
   * §SHARE-03 Generate public share link
   */
  async generatePublicLink(
    diagramId: string,
    userId: string,
    options: {
      expiresAt?: Date;
      password?: string;
    } = {}
  ): Promise<{ token: string; url: string }> {
    const diagram = await Diagram.findById(diagramId);
    if (!diagram) {
      throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    }

    // Check access
    const role = await workspaceService.getUserRole(
      diagram.workspaceId.toString(),
      userId
    );
    if (!role || !['owner', 'admin', 'editor'].includes(role)) {
      throw new ApiError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    diagram.isPublic = true;
    diagram.publicLinkToken = token;
    diagram.publicLinkExpiresAt = options.expiresAt || null;
    
    if (options.password) {
      const bcrypt = require('bcryptjs');
      diagram.publicLinkPasswordHash = await bcrypt.hash(options.password, 10);
    }

    await diagram.save();

    await AuditLog.create({
      actorId: userId,
      action: 'diagram_shared',
      resourceType: 'diagram',
      resourceId: diagramId,
      workspaceId: diagram.workspaceId,
      metadata: { hasPassword: !!options.password, expiresAt: options.expiresAt },
      success: true,
    });

    const url = `${process.env.FRONTEND_URL}/public/${token}`;
    return { token, url };
  }

  /**
   * Revoke public link
   */
  async revokePublicLink(diagramId: string, userId: string): Promise<void> {
    const diagram = await Diagram.findById(diagramId);
    if (!diagram) {
      throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    }

    const role = await workspaceService.getUserRole(
      diagram.workspaceId.toString(),
      userId
    );
    if (!role || !['owner', 'admin', 'editor'].includes(role)) {
      throw new ApiError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    diagram.isPublic = false;
    diagram.publicLinkToken = null;
    diagram.publicLinkExpiresAt = null;
    diagram.publicLinkPasswordHash = null;
    await diagram.save();

    await AuditLog.create({
      actorId: userId,
      action: 'diagram_unshared',
      resourceType: 'diagram',
      resourceId: diagramId,
      workspaceId: diagram.workspaceId,
      success: true,
    });
  }

  /**
   * §WS-08 Star/favorite diagram
   */
  async toggleStar(diagramId: string, userId: string): Promise<boolean> {
    const diagram = await Diagram.findById(diagramId);
    if (!diagram) {
      throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    }

    const hasAccess = await workspaceService.checkAccess(
      diagram.workspaceId.toString(),
      userId
    );
    if (!hasAccess) {
      throw new ApiError(403, 'FORBIDDEN', 'Access denied');
    }

    const isStarred = diagram.starredBy.some(id => id.toString() === userId);
    
    if (isStarred) {
      diagram.starredBy = diagram.starredBy.filter(id => id.toString() !== userId);
    } else {
      diagram.starredBy.push(userId as any);
    }

    await diagram.save();
    return !isStarred;
  }

  /**
   * §WS-09 Move diagram to trash
   */
  async moveToTrash(diagramId: string, userId: string): Promise<void> {
    const diagram = await Diagram.findById(diagramId);
    if (!diagram) {
      throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    }

    const role = await workspaceService.getUserRole(
      diagram.workspaceId.toString(),
      userId
    );
    if (!role || !['owner', 'admin', 'editor'].includes(role)) {
      throw new ApiError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    diagram.isTrashed = true;
    diagram.trashedAt = new Date();
    diagram.trashedBy = userId as any;
    await diagram.save();

    await AuditLog.create({
      actorId: userId,
      action: 'diagram_deleted',
      resourceType: 'diagram',
      resourceId: diagramId,
      workspaceId: diagram.workspaceId,
      success: true,
    });
  }

  /**
   * §WS-10 Restore from trash
   */
  async restoreFromTrash(diagramId: string, userId: string): Promise<void> {
    const diagram = await Diagram.findById(diagramId);
    if (!diagram) {
      throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    }

    const role = await workspaceService.getUserRole(
      diagram.workspaceId.toString(),
      userId
    );
    if (!role || !['owner', 'admin', 'editor'].includes(role)) {
      throw new ApiError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    diagram.isTrashed = false;
    diagram.trashedAt = null;
    diagram.trashedBy = null;
    await diagram.save();

    await AuditLog.create({
      actorId: userId,
      action: 'diagram_restored',
      resourceType: 'diagram',
      resourceId: diagramId,
      workspaceId: diagram.workspaceId,
      success: true,
    });
  }

  /**
   * Duplicate diagram
   */
  async duplicateDiagram(diagramId: string, userId: string): Promise<IDiagram> {
    const original = await Diagram.findById(diagramId);
    if (!original) {
      throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    }

    const hasAccess = await workspaceService.checkAccess(
      original.workspaceId.toString(),
      userId
    );
    if (!hasAccess) {
      throw new ApiError(403, 'FORBIDDEN', 'Access denied');
    }

    const duplicate = new Diagram({
      ...original.toObject(),
      _id: undefined,
      title: `${original.title} (Copy)`,
      createdBy: userId,
      lastEditedBy: userId,
      version: 1,
      isPublic: false,
      publicLinkToken: null,
      starredBy: [],
      isTrashed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await duplicate.save();

    const ws = await Workspace.findById(duplicate.workspaceId);
    if (ws) {
      ws.diagramCount += 1;
      await ws.save();
    }

    // Duplicate note
    const originalNote = await Note.findOne({ diagramId: original._id });
    if (originalNote) {
      await Note.create({
        diagramId: duplicate._id,
        workspaceId: duplicate.workspaceId,
        content: originalNote.content,
        contentText: originalNote.contentText,
        createdBy: userId,
      });
    }

    return duplicate;
  }
}

export const diagramService = new DiagramService();
