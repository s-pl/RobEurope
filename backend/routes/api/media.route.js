import authenticateToken from '../../middleware/auth.middleware.js';

const router = express.Router();

// Routes for media
router.post('/upload', authenticateToken, uploadFile);
router.get('/:id', authenticateToken, getMedia);
router.get('/:media_type/:media_id', authenticateToken, getMediaByEntity);
router.delete('/:id', authenticateToken, deleteMedia);

export default router;