import { Router } from 'express';
import * as WorkspaceController from '../controllers/workspace.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, WorkspaceController.listWorkspaces);
router.post('/', authenticateToken, WorkspaceController.createWorkspace);
router.get('/:id', authenticateToken, WorkspaceController.getWorkspace);
router.put('/:id', authenticateToken, WorkspaceController.updateWorkspace);
router.delete('/:id', authenticateToken, WorkspaceController.deleteWorkspace);
router.get('/:id/members', authenticateToken, WorkspaceController.getMembers);
router.post('/:id/invite', authenticateToken, WorkspaceController.inviteMember);
router.post('/invitations/accept', authenticateToken, WorkspaceController.acceptInvite);
router.delete('/:id/members/:userId', authenticateToken, WorkspaceController.removeMember);
router.put('/:id/members/:userId/role', authenticateToken, WorkspaceController.updateMemberRole);
router.post('/:id/transfer-ownership', authenticateToken, WorkspaceController.transferOwnership);
router.get('/:id/activity', authenticateToken, WorkspaceController.getActivity);

export default router;
