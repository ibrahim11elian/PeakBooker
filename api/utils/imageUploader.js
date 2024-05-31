import multer from 'multer';
import AppError from './error.js';

class Uploader {
  constructor() {
    this.upload = multer({
      storage: this.multerStorage,
      limits: {
        fileSize: 1024 * 1024 * 5, // 5MB
      },
      fileFilter: this.multerFilter,
    });
  }

  multerStorage = multer.memoryStorage();

  multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
      // the cb work like middleware
      cb(null, true);
    } else {
      cb(new AppError('Please upload only images', 400), false);
    }
  };
}

export default Uploader;
