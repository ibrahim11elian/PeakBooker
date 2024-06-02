/* eslint-disable no-undef */
import AppError from '../utils/error.js';
import logger from '../utils/logger.js';

export default function (err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Create a new error object, preserving the prototype chain
    // this is used as spread operator as well as Object.assign did not work for prototype chain
    let error = Object.create(
      Object.getPrototypeOf(err),
      Object.getOwnPropertyDescriptors(err),
    );

    if (error.name === 'CastError') error = handleCastError(error);
    if (error.name === 'ValidationError') error = handleValidationError(error);
    // this error is specific to mongo not to mongoose so i need to extract the code of duplicate error from the massage
    if (error.message.match(/E11000/g)) error = handleDuplicateFieldsDB(error);
    if (error.code === 16755) error = handleGeoKeysError(); // also mongo error (Geo keys error)
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError')
      error = handleTokenExpiredError(error);

    sendErrorProd(error, res);
  }
}

function sendErrorDev(err, res) {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
}

function sendErrorProd(err, res) {
  // trusted errors
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // unknown errors: don't leak errors details
  } else {
    // log error for log files
    logger.error('Error 💥:', err);
    // send generic error
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
}

function handleCastError(error) {
  const message = `Invalid ${error.path}: ${error.value}`;

  return new AppError(message, 400);
}

function handleValidationError(error) {
  return new AppError(error.message, 400);
}

function handleDuplicateFieldsDB(err) {
  // Extract the duplicate keys and values from the error message
  const matches = err.message.match(/dup key: {([^}]+)}/);
  const fields = matches[1].split(',').map((field) => field.trim());

  // Construct a dynamic error message
  const fieldMessages = fields.map((field) => {
    const [key, value] = field.split(':').map((part) => part.trim());
    return `${key}: ${value}`;
  });

  const message = `Duplicate field value(s): ${fieldMessages.join(', ')}. Please use another value(s)!`;
  return new AppError(message, 400);
}

function handleJWTError() {
  return new AppError('Invalid token.', 401);
}

function handleTokenExpiredError() {
  return new AppError('Token has expired.', 401);
}

function handleGeoKeysError() {
  // Construct a dynamic error message
  const message = `Invalid geo keys. Point must be an array or object with the correct format.`;

  return new AppError(message, 400);
}
