import { Router } from 'express';
import * as SearchController from '../controllers/search.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * §4.5 Workspace search routes §WS-06
 * Full-text search across diagrams and notes
 */
router.get('/', authenticateToken, SearchController.search);

export default router;
