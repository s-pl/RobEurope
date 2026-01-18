import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * @fileoverview
 * Multer-based upload middleware.
 *
 * Files are stored on disk under the project `uploads/` folder.
 * The backend typically serves these as static files from `/uploads`.
 */

/**
 * @typedef {Object} UploadOptions
 * @property {'single'|'array'|'fields'} [type='single'] Upload strategy.
 * @typedef {Object} UploadFieldDefinition
 * @property {string} name Field name.
 * @property {number} [maxCount] Maximum number of files for that field.
 *
 * @property {string|UploadFieldDefinition[]} [fieldName='file'] Field name(s).
 * @property {number} [maxSize] Maximum file size in bytes.
 * @property {RegExp} [allowedTypes] Allowed MIME type regex (tested against `file.mimetype`).
 */

/**
 * @typedef {Object} UploadedFileInfo
 * @property {string} filename Stored filename.
 * @property {string} originalname Original client filename.
 * @property {string} mimetype MIME type.
 * @property {number} size File size in bytes.
 * @property {string} path Server filesystem path.
 * @property {string} url Public URL path under `/uploads`.
 */

/**
 * Creates a multer middleware chain based on the given options.
 *
 * Notes:
 * - Defaults are inferred from the field name (e.g. `video` increases max size).
 * - Always returns an array `[multerMiddleware, handleUploadErrors]`.
 *
 * @param {UploadOptions} [options]
 * @returns {Function[]} Express middleware chain.
 */
export const uploadMiddleware = (options = {}) => {
  const {
    type = 'single',
    fieldName = 'file',
    maxSize,
    allowedTypes
  } = options;

  // Determine default maxSize and allowedTypes based on fieldName
  let defaultMaxSize = 5 * 1024 * 1024; // 5MB default
  let defaultAllowedTypes = /image\/*/; // image/* default

  if (fieldName.includes('video') || fieldName === 'video') {
    defaultMaxSize = 200 * 1024 * 1024; // 200MB for videos
    defaultAllowedTypes = /video\/*/;
  }

  const finalMaxSize = maxSize || defaultMaxSize;
  const finalAllowedTypes = allowedTypes || defaultAllowedTypes;

  // Storage configuration
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueName = `${Date.now()}_${uuidv4()}${ext}`;
      cb(null, uniqueName);
    }
  });

  // File filter
  const fileFilter = (req, file, cb) => {
    if (finalAllowedTypes.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${finalAllowedTypes}`), false);
    }
  };

  const upload = multer({
    storage,
    limits: { fileSize: finalMaxSize },
    fileFilter
  });

  // Return appropriate multer middleware
  if (type === 'fields') {
    return [upload.fields(fieldName), handleUploadErrors];
  } else if (type === 'array') {
    return [upload.array(fieldName, 10), handleUploadErrors]; // Limit to 10 files
  } else {
    return [upload.single(fieldName), handleUploadErrors];
  }
};

/**
 * Express error handler for upload middleware.
 *
 * Translates common Multer errors to consistent HTTP responses.
 *
 * @param {Error} error Error thrown by multer.
 * @param {Express.Request} req Express request.
 * @param {Express.Response} res Express response.
 * @param {Express.NextFunction} next Express next.
 * @returns {any}
 */
export const handleUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large',
        message: `File size exceeds the limit of ${error.field ? 'allowed size' : 'allowed size'}`
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected field',
        message: 'Unexpected file field in form data'
      });
    }
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(415).json({
      error: 'Unsupported Media Type',
      message: error.message
    });
  }

  // Generic error
  return res.status(422).json({
    error: 'Upload error',
    message: error.message || 'An error occurred during file upload'
  });
};

/**
 * Extracts normalized file info from a request after multer has run.
 *
 * - For `upload.single`, returns a single {@link UploadedFileInfo}.
 * - For `upload.fields`, returns a record of arrays keyed by field name.
 * - Returns `null` when no file data is present.
 *
 * @param {Express.Request} req Express request.
 * @returns {UploadedFileInfo|Object.<string, UploadedFileInfo[]>|null}
 */
export const getFileInfo = (req) => {
  if (req.file) {
    return {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/${req.file.filename}`
    };
  }

  if (req.files) {
    const filesInfo = {};
    for (const [field, files] of Object.entries(req.files)) {
      filesInfo[field] = files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        url: `/uploads/${file.filename}`
      }));
    }
    return filesInfo;
  }

  return null;
};

/**
 * Pre-configured upload middleware for general file uploads.
 * Supports PDFs, documents, images, videos, and archives.
 */
export const uploadFile = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueName = `${Date.now()}_${uuidv4()}${ext}`;
      cb(null, uniqueName);
    }
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (req, file, cb) => {
    // Allow common file types for archives
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
      /^text\/csv$/
    ];
    
    const isAllowed = allowedMimes.some(mime => mime.test(file.mimetype));
    
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
    }
  }
});