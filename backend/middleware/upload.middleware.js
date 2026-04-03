import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { put } from '@vercel/blob';

/**
 * @fileoverview
 * Upload middleware — uses multer memoryStorage to receive files in-memory,
 * then pushes them to Vercel Blob. No disk writes; compatible with Vercel serverless.
 *
 * Requires BLOB_READ_WRITE_TOKEN env var (set automatically on Vercel, or via `vercel env pull`).
 */

// All uploads use memory storage — files live in req.file.buffer
const memoryStorage = multer.memoryStorage();

/**
 * Uploads a multer in-memory file to Vercel Blob and returns the public URL.
 *
 * @param {Express.Multer.File} file multer file object (buffer must be present).
 * @param {string} [folder='uploads'] Blob path prefix.
 * @returns {Promise<string>} Public URL of the uploaded blob.
 */
export async function uploadToBlob(file, folder = 'uploads') {
  const ext = path.extname(file.originalname);
  const blobName = `${folder}/${Date.now()}_${uuidv4()}${ext}`;
  const blob = await put(blobName, file.buffer, {
    access: 'public',
    contentType: file.mimetype,
  });
  return blob.url;
}

/**
 * Creates a multer middleware chain that stores files in memory.
 * After the middleware runs, call `uploadToBlob(req.file)` in your controller.
 *
 * @param {object} [options]
 * @param {'single'|'array'|'fields'} [options.type='single']
 * @param {string|Array} [options.fieldName='file']
 * @param {number} [options.maxSize] Max file size in bytes (default: 5 MB, 200 MB for video).
 * @param {RegExp} [options.allowedTypes] Allowed MIME type regex.
 * @returns {Function[]} [multerMiddleware, handleUploadErrors]
 */
export const uploadMiddleware = (options = {}) => {
  const { type = 'single', fieldName = 'file', maxSize, allowedTypes } = options;

  let defaultMaxSize = 5 * 1024 * 1024;
  let defaultAllowedTypes = /image\/.*/;

  if (fieldName === 'video' || (typeof fieldName === 'string' && fieldName.includes('video'))) {
    defaultMaxSize = 200 * 1024 * 1024;
    defaultAllowedTypes = /video\/.*/;
  }

  const finalMaxSize = maxSize || defaultMaxSize;
  const finalAllowedTypes = allowedTypes || defaultAllowedTypes;

  const fileFilter = (req, file, cb) => {
    if (finalAllowedTypes.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${finalAllowedTypes}`), false);
    }
  };

  const upload = multer({ storage: memoryStorage, limits: { fileSize: finalMaxSize }, fileFilter });

  if (type === 'fields') return [upload.fields(fieldName), handleUploadErrors];
  if (type === 'array') return [upload.array(fieldName, 10), handleUploadErrors];
  return [upload.single(fieldName), handleUploadErrors];
};

export const handleUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field' });
    }
  }
  if (error?.message?.includes('Invalid file type') || error?.message?.includes('Tipo de archivo no permitido')) {
    return res.status(415).json({ error: 'Unsupported Media Type', message: error.message });
  }
  return res.status(422).json({ error: 'Upload error', message: error?.message || 'Unknown upload error' });
};

/**
 * Extracts normalized file info from a request after multer has run.
 * NOTE: `url` is not set here — call `uploadToBlob(req.file)` in the controller
 * to get the public URL after uploading to Vercel Blob.
 */
export const getFileInfo = (req) => {
  if (req.file) {
    return {
      filename: req.file.originalname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer,
    };
  }

  if (req.files) {
    const filesInfo = {};
    for (const [field, files] of Object.entries(req.files)) {
      filesInfo[field] = files.map((file) => ({
        filename: file.originalname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      }));
    }
    return filesInfo;
  }

  return null;
};

/**
 * Pre-configured upload middleware for general file uploads (documents, images, videos, archives).
 * Uses memory storage.
 */
export const uploadFile = multer({
  storage: memoryStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      /^image\/.*/,
      /^video\/.*/,
      /^application\/pdf$/,
      /^application\/msword$/,
      /^application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document$/,
      /^application\/vnd\.ms-excel$/,
      /^application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet$/,
      /^application\/vnd\.ms-powerpoint$/,
      /^application\/vnd\.openxmlformats-officedocument\.presentationml\.presentation$/,
      /^application\/zip$/,
      /^application\/x-rar-compressed$/,
      /^application\/x-7z-compressed$/,
      /^text\/plain$/,
      /^text\/csv$/,
    ];
    const isAllowed = allowedMimes.some((mime) => mime.test(file.mimetype));
    if (isAllowed) cb(null, true);
    else cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
  },
});
