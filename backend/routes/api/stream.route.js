
import express from 'express';
import streamController from '../../controller/stream.controller.js';

const {
  create: createStream,
  getAll: getStreams,
  getById: getStreamById,
  update: updateStream,
  delete: deleteStream
} = streamController;

import authenticateToken from '../../middleware/auth.middleware.js';

const router = express.Router();


router.get('/', getStreams);


router.post('/', authenticateToken, createStream);


router.get('/:id', getStreamById);


router.put('/:id', authenticateToken, updateStream);


router.delete('/:id', authenticateToken, deleteStream);

export default router;