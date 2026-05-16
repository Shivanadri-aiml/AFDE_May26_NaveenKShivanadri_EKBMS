const path = require('path');
const fs = require('fs');
const { Op, fn, col, literal } = require('sequelize');
const { Article, Category, User, Tag, ArticleTag, Attachment, Comment, Rating, Bookmark } = require('../models');
const { paginateQuery, formatArticleResponse, calculateAverageRating } = require('../utils/helpers');

/**
 * GET /api/articles
 */
const getArticles = async (req, res, next) => {
  try {
    const { status, categoryId, authorId, page = 1, limit = 12, sort = 'newest' } = req.query;
    const { offset, limit: parsedLimit } = paginateQuery(page, limit);
    const userRole = req.user.role ? req.user.role.name : 'Employee';

    const where = {};

    // Role-based filtering
    if (userRole === 'Employee') {
      where.status = 'Approved';
    } else if (userRole === 'Author') {
      if (status) {
        where.status = status;
        // Author can see own drafts/pending but only approved from others
        if (status !== 'Approved') {
          where.authorId = req.user.id;
        }
      } else {
        where[Op.or] = [
          { status: 'Approved' },
          { authorId: req.user.id },
        ];
      }
    } else {
      // Admin / Reviewer can see all
      if (status) where.status = status;
    }

    if (categoryId) where.categoryId = parseInt(categoryId);
    if (authorId && userRole !== 'Employee') where.authorId = parseInt(authorId);

    const orderMap = {
      newest: [['createdAt', 'DESC']],
      oldest: [['createdAt', 'ASC']],
      popular: [['viewCount', 'DESC']],
      az: [['title', 'ASC']],
    };
    const order = orderMap[sort] || orderMap.newest;

    const { count, rows } = await Article.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
        { model: Tag, as: 'tags', through: { attributes: [] } },
        { model: Rating, as: 'ratings', attributes: ['rating'] },
        { model: Comment, as: 'comments', attributes: ['id'] },
      ],
      offset,
      limit: parsedLimit,
      order,
      distinct: true,
    });

    const formatted = rows.map((article) => {
      const plain = article.toJSON();
      plain.avgRating = calculateAverageRating(plain.ratings);
      plain.ratingCount = plain.ratings ? plain.ratings.length : 0;
      plain.commentCount = plain.comments ? plain.comments.length : 0;
      delete plain.ratings;
      delete plain.comments;
      return plain;
    });

    return res.status(200).json({
      message: 'Articles retrieved successfully',
      data: {
        articles: formatted,
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
 * GET /api/articles/:id
 */
const getArticleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role ? req.user.role.name : 'Employee';

    const article = await Article.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: User, as: 'author', attributes: ['id', 'name', 'email', 'profilePicture'] },
        { model: User, as: 'reviewer', attributes: ['id', 'name', 'email'] },
        { model: Tag, as: 'tags', through: { attributes: [] } },
        { model: Attachment, as: 'attachments' },
        {
          model: Comment,
          as: 'comments',
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profilePicture'] }],
          order: [['createdAt', 'DESC']],
        },
        { model: Rating, as: 'ratings', attributes: ['rating', 'userId'] },
      ],
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Employees can only view approved articles
    if (userRole === 'Employee' && article.status !== 'Approved') {
      return res.status(403).json({ error: 'You do not have permission to view this article' });
    }

    // Authors can only view their own non-approved articles
    if (userRole === 'Author' && article.status !== 'Approved' && article.authorId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to view this article' });
    }

    // Increment view count
    await article.increment('viewCount');

    const plain = article.toJSON();
    plain.avgRating = calculateAverageRating(plain.ratings);
    plain.ratingCount = plain.ratings ? plain.ratings.length : 0;
    plain.viewCount = plain.viewCount + 1;

    // Check if current user has bookmarked this article
    const bookmark = await Bookmark.findOne({
      where: { articleId: id, userId: req.user.id },
    });
    plain.isBookmarked = !!bookmark;

    // Check current user's rating
    const userRating = plain.ratings ? plain.ratings.find((r) => r.userId === req.user.id) : null;
    plain.userRating = userRating ? userRating.rating : null;

    return res.status(200).json({ message: 'Article retrieved successfully', data: { article: plain } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/articles
 */
const createArticle = async (req, res, next) => {
  try {
    const { title, content, description, categoryId, tags, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const articleData = {
      title: title.trim(),
      content: content.trim(),
      description: description ? description.trim() : null,
      categoryId: categoryId ? parseInt(categoryId) : null,
      authorId: req.user.id,
      status: status && ['Draft', 'Pending Approval'].includes(status) ? status : 'Draft',
    };

    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) return res.status(400).json({ error: 'Category not found' });
    }

    const article = await Article.create(articleData);

    // Handle tags
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const tagInstances = [];
      for (const tagName of tags) {
        const [tag] = await Tag.findOrCreate({
          where: { name: tagName.toLowerCase().trim() },
          defaults: { name: tagName.toLowerCase().trim() },
        });
        tagInstances.push(tag);
      }
      await article.setTags(tagInstances);
    }

    const created = await Article.findByPk(article.id, {
      include: [
        { model: Category, as: 'category' },
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
        { model: Tag, as: 'tags', through: { attributes: [] } },
      ],
    });

    return res.status(201).json({ message: 'Article created successfully', data: { article: created } });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/articles/:id
 */
const updateArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, description, categoryId, tags } = req.body;
    const userRole = req.user.role ? req.user.role.name : 'Employee';

    const article = await Article.findByPk(id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Only author or admin can update
    if (userRole !== 'Admin' && article.authorId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to update this article' });
    }

    // Cannot edit approved articles (unless admin)
    if (article.status === 'Approved' && userRole !== 'Admin') {
      return res.status(400).json({ error: 'Approved articles cannot be edited. Contact an admin.' });
    }

    const updates = {};
    if (title && title.trim()) updates.title = title.trim();
    if (content && content.trim()) updates.content = content.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;

    if (categoryId !== undefined) {
      if (categoryId) {
        const category = await Category.findByPk(categoryId);
        if (!category) return res.status(400).json({ error: 'Category not found' });
        updates.categoryId = parseInt(categoryId);
      } else {
        updates.categoryId = null;
      }
    }

    // Reset to Draft when editing a rejected article
    if (article.status === 'Rejected') {
      updates.status = 'Draft';
    }

    await article.update(updates);

    // Sync tags
    if (tags && Array.isArray(tags)) {
      const tagInstances = [];
      for (const tagName of tags) {
        const [tag] = await Tag.findOrCreate({
          where: { name: tagName.toLowerCase().trim() },
          defaults: { name: tagName.toLowerCase().trim() },
        });
        tagInstances.push(tag);
      }
      await article.setTags(tagInstances);
    }

    const updated = await Article.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
        { model: Tag, as: 'tags', through: { attributes: [] } },
      ],
    });

    return res.status(200).json({ message: 'Article updated successfully', data: { article: updated } });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/articles/:id
 */
