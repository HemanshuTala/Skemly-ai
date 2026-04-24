import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { aiRateLimiter } from '../middleware/rateLimiter';
import * as AIController from '../controllers/ai.controller';

const router = Router();

router.post('/generate', authenticateToken, aiRateLimiter, AIController.generateDiagram);
router.post('/generate/stream', authenticateToken, aiRateLimiter, AIController.streamGenerateDiagram);
router.post('/code-to-diagram', authenticateToken, aiRateLimiter, AIController.codeToDiagram);
router.post('/explain', authenticateToken, aiRateLimiter, AIController.explainDiagram);
router.post('/improve', authenticateToken, aiRateLimiter, AIController.improveDiagram);
router.post('/autofix', authenticateToken, aiRateLimiter, AIController.autofixSyntax);
router.get('/usage', authenticateToken, AIController.getAIUsage);

export default router;
