const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roles');

const isAdmin = [requireAuth, requireRole('ADMIN')];

// Platform stats
router.get('/stats', isAdmin, adminController.getStats);

// User management
router.get('/users', isAdmin, adminController.getUsers);
router.patch('/users/:id/toggle-active', isAdmin, adminController.toggleUserActive);
router.patch('/users/:id/role', isAdmin, adminController.changeUserRole);
router.delete('/users/:id', isAdmin, adminController.deleteUser);

// Instructor management
router.get('/instructors/pending', isAdmin, adminController.getPendingInstructors);
router.post('/instructors', isAdmin, adminController.createInstructor);
router.patch('/instructors/:id/approve', isAdmin, adminController.approveInstructor);
router.patch('/instructors/:id/reject', isAdmin, adminController.rejectInstructor);
router.patch('/instructors/:id/assign-course', isAdmin, adminController.assignCourse);
router.get('/instructors', isAdmin, adminController.getInstructors);

// Course management
router.get('/courses', isAdmin, adminController.getAllCourses);
router.patch('/courses/:courseId/reassign-instructor', isAdmin, adminController.reassignCourseInstructor);
router.patch('/courses/:courseId/unassign-instructor', isAdmin, adminController.unassignCourse);

// Enrollment reports
router.get('/enrollments', isAdmin, adminController.getRecentEnrollments);

// Attendance management
router.get('/attendance/:courseId', isAdmin, adminController.getCourseAttendance);
router.patch('/enrollments/:studentId/:courseId/reactivate', isAdmin, adminController.reactivateEnrollment);

// Announcements
router.post('/announcements', isAdmin, adminController.createAnnouncement);
router.get('/announcements', isAdmin, adminController.getAnnouncements);
router.delete('/announcements/:id', isAdmin, adminController.deleteAnnouncement);
router.get('/announcements/active/banner', requireAuth, adminController.getActiveAnnouncements);

module.exports = router;
