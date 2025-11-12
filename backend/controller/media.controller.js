import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../models/index.js';
import { v4 as uuidv4 } from 'uuid'; // Assuming uuid is installed, or use crypto

const { Media } = db;

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export const uploadFile = [
  upload.single('file'),
  async (req, res) => {
    try {
      const { media_type, media_id } = req.body;
      const userId = req.user.id; // Assuming auth middleware sets req.user

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const media = await Media.create({
        media_type,
        media_id,
        filename: req.file.filename,
        path: req.file.path,
        url: `/uploads/${req.file.filename}`, // Assuming static serve
        mime_type: req.file.mimetype,
        size: req.file.size,
        uploaded_by: userId
      });

      res.status(201).json(media);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
];

export const getMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await Media.findByPk(id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMediaByEntity = async (req, res) => {
  try {
    const { media_type, media_id } = req.params;
    const media = await Media.findAll({
      where: { media_type, media_id }
    });
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const media = await Media.findByPk(id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    if (media.uploaded_by !== userId && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    // Delete file from disk
    fs.unlinkSync(media.path);
    await media.destroy();
    res.json({ message: 'Media deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};