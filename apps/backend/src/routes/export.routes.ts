import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import * as ExportController from '../controllers/export.controller';

const router = Router();

router.post('/png', authenticateToken, ExportController.exportPNG);
router.post('/svg', authenticateToken, ExportController.exportSVG);
router.post('/pdf', authenticateToken, ExportController.exportPDF);
router.post('/syntax', authenticateToken, ExportController.exportSyntax);
router.get('/status/:jobId', authenticateToken, ExportController.getExportStatus);
router.get('/download/:fileId', authenticateToken, ExportController.downloadExport);

export default router;
