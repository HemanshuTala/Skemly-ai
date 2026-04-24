import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import * as CommentController from '../controllers/comment.controller';

const router = Router({ mergeParams: true });

router.get('/:id/comments', authenticateToken, CommentController.getComments);
router.post('/:id/comments', authenticateToken, CommentController.createComment);
router.put('/:id/comments/:commentId', authenticateToken, CommentController.updateComment);
router.delete('/:id/comments/:commentId', authenticateToken, CommentController.deleteComment);
router.post('/:id/comments/:commentId/resolve', authenticateToken, CommentController.resolveComment);
router.post('/:id/comments/:commentId/reply', authenticateToken, CommentController.replyToComment);

export default router;
