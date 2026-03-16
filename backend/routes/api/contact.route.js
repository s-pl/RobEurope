import express from 'express';
import { sendContactMessage, getReviews, createReview, deleteMyReview } from '../../controller/contact.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';
import validate from '../../middleware/validate.middleware.js';

const router = express.Router();

// Contact form — public
router.post('/', validate({
  name: { required: true, type: 'string', min: 1, max: 200 },
  email: { required: true, type: 'email' },
  message: { required: true, type: 'string', min: 1, max: 5000 }
}), sendContactMessage);

// Reviews — GET public, POST/DELETE authenticated
router.get('/reviews', getReviews);
router.post('/reviews', authenticateToken, createReview);
router.delete('/reviews/me', authenticateToken, deleteMyReview);

export default router;
