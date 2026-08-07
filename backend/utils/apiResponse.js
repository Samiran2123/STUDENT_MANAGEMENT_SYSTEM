/**
 * Standardized API Response Helpers
 * Ensures every response follows the same shape:
 *  { success, message, data?, pagination? }
 */

/**
 * Send a success response
 * @param {Object}  res        - Express response object
 * @param {number}  statusCode - HTTP status code (default 200)
 * @param {string}  message    - Human-readable message
 * @param {*}       data       - Response payload
 * @param {Object}  pagination - Optional pagination metadata
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = null, pagination = null) => {
  const response = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(pagination && { pagination }),
  };
  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {Object}  res        - Express response object
 * @param {number}  statusCode - HTTP status code
 * @param {string}  message    - Error message
 * @param {*}       errors     - Optional validation errors
 */
const errorResponse = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  const response = {
    success: false,
    message,
    ...(errors && { errors }),
  };
  return res.status(statusCode).json(response);
};

/**
 * Send a created (201) response
 */
const createdResponse = (res, message = 'Created successfully', data = null) => {
  return successResponse(res, 201, message, data);
};

/**
 * Send a no-content (204) response
 */
const noContentResponse = (res) => {
  return res.status(204).send();
};

module.exports = {
  successResponse,
  errorResponse,
  createdResponse,
  noContentResponse,
};
