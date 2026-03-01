import express from 'express';
import { sendContactMessage, getReviews, createReview, deleteMyReview } from '../../controller/contact.controller.js';
import authenticateToken from '../../middleware/auth.middleware.js';

const router = express.Router();

// Contact form — public
router.post('/', sendContactMessage);

// Reviews — GET public, POST/DELETE authenticated
router.get('/reviews', getReviews);
router.post('/reviews', authenticateToken, createReview);
router.delete('/reviews/me', authenticateToken, deleteMyReview);

export default router;
