const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

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
          _count: { select: { enrollments: true, courses: true } },
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

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return sendError(res, 'User not found.', 404);

    // Reassign / clean up instructor's owned resources before deleting the user
    if (user.role === 'INSTRUCTOR') {
      // Delete zoom meetings (non-cascaded, instructorId is non-nullable on ZoomMeeting)
      await prisma.zoomMeeting.deleteMany({ where: { instructorId: id } });

      // Delete assignments (non-cascaded, instructorId is non-nullable on Assignment)
      await prisma.assignment.deleteMany({ where: { instructorId: id } });

      // Reassign courses to admin executing deletion (instructorId stays valid & non-null)
      await prisma.course.updateMany({
        where: { instructorId: id },
        data: { instructorId: req.user.id },
      });
    }

    // Reassign authored announcements (non-cascade, authorId non-nullable)
    await prisma.announcement.updateMany({
      where: { authorId: id },
      data: { authorId: req.user.id },
    });

    await prisma.platformAnnouncement.updateMany({
      where: { authorId: id },
      data: { authorId: req.user.id },
    });

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

    // Enrich each enrollment with payment amount, certificate status, and dynamic eligibility
    const enriched = await Promise.all(
      enrollments.map(async (enr) => {
        const payment = await prisma.paymentRequest.findUnique({
          where: { studentId_courseId: { studentId: enr.studentId, courseId: enr.courseId } },
          select: { amount: true, status: true },
        });

        const certificate = await prisma.certificate.findUnique({
          where: { studentId_courseId: { studentId: enr.studentId, courseId: enr.courseId } },
          select: { id: true },
        });

        // Determine dynamic eligibility vs admin override:
        // 1. Admin explicitly granted -> eligible (true)
        // 2. Admin explicitly revoked -> ineligible (false)
        // 3. Dynamic: Student completed or has certificate OR progress === 100
        let isEligible = false;
        let override = null; // 'GRANTED' | 'REVOKED' | null

        if (certificate || enr.status === 'COMPLETED') {
          isEligible = true;
        } else if (enr.certificateEligible === true) {
          isEligible = true;
          override = 'GRANTED';
        } else if (enr.certificateEligible === false) {
          isEligible = false;
          override = 'REVOKED';
        } else {
          // Dynamic calculation: eligible only if course progress is 100% and not dropped
          isEligible = enr.progress >= 100 && enr.status !== 'DROPPED';
        }

        return {
          ...enr,
          paymentAmount: payment?.amount ? Number(payment.amount) : null,
          paymentStatus: payment?.status || null,
          hasCertificate: !!certificate,
          isEligible,
          override,
        };
      })
    );

    sendSuccess(res, 'Enrollments fetched.', { enrollments: enriched });
  }),

  // PATCH /api/admin/enrollments/:enrollmentId/eligibility — Toggle or set certificate eligibility
  toggleCertEligibility: asyncHandler(async (req, res) => {
    const { enrollmentId } = req.params;
    const { certificateEligible } = req.body; // true | false | null (or omitted to cycle)

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    });

    if (!enrollment) return sendError(res, 'Enrollment not found.', 404);

    // Determine next value
    let nextValue;
    if (typeof certificateEligible === 'boolean' || certificateEligible === null) {
      nextValue = certificateEligible;
    } else {
      // Cycle: if null -> true, if true -> false, if false -> null
      if (enrollment.certificateEligible === true) {
        nextValue = false;
      } else if (enrollment.certificateEligible === false) {
        nextValue = null;
      } else {
        nextValue = true;
      }
    }

    const updated = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { certificateEligible: nextValue },
    });

    // Notify student if explicitly granted or revoked
    if (nextValue === true) {
      await prisma.notification.create({
        data: {
          userId: enrollment.studentId,
          title: '🎓 Certificate Eligibility Granted',
          message: `The administrator has granted you certificate eligibility for "${enrollment.course.title}". You can now proceed to the final assessment.`,
          type: 'SUCCESS',
          link: `/student/course/${enrollment.courseId}`,
        },
      }).catch(() => {});
    } else if (nextValue === false) {
      await prisma.notification.create({
        data: {
          userId: enrollment.studentId,
          title: '⚠️ Certificate Eligibility Revoked',
          message: `Your certificate eligibility for "${enrollment.course.title}" has been placed on hold by the administrator.`,
          type: 'WARNING',
          link: `/student/course/${enrollment.courseId}`,
        },
      }).catch(() => {});
    }

    const isEligible = nextValue === true ? true : nextValue === false ? false : updated.progress >= 100;
    const override = nextValue === true ? 'GRANTED' : nextValue === false ? 'REVOKED' : null;

    sendSuccess(res, 'Certificate eligibility updated successfully.', {
      enrollment: {
        ...updated,
        isEligible,
        override,
      },
    });
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
        _count: { select: { courses: true } },
      },
    });
    sendSuccess(res, 'Pending instructors fetched.', { instructors: pending });
  }),

  // POST /api/admin/instructors — Admin creates an instructor account
  createInstructor: asyncHandler(async (req, res) => {
    const { name, email, password, phone, bio } = req.body;
    if (!name || !email || !password) {
      return sendError(res, 'Name, email, and password are required.', 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return sendError(res, 'An account with this email already exists.', 409);

    const hashed = await bcrypt.hash(password, 12);
    const instructor = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: 'INSTRUCTOR',
        isActive: true,
        isVerified: true,
        instructorApproval: 'APPROVED',
        phone: phone || null,
        bio: bio || null,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, phone: true, createdAt: true },
    });

    // Send credentials email to instructor
    try {
      await sendEmail({
        to: email,
        subject: 'Your Instructor Account — Swift Institute of Safety & Technology',
        html: `
          <!DOCTYPE html>
          <html>
          <body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
              <tr><td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                  <tr>
                    <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:32px;text-align:center;">
                      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Swift Institute of Safety &amp; Technology</h1>
                      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Building Safer Workplaces Through Knowledge &amp; Training</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px 48px;">
                      <h2 style="color:#1e293b;margin:0 0 16px;font-size:22px;">Welcome, ${name}!</h2>
                      <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 24px;">
                        An instructor account has been created for you on the Swift LMS platform. Here are your login credentials:
                      </p>
                      <div style="background:#f1f5ff;border:2px dashed #3b82f6;border-radius:12px;padding:24px;margin:24px 0;">
                        <p style="color:#1e293b;font-size:14px;margin:0 0 8px;"><strong>Email:</strong> ${email}</p>
                        <p style="color:#1e293b;font-size:14px;margin:0;"><strong>Password:</strong> ${password}</p>
                      </div>
                      <p style="color:#94a3b8;font-size:13px;margin:24px 0 0;">Please log in and change your password immediately for security.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#f8fafc;padding:20px 48px;border-top:1px solid #e2e8f0;">
                      <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">Swift Institute of Safety &amp; Technology – Building Safer Workplaces Through Knowledge &amp; Training</p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `,
        text: `Welcome ${name}! Your instructor account has been created. Email: ${email} | Password: ${password}. Please login and change your password.`,
      });
    } catch (emailErr) {
      console.error('Failed to send instructor credentials email:', emailErr.message);
    }

    sendSuccess(res, 'Instructor account created successfully. Credentials emailed to instructor.', { instructor }, 201);
  }),

  // PATCH /api/admin/instructors/:id/assign-course — Assign a course to an instructor
  assignCourse: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { courseId } = req.body;
    if (!courseId) return sendError(res, 'courseId is required.', 400);

    const instructor = await prisma.user.findUnique({ where: { id } });
    if (!instructor || instructor.role !== 'INSTRUCTOR') {
      return sendError(res, 'Instructor not found.', 404);
    }
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return sendError(res, 'Course not found.', 404);

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: { instructorId: id },
      include: { instructor: { select: { id: true, name: true, email: true } } },
    });

    sendSuccess(res, 'Course assigned to instructor successfully.', { course: updated });
  }),

  // PATCH /api/admin/courses/:courseId/reassign-instructor — Reassign an unassigned course to an instructor
  reassignCourseInstructor: asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { instructorId } = req.body;
    if (!instructorId) return sendError(res, 'instructorId is required.', 400);

    const instructor = await prisma.user.findUnique({ where: { id: instructorId } });
    if (!instructor || instructor.role !== 'INSTRUCTOR') {
      return sendError(res, 'Instructor not found.', 404);
    }
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return sendError(res, 'Course not found.', 404);

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: { instructorId },
      include: { instructor: { select: { id: true, name: true, email: true } } },
    });

    sendSuccess(res, 'Course reassigned to instructor successfully.', { course: updated });
  }),

  // PATCH /api/admin/courses/:courseId/unassign — Unassign a course from an instructor (assigns back to Admin)
  unassignCourse: asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const adminId = req.user.id;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return sendError(res, 'Course not found.', 404);

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: { instructorId: adminId },
      include: { instructor: { select: { id: true, name: true, email: true, role: true } } },
    });

    sendSuccess(res, 'Course unassigned from instructor successfully.', { course: updated });
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

  // PATCH /api/admin/enrollments/:studentId/:courseId/reactivate — Reactivate a dropped enrollment
  reactivateEnrollment: asyncHandler(async (req, res) => {
    const { studentId, courseId } = req.params;
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (!enrollment) return sendError(res, 'Enrollment not found.', 404);

    const updated = await prisma.enrollment.update({
      where: { studentId_courseId: { studentId, courseId } },
      data: { status: 'ACTIVE' },
    });

    await prisma.notification.create({
      data: {
        userId: studentId,
        title: 'Enrollment Reactivated',
        message: 'Your course enrollment has been reactivated by the admin. You now have access to the course.',
        type: 'SUCCESS',
        link: '/student/my-courses',
      },
    });

    sendSuccess(res, 'Enrollment reactivated successfully.', { enrollment: updated });
  }),

  // GET /api/admin/attendance/:courseId — Get attendance summary for a course
  getCourseAttendance: asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const meetings = await prisma.zoomMeeting.findMany({
      where: { courseId, status: { in: ['ENDED', 'LIVE'] } },
      select: { id: true },
    });

    const totalMeetings = meetings.length;
    if (totalMeetings === 0) {
      return sendSuccess(res, 'No ended meetings for this course yet.', { students: [], totalMeetings: 0 });
    }

    const meetingIds = meetings.map((m) => m.id);

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId, status: 'ACTIVE' },
      include: { student: { select: { id: true, name: true, email: true } } },
    });

    const attendanceCounts = await prisma.attendance.groupBy({
      by: ['studentId'],
      where: { meetingId: { in: meetingIds } },
      _count: { meetingId: true },
    });

    const countMap = {};
    attendanceCounts.forEach((a) => { countMap[a.studentId] = a._count.meetingId; });

    const students = enrollments.map((e) => {
      const attended = countMap[e.studentId] || 0;
      const percentage = totalMeetings > 0 ? Math.round((attended / totalMeetings) * 100) : 0;
      return {
        studentId: e.studentId,
        name: e.student.name,
        email: e.student.email,
        attended,
        totalMeetings,
        percentage,
        belowThreshold: percentage < 80,
      };
    });

    sendSuccess(res, 'Attendance summary fetched.', { students, totalMeetings });
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
