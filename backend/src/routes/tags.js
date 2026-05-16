const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');

// GET /api/tags
router.get('/', authenticate, tagController.getTags);

// POST /api/tags — Author or Admin
router.post('/', authenticate, requireRole('Author', 'Admin'), tagController.createTag);

// DELETE /api/tags/:id — Admin only
router.delete('/:id', authenticate, requireRole('Admin'), tagController.deleteTag);

module.exports = router;
