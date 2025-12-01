import express from 'express';
import { createRegistration, getRegistrations, getRegistrationById, updateRegistration, deleteRegistration, approveRegistration, rejectRegistration, exportRegistrationsCSV } from '../../controller/registration.controller.js';
import { requireRole } from '../../middleware/role.middleware.js';
const router = express.Router();

router.get('/', getRegistrations);
router.get('/export', requireRole('super_admin'), exportRegistrationsCSV);
router.get('/:id', getRegistrationById);
router.post('/', createRegistration);
router.put('/:id', updateRegistration);
router.delete('/:id', deleteRegistration);
router.post('/:id/approve', requireRole('super_admin'), approveRegistration);
router.post('/:id/reject', requireRole('super_admin'), rejectRegistration);

export default router;
