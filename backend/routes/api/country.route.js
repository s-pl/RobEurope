import express from 'express';

import morgan from 'morgan';
import logger from '../../utils/logger.js';
import { getCountries, getCountryById, createCountry, updateCountry, deleteCountry } from '../../controller/country.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = express.Router();
router.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
router.get('/', getCountries);
router.get('/:id', getCountryById);
router.post('/', authenticateToken, requireRole('admin'), createCountry);
router.put('/:id', authenticateToken, requireRole('admin'), updateCountry);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteCountry);

export default router;