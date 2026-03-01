import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEPLOY_INFO_PATH = path.resolve(__dirname, '../../deploy-info.json');

/**
 * GET /health/deploy/actions
 * Returns last deploy metadata written by deploy-server.sh at build time.
 */
router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(DEPLOY_INFO_PATH)) {
      return res.status(200).json({
        status: 'ok',
        last_deploy: null,
        commit: null,
        branch: null,
        message: 'No deploy info available yet.',
      });
    }

    const raw = fs.readFileSync(DEPLOY_INFO_PATH, 'utf8');
    const info = JSON.parse(raw);

    return res.status(200).json({
      status: 'ok',
      last_deploy: info.deployed_at ?? null,
      commit: info.commit ?? null,
      branch: info.branch ?? null,
      triggered_by: info.triggered_by ?? 'github-actions',
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Could not read deploy info.' });
  }
});

export default router;
