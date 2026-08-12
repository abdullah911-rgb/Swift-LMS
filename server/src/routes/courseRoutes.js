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

// Temporary route to set student progress to 100%
const prisma = require('../config/db');
router.get('/admin/set-100-progress', async (req, res) => {
  try {
    const student = await prisma.user.findUnique({
      where: { email: 'student@lms.com' }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student user student@lms.com not found.' });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id },
      include: { course: { include: { modules: { include: { lessons: true } } } } }
    });

    for (const enrollment of enrollments) {
      // 1. Update enrollment progress to 100%
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { progress: 100, completedAt: new Date() }
      });

      // 2. Mark all lessons of the course as completed for this student
      for (const module of enrollment.course.modules) {
        for (const lesson of module.lessons) {
          await prisma.lessonProgress.upsert({
            where: {
              enrollmentId_lessonId: {
                enrollmentId: enrollment.id,
                lessonId: lesson.id
              }
            },
            update: { isCompleted: true, completedAt: new Date() },
            create: {
              enrollmentId: enrollment.id,
              lessonId: lesson.id,
              userId: student.id,
              isCompleted: true,
              completedAt: new Date()
            }
          });
        }
      }
    }

    res.json({ success: true, message: 'All student enrollments and lesson progress updated to 100% completed successfully.' });
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
