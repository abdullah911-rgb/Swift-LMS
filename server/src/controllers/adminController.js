const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const adminController = {
  // GET /api/admin/stats — Platform-wide statistics
  getStats: asyncHandler(async (req, res) => {
    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalCourses,
      publishedCourses,
      pendingCourses,
      totalEnrollments,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
      prisma.user.count({ where: { role: 'INSTRUCTOR', isActive: true } }),
      prisma.course.count({ where: { status: { not: 'ARCHIVED' } } }),
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
      prisma.course.count({ where: { pendingApproval: true } }),
      prisma.enrollment.count(),
      prisma.course.aggregate({ _sum: { price: true }, where: { status: 'PUBLISHED' } }),
    ]);

    sendSuccess(res, 'Admin stats fetched.', {
      stats: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalCourses,
        publishedCourses,
        pendingCourses,
        totalEnrollments,
        totalRevenue: totalRevenue._sum.price || 0,
      },
    });
  }),

  // GET /api/admin/users — List all users with filters
  getUsers: asyncHandler(async (req, res) => {
    const { role, search, page = 1, limit = 20, isActive } = req.query;
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
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          _count: { select: { enrollments: true, instructorCourses: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    sendSuccess(res, 'Users fetched.', {
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  }),

  // PATCH /api/admin/users/:id/toggle-active — Toggle user active status
  toggleUserActive: asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (id === req.user.id) return sendError(res, 'Cannot deactivate yourself.', 400);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return sendError(res, 'User not found.', 404);
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, email: true, isActive: true, role: true },
    });
    sendSuccess(res, `User ${updated.isActive ? 'activated' : 'deactivated'}.`, { user: updated });
  }),

  // PATCH /api/admin/users/:id/role — Change user role
  changeUserRole: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(role)) {
      return sendError(res, 'Invalid role.', 400);
    }
    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    sendSuccess(res, 'User role updated.', { user: updated });
  }),

  // DELETE /api/admin/users/:id — Delete a user
  deleteUser: asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (id === req.user.id) return sendError(res, 'Cannot delete yourself.', 400);
    await prisma.user.delete({ where: { id } });
    sendSuccess(res, 'User deleted.');
  }),

  // GET /api/admin/courses — All courses with full info
  getAllCourses: asyncHandler(async (req, res) => {
    const { status, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status.toUpperCase();
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { instructor: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { name: true } },
          instructor: { select: { id: true, name: true, avatar: true } },
          _count: { select: { enrollments: true, modules: true } },
        },
      }),
      prisma.course.count({ where }),
    ]);

    sendSuccess(res, 'Courses fetched.', {
      courses,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  }),

  // GET /api/admin/enrollments — Recent enrollments
  getRecentEnrollments: asyncHandler(async (req, res) => {
    const enrollments = await prisma.enrollment.findMany({
      take: 50,
      orderBy: { enrolledAt: 'desc' },
      include: {
        student: { select: { id: true, name: true, email: true, avatar: true } },
        course: { select: { id: true, title: true, instructor: { select: { name: true } } } },
      },
    });
    sendSuccess(res, 'Enrollments fetched.', { enrollments });
  }),

  // GET /api/admin/instructors/pending — List all pending instructors
  getPendingInstructors: asyncHandler(async (req, res) => {
    const pending = await prisma.user.findMany({
      where: { role: 'INSTRUCTOR', instructorApproval: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });
    sendSuccess(res, 'Pending instructors fetched.', { instructors: pending });
  }),

  // PATCH /api/admin/instructors/:id/approve — Approve instructor
  approveInstructor: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== 'INSTRUCTOR') {
      return sendError(res, 'Instructor not found.', 404);
    }
    const updated = await prisma.user.update({
      where: { id },
      data: { instructorApproval: 'APPROVED', isActive: true },
    });
    sendSuccess(res, 'Instructor approved successfully.', { user: updated });
  }),

  // PATCH /api/admin/instructors/:id/reject — Reject instructor
  rejectInstructor: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== 'INSTRUCTOR') {
      return sendError(res, 'Instructor not found.', 404);
    }
    const updated = await prisma.user.update({
      where: { id },
      data: { instructorApproval: 'REJECTED', isActive: false, instructorRejectedNote: reason || null },
    });
    sendSuccess(res, 'Instructor registration rejected.', { user: updated });
  }),

  // GET /api/admin/instructors — List all instructors with courses and enrollment counts
  getInstructors: asyncHandler(async (req, res) => {
    const instructors = await prisma.user.findMany({
      where: { role: 'INSTRUCTOR' },
      include: {
        courses: {
          where: { status: { not: 'ARCHIVED' } },
          include: {
            category: { select: { name: true } },
            _count: { select: { enrollments: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, 'Instructors fetched successfully.', { instructors });
  }),

  // POST /api/admin/announcements — Create platform announcement
  createAnnouncement: asyncHandler(async (req, res) => {
    const { title, body, type, target, expiresAt } = req.body;
    if (!title || !body) return sendError(res, 'Title and body are required.', 400);

    const announcement = await prisma.platformAnnouncement.create({
      data: {
        title,
        body,
        type: type || 'INFO',
        target: target || 'ALL',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        authorId: req.user.id,
      },
    });
    sendSuccess(res, 'Announcement created successfully.', { announcement }, 201);
  }),

  // GET /api/admin/announcements — List all platform announcements (admin view)
  getAnnouncements: asyncHandler(async (req, res) => {
    const announcements = await prisma.platformAnnouncement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { name: true } },
      },
    });
    sendSuccess(res, 'Announcements fetched.', { announcements });
  }),

  // DELETE /api/admin/announcements/:id — Delete platform announcement
  deleteAnnouncement: asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.platformAnnouncement.delete({ where: { id } });
    sendSuccess(res, 'Announcement deleted successfully.');
  }),

  // GET /api/admin/announcements/active — Get active announcements for banners
  getActiveAnnouncements: asyncHandler(async (req, res) => {
    const now = new Date();
    const announcements = await prisma.platformAnnouncement.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, 'Active announcements fetched.', { announcements });
  }),
};

module.exports = adminController;
