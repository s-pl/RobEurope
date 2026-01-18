import express from 'express';
import { 
  createRegistration, 
  getRegistrations, 
  getRegistrationById, 
  updateRegistration, 
  deleteRegistration, 
  approveRegistration, 
  rejectRegistration, 
  exportRegistrationsCSV,
  centerApproveRegistration,
  centerRejectRegistration,
  getMyCenterRegistrations,
  createPasswordRegistration
} from '../../controller/registration.controller.js';
import { requireRole, requireAnyRole, requireAdminOrCenterAdmin } from '../../middleware/role.middleware.js';
const router = express.Router();

router.get('/', getRegistrations);
router.get('/export', requireRole('super_admin'), exportRegistrationsCSV);
router.get('/my-center', requireAdminOrCenterAdmin, getMyCenterRegistrations);
router.get('/:id', getRegistrationById);
router.post('/', createRegistration);
router.post('/with-password', createPasswordRegistration);
router.put('/:id', updateRegistration);
router.delete('/:id', deleteRegistration);

// Super admin approval routes
router.post('/:id/approve', requireRole('super_admin'), approveRegistration);
router.post('/:id/reject', requireRole('super_admin'), rejectRegistration);

// Center admin approval routes
router.post('/:id/center-approve', requireAdminOrCenterAdmin, centerApproveRegistration);
router.post('/:id/center-reject', requireAdminOrCenterAdmin, centerRejectRegistration);

export default router;
