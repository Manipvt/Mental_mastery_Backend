const logger = require('../config/logger');
const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err);

  // PostgreSQL duplicate key error
  if (err.code === '23505') {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // PostgreSQL foreign key constraint error
  if (err.code === '23503') {
    const message = 'Referenced resource not found';
    error = new ErrorResponse(message, 404);
  }

  // PostgreSQL not-null violation
  if (err.code === '23502') {
    const message = 'Required field is missing';
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;