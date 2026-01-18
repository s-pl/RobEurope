/**
 * @fileoverview
 * API handlers for Archive (Global Information Page).
 * 
 * Archives store files, text and mixed content organized by competition/year
 * with configurable visibility (hidden, public, restricted by email).
 * @module controller/ArchiveController
 */

import db from '../models/index.js';
import { getFileInfo } from '../middleware/upload.middleware.js';
import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';

const { Archive, Competition, User } = db;

/**
 * Checks if user is super_admin.
 * @param {Object} user - Session user.
 * @returns {boolean}
 */
const isSuperAdmin = (user) => user?.role === 'super_admin';

/**
 * Checks if user has access to restricted content.
 * @param {Object} archive - Archive item.
 * @param {Object} user - Session user.
 * @returns {boolean}
 */
const hasAccessToRestricted = (archive, user) => {
  if (!user || !user.email) return false;
  if (isSuperAdmin(user)) return true;
  
  const allowedEmails = archive.allowed_emails || [];
  return allowedEmails.includes(user.email.toLowerCase());
};

/**
 * Filters archives based on visibility and user access.
 * @param {Array} archives - Array of archive items.
 * @param {Object} user - Session user.
 * @returns {Array} Filtered archives.
 */
const filterByVisibility = (archives, user) => {
  return archives.filter(archive => {
    // Super admin sees everything
    if (isSuperAdmin(user)) return true;
    
    // Hidden content is only visible to admins
    if (archive.visibility === 'hidden') return false;
    
    // Public content is visible to all
    if (archive.visibility === 'public') return true;
    
    // Restricted content requires email check
    if (archive.visibility === 'restricted') {
      return hasAccessToRestricted(archive, user);
    }
    
    return false;
  });
};

