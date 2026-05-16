const { Comment, User, Article } = require('../models');
const { paginateQuery } = require('../utils/helpers');

/**
 * GET /api/articles/:articleId/comments
 */
const getComments = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const { offset, limit: parsedLimit } = paginateQuery(page, limit);

    const article = await Article.findByPk(articleId);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const { count, rows } = await Comment.findAndCountAll({
      where: { articleId: parseInt(articleId) },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profilePicture'] }],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parsedLimit,
    });

    return res.status(200).json({
      message: 'Comments retrieved successfully',
      data: {
        comments: rows,
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
 * POST /api/articles/:articleId/comments
 */
const addComment = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length < 2) {
      return res.status(400).json({ error: 'Comment content must be at least 2 characters' });
    }

    const article = await Article.findByPk(articleId);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const comment = await Comment.create({
      articleId: parseInt(articleId),
      userId: req.user.id,
      content: content.trim(),
    });

    const withUser = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profilePicture'] }],
    });

    return res.status(201).json({ message: 'Comment added successfully', data: { comment: withUser } });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/comments/:id
 */
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const userRole = req.user.role ? req.user.role.name : 'Employee';

    if (userRole !== 'Admin' && comment.userId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this comment' });
    }

    await comment.destroy();

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = { getComments, addComment, deleteComment };
