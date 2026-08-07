/**
 * asyncHandler — wraps async route handlers to forward errors to Express
 * Eliminates repetitive try/catch blocks in every controller
 *
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
