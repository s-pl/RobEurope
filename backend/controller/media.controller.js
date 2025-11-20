import db from '../models/index.js';
const { Media, User } = db;
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export const getAllMedia = async (req, res) => {
  try {
    const { page = 1, limit = 10, uploaded_by } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (uploaded_by) where.uploaded_by = uploaded_by;

    const media = await Media.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'uploader',
        attributes: ['id', 'username', 'first_name', 'last_name']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      media: media.rows,
      pagination: {
        total: media.count,
        page: parseInt(page),
        pages: Math.ceil(media.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
};

export const getMediaById = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await Media.findByPk(id, {
      include: [{
        model: User,
        as: 'uploader',
        attributes: ['id', 'username', 'first_name', 'last_name']
      }]
    });

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    res.json(media);
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
};

export const uploadMedia = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { originalname, filename, mimetype, size } = req.file;
      const url = `/uploads/${filename}`;

      const media = await Media.create({
        filename,
        original_name: originalname,
        mime_type: mimetype,
        size,
        url,
        uploaded_by: req.user.id
      });

      res.status(201).json(media);
    } catch (error) {
      console.error('Error uploading media:', error);
      res.status(500).json({ error: 'Failed to upload media' });
    }
  }
];

export const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await Media.findByPk(id);

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Check if user owns the media or is admin
    if (media.uploaded_by !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to delete this media' });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'uploads', media.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await media.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
};

// Middleware for handling file uploads
export const uploadMiddleware = upload;