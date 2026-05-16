const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');

// All approval routes require Reviewer or Admin role
// GET /api/approvals/history — must be defined before /:id routes
router.get('/history', authenticate, requireRole('Reviewer', 'Admin'), approvalController.getReviewHistory);

// GET /api/approvals
router.get('/', authenticate, requireRole('Reviewer', 'Admin'), approvalController.getPendingArticles);

// POST /api/approvals/:id/approve
router.post('/:id/approve', authenticate, requireRole('Reviewer', 'Admin'), approvalController.approveArticle);

// POST /api/approvals/:id/reject
router.post('/:id/reject', authenticate, requireRole('Reviewer', 'Admin'), approvalController.rejectArticle);

module.exports = router;
