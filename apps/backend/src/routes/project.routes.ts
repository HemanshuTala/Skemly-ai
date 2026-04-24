import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import * as ProjectController from '../controllers/project.controller';

const router = Router({ mergeParams: true });

router.get('/:wsId/projects', authenticateToken, ProjectController.listProjects);
router.post('/:wsId/projects', authenticateToken, ProjectController.createProject);
router.put('/:wsId/projects/:id', authenticateToken, ProjectController.updateProject);
router.delete('/:wsId/projects/:id', authenticateToken, ProjectController.deleteProject);

export default router;
