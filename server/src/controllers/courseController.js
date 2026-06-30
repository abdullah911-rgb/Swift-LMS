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
    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        instructor: { select: { id: true, name: true, avatar: true, bio: true } },
        modules: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              where: { isPublished: true },
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

    if (!course || course.status !== 'PUBLISHED') {
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
    const { title, description, shortDescription, categoryId, level, price, isFree, language, learningOutcomes, prerequisites, certificate } = req.body;
    const slug = slugify(title, { lower: true, strict: true }) + '-' + Date.now();
    const thumbnail = req.file ? `/uploads/${req.file.filename}` : null;

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description,
        shortDescription,
        thumbnail,
        categoryId,
        instructorId: req.user.id,
        level: level || 'BEGINNER',
        price: parseFloat(price) || 0,
        isFree: isFree === 'true' || isFree === true,
        language: language || 'English',
        learningOutcomes: learningOutcomes || [],
        prerequisites: prerequisites || [],
        certificate: certificate !== 'false',
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

    const { title, description, shortDescription, categoryId, level, price, isFree, language, status, learningOutcomes, prerequisites, certificate } = req.body;
    const data = {};
    if (title) { data.title = title; data.slug = slugify(title, { lower: true, strict: true }) + '-' + Date.now(); }
    if (description) data.description = description;
    if (shortDescription) data.shortDescription = shortDescription;
    if (categoryId) data.categoryId = categoryId;
    if (level) data.level = level;
    if (price !== undefined) data.price = parseFloat(price);
    if (isFree !== undefined) data.isFree = isFree === 'true' || isFree === true;
    if (language) data.language = language;
    if (status && req.user.role === 'ADMIN') data.status = status;
    if (learningOutcomes) data.learningOutcomes = learningOutcomes;
    if (prerequisites) data.prerequisites = prerequisites;
    if (certificate !== undefined) data.certificate = certificate !== 'false';
    if (req.file) data.thumbnail = `/uploads/${req.file.filename}`;

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
};

module.exports = courseController;
