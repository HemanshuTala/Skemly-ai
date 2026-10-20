import { Router } from 'express';
import * as WorkspaceController from '../controllers/workspace.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  transferOwnershipSchema,
} from '../validators/workspace.validator';

const router = Router();

router.get('/', authenticateToken, WorkspaceController.listWorkspaces);
router.post('/', authenticateToken, validate(createWorkspaceSchema), WorkspaceController.createWorkspace);
router.get('/:id', authenticateToken, WorkspaceController.getWorkspace);
router.put('/:id', authenticateToken, validate(updateWorkspaceSchema), WorkspaceController.updateWorkspace);
router.delete('/:id', authenticateToken, WorkspaceController.deleteWorkspace);
router.get('/:id/members', authenticateToken, WorkspaceController.getMembers);
router.post('/:id/invite', authenticateToken, validate(inviteMemberSchema), WorkspaceController.inviteMember);
router.post('/invitations/accept', authenticateToken, WorkspaceController.acceptInvite);
router.delete('/:id/members/:userId', authenticateToken, WorkspaceController.removeMember);
router.put('/:id/members/:userId/role', authenticateToken, validate(updateMemberRoleSchema), WorkspaceController.updateMemberRole);
router.post('/:id/transfer-ownership', authenticateToken, validate(transferOwnershipSchema), WorkspaceController.transferOwnership);
router.get('/:id/activity', authenticateToken, WorkspaceController.getActivity);

export default router;
