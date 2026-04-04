/**
 * @fileoverview Robot file upload/list/delete endpoints.
 *
 * Robot files are uploaded for a team and competition and can be toggled public.
 * Access checks are enforced for team members (or admins).
 */

import prisma from '../lib/prisma.js';
import { getFileInfo } from '../middleware/upload.middleware.js';

/**
 * Upload a robot file.
 *
 * @route POST /api/robot_file
 */
export const uploadRobotFile = async (req, res) => {
  try {
    const { team_id, competition_id, description } = req.body;
    const fileInfo = getFileInfo(req);

    if (!fileInfo) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check permissions
    const membership = await prisma.teamMember.findFirst({
      where: {
        team_id: Number(team_id),
        user_id: req.user.id,
        left_at: null
      }
    });

    if (!membership && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not a member of this team' });
    }

    const newFile = await prisma.robotFile.create({
      data: {
        team_id: Number(team_id),
        competition_id: Number(competition_id),
        file_url: fileInfo.url,
        file_name: fileInfo.originalname,
        file_type: fileInfo.mimetype,
        description,
        uploaded_by: req.user.id
      }
    });

    res.status(201).json(newFile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * List robot files.
 *
 * @route GET /api/robot_file
 */
export const getRobotFiles = async (req, res) => {
  try {
    const { team_id, competition_id } = req.query;

    if (competition_id && !team_id) {
      const files = await prisma.robotFile.findMany({
        where: {
          competition_id: Number(competition_id),
          is_public: true
        },
        include: {
          uploader: { select: { username: true } },
          team: { select: { name: true, id: true } }
        },
        orderBy: { created_at: 'desc' }
      });
      return res.json(files);
    }

    if (!team_id || !competition_id) {
      return res.status(400).json({ error: 'team_id and competition_id are required' });
    }

    const files = await prisma.robotFile.findMany({
      where: { team_id: Number(team_id), competition_id: Number(competition_id) },
      include: { uploader: { select: { username: true } } },
      orderBy: { created_at: 'desc' }
    });

    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete a robot file.
 *
 * @route DELETE /api/robot_file/:id
 */
export const deleteRobotFile = async (req, res) => {
  try {
    const file = await prisma.robotFile.findUnique({ where: { id: Number(req.params.id) } });
    if (!file) return res.status(404).json({ error: 'File not found' });

    // Check permissions
    if (req.user.role !== 'admin') {
      const membership = await prisma.teamMember.findFirst({
        where: {
          team_id: file.team_id,
          user_id: req.user.id,
          left_at: null
        }
      });
      if (!membership) return res.status(403).json({ error: 'Permission denied' });
    }

    await prisma.robotFile.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Toggle a robot file's public visibility.
 *
 * @route PUT /api/robot_file/:id/visibility
 */
export const toggleFileVisibility = async (req, res) => {
  try {
    const file = await prisma.robotFile.findUnique({ where: { id: Number(req.params.id) } });
    if (!file) return res.status(404).json({ error: 'File not found' });

    // Check permissions
    if (req.user.role !== 'admin') {
      const membership = await prisma.teamMember.findFirst({
        where: {
          team_id: file.team_id,
          user_id: req.user.id,
          left_at: null
        }
      });
      if (!membership) return res.status(403).json({ error: 'Permission denied' });
    }

    const updated = await prisma.robotFile.update({
      where: { id: Number(req.params.id) },
      data: { is_public: !file.is_public }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
