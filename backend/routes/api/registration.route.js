import express from 'express';
import { createRegistration, getRegistrations, getRegistrationById, updateRegistration, deleteRegistration } from '../../controller/registration.controller.js';
const router = express.Router();

router.get('/', getRegistrations);
router.get('/:id', getRegistrationById);
router.post('/', createRegistration);
router.put('/:id', updateRegistration);
router.delete('/:id', deleteRegistration);

export default router;
