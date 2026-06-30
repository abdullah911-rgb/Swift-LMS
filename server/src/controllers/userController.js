const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const userController = {
  // GET /api/users/profile
  getProfile: asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, role: true,
        avatar: true, bio: true, phone: true, isVerified: true,
        isActive: true, createdAt: true,
        _count: { select: { enrollments: true, certificates: true } },
      },
    });
    sendSuccess(res, 'Profile fetched.', { user });
  }),

  // PUT /api/users/profile
  updateProfile: asyncHandler(async (req, res) => {
    const { name, bio, phone } = req.body;
    const data = {};
    if (name) data.name = name;
    if (bio !== undefined) data.bio = bio;
    if (phone !== undefined) data.phone = phone;
    if (req.file) data.avatar = `/uploads/${req.file.filename}`;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, name: true, email: true, role: true, avatar: true, bio: true, phone: true },
    });
    sendSuccess(res, 'Profile updated.', { user });
  }),

  // PUT /api/users/change-password
  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return sendError(res, 'Current password is incorrect.', 400);
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } });
    sendSuccess(res, 'Password changed. Please log in again.');
  }),

  // GET /api/users — Admin only
  getAllUsers: asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, role, search, isActive } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (role) where.role = role.toUpperCase();
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, role: true,
          avatar: true, isVerified: true, isActive: true, createdAt: true,
          _count: { select: { enrollments: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    sendSuccess(res, 'Users fetched.', {
      users,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  }),

  // PATCH /api/users/:id/status — Admin only
  toggleUserStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return sendError(res, 'User not found.', 404);
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, email: true, isActive: true },
    });
    sendSuccess(res, `User ${updated.isActive ? 'activated' : 'deactivated'}.`, { user: updated });
  }),

  // GET /api/users/notifications
  getNotifications: asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    sendSuccess(res, 'Notifications fetched.', { notifications });
  }),

  // PATCH /api/users/notifications/read-all
  markAllNotificationsRead: asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    sendSuccess(res, 'All notifications marked as read.');
  }),

  // PATCH /api/users/notifications/:id/read
  markNotificationRead: asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.notification.updateMany({
      where: { id, userId: req.user.id },
      data: { isRead: true },
    });
    sendSuccess(res, 'Notification marked as read.');
  }),
};

module.exports = userController;
