import { Request, Response, NextFunction } from 'express';
import { Comment } from '../models/comment.model';
import { Notification } from '../models/notification.model';
import { Diagram } from '../models/diagram.model';
import { ApiError } from '../middleware/errorHandler';
import { workspaceService } from '../services/workspace.service';

/**
 * §4.6 Comment controller logic with @mentions
 */
export const getComments = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const diagram = await Diagram.findById(id);
    if (!diagram) throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    await workspaceService.assertWorkspaceAccess(diagram.workspaceId.toString(), req.userId);

    const comments = await Comment.find({ diagramId: id, parentId: null })
      .populate('authorId', 'name email avatar')
      .populate('mentions', 'name email')
      .sort({ createdAt: -1 });

    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentId: comment._id })
          .populate('authorId', 'name email avatar')
          .sort({ createdAt: 1 });
        return { ...comment.toObject(), replies };
      })
    );

    res.json({ success: true, data: commentsWithReplies });
  } catch (err) {
    next(err);
  }
};

export const createComment = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { content, position, parentId, mentions } = req.body;

    const diagram = await Diagram.findById(id);
    if (!diagram) throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    await workspaceService.assertWorkspaceAccess(diagram.workspaceId.toString(), req.userId);

    const comment = new Comment({
      diagramId: id,
      parentId: parentId || null,
      authorId: req.userId,
      content,
      position,
      mentions: mentions || [],
    });
    await comment.save();

    if (mentions && mentions.length > 0) {
      for (const mentionedUserId of mentions) {
        await Notification.create({
          userId: mentionedUserId,
          type: 'COMMENT_MENTION',
          title: 'You were mentioned in a comment',
          message: `You were mentioned in a comment on "${diagram.title}"`,
          link: `/diagrams/${id}`,
          metadata: { diagramId: id, commentId: comment._id },
        });
      }
    }

    if (diagram.createdBy.toString() !== req.userId && !parentId) {
      await Notification.create({
        userId: diagram.createdBy,
        type: 'COMMENT_ADD',
        title: 'New comment on your diagram',
        message: `New comment on "${diagram.title}"`,
        link: `/diagrams/${id}`,
        metadata: { diagramId: id, commentId: comment._id },
      });
    }

    await comment.populate('authorId', 'name email avatar');
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
};

export const updateComment = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { commentId } = req.params;
    const existing = await Comment.findById(commentId);
    if (!existing || existing.authorId.toString() !== req.userId) {
      throw new ApiError(403, 'FORBIDDEN', 'Access denied');
    }
    const diagram = await Diagram.findById(existing.diagramId);
    if (!diagram) throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    await workspaceService.assertWorkspaceAccess(diagram.workspaceId.toString(), req.userId);

    const comment = await Comment.findOneAndUpdate(
      { _id: commentId, authorId: req.userId },
      { content: req.body.content },
      { new: true }
    );
    res.json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { commentId } = req.params;
    const existing = await Comment.findOne({ _id: commentId, authorId: req.userId });
    if (!existing) throw new ApiError(403, 'FORBIDDEN', 'Access denied');

    const diagram = await Diagram.findById(existing.diagramId);
    if (!diagram) throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    await workspaceService.assertWorkspaceAccess(diagram.workspaceId.toString(), req.userId);

    await Comment.deleteOne({ _id: commentId });
    await Comment.deleteMany({ parentId: commentId });

    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
};

export const resolveComment = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { commentId } = req.params;
    const existing = await Comment.findById(commentId);
    if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Comment not found');

    const diagram = await Diagram.findById(existing.diagramId);
    if (!diagram) throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    await workspaceService.assertWorkspaceEditor(diagram.workspaceId.toString(), req.userId);

    const comment = await Comment.findByIdAndUpdate(
      commentId,
      { resolved: true, resolvedBy: req.userId, resolvedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
};

export const replyToComment = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id, commentId } = req.params;
    const { content, mentions } = req.body;

    const diagram = await Diagram.findById(id);
    if (!diagram) throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    await workspaceService.assertWorkspaceAccess(diagram.workspaceId.toString(), req.userId);

    const parentComment = await Comment.findById(commentId);
    if (!parentComment) throw new ApiError(404, 'NOT_FOUND', 'Parent comment not found');
    if (parentComment.diagramId.toString() !== id) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Comment does not belong to this diagram');
    }

    const reply = new Comment({
      diagramId: id,
      parentId: commentId,
      authorId: req.userId,
      content,
      position: parentComment.position,
      mentions: mentions || [],
    });
    await reply.save();

    if (parentComment.authorId.toString() !== req.userId) {
      await Notification.create({
        userId: parentComment.authorId,
        type: 'COMMENT_ADD',
        title: 'Reply to your comment',
        message: `Someone replied to your comment`,
        link: `/diagrams/${id}`,
        metadata: { diagramId: id, commentId: reply._id },
      });
    }

    await reply.populate('authorId', 'name email avatar');
    res.status(201).json({ success: true, data: reply });
  } catch (err) {
    next(err);
  }
};
