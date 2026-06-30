const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { requireAuth } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roles');

router.get('/', categoryController.getAll);
router.get('/:slug', categoryController.getOne);
router.post('/', requireAuth, requireRole('ADMIN'), categoryController.create);
router.put('/:id', requireAuth, requireRole('ADMIN'), categoryController.update);
router.delete('/:id', requireAuth, requireRole('ADMIN'), categoryController.delete);

module.exports = router;
