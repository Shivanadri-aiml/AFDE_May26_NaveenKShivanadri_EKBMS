const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const attachmentController = require('../controllers/attachmentController');
const commentController = require('../controllers/commentController');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');
const { uploadMultiple } = require('../middleware/upload');
const { Rating } = require('../models');
const { calculateAverageRating } = require('../utils/helpers');

// GET /api/articles
router.get('/', authenticate, articleController.getArticles);

// POST /api/articles — Author or Admin
router.post('/', authenticate, requireRole('Author', 'Admin'), articleController.createArticle);

// GET /api/articles/:id
router.get('/:id', authenticate, articleController.getArticleById);

// PUT /api/articles/:id — Author or Admin
router.put('/:id', authenticate, requireRole('Author', 'Admin'), articleController.updateArticle);

// DELETE /api/articles/:id — Author or Admin
router.delete('/:id', authenticate, requireRole('Author', 'Admin'), articleController.deleteArticle);

// POST /api/articles/:id/submit — Submit for approval
router.post('/:id/submit', authenticate, articleController.submitForApproval);

// POST /api/articles/:id/publish — Admin only
router.post('/:id/publish', authenticate, requireRole('Admin'), articleController.publishArticle);

// POST /api/articles/:id/archive — Admin only
router.post('/:id/archive', authenticate, requireRole('Admin'), articleController.archiveArticle);

// POST /api/articles/:id/attachments — Upload files
router.post('/:id/attachments', authenticate, uploadMultiple, attachmentController.uploadAttachment);

// GET /api/articles/:articleId/comments
router.get('/:articleId/comments', authenticate, commentController.getComments);

// POST /api/articles/:articleId/comments
router.post('/:articleId/comments', authenticate, commentController.addComment);

// POST /api/articles/:id/rate — Inline rating handler using Rating.upsert
router.post('/:id/rate', authenticate, async (req, res, next) => {
  try {
    const { rating } = req.body;
    const articleId = parseInt(req.params.id);

    if (!rating || isNaN(parseInt(rating)) || parseInt(rating) < 1 || parseInt(rating) > 5) {
      return res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
    }

    const { Article } = require('../models');
    const article = await Article.findByPk(articleId);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.status !== 'Approved') {
      return res.status(400).json({ error: 'Only approved articles can be rated' });
    }

    // Upsert: create or update the user's rating for this article
    await Rating.upsert({
      articleId,
      userId: req.user.id,
      rating: parseInt(rating),
    });

    // Calculate new average
    const allRatings = await Rating.findAll({
      where: { articleId },
      attributes: ['rating'],
    });

    const avgRating = calculateAverageRating(allRatings.map((r) => r.toJSON()));

    return res.status(200).json({
      message: 'Rating submitted successfully',
      data: {
        articleId,
        userRating: parseInt(rating),
        avgRating,
        ratingCount: allRatings.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
