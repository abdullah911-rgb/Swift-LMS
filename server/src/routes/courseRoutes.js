const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { requireAuth } = require('../middlewares/auth');
const { optionalAuth } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roles');
const { uploadImage } = require('../middlewares/upload');

// Public routes
router.get('/stats', courseController.getStats);
router.get('/featured', courseController.getFeatured);

// Temporary public route to update database thumbnails
const prisma = require('../config/db');
router.get('/admin/update-thumbnails-temp', async (req, res) => {
  try {
    const mappings = [
      { keywords: ['nebosh', 'safety officer'], file: '/uploads/nebosh.jfif' },
      { keywords: ['iosh'], file: '/uploads/iosh-safety-training.jfif' },
      { keywords: ['confined space', 'height'], file: '/uploads/confined-space-safety-work-at-height.jfif' },
      { keywords: ['basic computer', 'ms office'], file: '/uploads/basic-computer-ms-office.jfif' },
      { keywords: ['digital marketing'], file: '/uploads/digital-marketing-professional.jfif' },
      { keywords: ['graphic design', 'media'], file: '/uploads/graphic-design-media.jfif' },
      { keywords: ['english speaking', 'english language'], file: '/uploads/english-speaking-course.jfif' },
      { keywords: ['business', 'management'], file: '/uploads/business-management-training.jfif' },
      { keywords: ['css interview', 'css preparation'], file: '/uploads/css-interview-training.jfif' },
      { keywords: ['finance', 'accounting'], file: '/uploads/finance-accounting-professional.jfif' },
      { keywords: ['website design', 'web design', 'web dev', 'web development'], file: '/uploads/website-design-course.jfif' }
    ];

    const courses = await prisma.course.findMany({ select: { id: true, title: true } });
    let updatedCount = 0;
    for (const course of courses) {
      const titleLower = course.title.toLowerCase();
      const match = mappings.find(m => m.keywords.some(k => titleLower.includes(k)));
      if (match) {
        await prisma.course.update({
          where: { id: course.id },
          data: { thumbnail: match.file }
        });
        updatedCount++;
      }
    }
    res.json({ success: true, message: `Updated ${updatedCount} course thumbnails.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin routes (before /:id to avoid slug conflicts)
router.get('/admin/pending', requireAuth, requireRole('ADMIN'), courseController.getPendingApproval);
router.patch('/:id/approve', requireAuth, requireRole('ADMIN'), courseController.approveCourse);
router.patch('/:id/reject', requireAuth, requireRole('ADMIN'), courseController.rejectCourse);
router.patch('/:id/publish', requireAuth, requireRole('ADMIN'), courseController.togglePublish);

// Instructor routes — instructors can view their assigned courses but cannot create/delete
router.get('/instructor/my-courses', requireAuth, requireRole('INSTRUCTOR', 'ADMIN'), courseController.getInstructorCourses);
// Only admin can create, update, delete courses
router.post('/', requireAuth, requireRole('ADMIN'), uploadImage.single('thumbnail'), courseController.create);
router.put('/:id', requireAuth, requireRole('ADMIN'), uploadImage.single('thumbnail'), courseController.update);
router.delete('/:id', requireAuth, requireRole('ADMIN'), courseController.delete);

// Public listing and detail (must come AFTER specific named routes)
router.get('/', optionalAuth, courseController.getAll);
router.get('/:slug', optionalAuth, courseController.getOne);

// Instructor — Course Announcements
router.get('/:id/announcements', requireAuth, requireRole('INSTRUCTOR', 'ADMIN'), courseController.getCourseAnnouncements);
router.post('/:id/announcements', requireAuth, requireRole('INSTRUCTOR', 'ADMIN'), courseController.createCourseAnnouncement);
router.delete('/:courseId/announcements/:announcementId', requireAuth, requireRole('INSTRUCTOR', 'ADMIN'), courseController.deleteCourseAnnouncement);

module.exports = router;
