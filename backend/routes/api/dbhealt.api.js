import { Router } from 'express';
import { sequelize } from '../../models/index.js';
const router = Router();
import { authenticateToken } from '../../middleware/auth.middleware.js';
router.get('/health', authenticateToken, (req, res) => {
    checkDatabaseConnection().then(isHealthy => {
        res.status(200).json({
            status: 'OK',
            service: 'api',
            db: isHealthy ? 'up' : 'down',
            timestamp: new Date().toISOString()
        });
    });
});

function checkDatabaseConnection() {
  return sequelize.authenticate()
    .then(() => true)
    .catch(() => false);
}

export default router;
