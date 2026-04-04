import prisma from '../lib/prisma.js';
import { getFileInfo } from '../middleware/upload.middleware.js';
import fs from 'fs';
import path from 'path';

/**
 * Checks whether a session user should be treated as admin for gallery operations.
 * @param {object|null|undefined} user Session user.
 * @returns {boolean}
 */
const isAdminUser = (user) => {
  const role = user?.role;
  return role === 'super_admin' || role === 'admin' || role === 'center_admin';
};

/**
 * Determines media type from mime type.
 * @param {string} mimeType - MIME type of the file.
 * @returns {'image'|'video'}
 */
const getMediaType = (mimeType) => {
  if (mimeType && mimeType.startsWith('video/')) {
    return 'video';
  }
  return 'image';
};

const GALLERY_INCLUDE = {
  uploader: { select: { id: true, username: true, first_name: true, last_name: true } },
  competition: { select: { id: true, title: true, slug: true } }
};

/**
 * Lists gallery items (public).
 * Supports filtering by competition_id and media_type.
 *
 * @route GET /api/gallery
 */
export const listGallery = async (req, res) => {
  try {
    const { competition_id, media_type, featured, limit = 50, offset = 0 } = req.query;
    const where = {};

    if (competition_id) {
      where.competition_id = Number(competition_id);
    }

    if (media_type && ['image', 'video'].includes(media_type)) {
      where.media_type = media_type;
    }

    if (featured === 'true') {
      where.is_featured = true;
    }

    const [items, total] = await prisma.$transaction([
      prisma.gallery.findMany({
        where,
        include: GALLERY_INCLUDE,
        orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }],
        take: Number(limit),
        skip: Number(offset)
      }),
      prisma.gallery.count({ where })
    ]);

    return res.json({
      items,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('Error listing gallery:', error);
    return res.status(500).json({ error: 'Failed to fetch gallery' });
  }
};

/**
 * Gets gallery items grouped by competition.
 *
 * @route GET /api/gallery/by-competition
 */
export const getGalleryByCompetition = async (req, res) => {
  try {
    const competitions = await prisma.competition.findMany({
      orderBy: { start_date: 'desc' },
      select: { id: true, title: true, slug: true, start_date: true, end_date: true }
    });

    const result = [];

    for (const competition of competitions) {
      const items = await prisma.gallery.findMany({
        where: { competition_id: competition.id },
        include: { uploader: { select: { id: true, username: true, first_name: true, last_name: true } } },
        orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }]
      });

      if (items.length > 0) {
        result.push({
          competition,
          items,
          imageCount: items.filter(i => i.media_type === 'image').length,
          videoCount: items.filter(i => i.media_type === 'video').length
        });
      }
    }

    // Also get items without competition
    const noCompetitionItems = await prisma.gallery.findMany({
      where: { competition_id: null },
      include: { uploader: { select: { id: true, username: true, first_name: true, last_name: true } } },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }]
    });

    if (noCompetitionItems.length > 0) {
      result.push({
        competition: null,
        items: noCompetitionItems,
        imageCount: noCompetitionItems.filter(i => i.media_type === 'image').length,
        videoCount: noCompetitionItems.filter(i => i.media_type === 'video').length
      });
    }

    return res.json({ items: result });
  } catch (error) {
    console.error('Error getting gallery by competition:', error);
    return res.status(500).json({ error: 'Failed to fetch gallery by competition' });
  }
};

/**
 * Gets a single gallery item by ID.
 *
 * @route GET /api/gallery/:id
 */
export const getGalleryItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.gallery.findUnique({
      where: { id: Number(id) },
      include: GALLERY_INCLUDE
    });

    if (!item) {
      return res.status(404).json({ error: 'Gallery item not found' });
    }

    return res.json(item);
  } catch (error) {
    console.error('Error getting gallery item:', error);
    return res.status(500).json({ error: 'Failed to fetch gallery item' });
  }
};

/**
 * Creates a new gallery item (admin-only).
 *
 * @route POST /api/gallery
 */
export const createGalleryItem = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Session required' });
    }

    if (!isAdminUser(req.user)) {
      return res.status(403).json({ error: 'Se requiere rol: admin' });
    }

    const fileInfo = getFileInfo(req);
    if (!fileInfo) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const title = typeof req.body?.title === 'string' && req.body.title.trim() ? req.body.title.trim() : null;
    const description = typeof req.body?.description === 'string' && req.body.description.trim() ? req.body.description.trim() : null;
    const competition_id = req.body?.competition_id ? Number(req.body.competition_id) : null;
    const thumbnail_url = req.body?.thumbnail_url || null;
    const duration = req.body?.duration ? Number(req.body.duration) : null;
    const sort_order = req.body?.sort_order ? Number(req.body.sort_order) : 0;
    const is_featured = req.body?.is_featured === 'true' || req.body?.is_featured === true;

    const item = await prisma.gallery.create({
      data: {
        filename: fileInfo.filename,
        original_name: fileInfo.originalname,
        mime_type: fileInfo.mimetype,
        size: fileInfo.size,
        url: fileInfo.url,
        title,
        description,
        media_type: getMediaType(fileInfo.mimetype),
        thumbnail_url,
        duration,
        competition_id,
        sort_order,
        is_featured,
        uploaded_by: req.user.id
      }
    });

    return res.status(201).json(item);
  } catch (error) {
    console.error('Error creating gallery item:', error);
    return res.status(500).json({ error: 'Failed to upload gallery item' });
  }
};

