const config = require('../config/env');

/**
 * Global error handler middleware
 * Must be the last middleware registered in Express
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Prisma errors
  if (err.code === 'P2002') {
    statusCode = 409;
    const field = err.meta?.target?.[0] || 'field';
    message = `A record with this ${field} already exists.`;
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found.';
  } else if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Foreign key constraint failed.';
  } else if (err.code === 'P2016') {
    statusCode = 404;
    message = 'Record not found.';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired.';
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File is too large.';
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field.';
  }

  // Log in development
  if (config.env === 'development') {
    console.error(`❌ [${req.method}] ${req.path} → ${statusCode}: ${message}`);
    if (statusCode === 500) console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(config.env === 'development' && statusCode === 500 && { stack: err.stack }),
  });
};

/**
 * Handle 404 not found
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route ${req.method} ${req.path} not found.`,
  });
};

module.exports = { errorHandler, notFoundHandler };
