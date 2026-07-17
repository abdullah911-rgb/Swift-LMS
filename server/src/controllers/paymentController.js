const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// ── Multer storage for payment screenshots ────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/payments');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `payment-${req.user.id}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  cb(null, allowed.includes(file.mimetype));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single('screenshot');

const paymentController = {

  // ── GET /api/payments/methods — public, get active payment methods ──────────
  getMethods: asyncHandler(async (req, res) => {
    const methods = await prisma.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    sendSuccess(res, 'Payment methods retrieved.', { methods });
  }),

  // ── ADMIN: GET /api/payments/admin/methods — all methods incl inactive ──────
  adminGetMethods: asyncHandler(async (req, res) => {
    const methods = await prisma.paymentMethod.findMany({ orderBy: { createdAt: 'asc' } });
    sendSuccess(res, 'Payment methods retrieved.', { methods });
  }),

  // ── ADMIN: POST /api/payments/admin/methods ───────────────────────────────
  createMethod: asyncHandler(async (req, res) => {
    const { type, title, accountName, accountNumber, instructions } = req.body;
    if (!type || !title || !accountName || !accountNumber) {
      return sendError(res, 'type, title, accountName and accountNumber are required.', 400);
    }
    const method = await prisma.paymentMethod.create({
      data: { type, title, accountName, accountNumber, instructions },
    });
    sendSuccess(res, 'Payment method created.', { method }, 201);
  }),

  // ── ADMIN: PUT /api/payments/admin/methods/:id ────────────────────────────
  updateMethod: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { type, title, accountName, accountNumber, instructions, isActive } = req.body;
    const method = await prisma.paymentMethod.update({
      where: { id },
      data: { type, title, accountName, accountNumber, instructions, isActive },
    });
    sendSuccess(res, 'Payment method updated.', { method });
  }),

  // ── ADMIN: DELETE /api/payments/admin/methods/:id ─────────────────────────
  deleteMethod: asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.paymentMethod.delete({ where: { id } });
    sendSuccess(res, 'Payment method deleted.');
  }),

  // ── STUDENT: POST /api/payments/request — submit payment proof ────────────
  submitRequest: asyncHandler(async (req, res) => {
    upload(req, res, async (err) => {
      if (err) return sendError(res, err.message || 'File upload failed.', 400);
      if (!req.file) return sendError(res, 'Payment screenshot is required.', 400);

      const { courseId, transactionRef } = req.body;
      const studentId = req.user.id;

      if (!courseId) return sendError(res, 'courseId is required.', 400);

      // Verify course exists and is paid
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) return sendError(res, 'Course not found.', 404);
      if (course.isFree) return sendError(res, 'This course is free — no payment needed.', 400);

      // Check if already enrolled
      const existing = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
      });
      if (existing) return sendError(res, 'You are already enrolled in this course.', 400);

      // Check if already has a pending/approved payment request
      const existingRequest = await prisma.paymentRequest.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
      });
      if (existingRequest) {
        if (existingRequest.status === 'PENDING') {
          return sendError(res, 'You already have a pending payment request for this course.', 400);
        }
        if (existingRequest.status === 'APPROVED') {
          return sendError(res, 'Your payment has already been approved.', 400);
        }
        // If REJECTED — allow resubmission by updating
        const screenshotUrl = `/uploads/payments/${req.file.filename}`;
        const updated = await prisma.paymentRequest.update({
          where: { id: existingRequest.id },
          data: {
            screenshotUrl,
            transactionRef: transactionRef || null,
            status: 'PENDING',
            rejectedNote: null,
            reviewedAt: null,
          },
        });
        // Notify admin
        await notifyAdmins(course, studentId, req.user.name);
        return sendSuccess(res, 'Payment request resubmitted successfully.', { request: updated }, 201);
      }

      const screenshotUrl = `/uploads/payments/${req.file.filename}`;
      const request = await prisma.paymentRequest.create({
        data: {
          studentId,
          courseId,
          amount: course.price,
          screenshotUrl,
          transactionRef: transactionRef || null,
        },
      });

      // Notify admin
      await notifyAdmins(course, studentId, req.user.name);

      sendSuccess(res, 'Payment request submitted. Admin will review it shortly.', { request }, 201);
    });
  }),

  // ── STUDENT: GET /api/payments/my-requests ────────────────────────────────
  getMyRequests: asyncHandler(async (req, res) => {
    const requests = await prisma.paymentRequest.findMany({
      where: { studentId: req.user.id },
      include: {
        course: { select: { id: true, title: true, thumbnail: true, price: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, 'Your payment requests retrieved.', { requests });
  }),

  // ── ADMIN: GET /api/payments/admin/requests ───────────────────────────────
  adminGetRequests: asyncHandler(async (req, res) => {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const requests = await prisma.paymentRequest.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, email: true, avatar: true } },
        course: { select: { id: true, title: true, price: true, thumbnail: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, 'Payment requests retrieved.', { requests });
  }),

  // ── ADMIN: PATCH /api/payments/admin/requests/:id/approve ────────────────
  approveRequest: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const request = await prisma.paymentRequest.findUnique({
      where: { id },
      include: { course: true, student: true },
    });
    if (!request) return sendError(res, 'Payment request not found.', 404);
    if (request.status !== 'PENDING') {
      return sendError(res, `Request is already ${request.status.toLowerCase()}.`, 400);
    }

    // Update request + create enrollment in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.paymentRequest.update({
        where: { id },
        data: { status: 'APPROVED', reviewedAt: new Date() },
      });

      // Create enrollment
      await tx.enrollment.upsert({
        where: { studentId_courseId: { studentId: request.studentId, courseId: request.courseId } },
        create: { studentId: request.studentId, courseId: request.courseId },
        update: { status: 'ACTIVE' },
      });

      // Notify student
      await tx.notification.create({
        data: {
          userId: request.studentId,
          title: '✅ Payment Approved — Enrollment Confirmed!',
          message: `Your payment for "${request.course.title}" has been verified. You're now enrolled!`,
          type: 'SUCCESS',
          link: `/student/my-courses`,
        },
      });
    });

    sendSuccess(res, 'Payment approved and student enrolled.');
  }),

  // ── ADMIN: PATCH /api/payments/admin/requests/:id/reject ─────────────────
  rejectRequest: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const request = await prisma.paymentRequest.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!request) return sendError(res, 'Payment request not found.', 404);
    if (request.status !== 'PENDING') {
      return sendError(res, `Request is already ${request.status.toLowerCase()}.`, 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.paymentRequest.update({
        where: { id },
        data: { status: 'REJECTED', rejectedNote: reason || null, reviewedAt: new Date() },
      });

      await tx.notification.create({
        data: {
          userId: request.studentId,
          title: '❌ Payment Not Verified',
          message: `Your payment for "${request.course.title}" was not verified${reason ? `: ${reason}` : '.'}. Please resubmit with a valid screenshot.`,
          type: 'ERROR',
          link: `/courses/${request.course.slug || request.courseId}`,
        },
      });
    });

    sendSuccess(res, 'Payment request rejected.');
  }),

  // ── ADMIN: GET /api/payments/admin/revenue ────────────────────────────────
  getRevenue: asyncHandler(async (req, res) => {
    const [totalResult, pendingCount, approvedRequests] = await Promise.all([
      // Total approved revenue
      prisma.paymentRequest.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true },
        _count: true,
      }),
      // Pending count
      prisma.paymentRequest.count({ where: { status: 'PENDING' } }),
      // All approved requests with course details (for monthly + course breakdown)
      prisma.paymentRequest.findMany({
        where: { status: 'APPROVED' },
        select: {
          id: true,
          amount: true,
          reviewedAt: true,
          courseId: true,
          course: { select: { id: true, title: true } },
        },
        orderBy: { reviewedAt: 'asc' },
      }),
    ]);

    // Build monthly revenue for the last 6 months using JS
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyMap = {};
    for (let i = 0; i <= 5; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      monthlyMap[key] = { month: `${monthNames[d.getMonth()]} ${d.getFullYear()}`, count: 0, revenue: 0 };
    }

    approvedRequests.forEach((r) => {
      if (!r.reviewedAt) return;
      const d = new Date(r.reviewedAt);
      if (d < sixMonthsAgo) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        monthlyMap[key].count += 1;
        monthlyMap[key].revenue += Number(r.amount || 0);
      }
    });
    const monthlyRevenue = Object.values(monthlyMap);

    // Build top courses breakdown using JS
    const courseMap = {};
    approvedRequests.forEach((r) => {
      const cid = r.courseId;
      if (!courseMap[cid]) {
        courseMap[cid] = {
          course_id: cid,
          title: r.course?.title || 'Unknown',
          enrollments: 0,
          revenue: 0,
        };
      }
      courseMap[cid].enrollments += 1;
      courseMap[cid].revenue += Number(r.amount || 0);
    });
    const topCourses = Object.values(courseMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    sendSuccess(res, 'Revenue data retrieved.', {
      totalRevenue: Number(totalResult._sum.amount || 0),
      totalApproved: totalResult._count,
      pendingCount,
      monthlyRevenue,
      topCourses,
    });
  }),
};

async function notifyAdmins(course, studentId, studentName) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    });
    if (!admins.length) return;
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        title: '💰 New Payment Request',
        message: `${studentName || 'A student'} submitted payment proof for "${course.title}". Review now.`,
        type: 'WARNING',
        link: '/admin/payments',
      })),
    });
  } catch (_) { /* non-critical */ }
}

module.exports = paymentController;