/**
 * Updates a gallery item (admin-only).
 *
 * @route PUT /api/gallery/:id
 */
export const updateGalleryItem = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Session required' });
    }

    if (!isAdminUser(req.user)) {
      return res.status(403).json({ error: 'Se requiere rol: admin' });
    }

    const { id } = req.params;
    const item = await prisma.gallery.findUnique({ where: { id: Number(id) } });

    if (!item) {
      return res.status(404).json({ error: 'Gallery item not found' });
    }

    const { title, description, competition_id, thumbnail_url, duration, sort_order, is_featured } = req.body;

    const updateData = {
      title: title !== undefined ? (title?.trim() || null) : item.title,
      description: description !== undefined ? (description?.trim() || null) : item.description,
      competition_id: competition_id !== undefined ? (competition_id ? Number(competition_id) : null) : item.competition_id,
      thumbnail_url: thumbnail_url !== undefined ? thumbnail_url : item.thumbnail_url,
      duration: duration !== undefined ? Number(duration) : item.duration,
      sort_order: sort_order !== undefined ? Number(sort_order) : item.sort_order,
      is_featured: is_featured !== undefined ? (is_featured === 'true' || is_featured === true) : item.is_featured,
    };

    const updated = await prisma.gallery.update({ where: { id: Number(id) }, data: updateData });

    return res.json(updated);
  } catch (error) {
    console.error('Error updating gallery item:', error);
    return res.status(500).json({ error: 'Failed to update gallery item' });
  }
};

/**
 * Deletes a gallery item and its stored file (admin-only).
 * @route DELETE /api/gallery/:id
 */
export const deleteGalleryItem = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Session required' });
    }

    if (!isAdminUser(req.user)) {
      return res.status(403).json({ error: 'Se requiere rol: admin' });
    }

    const { id } = req.params;
    const item = await prisma.gallery.findUnique({ where: { id: Number(id) } });

    if (!item) {
      return res.status(404).json({ error: 'Gallery item not found' });
    }

    const filePath = path.join(process.cwd(), 'uploads', item.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Also delete thumbnail if exists
    if (item.thumbnail_url) {
      const thumbPath = path.join(process.cwd(), 'uploads', path.basename(item.thumbnail_url));
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }
    }

    await prisma.gallery.delete({ where: { id: Number(id) } });
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    return res.status(500).json({ error: 'Failed to delete gallery item' });
  }
};

/**
 * Reorders gallery items (admin-only).
 *
 * @route POST /api/gallery/reorder
 */
export const reorderGalleryItems = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Session required' });
    }

    if (!isAdminUser(req.user)) {
      return res.status(403).json({ error: 'Se requiere rol: admin' });
    }

    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Se requiere un array de items con id y sort_order' });
    }

    for (const item of items) {
      if (item.id && typeof item.sort_order === 'number') {
        await prisma.gallery.update({
          where: { id: Number(item.id) },
          data: { sort_order: item.sort_order }
        });
      }
    }

    return res.json({ message: 'Orden actualizado' });
  } catch (error) {
    console.error('Error reordering gallery items:', error);
    return res.status(500).json({ error: 'Failed to reorder gallery items' });
  }
};

/**
 * Toggles featured status of a gallery item (admin-only).
 *
 * @route POST /api/gallery/:id/toggle-featured
 */
export const toggleFeatured = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Session required' });
    }

    if (!isAdminUser(req.user)) {
      return res.status(403).json({ error: 'Se requiere rol: admin' });
    }

    const { id } = req.params;
    const item = await prisma.gallery.findUnique({ where: { id: Number(id) } });

    if (!item) {
      return res.status(404).json({ error: 'Gallery item not found' });
    }

    const updated = await prisma.gallery.update({
      where: { id: Number(id) },
      data: { is_featured: !item.is_featured }
    });

    return res.json({ message: 'Featured status toggled', is_featured: updated.is_featured });
  } catch (error) {
    console.error('Error toggling featured status:', error);
    return res.status(500).json({ error: 'Failed to toggle featured status' });
  }
};
