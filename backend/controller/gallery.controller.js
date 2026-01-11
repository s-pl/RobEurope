import db from '../models/index.js';
import { getFileInfo } from '../middleware/upload.middleware.js';

const { Gallery, User } = db;

const isAdminUser = (user) => {
  const role = user?.role;
  return role === 'super_admin' || role === 'admin';
};

export const listGallery = async (req, res) => {
  try {
    const items = await Gallery.findAll({
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'username', 'first_name', 'last_name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.json({ items });
  } catch (error) {
    console.error('Error listing gallery:', error);
    return res.status(500).json({ error: 'Failed to fetch gallery' });
  }
};

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

    const item = await Gallery.create({
      filename: fileInfo.filename,
      original_name: fileInfo.originalname,
      mime_type: fileInfo.mimetype,
      size: fileInfo.size,
      url: fileInfo.url,
      title,
      description,
      uploaded_by: req.user.id
    });

    return res.status(201).json(item);
  } catch (error) {
    console.error('Error creating gallery item:', error);
    return res.status(500).json({ error: 'Failed to upload gallery image' });
  }
};
