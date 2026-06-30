const { sendError } = require('../utils/apiResponse');

/**
 * Middleware factory for role-based access control
 * @param {...string} roles - Allowed roles e.g. requireRole('ADMIN', 'INSTRUCTOR')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required role: ${roles.join(' or ')}.`,
        403
      );
    }
    next();
  };
};

/**
 * Check if user's email is verified
 */
const requireVerified = (req, res, next) => {
  if (!req.user) return sendError(res, 'Authentication required.', 401);
  if (!req.user.isVerified) {
    return sendError(res, 'Please verify your email address to continue.', 403);
  }
  next();
};

module.exports = { requireRole, requireVerified };
