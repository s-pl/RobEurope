/**
 * Team Files — uploads stored in Cloudflare R2.
 *
 * Routes:
 *   GET  /api/teams/:teamId/files          — list files (team members)
 *   GET  /api/teams/:teamId/files/usage    — storage + ops usage snapshot
 *   POST /api/teams/:teamId/files          — upload file (team owner or super_admin)
 *   DELETE /api/teams/:teamId/files/:fileId — delete file (team owner or super_admin)
 */

import path from 'path';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { uploadToR2, deleteFromR2, isR2Configured, generatePresignedUrl } from '../utils/r2.js';
import {
  assertUploadAllowed,
  incrementClassA,
  incrementClassB,
  getUsageSnapshot,
} from '../utils/quotas.js';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB per file

/** Check whether the user is the team owner or super_admin */
async function isAdminOrOwner(teamId, user) {
  if (user.role === 'super_admin') return true;
  const membership = await prisma.teamMember.findFirst({
    where: { team_id: Number(teamId), user_id: user.id, left_at: null },
  });
  return membership?.role === 'owner';
}

/**
 * GET /api/teams/:teamId/files
 */
export const listTeamFiles = async (req, res) => {
  try {
    const { teamId } = req.params;

    const isMember = await prisma.teamMember.findFirst({
      where: { team_id: Number(teamId), user_id: req.user.id, left_at: null },
    });
    if (!isMember && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const files = await prisma.teamFile.findMany({
      where: { team_id: Number(teamId) },
      include: { uploader: { select: { id: true, first_name: true, last_name: true, profile_photo_url: true } } },
      orderBy: { created_at: 'desc' },
    });

    incrementClassB().catch(() => {});

    const withUrls = files.map(f => {
      const plain = { ...f, size: f.size.toString() }; // BigInt -> string
      try {
        plain.signed_url = generatePresignedUrl(f.r2_key, 3600);
      } catch {
        plain.signed_url = plain.url;
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
 */
export const getTeamFilesUsage = async (req, res) => {
  try {
    const { teamId } = req.params;

    const isMember = await prisma.teamMember.findFirst({
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

    await assertUploadAllowed(teamId, req.file.size);

    const ext      = path.extname(req.file.originalname).toLowerCase();
    const uniqueId = crypto.randomBytes(12).toString('hex');
    const r2Key    = `teams/${teamId}/${uniqueId}${ext}`;

    const publicUrl = await uploadToR2({
      buffer:   req.file.buffer,
      key:      r2Key,
      mimeType: req.file.mimetype,
    });

    incrementClassA().catch(() => {});

    const record = await prisma.teamFile.create({
      data: {
        team_id:       Number(teamId),
        uploaded_by:   req.user.id,
        filename:      `${uniqueId}${ext}`,
        original_name: req.file.originalname,
        mime_type:     req.file.mimetype,
        size:          BigInt(req.file.size),
        r2_key:        r2Key,
        url:           publicUrl,
      }
    });

    const full = await prisma.teamFile.findUnique({
      where: { id: record.id },
      include: { uploader: { select: { id: true, first_name: true, last_name: true, profile_photo_url: true } } },
    });

    res.status(201).json({ ...full, size: full.size.toString() });
  } catch (err) {
    console.error(err);
    res.status(err.status ?? 500).json({ error: err.message });
  }
};

/**
 * DELETE /api/teams/:teamId/files/:fileId
 */
export const deleteTeamFile = async (req, res) => {
  try {
    const { teamId, fileId } = req.params;

    if (!(await isAdminOrOwner(teamId, req.user))) {
      return res.status(403).json({ error: 'Solo el propietario del equipo o un administrador puede eliminar archivos.' });
    }

    const file = await prisma.teamFile.findFirst({ where: { id: Number(fileId), team_id: Number(teamId) } });
    if (!file) return res.status(404).json({ error: 'Archivo no encontrado.' });

    await deleteFromR2(file.r2_key);
    await prisma.teamFile.delete({ where: { id: Number(fileId) } });

    incrementClassA().catch(() => {});

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(err.status ?? 500).json({ error: err.message });
  }
};
