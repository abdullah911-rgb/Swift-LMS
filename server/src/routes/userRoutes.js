const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth } = require('../middlewares/auth');
const { requireRole, requireVerified } = require('../middlewares/roles');
const { authValidators } = require('../validators/authValidators');
const { uploadImage } = require('../middlewares/upload');

// Authenticated user routes
router.get('/profile', requireAuth, userController.getProfile);
router.put('/profile', requireAuth, uploadImage.single('avatar'), userController.updateProfile);
router.put('/change-password', requireAuth, authValidators.changePassword, userController.changePassword);

// Notifications
router.get('/notifications', requireAuth, userController.getNotifications);
router.patch('/notifications/read-all', requireAuth, userController.markAllNotificationsRead);
router.patch('/notifications/:id/read', requireAuth, userController.markNotificationRead);

// Admin routes
router.get('/', requireAuth, requireRole('ADMIN'), userController.getAllUsers);
router.patch('/:id/status', requireAuth, requireRole('ADMIN'), userController.toggleUserStatus);

module.exports = router;
