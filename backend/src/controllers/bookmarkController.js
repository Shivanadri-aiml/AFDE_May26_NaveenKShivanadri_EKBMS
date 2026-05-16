const { Bookmark, Article, Category, User, Tag } = require('../models');
const { paginateQuery } = require('../utils/helpers');

/**
 * GET /api/bookmarks
 */
const getBookmarks = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const { offset, limit: parsedLimit } = paginateQuery(page, limit);

    const { count, rows } = await Bookmark.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Article,
          as: 'Article',
          include: [
            { model: Category, as: 'category', attributes: ['id', 'name'] },
            { model: User, as: 'author', attributes: ['id', 'name'] },
            { model: Tag, as: 'tags', through: { attributes: [] } },
          ],
        },
      ],
      offset,
      limit: parsedLimit,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    return res.status(200).json({
      message: 'Bookmarks retrieved successfully',
      data: {
        bookmarks: rows,
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
 * POST /api/bookmarks/:articleId
 */
const addBookmark = async (req, res, next) => {
  try {
    const { articleId } = req.params;

    const article = await Article.findByPk(articleId);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.status !== 'Approved') {
      return res.status(400).json({ error: 'Only approved articles can be bookmarked' });
    }

    const existing = await Bookmark.findOne({
      where: { articleId: parseInt(articleId), userId: req.user.id },
    });

    if (existing) {
      return res.status(409).json({ error: 'Article already bookmarked' });
    }

    const bookmark = await Bookmark.create({
      articleId: parseInt(articleId),
      userId: req.user.id,
    });

    return res.status(201).json({ message: 'Bookmarked successfully', data: { bookmark } });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/bookmarks/:articleId
 */
const removeBookmark = async (req, res, next) => {
  try {
    const { articleId } = req.params;

    const bookmark = await Bookmark.findOne({
      where: { articleId: parseInt(articleId), userId: req.user.id },
    });

    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    await bookmark.destroy();

    return res.status(200).json({ message: 'Bookmark removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBookmarks, addBookmark, removeBookmark };
