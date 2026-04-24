import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import * as NotesController from '../controllers/notes.controller';

const router = Router();
router.get('/:diagramId', authenticateToken, NotesController.getNotes);
router.put('/:diagramId', authenticateToken, NotesController.updateNotes);
router.get('/:diagramId/versions', authenticateToken, NotesController.getNoteVersions);
router.post('/:diagramId/publish', authenticateToken, NotesController.publishNotes);
router.delete('/:diagramId/publish', authenticateToken, NotesController.unpublishNotes);
export default router;
