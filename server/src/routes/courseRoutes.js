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
router.get('/', optionalAuth, courseController.getAll);
router.get('/:slug', optionalAuth, courseController.getOne);

// Instructor routes
router.get('/instructor/my-courses', requireAuth, requireRole('INSTRUCTOR', 'ADMIN'), courseController.getInstructorCourses);
router.post('/', requireAuth, requireRole('INSTRUCTOR', 'ADMIN'), uploadImage.single('thumbnail'), courseController.create);
router.put('/:id', requireAuth, requireRole('INSTRUCTOR', 'ADMIN'), uploadImage.single('thumbnail'), courseController.update);
router.delete('/:id', requireAuth, requireRole('INSTRUCTOR', 'ADMIN'), courseController.delete);

// Admin only
router.patch('/:id/publish', requireAuth, requireRole('ADMIN'), courseController.togglePublish);

module.exports = router;
