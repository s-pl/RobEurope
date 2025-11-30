
import express from 'express';
import { createStream, getStreams, getStreamById, updateStream, deleteStream } from '../../controller/stream.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = express.Router();

router.get('/', getStreams);
router.get('/:id', getStreamById);
router.post('/', authenticateToken, createStream);
router.put('/:id', authenticateToken, updateStream);
router.delete('/:id', authenticateToken, deleteStream);

export default router;
