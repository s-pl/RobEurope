import express from 'express';
import { createSponsor, getSponsors, getSponsorById, updateSponsor, deleteSponsor } from '../../controller/sponsors.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
const router = express.Router();

router.get('/', getSponsors);
router.get('/:id', getSponsorById);
router.post('/', authenticateToken, createSponsor);
router.put('/:id', authenticateToken, requireRole('super_admin'), updateSponsor);
router.delete('/:id', authenticateToken, requireRole('super_admin'), deleteSponsor);

export default router;
