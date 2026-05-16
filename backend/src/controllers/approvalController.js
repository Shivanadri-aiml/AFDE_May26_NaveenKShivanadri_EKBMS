const { Article, User, Category, Tag } = require('../models');
const { paginateQuery } = require('../utils/helpers');

/**
 * GET /api/approvals — Reviewer/Admin
 */
const getPendingArticles = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { offset, limit: parsedLimit } = paginateQuery(page, limit);

    const { count, rows } = await Article.findAndCountAll({
      where: { status: 'Pending Approval' },
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Tag, as: 'tags', through: { attributes: [] } },
      ],
      offset,
      limit: parsedLimit,
      order: [['createdAt', 'ASC']], // Oldest first (review in order)
      distinct: true,
    });

    return res.status(200).json({
      message: 'Pending articles retrieved successfully',
      data: {
        articles: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / parsedLimit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/approvals/:id/approve — Reviewer/Admin
 */
const approveArticle = async (req, res, next) => {
  try {
    const { approvalComment } = req.body;

    const article = await Article.findByPk(req.params.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
      ],
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.status !== 'Pending Approval') {
      return res.status(400).json({ error: `Article is not pending approval (current status: ${article.status})` });
    }

    const now = new Date();
    await article.update({
      status: 'Approved',
      reviewerId: req.user.id,
      reviewedAt: now,
      publishedAt: now,
      approvalComment: approvalComment ? approvalComment.trim() : null,
    });

    const updated = await Article.findByPk(article.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'reviewer', attributes: ['id', 'name', 'email'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Tag, as: 'tags', through: { attributes: [] } },
      ],
    });

    return res.status(200).json({ message: 'Article approved successfully', data: { article: updated } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/approvals/:id/reject — Reviewer/Admin
 */
const rejectArticle = async (req, res, next) => {
  try {
    const { approvalComment } = req.body;

    if (!approvalComment || !approvalComment.trim()) {
      return res.status(400).json({ error: 'Rejection reason (approvalComment) is required' });
    }

    const article = await Article.findByPk(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.status !== 'Pending Approval') {
      return res.status(400).json({ error: `Article is not pending approval (current status: ${article.status})` });
    }

    await article.update({
      status: 'Rejected',
      reviewerId: req.user.id,
      reviewedAt: new Date(),
      approvalComment: approvalComment.trim(),
    });

    const updated = await Article.findByPk(article.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'reviewer', attributes: ['id', 'name', 'email'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
      ],
    });

    return res.status(200).json({ message: 'Article rejected', data: { article: updated } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/approvals/history — Reviewer/Admin
 */
const getReviewHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { offset, limit: parsedLimit } = paginateQuery(page, limit);
    const userRole = req.user.role ? req.user.role.name : 'Employee';

    const where = {
      status: ['Approved', 'Rejected'],
    };

    // Reviewers see their own history; Admins see all
    if (userRole === 'Reviewer') {
      where.reviewerId = req.user.id;
    }

    const { count, rows } = await Article.findAndCountAll({
      where,
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'reviewer', attributes: ['id', 'name', 'email'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
      ],
      offset,
      limit: parsedLimit,
      order: [['reviewedAt', 'DESC']],
      distinct: true,
    });

    return res.status(200).json({
      message: 'Review history retrieved successfully',
      data: {
        articles: rows,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / parsedLimit),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPendingArticles, approveArticle, rejectArticle, getReviewHistory };
