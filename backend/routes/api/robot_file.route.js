import express from 'express';
import { uploadRobotFile, getRobotFiles, deleteRobotFile } from '../../controller/robot_file.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import { uploadMiddleware } from '../../middleware/upload.middleware.js';

const router = express.Router();

router.post('/', authenticateToken, uploadMiddleware({ fieldName: 'file', allowedTypes: /.*/ }), uploadRobotFile);
router.get('/', authenticateToken, getRobotFiles);
router.delete('/:id', authenticateToken, deleteRobotFile);

export default router;
