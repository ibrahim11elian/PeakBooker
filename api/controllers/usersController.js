import UserModel from '../models/userModel.js';
import { APIFeatures } from '../utils/api-features.js';
import AppError from '../utils/error.js';

export default class Users {
  constructor() {}

  getAllUsers = async (req, res, next) => {
    try {
      // create feature object to apply operations on mongoose query
      const features = new APIFeatures(UserModel.find(), req.query);

      // 1) Filter
      features.filter();

      // 2) Sort
      features.sort();

      // 3) Projection
      features.limitFields();

      // 4) Pagination
      features.paginate();

      // execute the query
      const numUsers = await UserModel.countDocuments();
      const users = await features.query;
      res.status(200).json({
        status: 'success',
        totalUsers: numUsers,
        results: users.length,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  };

  createNewUser = (req, res) => {
    res.status(503).json({ message: 'this route not yet implemented' });
  };

  getUserByID = (req, res) => {
    res.status(503).json({ message: 'this route not yet implemented' });
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

  updateUser = async (req, res, next) => {
    res.status(503).json({ message: 'this route not yet implemented' });
  };

  deleteUser = (req, res) => {
    res.status(503).json({ message: 'this route not yet implemented' });
  };
}
