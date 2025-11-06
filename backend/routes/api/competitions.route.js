import express from 'express';
import { createCompetition, getCompetitions, getCompetitionById, updateCompetition, deleteCompetition } from '../../controller/competitions.controller.js';
const router = express.Router();

router.get('/', getCompetitions);
router.get('/:id', getCompetitionById);
router.post('/', createCompetition);
router.put('/:id', updateCompetition);
router.delete('/:id', deleteCompetition);

export default router;
