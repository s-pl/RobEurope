import express from 'express';
import { createSponsor, getSponsors, getSponsorById, updateSponsor, deleteSponsor } from '../../controller/sponsors.controller.js';
const router = express.Router();

router.get('/', getSponsors);
router.get('/:id', getSponsorById);
router.post('/', createSponsor);
router.put('/:id', updateSponsor);
router.delete('/:id', deleteSponsor);

export default router;
