const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');
const { Role } = require('../models');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me
router.get('/me', authenticate, authController.getMe);

// POST /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// PUT /api/auth/profile
router.put('/profile', authenticate, authController.updateProfile);

// PUT /api/auth/change-password
router.put('/change-password', authenticate, authController.changePassword);

// GET /api/auth/roles — public, returns all roles for registration/admin UI
router.get('/roles', async (req, res, next) => {
  try {
    const roles = await Role.findAll({ order: [['name', 'ASC']] });
    return res.status(200).json({ message: 'Roles retrieved', data: { roles } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
