import express from 'express';
import {
  getAllStreams,
  getStreamById,
  createStream,
  updateStream,
  deleteStream
} from '../../controller/stream.controller.js';
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

router.get('/', getAllStreams);
router.get('/:id', getStreamById);
router.post('/', createStream);
router.put('/:id', updateStream);
router.delete('/:id', deleteStream);

export default router;
