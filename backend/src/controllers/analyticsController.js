const { Op, fn, col, literal } = require('sequelize');
const { Article, User, Role, Category, Tag, Comment, Bookmark, Rating } = require('../models');
const { sequelize } = require('../models');

/**
 * GET /api/analytics/dashboard
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // Article counts by status
    const totalArticles = await Article.count();
    const approvedArticles = await Article.count({ where: { status: 'Approved' } });
    const pendingApprovals = await Article.count({ where: { status: 'Pending Approval' } });
    const rejectedArticles = await Article.count({ where: { status: 'Rejected' } });
    const draftArticles = await Article.count({ where: { status: 'Draft' } });

    // User counts
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });

    // Other counts
    const totalCategories = await Category.count();
    const totalTags = await Tag.count();
    const totalComments = await Comment.count();

    // Total views
    const viewResult = await Article.findOne({
      attributes: [[fn('SUM', col('viewCount')), 'totalViews']],
      raw: true,
    });
    const totalViews = parseInt(viewResult.totalViews) || 0;

    // Recent articles (last 5)
    const recentArticles = await Article.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'author', attributes: ['id', 'name'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
      ],
    });

    // Most viewed articles (top 5, Approved only)
    const mostViewedArticles = await Article.findAll({
      where: { status: 'Approved' },
      limit: 5,
      order: [['viewCount', 'DESC']],
      include: [
        { model: User, as: 'author', attributes: ['id', 'name'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
      ],
    });

    // Articles by status
    const articlesByStatus = await Article.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    // Articles by category
    const articlesByCategory = await Article.findAll({
      attributes: ['categoryId', [fn('COUNT', col('Article.id')), 'count']],
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      group: ['categoryId'],
      raw: false,
      where: { categoryId: { [Op.ne]: null } },
    });

    const catStats = articlesByCategory.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.category ? row.category.name : 'Unknown',
      count: row.get('count'),
    }));

    return res.status(200).json({
      message: 'Dashboard stats retrieved successfully',
      data: {
        totalArticles,
        approvedArticles,
        pendingApprovals,
        rejectedArticles,
        draftArticles,
        totalUsers,
        activeUsers,
        totalCategories,
        totalTags,
        totalComments,
        totalViews,
        recentArticles,
        mostViewedArticles,
        articlesByStatus,
        articlesByCategory: catStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/articles — Admin/Reviewer
 */
const getArticleAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const articles = await Article.findAll({
      where,
      attributes: ['id', 'title', 'status', 'viewCount', 'createdAt', 'publishedAt'],
      include: [
        { model: User, as: 'author', attributes: ['id', 'name'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Rating, as: 'ratings', attributes: ['rating'] },
        { model: Comment, as: 'comments', attributes: ['id'] },
        { model: Bookmark, as: 'bookmarks', attributes: ['id'] },
      ],
      order: [['viewCount', 'DESC']],
    });

    const result = articles.map((a) => {
      const plain = a.toJSON();
      const ratings = plain.ratings || [];
      plain.avgRating = ratings.length
        ? parseFloat((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2))
        : 0;
      plain.ratingCount = ratings.length;
      plain.commentCount = plain.comments ? plain.comments.length : 0;
      plain.bookmarkCount = plain.bookmarks ? plain.bookmarks.length : 0;
      delete plain.ratings;
      delete plain.comments;
      delete plain.bookmarks;
      return plain;
    });

    return res.status(200).json({ message: 'Article analytics retrieved', data: { articles: result } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/users — Admin only
 */
const getUserAnalytics = async (req, res, next) => {
  try {
    // Total by role
    const usersByRole = await User.findAll({
      attributes: ['roleId', [fn('COUNT', col('User.id')), 'count']],
      include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
      group: ['roleId'],
      raw: false,
    });

    const roleStats = usersByRole.map((row) => ({
      roleId: row.roleId,
      roleName: row.role ? row.role.name : 'Unknown',
      count: row.get('count'),
    }));

    // Active vs inactive
    const activeCount = await User.count({ where: { isActive: true } });
    const inactiveCount = await User.count({ where: { isActive: false } });

    // Top authors (most articles)
    const topAuthors = await Article.findAll({
      attributes: ['authorId', [fn('COUNT', col('Article.id')), 'articleCount']],
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'email'] }],
      group: ['authorId'],
      order: [[literal('articleCount'), 'DESC']],
      limit: 10,
      raw: false,
    });

    const authors = topAuthors.map((row) => ({
      userId: row.authorId,
      name: row.author ? row.author.name : 'Unknown',
      email: row.author ? row.author.email : null,
      articleCount: row.get('articleCount'),
    }));

    // Recent registrations (last 10)
    const recentUsers = await User.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
      attributes: { exclude: ['password'] },
    });

    return res.status(200).json({
      message: 'User analytics retrieved',
      data: {
        usersByRole: roleStats,
        activeUsers: activeCount,
        inactiveUsers: inactiveCount,
        topAuthors: authors,
        recentUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/search-trends
 */
const getSearchTrends = async (req, res, next) => {
  try {
    // Popular categories by total views of their articles
    const popularCategories = await Article.findAll({
      where: { status: 'Approved', categoryId: { [Op.ne]: null } },
      attributes: ['categoryId', [fn('SUM', col('viewCount')), 'totalViews'], [fn('COUNT', col('Article.id')), 'articleCount']],
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      group: ['categoryId'],
      order: [[literal('totalViews'), 'DESC']],
      limit: 10,
      raw: false,
    });

    const catTrends = popularCategories.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.category ? row.category.name : 'Unknown',
      totalViews: row.get('totalViews'),
      articleCount: row.get('articleCount'),
    }));

    // Popular tags by total views of articles they are attached to
    const { Tag: TagModel, ArticleTag } = require('../models');
    const allTags = await Tag.findAll({ attributes: ['id', 'name'] });

    const tagTrends = [];
    for (const tag of allTags) {
      const articles = await tag.getArticles({
        where: { status: 'Approved' },
        attributes: ['id', 'viewCount'],
        through: { attributes: [] },
      });
      const totalViews = articles.reduce((sum, a) => sum + (a.viewCount || 0), 0);
      if (articles.length > 0) {
        tagTrends.push({ tagId: tag.id, tagName: tag.name, totalViews, articleCount: articles.length });
      }
    }
    tagTrends.sort((a, b) => b.totalViews - a.totalViews);

    return res.status(200).json({
      message: 'Search trends retrieved',
      data: {
        popularCategories: catTrends,
        popularTags: tagTrends.slice(0, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, getArticleAnalytics, getUserAnalytics, getSearchTrends };
