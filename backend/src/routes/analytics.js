const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');

// GET /api/analytics/dashboard
router.get('/dashboard', authenticate, analyticsController.getDashboardStats);

// GET /api/analytics/articles — Admin or Reviewer
router.get('/articles', authenticate, requireRole('Admin', 'Reviewer'), analyticsController.getArticleAnalytics);

// GET /api/analytics/users — Admin only
router.get('/users', authenticate, requireRole('Admin'), analyticsController.getUserAnalytics);

// GET /api/analytics/search-trends
router.get('/search-trends', authenticate, analyticsController.getSearchTrends);

module.exports = router;
