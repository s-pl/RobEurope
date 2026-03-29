/**
 * Team Files — admin-only uploads stored in Cloudflare R2.
 *
 * Routes:
 *   GET  /api/teams/:teamId/files          — list files (team members)
 *   GET  /api/teams/:teamId/files/usage    — storage + ops usage snapshot
 *   POST /api/teams/:teamId/files          — upload file (team owner or super_admin)
 *   DELETE /api/teams/:teamId/files/:fileId — delete file (team owner or super_admin)
 */

import path from 'path';
import crypto from 'crypto';
import db from '../models/index.js';
import { uploadToR2, deleteFromR2, isR2Configured, generatePresignedUrl } from '../utils/r2.js';
import {
  assertUploadAllowed,
  incrementClassA,
  incrementClassB,
  getUsageSnapshot,
} from '../utils/quotas.js';

const { TeamFile, TeamMembers, User } = db;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB per file (hard cap before quota check)

/** Check whether the user is the team owner or super_admin */
async function isAdminOrOwner(teamId, user) {
  if (user.role === 'super_admin') return true;
  const membership = await TeamMembers.findOne({
    where: { team_id: Number(teamId), user_id: user.id, left_at: null },
  });
  return membership?.role === 'owner';
}

/**
 * GET /api/teams/:teamId/files
 * Any team member can list files.
 * Counts as one Class B operation.
 */
export const listTeamFiles = async (req, res) => {
  try {
    const { teamId } = req.params;

    const isMember = await TeamMembers.findOne({
      where: { team_id: Number(teamId), user_id: req.user.id, left_at: null },
    });
    if (!isMember && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const files = await TeamFile.findAll({
      where: { team_id: teamId },
      include: [{ model: User, as: 'uploader', attributes: ['id', 'first_name', 'last_name', 'profile_photo_url'] }],
      order: [['created_at', 'DESC']],
    });

    // Track Class B op (fire-and-forget — never block the response)
    incrementClassB().catch(() => {});

    // Attach presigned URLs valid for 1 hour so the browser can load them directly
    const withUrls = files.map(f => {
      const plain = f.toJSON();
      try {
        plain.signed_url = generatePresignedUrl(f.r2_key, 3600);
      } catch {
        plain.signed_url = plain.url; // fallback to stored URL
      }
      return plain;
    });

    res.json(withUrls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/teams/:teamId/files/usage
 * Storage + ops snapshot for the team.
 * Accessible to any team member.
 */
export const getTeamFilesUsage = async (req, res) => {
  try {
    const { teamId } = req.params;

    const isMember = await TeamMembers.findOne({
      where: { team_id: Number(teamId), user_id: req.user.id, left_at: null },
    });
    if (!isMember && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const snapshot = await getUsageSnapshot(teamId);
    res.json(snapshot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/teams/:teamId/files
 * Restricted to team owner or super_admin.
 * Expects multipart/form-data with a single field "file".
 */
export const uploadTeamFile = async (req, res) => {
  try {
    const { teamId } = req.params;

    if (!(await isAdminOrOwner(teamId, req.user))) {
      return res.status(403).json({ error: 'Solo el propietario del equipo o un administrador puede subir archivos.' });
    }

    if (!isR2Configured()) {
      return res.status(503).json({ error: 'El almacenamiento en la nube no está configurado. Contacta con el administrador.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo.' });
    }

    if (req.file.size > MAX_FILE_SIZE) {
      return res.status(413).json({ error: `El archivo supera el límite por archivo de ${MAX_FILE_SIZE / 1024 / 1024} MB.` });
    }

    // ── Quota enforcement ────────────────────────────────────────────────────
    await assertUploadAllowed(teamId, req.file.size);
    // ────────────────────────────────────────────────────────────────────────

    const ext      = path.extname(req.file.originalname).toLowerCase();
    const uniqueId = crypto.randomBytes(12).toString('hex');
    const r2Key    = `teams/${teamId}/${uniqueId}${ext}`;

    const publicUrl = await uploadToR2({
      buffer:   req.file.buffer,
      key:      r2Key,
      mimeType: req.file.mimetype,
    });

    // Track Class A op (upload is a write)
    incrementClassA().catch(() => {});

    const record = await TeamFile.create({
      team_id:       teamId,
      uploaded_by:   req.user.id,
      filename:      `${uniqueId}${ext}`,
      original_name: req.file.originalname,
      mime_type:     req.file.mimetype,
      size:          req.file.size,
      r2_key:        r2Key,
      url:           publicUrl,
    });

    const full = await TeamFile.findByPk(record.id, {
      include: [{ model: User, as: 'uploader', attributes: ['id', 'first_name', 'last_name', 'profile_photo_url'] }],
    });

    res.status(201).json(full);
  } catch (err) {
    console.error(err);
    res.status(err.status ?? 500).json({ error: err.message });
  }
};

/**
 * DELETE /api/teams/:teamId/files/:fileId
 * Restricted to team owner or super_admin.
 */
export const deleteTeamFile = async (req, res) => {
  try {
    const { teamId, fileId } = req.params;

    if (!(await isAdminOrOwner(teamId, req.user))) {
      return res.status(403).json({ error: 'Solo el propietario del equipo o un administrador puede eliminar archivos.' });
    }

    const file = await TeamFile.findOne({ where: { id: fileId, team_id: teamId } });
    if (!file) return res.status(404).json({ error: 'Archivo no encontrado.' });

    await deleteFromR2(file.r2_key);
    await file.destroy();

    // Track Class A op (delete is a write/mutation)
    incrementClassA().catch(() => {});

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(err.status ?? 500).json({ error: err.message });
  }
};
