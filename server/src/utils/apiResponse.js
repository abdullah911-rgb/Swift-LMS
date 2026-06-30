/**
 * Standardized API response helper
 */
class ApiResponse {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {*} data
   */
  constructor(statusCode, message, data = null) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    if (data !== null) this.data = data;
  }
}

/**
 * Send a success response
 */
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json(new ApiResponse(statusCode, message, data));
};

/**
 * Send an error response
 */
const sendError = (res, message, statusCode = 400, errors = null) => {
  const response = new ApiResponse(statusCode, message);
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

module.exports = { ApiResponse, sendSuccess, sendError };
