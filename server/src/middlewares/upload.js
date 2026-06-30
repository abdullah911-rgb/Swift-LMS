const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/env');

const ALLOWED_IMAGE_TYPES = /jpeg|jpg|png|gif|webp/;
const ALLOWED_VIDEO_TYPES = /mp4|mkv|avi|mov|webm/;
const ALLOWED_DOC_TYPES = /pdf|doc|docx|ppt|pptx|xls|xlsx|zip/;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.path);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (allowedTypes) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mimeType = file.mimetype.split('/')[1];
  if (allowedTypes.test(ext) || allowedTypes.test(mimeType)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowedTypes.source}`), false);
  }
};

const uploadImage = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES),
});

const uploadVideo = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB for video
  fileFilter: fileFilter(ALLOWED_VIDEO_TYPES),
});

const uploadDocument = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: fileFilter(ALLOWED_DOC_TYPES),
});

const uploadAny = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
});

module.exports = { uploadImage, uploadVideo, uploadDocument, uploadAny };
