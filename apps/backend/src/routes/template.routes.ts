import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import * as TemplateController from '../controllers/template.controller';

const router = Router();
router.get('/', TemplateController.listTemplates);
router.post('/', authenticateToken, TemplateController.createTemplate);
router.get('/:id', TemplateController.getTemplate);
router.delete('/:id', authenticateToken, TemplateController.deleteTemplate);
router.post('/:id/use', authenticateToken, TemplateController.useTemplate);
export default router;
