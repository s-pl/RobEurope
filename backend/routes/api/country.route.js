import express from 'express';

import morgan from 'morgan';
import logger from '../../utils/logger.js';
import { getCountries, getCountryById, createCountry, updateCountry, deleteCountry } from '../../controller/country.controller.js';
const router = express.Router();
router.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
router.get('/', getCountries);
router.get('/:id', getCountryById);
router.post('/', createCountry);
router.put('/:id', updateCountry);
router.delete('/:id', deleteCountry);

export default router;