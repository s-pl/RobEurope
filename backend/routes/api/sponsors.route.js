import express from 'express';
import { createSponsor, getSponsors, getSponsorById, updateSponsor, deleteSponsor } from '../../controller/sponsors.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { uploadMiddleware } from '../../middleware/upload.middleware.js';
const router = express.Router();

router.get('/', getSponsors);
router.get('/:id', getSponsorById);
router.post('/', authenticateToken, uploadMiddleware({ fieldName: 'logo' }), createSponsor);
router.put('/:id', authenticateToken, requireRole('super_admin'), uploadMiddleware({ fieldName: 'logo' }), updateSponsor);
router.delete('/:id', authenticateToken, requireRole('super_admin'), deleteSponsor);

export default router;
