import sharp from 'sharp';
import UserModel from '../models/userModel.js';
import AppError from '../utils/error.js';
import BaseController from './baseController.js';
import Uploader from '../utils/imageUploader.js';
import { bucket } from '../utils/firebase-config.js';
const uploader = new Uploader();

export default class Users extends BaseController {
  constructor() {
    super(UserModel);
  }

  getAllUsers = this.getAll;

  getMe = (req, res, next) => {
    // middleware to pass the id that we got from the protect middleware to the getUserByID all the way to getOne
    req.params.id = req.user.id;
    next();
  };

  updateMe = async (req, res, next) => {
    try {
      if (req.body.password) {
        return next(
          new AppError(
            'This route is not for password update. Please use /updatePassword',
            400,
          ),
        );
      }

      const { email, name } = req.body;

      const photo = req.file ? req.body.photo : undefined;

      const { id } = req.user;
      const user = await UserModel.findByIdAndUpdate(
        id,
        { email, name, photo },
        {
          new: true,
          runValidators: true,
        },
      );

      res.status(200).json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  };

  deleteMe = async (req, res, next) => {
    try {
      const { id } = req.user;
      await UserModel.findByIdAndUpdate(id, { active: false });
      res.status(204).json({ status: 'success', data: null });
    } catch (error) {
      next(error);
    }
  };

  uploadUserPhoto = uploader.upload.single('photo');

  resizeUserPhoto = async (req, res, next) => {
    if (!req.file) return next();

    try {
      req.file.filename = `user-${req.user.id}.jpeg`;

      const resizedBuffer = await sharp(req.file.buffer)
        .resize(500, 500, {
          fit: 'cover',
          position: 'center',
        })
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toBuffer();

      req.file.buffer = resizedBuffer;

      next();
    } catch (error) {
      next(error);
    }
  };

  // Firebase Upload
  handleFileUpload = async (req, res, next) => {
    if (!req.file) {
      return next();
    }

    try {
      const blob = bucket.file(`uploads/users/${req.file.filename}`);
      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      await new Promise((resolve, reject) => {
        blobStream.on('error', (err) => {
          reject(err);
        });

        blobStream.on('finish', () => {
          const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${blob.name.split('/').join('%2F')}?alt=media`;
          req.body.photo = publicUrl;
          resolve();
        });

        blobStream.end(req.file.buffer);
      });

      next();
    } catch (error) {
      next(error);
    }
  };

  // for admin use
  getUserByID = this.getOne();
  updateUser = this.updateOne; // don't update the password
  deleteUser = this.deleteOne;
}
