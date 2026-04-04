/**
 * @fileoverview Authenticated media library endpoints.
 *
 * Supports listing media (with pagination and optional uploader filter), reading
 * a single media record, uploading a file to `/uploads`, and deleting media.
 */

import prisma from '../lib/prisma.js';
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
  limits: { fileSize: 10 * 1024 * 1024 },
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

/**
 * Get a page of media.
 *
 * @route GET /api/media
 */
export const getAllMedia = async (req, res) => {
  try {
    const { page = 1, limit = 10, uploaded_by } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (uploaded_by) where.uploaded_by = uploaded_by;

    const [rows, total] = await prisma.$transaction([
      prisma.media.findMany({
        where,
        include: {
          uploader: { select: { id: true, username: true, first_name: true, last_name: true } }
        },
        take: parseInt(limit),
        skip: parseInt(skip),
        orderBy: { created_at: 'desc' }
      }),
      prisma.media.count({ where })
    ]);

    res.json({
      media: rows,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
};

/**
 * Get a single media record by id.
 *
 * @route GET /api/media/:id
 */
export const getMediaById = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await prisma.media.findUnique({
      where: { id: Number(id) },
      include: {
        uploader: { select: { id: true, username: true, first_name: true, last_name: true } }
      }
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

/**
 * Upload a media file.
 *
 * @route POST /api/media
 */
export const uploadMedia = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { originalname, filename, mimetype, size } = req.file;
      const url = `/uploads/${filename}`;

      const media = await prisma.media.create({
        data: {
          filename,
          original_name: originalname,
          mime_type: mimetype,
          size,
          url,
          uploaded_by: req.user.id
        }
      });

      res.status(201).json(media);
    } catch (error) {
      console.error('Error uploading media:', error);
      res.status(500).json({ error: 'Failed to upload media' });
    }
  }
];

/**
 * Delete a media record and its file on disk.
 *
 * @route DELETE /api/media/:id
 */
export const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await prisma.media.findUnique({ where: { id: Number(id) } });

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    if (media.uploaded_by !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to delete this media' });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'uploads', media.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.media.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
};

// Middleware for handling file uploads
export const uploadMiddleware = upload;
