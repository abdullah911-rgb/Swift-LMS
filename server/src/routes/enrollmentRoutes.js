const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { requireAuth } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roles');

// Student routes
router.get('/my', requireAuth, requireRole('STUDENT'), enrollmentController.getMyEnrollments);
router.get('/eligibility/:courseId', requireAuth, requireRole('STUDENT'), enrollmentController.checkEligibility);
router.post('/:courseId', requireAuth, requireRole('STUDENT'), enrollmentController.enroll);
router.get('/:courseId', requireAuth, requireRole('STUDENT'), enrollmentController.getCourseAccess);
router.post('/:courseId/lessons/:lessonId/complete', requireAuth, requireRole('STUDENT'), enrollmentController.completeLesson);

// Instructor / Admin route — view enrolled students for a course
router.get('/:courseId/students', requireAuth, requireRole('INSTRUCTOR', 'ADMIN'), enrollmentController.getCourseStudents);

module.exports = router;
