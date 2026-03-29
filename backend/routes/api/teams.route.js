import express from 'express';
import multer from 'multer';
import { createTeam, getTeams, getTeamById, updateTeam, deleteTeam, inviteToTeam, acceptInvite, declineInvite, requestJoinTeam, approveJoinRequest, registerTeamInCompetition, getMyTeam, listJoinRequests, getMembershipStatus, leaveTeam, getMyJoinRequests, cancelJoinRequest } from '../../controller/teams.controller.js';
import { getMessages, sendMessage } from '../../controller/team_chat.controller.js';
import { listTeamFiles, uploadTeamFile, deleteTeamFile, getTeamFilesUsage } from '../../controller/team_files.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import { requireOwnership } from '../../middleware/ownership.middleware.js';
import { uploadMiddleware } from '../../middleware/upload.middleware.js';

const router = express.Router();

// Memory storage for R2 uploads (no disk, goes straight to Cloudflare)
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

router.get('/', getTeams);
router.get('/mine', authenticateToken, getMyTeam);
router.get('/status', authenticateToken, getMembershipStatus);
router.get('/my-requests', authenticateToken, getMyJoinRequests);
router.post('/leave', authenticateToken, leaveTeam);
router.get('/:id', getTeamById);
router.post('/', authenticateToken, uploadMiddleware({ fieldName: 'logo' }), createTeam);
router.put('/:id', authenticateToken, requireOwnership('Team'), uploadMiddleware({ fieldName: 'logo' }), updateTeam);
router.delete('/:id', authenticateToken, requireOwnership('Team'), deleteTeam);

// invitations
router.post('/:id/invite', authenticateToken, requireOwnership('Team'), inviteToTeam);
router.post('/invitations/accept', authenticateToken, acceptInvite);
router.post('/invitations/decline', authenticateToken, declineInvite);

// join requests
router.post('/:id/requests', authenticateToken, requestJoinTeam);
router.post('/requests/:requestId/approve', authenticateToken, approveJoinRequest);
router.delete('/requests/:requestId', authenticateToken, cancelJoinRequest);
router.get('/:id/requests', authenticateToken, requireOwnership('Team'), listJoinRequests);

// team -> competition registration
router.post('/:id/register-competition', authenticateToken, requireOwnership('Team'), registerTeamInCompetition);

// Chat routes — text only, no file uploads
router.get('/:teamId/messages', authenticateToken, getMessages);
router.post('/:teamId/messages', authenticateToken, sendMessage);

// Team files — admin/owner upload to Cloudflare R2
router.get('/:teamId/files/usage', authenticateToken, getTeamFilesUsage);
router.get('/:teamId/files', authenticateToken, listTeamFiles);
router.post('/:teamId/files', authenticateToken, memoryUpload.single('file'), uploadTeamFile);
router.delete('/:teamId/files/:fileId', authenticateToken, deleteTeamFile);

export default router;
