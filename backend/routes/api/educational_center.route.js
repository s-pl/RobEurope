/**
 * @fileoverview
 * Routes for Educational Centers API.
 * @module routes/api/educational-center
 */

import express from 'express';
import {
  listEducationalCenters,
  getEducationalCenterById,
  createEducationalCenter,
  updateEducationalCenter,
  approveCenter,
  rejectCenter,
  deleteEducationalCenter,
  getEducationalCenterTeams,
  getEducationalCenterStreams,
  getEducationalCenterUsers,
  removeEducationalCenterUser,
  removeEducationalCenterTeam
} from '../../controller/educational_center.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import { requireRole, requireCenterAdmin, requireAnyRole } from '../../middleware/role.middleware.js';

const router = express.Router();
router.get('/', listEducationalCenters);
router.get('/:id', getEducationalCenterById);
router.get('/:id/teams', getEducationalCenterTeams);
router.get('/:id/users', authenticateToken, requireCenterAdmin(), getEducationalCenterUsers);
router.delete('/:id/users/:userId', authenticateToken, requireCenterAdmin(), removeEducationalCenterUser);
router.get('/:id/streams', getEducationalCenterStreams);
router.delete('/:id/teams/:teamId', authenticateToken, requireCenterAdmin(), removeEducationalCenterTeam);

// Protected routes - require authentication
router.use(authenticateToken);
router.post('/', requireAnyRole(['center_admin', 'super_admin']), createEducationalCenter);
router.put('/:id', requireCenterAdmin(), updateEducationalCenter);
router.post('/:id/approve', requireRole('super_admin'), approveCenter);
router.post('/:id/reject', requireRole('super_admin'), rejectCenter);
router.patch('/:id/approve', requireRole('super_admin'), approveCenter);
router.patch('/:id/reject', requireRole('super_admin'), rejectCenter);
router.delete('/:id', requireRole('super_admin'), deleteEducationalCenter);

export default router;
