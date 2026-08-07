const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/apiResponse');

/**
 * verifyToken — JWT Authentication Middleware
 * Extracts the Bearer token from Authorization header,
 * verifies it, and attaches decoded payload to req.user.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 401, 'Access denied. No token provided.');
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return errorResponse(res, 401, 'Access denied. Token is malformed.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Token has expired. Please log in again.');
    }
    if (err.name === 'JsonWebTokenError') {
      return errorResponse(res, 401, 'Invalid token. Please log in again.');
    }
    return errorResponse(res, 500, 'Token verification failed.');
  }
};

module.exports = { verifyToken };
