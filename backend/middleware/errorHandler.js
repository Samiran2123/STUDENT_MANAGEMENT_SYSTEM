/**
 * Centralized Error Handler Middleware
 * Must be registered LAST in Express middleware chain.
 * Catches all errors forwarded via next(err).
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // PostgreSQL unique violation
  if (err.code === '23505') {
    const field = err.detail?.match(/Key \((.+?)\)/)?.[1] || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
    });
  }

  // PostgreSQL not-null violation
  if (err.code === '23502') {
    const column = err.column || 'field';
    return res.status(400).json({
      success: false,
      message: `${column} cannot be null.`,
    });
  }

  // PostgreSQL check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      message: 'A constraint check failed. Please verify your input values.',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. ' + err.message,
    });
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: `File too large. Maximum allowed size is ${process.env.MAX_FILE_SIZE / 1024 / 1024}MB.`,
    });
  }

  // Multer unexpected field error
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field. Please check the field name.',
    });
  }

  // Express body parser errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body.',
    });
  }

  // Custom application errors (throw with statusCode)
  const statusCode = err.statusCode || err.status || 500;
  const message    = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler — register before errorHandler
 */
const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} — route not found.`,
  });
};

module.exports = { errorHandler, notFoundHandler };
