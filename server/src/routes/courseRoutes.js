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
