/* eslint-disable no-undef */
import crypto from 'crypto';
import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User Name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Email is not valid!'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: 8,
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  photo: {
    type: String,
    default: 'no-photo.jpg',
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  changedPasswordTime: {
    type: Date,
    select: false,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = parseInt(process.env.HASH_SALT, 10) || 10;
    this.password = await bcrypt.hash(this.password, saltRounds);

    next();
  } catch (err) {
    next(err);
  }
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.changedPasswordTime = Date.now() - 1000;
  console.log(this.changedPasswordTime);
  next();
});

const activeFilterPlugin = (schema) => {
  const applyFilter = function (next) {
    this.find({ active: { $ne: false } });
    next();
  };

  schema.pre('find', applyFilter);
  schema.pre('findOne', applyFilter);
  schema.pre('findOneAndUpdate', applyFilter);
  schema.pre('count', applyFilter);
  schema.pre('countDocuments', applyFilter);
  schema.pre('updateMany', applyFilter);
};

// Usage
userSchema.plugin(activeFilterPlugin);

userSchema.methods.comparePassword = async function (pass, storedPass) {
  return await bcrypt.compare(pass, storedPass);
};

userSchema.methods.checkChangedPassword = function (JWTtime) {
  if (this.changedPasswordTime) {
    // change the changedPasswordTime from milliseconds to be in seconds as the JWT timeStamp is in seconds
    const changedTimeInSeconds = parseInt(
      this.changedPasswordTime.getTime() / 1000,
      10,
    );

    return JWTtime < changedTimeInSeconds;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

export default User;
