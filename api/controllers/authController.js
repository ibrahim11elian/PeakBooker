/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import crypto from 'crypto';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import AppError from '../utils/error.js';
import Email from '../utils/email.js';

class AuthController {
  constructor() {}

  signup = async (req, res, next) => {
    try {
      const newUser = req.body;
      const existingUser = await User.findOne({ email: newUser.email });

      if (existingUser) {
        return next(new AppError('This user is already exist!', 400));
      }

      const createdUser = await User.create({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
      });

      // remove the password from the created user so we did not send it to the user
      createdUser.password = undefined;

      const token = this.generateToken({ id: createdUser._id });

      // const url = `${req.protocol}://${req.get('host')}/me`;
      // await new Email(createdUser, url).sendWelcome();

      this.sendTokenCookie(token, res);

      res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        data: {
          user: createdUser,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password)
        return next(
          new AppError(
            'Missing information you have to provide email and password',
            400,
          ),
        );

      const user = await User.findOne({ email, active: true }).select(
        '+password',
      );

      if (!user || !(await user.comparePassword(password, user.password))) {
        return next(new AppError('email or password is wrong!', 401));
      }

      const token = this.generateToken({ id: user._id });
      res.status(200).json({
        status: 'success',
        message: 'Logged in successfully',
        token,
      });
    } catch (error) {
      next(error);
    }
  };

  generateToken(data) {
    const expiresIn = process.env.JWT_EXPIRES_IN;

    // Ensure expiresIn is correctly interpreted as a string or number
    const expiresInValue = isNaN(expiresIn)
      ? expiresIn
      : parseInt(expiresIn, 10);

    return jwt.sign(data, process.env.JWT_SECRET, {
      expiresIn: expiresInValue,
    });
  }

  async verifyToken(data) {
    const verify = promisify(jwt.verify);
    return await verify(data, process.env.JWT_SECRET);
  }

  sendTokenCookie = (token, res) => {
    const cookieOptions = {
      // the same as the token expires
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
      ),
      // this will make it unaccessible from the browser
      httpOnly: true,
    };

    // send it in secure connection only (https)
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);
  };

  // middleware to check if the user is authenticated
  protect = async (req, res, next) => {
    try {
      let token;

      // get the token from request header
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
      ) {
        token = req.headers.authorization.split(' ')[1];
      }
      if (!token) {
        return next(
          new AppError(
            'You are not logged in! Please log in to get access.',
            401,
          ),
        );
      }

      // check if the user exists
      let { id, iat } = await this.verifyToken(token);
      const user = await User.findById(id);
      if (!user) {
        return next(
          new AppError(
            'The user belonging to this token does no longer exist.',
            401,
          ),
        );
      }

      // check if the user changed the password and the token is issued after user changing it
      if (user.checkChangedPassword(iat)) {
        return next(
          new AppError(
            'User changed the password, login again to get a new token.',
            401,
          ),
        );
      }

      req.user = user;

      next();
    } catch (error) {
      next(error);
    }
  };

  restrictTo = (...role) => {
    return (req, res, next) => {
      // this user we get from the prev middleware which is 'protect'
      const { user } = req;

      if (!role.includes(user.role)) {
        return next(
          new AppError(
            'You do not have the permission to perform this action.',
            403,
          ),
        );
      }
      next();
    };
  };

  forgotPassword = async (req, res, next) => {
    // get user based on the email
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return next(new AppError('there is no user with that email', 404));
    }
    // generate random reset token
    const passwordToken = user.createPasswordResetToken();

    try {
      // skip the validation step to store the reset passToken and the expireTime
      await user.save({ validateBeforeSave: false });

      // send it to the user's email
      const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${passwordToken}`;
      const email = new Email();

      const message = `If you forgot your password you can reset it from here: ${resetUrl} \nIf you not forgot it pleas ignore this email.`;
      await email.sendEmail({
        email: user.email,
        subject: 'Password reset token (valid for 10 min)',
        message,
      });

      res.status(200).json({
        status: 'success',
        message: 'Token was sent to email!',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        new AppError(
          'There was an error sending the email, try again later.',
          500,
        ),
      );
    }
  };

  resetPassword = async (req, res, next) => {
    try {
      // get user based on the token
      const { token } = req.params;
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      });

      // check if the user is exist and the token has not expired
      //  then set the new password
      if (!user) {
        return next(new AppError('The token is expired or invalid', 400));
      }
      // change the actual new password
      user.password = req.body.password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save();
      // send jwt token to the user
      const newToken = this.generateToken({ id: user._id });

      res.status(200).json({
        status: 'success',
        message: 'the password was reset successfully',
        token: newToken,
      });
    } catch (error) {
      next(error);
    }
  };

  updatePassword = async (req, res, next) => {
    try {
      const { password, newPassword } = req.body;

      // check for passwords
      if (!password || !newPassword)
        return next(
          new AppError(
            'Missing information you have to provide password and newPassword',
            400,
          ),
        );

      // this one we get from the protect middleware
      const { _id } = req.user;
      const user = await User.findById(_id).select('+password');

      // check if the password is correct
      if (!(await user.comparePassword(password, user.password))) {
        return next(new AppError('password is wrong!', 401));
      }

      user.password = newPassword;

      // do not forget that we have a middleware that take care of hashing the password for us
      await user.save();

      const token = this.generateToken({ id: user._id });
      res.status(200).json({
        status: 'success',
        message: 'Password updated successfully',
        token,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
