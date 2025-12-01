import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';


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
 * Error handler for upload middleware
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