const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const slugify = require('slugify');

// Helper to build course where clause for public queries
const publicFilter = { status: 'PUBLISHED' };

const courseController = {
  // GET /api/courses — Public listing with filters & pagination
  getAll: asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 12,
      category,
      level,
      search,
      isFree,
      sort = 'createdAt',
      order = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { ...publicFilter };

    if (category) where.category = { slug: category };
    if (level) where.level = level.toUpperCase();
    if (isFree !== undefined) where.isFree = isFree === 'true';
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    const allowedSorts = ['createdAt', 'title', 'price', 'totalLessons'];
    const sortField = allowedSorts.includes(sort) ? sort : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortField]: sortOrder },
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          thumbnail: true,
          level: true,
          isFree: true,
          price: true,
          duration: true,
          durationInMonths: true,
          totalLessons: true,
          language: true,
          certificate: true,
          createdAt: true,
          category: { select: { id: true, name: true, slug: true } },
          instructor: { select: { id: true, name: true, avatar: true } },
          _count: { select: { enrollments: true } },
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

  // GET /api/courses/:slug — Public course detail
  getOne: asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    const course = await prisma.course.findUnique({
      where: isUuid ? { id: slug } : { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        instructor: { select: { id: true, name: true, avatar: true, bio: true } },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                type: true,
                duration: true,
                isFree: true,
                order: true,
              },
            },
          },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) {
      return sendError(res, 'Course not found.', 404);
    }

    const isStaff = req.user && (req.user.role === 'ADMIN' || (req.user.role === 'INSTRUCTOR' && course.instructorId === req.user.id));
    if (course.status !== 'PUBLISHED' && !isStaff) {
      return sendError(res, 'Course not found.', 404);
    }

    // Check if requesting user is enrolled
    let isEnrolled = false;
    if (req.user) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: req.user.id, courseId: course.id } },
      });
      isEnrolled = !!enrollment;
    }

    sendSuccess(res, 'Course fetched.', { course, isEnrolled });
  }),

  // GET /api/courses/featured — Featured courses for homepage
  getFeatured: asyncHandler(async (req, res) => {
    const courses = await prisma.course.findMany({
      where: publicFilter,
      take: 6,
      orderBy: { enrollments: { _count: 'desc' } },
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        thumbnail: true,
        level: true,
        isFree: true,
        price: true,
        duration: true,
        durationInMonths: true,
        totalLessons: true,
        certificate: true,
        category: { select: { id: true, name: true, slug: true } },
        instructor: { select: { id: true, name: true, avatar: true } },
        _count: { select: { enrollments: true } },
      },
    });
    sendSuccess(res, 'Featured courses fetched.', { courses });
  }),

  // GET /api/courses/stats — Platform statistics
  getStats: asyncHandler(async (req, res) => {
    const [totalCourses, totalStudents, totalInstructors, totalEnrollments] = await Promise.all([
      prisma.course.count({ where: publicFilter }),
      prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
      prisma.user.count({ where: { role: 'INSTRUCTOR', isActive: true } }),
      prisma.enrollment.count(),
    ]);
    sendSuccess(res, 'Stats fetched.', {
      stats: { totalCourses, totalStudents, totalInstructors, totalEnrollments },
    });
  }),

  // ── Instructor / Admin course management ────────────────────────────────

  // POST /api/courses
  create: asyncHandler(async (req, res) => {
    const { title, description, shortDescription, categoryId, level, price, isFree, language, learningOutcomes, prerequisites, certificate, durationInMonths, instructorId } = req.body;
    const slug = slugify(title, { lower: true, strict: true }) + '-' + Date.now();
    const thumbnail = req.file ? `/uploads/${req.file.filename}` : null;

    const targetInstructorId = (req.user.role === 'ADMIN' && instructorId) ? instructorId : req.user.id;

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description,
        shortDescription,
        thumbnail,
        categoryId,
        instructorId: targetInstructorId,
        level: level || 'BEGINNER',
        price: parseFloat(price) || 0,
        isFree: isFree === 'true' || isFree === true,
        durationInMonths: parseInt(durationInMonths, 10) || 2,
        language: language || 'English',
        learningOutcomes: learningOutcomes || [],
        prerequisites: prerequisites || [],
        certificate: certificate !== 'false',
        status: 'DRAFT',
        pendingApproval: false,
      },
      include: { category: true, instructor: { select: { id: true, name: true } } },
    });

    sendSuccess(res, 'Course created successfully.', { course }, 201);
  }),

  // PUT /api/courses/:id
  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return sendError(res, 'Course not found.', 404);

    // Instructors can only edit their own courses
    if (req.user.role === 'INSTRUCTOR' && course.instructorId !== req.user.id) {
      return sendError(res, 'You are not authorized to edit this course.', 403);
    }

    const { title, description, shortDescription, categoryId, level, price, isFree, language, status, learningOutcomes, prerequisites, certificate, durationInMonths, instructorId } = req.body;
    const data = {};

    // Instructors can only update details; changes go into pendingEdits for admin review
    if (req.user.role === 'INSTRUCTOR') {
      // Store proposed edits — admin will review and apply
      const pendingEdits = {};
      if (title) { pendingEdits.title = title; pendingEdits.slug = slugify(title, { lower: true, strict: true }) + '-' + Date.now(); }
      if (description) pendingEdits.description = description;
      if (shortDescription) pendingEdits.shortDescription = shortDescription;
      if (categoryId) pendingEdits.categoryId = categoryId;
      if (level) pendingEdits.level = level;
      if (price !== undefined) pendingEdits.price = parseFloat(price);
      if (isFree !== undefined) pendingEdits.isFree = isFree === 'true' || isFree === true;
      if (durationInMonths !== undefined) pendingEdits.durationInMonths = parseInt(durationInMonths, 10);
      if (language) pendingEdits.language = language;
      if (learningOutcomes) pendingEdits.learningOutcomes = learningOutcomes;
      if (prerequisites) pendingEdits.prerequisites = prerequisites;
      if (certificate !== undefined) pendingEdits.certificate = certificate !== 'false';
      if (req.file) pendingEdits.thumbnail = `/uploads/${req.file.filename}`;

      const updated = await prisma.course.update({
        where: { id },
        data: { pendingEdits, pendingApproval: true },
        include: { category: true },
      });
      return sendSuccess(res, 'Edit request submitted for admin approval.', { course: updated });
    }

    // Admin can update directly
    if (title) { data.title = title; data.slug = slugify(title, { lower: true, strict: true }) + '-' + Date.now(); }
    if (description) data.description = description;
    if (shortDescription) data.shortDescription = shortDescription;
    if (categoryId) data.categoryId = categoryId;
    if (level) data.level = level;
    if (price !== undefined) data.price = parseFloat(price);
    if (isFree !== undefined) data.isFree = isFree === 'true' || isFree === true;
    if (durationInMonths !== undefined) data.durationInMonths = parseInt(durationInMonths, 10);
    if (language) data.language = language;
    if (status) data.status = status;
    if (learningOutcomes) data.learningOutcomes = learningOutcomes;
    if (prerequisites) data.prerequisites = prerequisites;
    if (certificate !== undefined) data.certificate = certificate !== 'false';
    if (req.file) data.thumbnail = `/uploads/${req.file.filename}`;
    if (req.user.role === 'ADMIN' && instructorId) data.instructorId = instructorId;

    const updated = await prisma.course.update({ where: { id }, data, include: { category: true } });
    sendSuccess(res, 'Course updated.', { course: updated });
  }),

  // PATCH /api/courses/:id/publish (Admin only)
  togglePublish: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return sendError(res, 'Course not found.', 404);
    const newStatus = course.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    const updated = await prisma.course.update({ where: { id }, data: { status: newStatus } });
    sendSuccess(res, `Course ${newStatus === 'PUBLISHED' ? 'published' : 'unpublished'}.`, { course: updated });
  }),

  // DELETE /api/courses/:id
  delete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return sendError(res, 'Course not found.', 404);
    if (req.user.role === 'INSTRUCTOR' && course.instructorId !== req.user.id) {
      return sendError(res, 'Not authorized.', 403);
    }
    await prisma.course.update({ where: { id }, data: { status: 'ARCHIVED' } });
    sendSuccess(res, 'Course archived.');
  }),

  // PATCH /api/courses/:id/submit-approval (Instructor) — submit new course for admin approval
  submitForApproval: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return sendError(res, 'Course not found.', 404);
    if (course.instructorId !== req.user.id) return sendError(res, 'Not authorized.', 403);
    if (course.pendingApproval) return sendError(res, 'Course is already pending approval.', 400);

    const updated = await prisma.course.update({
      where: { id },
      data: { pendingApproval: true },
    });
    sendSuccess(res, 'Course submitted for admin approval.', { course: updated });
  }),

  // PATCH /api/courses/:id/approve (Admin) — approve a course/edits and publish
  approveCourse: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return sendError(res, 'Course not found.', 404);

    // Apply any pending edits
    const dataToApply = course.pendingEdits || {};
    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...dataToApply,
        pendingApproval: false,
        pendingEdits: null,
        status: 'PUBLISHED',
      },
    });
    sendSuccess(res, 'Course approved and published.', { course: updated });
  }),

  // PATCH /api/courses/:id/reject (Admin) — reject a pending approval
  rejectCourse: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return sendError(res, 'Course not found.', 404);

    const updated = await prisma.course.update({
      where: { id },
      data: {
        pendingApproval: false,
        pendingEdits: null,
        // Keep status as DRAFT, store rejection reason in pendingEdits field temporarily
        pendingEdits: reason ? { rejectionReason: reason } : null,
      },
    });
    sendSuccess(res, 'Course rejected.', { course: updated });
  }),

  // GET /api/courses/admin/pending — Admin: list all pending approval courses
  getPendingApproval: asyncHandler(async (req, res) => {
    const courses = await prisma.course.findMany({
      where: { pendingApproval: true },
      include: {
        category: { select: { name: true } },
        instructor: { select: { id: true, name: true, email: true, avatar: true } },
        _count: { select: { enrollments: true, modules: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    sendSuccess(res, 'Pending courses fetched.', { courses });
  }),

  // GET /api/courses/instructor/my-courses
  getInstructorCourses: asyncHandler(async (req, res) => {
    const courses = await prisma.course.findMany({
      where: { instructorId: req.user.id },
      include: {
        category: { select: { name: true, slug: true } },
        _count: { select: { enrollments: true, modules: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, 'Instructor courses fetched.', { courses });
  }),

  // ── Announcements ─────────────────────────────────────────────────────────

  // GET /api/courses/:id/announcements — Instructor views all announcements for their course
  getCourseAnnouncements: asyncHandler(async (req, res) => {
    const { id: courseId } = req.params;

    const course = await prisma.course.findFirst({
      where: { id: courseId, instructorId: req.user.id },
    });
    if (!course) return sendError(res, 'Course not found or not authorized.', 404);

    const announcements = await prisma.announcement.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, body: true, isPublished: true, createdAt: true },
    });

    sendSuccess(res, 'Announcements fetched.', { announcements });
  }),

  // POST /api/courses/:id/announcements — Instructor creates a course announcement
  createCourseAnnouncement: asyncHandler(async (req, res) => {
    const { id: courseId } = req.params;
    const { title, body } = req.body;

    if (!title || !body) return sendError(res, 'Title and body are required.', 400);

    const course = await prisma.course.findFirst({
      where: { id: courseId, instructorId: req.user.id },
    });
    if (!course) return sendError(res, 'Course not found or not authorized.', 404);

    const announcement = await prisma.announcement.create({
      data: {
        title,
        body,
        authorId: req.user.id,
        courseId,
        isPublished: true,
      },
    });

    // Notify all enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId, status: 'ACTIVE' },
      select: { studentId: true },
    });

    if (enrollments.length > 0) {
      await prisma.notification.createMany({
        data: enrollments.map((e) => ({
          userId: e.studentId,
          title: `📢 New Announcement: ${title}`,
          message: `Your instructor posted a new announcement in "${course.title}". Check the Announcements tab.`,
          type: 'INFO',
          link: `/student/course/${courseId}`,
        })),
      });
    }

    sendSuccess(res, 'Announcement published and students notified.', { announcement }, 201);
  }),

  // DELETE /api/courses/:courseId/announcements/:announcementId
  deleteCourseAnnouncement: asyncHandler(async (req, res) => {
    const { courseId, announcementId } = req.params;

    const announcement = await prisma.announcement.findFirst({
      where: { id: announcementId, courseId, authorId: req.user.id },
    });
    if (!announcement) return sendError(res, 'Announcement not found or not authorized.', 404);

    await prisma.announcement.delete({ where: { id: announcementId } });
    sendSuccess(res, 'Announcement deleted.');
  }),
};

module.exports = courseController;

