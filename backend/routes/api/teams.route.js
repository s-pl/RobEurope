import express from 'express';
import { createTeam, getTeams, getTeamById, updateTeam, deleteTeam, inviteToTeam, acceptInvite, requestJoinTeam, approveJoinRequest, registerTeamInCompetition, getMyTeam, listJoinRequests, getMembershipStatus } from '../../controller/teams.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import { requireOwnership } from '../../middleware/ownership.middleware.js';
import { uploadMiddleware } from '../../middleware/upload.middleware.js';
const router = express.Router();

router.get('/', getTeams);
router.get('/mine', authenticateToken, getMyTeam);
router.get('/status', authenticateToken, getMembershipStatus);
router.get('/:id', getTeamById);
router.post('/', authenticateToken, uploadMiddleware({ fieldName: 'logo' }), createTeam);
router.put('/:id', authenticateToken, requireOwnership('Team'), uploadMiddleware({ fieldName: 'logo' }), updateTeam);
router.delete('/:id', authenticateToken, requireOwnership('Team'), deleteTeam);

// invitations
router.post('/:id/invite', authenticateToken, requireOwnership('Team'), inviteToTeam);
router.post('/invitations/accept', authenticateToken, acceptInvite);

// join requests
router.post('/:id/requests', authenticateToken, requestJoinTeam);
router.post('/requests/:requestId/approve', authenticateToken, approveJoinRequest);
router.get('/:id/requests', authenticateToken, requireOwnership('Team'), listJoinRequests);

// team -> competition registration
router.post('/:id/register-competition', authenticateToken, requireOwnership('Team'), registerTeamInCompetition);

export default router;
