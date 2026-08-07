const { errorResponse } = require('../utils/apiResponse');

/**
 * authorize — Role-Based Authorization Middleware Factory
 * Returns a middleware that only allows users with the specified roles.
 *
 * Usage: router.get('/admin-only', verifyToken, authorize('admin'), handler)
 *        router.get('/multi',      verifyToken, authorize('admin', 'teacher'), handler)
 *
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Authentication required.');
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        `Access denied. Required role(s): [${roles.join(', ')}]. Your role: ${req.user.role}`
      );
    }

    next();
  };
};

module.exports = { authorize };