const deleteArticle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role ? req.user.role.name : 'Employee';

    const article = await Article.findByPk(id, {
      include: [{ model: Attachment, as: 'attachments' }],
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (userRole !== 'Admin' && article.authorId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this article' });
    }

    // Delete attachment files from disk
    if (article.attachments && article.attachments.length > 0) {
      for (const attachment of article.attachments) {
        const filePath = path.join(__dirname, '../../uploads', attachment.fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await article.destroy();

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/articles/:id/submit
 */
const submitForApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role ? req.user.role.name : 'Employee';

    const article = await Article.findByPk(id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (userRole !== 'Admin' && article.authorId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to submit this article' });
    }

    if (!['Draft', 'Rejected'].includes(article.status)) {
      return res.status(400).json({ error: `Cannot submit article with status '${article.status}' for approval` });
    }

    await article.update({ status: 'Pending Approval' });

    return res.status(200).json({ message: 'Article submitted for approval', data: { article } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/articles/:id/publish — Admin only
 */
const publishArticle = async (req, res, next) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    await article.update({
      status: 'Approved',
      publishedAt: new Date(),
      reviewerId: req.user.id,
      reviewedAt: new Date(),
    });

    return res.status(200).json({ message: 'Article published successfully', data: { article } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/articles/:id/archive — Admin only
 */
const archiveArticle = async (req, res, next) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    await article.update({ status: 'Archived' });

    return res.status(200).json({ message: 'Article archived successfully', data: { article } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  submitForApproval,
  publishArticle,
  archiveArticle,
};