/**
 * Lists archive items.
 * Filters based on user visibility permissions.
 *
 * @route GET /api/archives
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const listArchives = async (req, res) => {
  try {
    const { competition_id, content_type, visibility, limit = 50, offset = 0 } = req.query;
    const where = {};
    
    if (competition_id) {
      where.competition_id = competition_id;
    }
    
    if (content_type) {
      where.content_type = content_type;
    }
    
    // Only super_admin can filter by visibility or see non-public content
    if (visibility && isSuperAdmin(req.user)) {
      where.visibility = visibility;
    }
    
    const archives = await Archive.findAll({
      where,
      include: [
        { model: Competition, as: 'competition', attributes: ['id', 'title', 'slug'] },
        { model: User, as: 'uploader', attributes: ['id', 'username', 'first_name', 'last_name'] }
      ],
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
      limit: Number(limit),
      offset: Number(offset)
    });
    
    // Filter by visibility
    const filteredArchives = filterByVisibility(archives, req.user);
    
    res.json({
      items: filteredArchives,
      total: filteredArchives.length,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (err) {
    console.error('Error listing archives:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Gets archives grouped by competition.
 *
 * @route GET /api/archives/by-competition
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const getArchivesByCompetition = async (req, res) => {
  try {
    const competitions = await Competition.findAll({
      order: [['start_date', 'DESC']],
      attributes: ['id', 'title', 'slug', 'start_date', 'end_date']
    });
    
    const result = [];
    
    for (const competition of competitions) {
      const archives = await Archive.findAll({
        where: { competition_id: competition.id },
        include: [
          { model: User, as: 'uploader', attributes: ['id', 'username', 'first_name', 'last_name'] }
        ],
        order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
      });
      
      const filteredArchives = filterByVisibility(archives, req.user);
      
      if (filteredArchives.length > 0 || isSuperAdmin(req.user)) {
        result.push({
          competition,
          archives: filteredArchives
        });
      }
    }
    
    // Also get archives without competition
    const noCompetitionArchives = await Archive.findAll({
      where: { competition_id: null },
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'username', 'first_name', 'last_name'] }
      ],
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
    });
    
    const filteredNoCompetition = filterByVisibility(noCompetitionArchives, req.user);
    
    if (filteredNoCompetition.length > 0 || isSuperAdmin(req.user)) {
      result.push({
        competition: null,
        archives: filteredNoCompetition
      });
    }
    
    res.json({ items: result });
  } catch (err) {
    console.error('Error getting archives by competition:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Gets a single archive by ID.
 *
 * @route GET /api/archives/:id
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const getArchiveById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const archive = await Archive.findByPk(id, {
      include: [
        { model: Competition, as: 'competition', attributes: ['id', 'title', 'slug'] },
        { model: User, as: 'uploader', attributes: ['id', 'username', 'first_name', 'last_name'] }
      ]
    });
    
    if (!archive) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    // Check visibility
    if (archive.visibility === 'hidden' && !isSuperAdmin(req.user)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    if (archive.visibility === 'restricted' && !hasAccessToRestricted(archive, req.user)) {
      return res.status(403).json({ error: 'No tienes acceso a este contenido' });
    }
    
    res.json(archive);
  } catch (err) {
    console.error('Error getting archive:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Creates a new archive item (super_admin only).
 *
 * @route POST /api/archives
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const createArchive = async (req, res) => {
  try {
    if (!req.user || !isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Solo el administrador general puede crear archivos' });
    }
    
    const { 
      title, 
      description, 
      content_type = 'text', 
      competition_id, 
      visibility = 'hidden',
      allowed_emails = [],
      sort_order = 0
    } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'El título es requerido' });
    }
    
    let fileData = {};
    const fileInfo = getFileInfo(req);
    
    if (fileInfo) {
      fileData = {
        file_url: fileInfo.url,
        file_name: fileInfo.originalname,
        file_mime_type: fileInfo.mimetype,
        file_size: fileInfo.size
      };
    }
    
    // Validate content_type based on what's provided
    let finalContentType = content_type;
    if (fileInfo && description) {
      finalContentType = 'mixed';
    } else if (fileInfo && !description) {
      finalContentType = 'file';
    } else if (!fileInfo && description) {
      finalContentType = 'text';
    }
    
    // Normalize allowed_emails
    let normalizedEmails = [];
    if (allowed_emails && Array.isArray(allowed_emails)) {
      normalizedEmails = allowed_emails.map(e => e.toLowerCase().trim()).filter(e => e);
    } else if (typeof allowed_emails === 'string') {
      normalizedEmails = allowed_emails.split(',').map(e => e.toLowerCase().trim()).filter(e => e);
    }
    
    const archive = await Archive.create({
      title: title.trim(),
      description: description?.trim() || null,
      content_type: finalContentType,
      competition_id: competition_id || null,
      visibility,
      allowed_emails: normalizedEmails,
      sort_order: Number(sort_order) || 0,
      uploaded_by: req.user.id,
      ...fileData
    });
    
    res.status(201).json(archive);
  } catch (err) {
    console.error('Error creating archive:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Updates an archive item (super_admin only).
 *
 * @route PUT /api/archives/:id
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const updateArchive = async (req, res) => {
  try {
    if (!req.user || !isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Solo el administrador general puede editar archivos' });
    }
    
    const { id } = req.params;
    const archive = await Archive.findByPk(id);
    
    if (!archive) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    const { 
      title, 
      description, 
      competition_id, 
      visibility,
      allowed_emails,
      sort_order
    } = req.body;
    
    // Handle file upload if present
    let fileData = {};
    const fileInfo = getFileInfo(req);
    
    if (fileInfo) {
      // Delete old file if exists
      if (archive.file_url) {
        const oldFilePath = path.join(process.cwd(), 'uploads', path.basename(archive.file_url));
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      fileData = {
        file_url: fileInfo.url,
        file_name: fileInfo.originalname,
        file_mime_type: fileInfo.mimetype,
        file_size: fileInfo.size
      };
    }
    
    // Normalize allowed_emails
    let normalizedEmails = archive.allowed_emails;
    if (allowed_emails !== undefined) {
      if (Array.isArray(allowed_emails)) {
        normalizedEmails = allowed_emails.map(e => e.toLowerCase().trim()).filter(e => e);
      } else if (typeof allowed_emails === 'string') {
        normalizedEmails = allowed_emails.split(',').map(e => e.toLowerCase().trim()).filter(e => e);
      }
    }
    
    const updateData = {
      title: title?.trim() || archive.title,
      description: description !== undefined ? description?.trim() : archive.description,
      competition_id: competition_id !== undefined ? competition_id : archive.competition_id,
      visibility: visibility || archive.visibility,
      allowed_emails: normalizedEmails,
      sort_order: sort_order !== undefined ? Number(sort_order) : archive.sort_order,
      updated_at: new Date(),
      ...fileData
    };
    
    // Update content_type based on current state
    const hasFile = fileData.file_url || archive.file_url;
    const hasText = updateData.description;
    if (hasFile && hasText) {
      updateData.content_type = 'mixed';
    } else if (hasFile) {
      updateData.content_type = 'file';
    } else {
      updateData.content_type = 'text';
    }
    
    await archive.update(updateData);
    
    res.json(archive);
  } catch (err) {
    console.error('Error updating archive:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Updates visibility of an archive item (super_admin only).
 *
 * @route PATCH /api/archives/:id/visibility
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const updateArchiveVisibility = async (req, res) => {
  try {
    if (!req.user || !isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Solo el administrador general puede cambiar la visibilidad' });
    }
    
    const { id } = req.params;
    const { visibility, allowed_emails } = req.body;
    
    if (!visibility || !['hidden', 'public', 'restricted'].includes(visibility)) {
      return res.status(400).json({ error: 'Visibilidad inválida. Opciones: hidden, public, restricted' });
    }
    
    const archive = await Archive.findByPk(id);
    if (!archive) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    const updateData = { visibility, updated_at: new Date() };
    
    if (visibility === 'restricted') {
      if (!allowed_emails || allowed_emails.length === 0) {
        return res.status(400).json({ error: 'Se requieren emails cuando la visibilidad es restringida' });
      }
      
      let normalizedEmails = [];
      if (Array.isArray(allowed_emails)) {
        normalizedEmails = allowed_emails.map(e => e.toLowerCase().trim()).filter(e => e);
      } else if (typeof allowed_emails === 'string') {
        normalizedEmails = allowed_emails.split(',').map(e => e.toLowerCase().trim()).filter(e => e);
      }
      updateData.allowed_emails = normalizedEmails;
    }
    
    await archive.update(updateData);
    
    res.json({ message: 'Visibilidad actualizada', archive });
  } catch (err) {
    console.error('Error updating archive visibility:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Deletes an archive item (super_admin only).
 *
 * @route DELETE /api/archives/:id
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const deleteArchive = async (req, res) => {
  try {
    if (!req.user || !isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Solo el administrador general puede eliminar archivos' });
    }
    
    const { id } = req.params;
    const archive = await Archive.findByPk(id);
    
    if (!archive) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    // Delete file if exists
    if (archive.file_url) {
      const filePath = path.join(process.cwd(), 'uploads', path.basename(archive.file_url));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await archive.destroy();
    
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting archive:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Reorders archive items (super_admin only).
 *
 * @route POST /api/archives/reorder
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @returns {Promise<void>}
 */
export const reorderArchives = async (req, res) => {
  try {
    if (!req.user || !isSuperAdmin(req.user)) {
      return res.status(403).json({ error: 'Solo el administrador general puede reordenar archivos' });
    }
    
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Se requiere un array de items con id y sort_order' });
    }
    
    for (const item of items) {
      if (item.id && typeof item.sort_order === 'number') {
        await Archive.update(
          { sort_order: item.sort_order },
          { where: { id: item.id } }
        );
      }
    }
    
    res.json({ message: 'Orden actualizado' });
  } catch (err) {
    console.error('Error reordering archives:', err);
    res.status(500).json({ error: err.message });
  }
};
