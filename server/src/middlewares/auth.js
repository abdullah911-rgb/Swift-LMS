const { verifyAccessToken } = require('../utils/generateToken');
const { sendError } = require('../utils/apiResponse');
const prisma = require('../config/db');

/**
 * Authenticate request using JWT access token from Authorization header
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isVerified: true,
        isActive: true,
      },
    });

    if (!user) return sendError(res, 'User not found.', 401);
    if (!user.isActive) return sendError(res, 'Account has been deactivated.', 403);

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Access token expired.', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid access token.', 401);
    }
    next(err);
  }
};

/**
 * Optionally authenticate — attaches user if token present, continues if not
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, isVerified: true, isActive: true },
    });
    req.user = user && user.isActive ? user : null;
    next();
  } catch {
    req.user = null;
    next();
  }
};

module.exports = { requireAuth, optionalAuth };
