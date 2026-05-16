const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');

// GET /api/categories
router.get('/', authenticate, categoryController.getCategories);

// POST /api/categories — Admin only
router.post('/', authenticate, requireRole('Admin'), categoryController.createCategory);

// GET /api/categories/:id
router.get('/:id', authenticate, categoryController.getCategoryById);

// PUT /api/categories/:id — Admin only
router.put('/:id', authenticate, requireRole('Admin'), categoryController.updateCategory);

// DELETE /api/categories/:id — Admin only
router.delete('/:id', authenticate, requireRole('Admin'), categoryController.deleteCategory);

module.exports = router;
