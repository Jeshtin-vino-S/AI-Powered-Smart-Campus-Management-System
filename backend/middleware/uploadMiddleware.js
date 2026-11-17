import multer from 'multer';
import path from 'path';
import cloudinary from '../config/cloudinary.js';

// Memory storage keeps file buffers in RAM, streaming directly to Cloudinary without local disk files
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|pdf|doc|docx|zip|txt/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.test(ext.slice(1))) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Only images, PDFs, docs, and zip files are allowed.'), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

export const handleFileUpload = (file, folder = 'campus_assets') => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary Upload Error]:', error.message);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(file.buffer);
  });
};
