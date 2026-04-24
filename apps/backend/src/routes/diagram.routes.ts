import { Router } from 'express';
import * as DiagramController from '../controllers/diagram.controller';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, DiagramController.listDiagrams);
router.post('/', authenticateToken, DiagramController.createDiagram);
router.get('/public/:token', optionalAuth, DiagramController.getPublicDiagram);
router.post('/public/:token', optionalAuth, DiagramController.getPublicDiagram);
router.get('/:id', authenticateToken, DiagramController.getDiagram);
router.put('/:id', authenticateToken, DiagramController.updateDiagram);
router.delete('/:id', authenticateToken, DiagramController.deleteDiagram);
router.post('/:id/duplicate', authenticateToken, DiagramController.duplicateDiagram);
router.post('/:id/star', authenticateToken, DiagramController.starDiagram);
router.delete('/:id/star', authenticateToken, DiagramController.unstarDiagram);
router.post('/:id/trash', authenticateToken, DiagramController.trashDiagram);
router.post('/:id/restore', authenticateToken, DiagramController.restoreDiagram);
router.post('/:id/share', authenticateToken, DiagramController.createShareLink);
router.delete('/:id/share', authenticateToken, DiagramController.revokeShareLink);
router.get('/:id/versions', authenticateToken, DiagramController.getVersions);
router.post('/:id/versions', authenticateToken, DiagramController.saveVersion);
router.get('/:id/versions/:versionId', authenticateToken, DiagramController.getVersion);
router.post('/:id/versions/:versionId/restore', authenticateToken, DiagramController.restoreVersion);

export default router;
