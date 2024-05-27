import UserModel from '../models/userModel.js';
import AppError from '../utils/error.js';
import BaseController from './baseController.js';

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
      const { id } = req.user;
      const user = await UserModel.findByIdAndUpdate(
        id,
        { email, name },
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

  // for admin use
  getUserByID = this.getOne();
  updateUser = this.updateOne; // don't update the password
  deleteUser = this.deleteOne;
}
