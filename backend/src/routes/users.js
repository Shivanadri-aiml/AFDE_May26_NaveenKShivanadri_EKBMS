const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');

// All user routes require authentication
router.use(authenticate);

// GET /api/users — Admin only
router.get('/', requireRole('Admin'), userController.getAllUsers);

// GET /api/users/:id
router.get('/:id', userController.getUserById);

// PUT /api/users/:id — Admin only
router.put('/:id', requireRole('Admin'), userController.updateUser);

// DELETE /api/users/:id — Admin only
router.delete('/:id', requireRole('Admin'), userController.deleteUser);

// PUT /api/users/:id/role — Admin only
router.put('/:id/role', requireRole('Admin'), userController.changeUserRole);

// GET /api/users/:id/stats
router.get('/:id/stats', userController.getUserStats);

module.exports = router;
