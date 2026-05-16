const { Op } = require('sequelize');
const { Article, Category, User, Tag, ArticleTag } = require('../models');
const { paginateQuery, calculateAverageRating } = require('../utils/helpers');

/**
 * GET /api/search
 */
const search = async (req, res, next) => {
  try {
    const { q, category, tag, sort = 'latest', page = 1, limit = 12 } = req.query;
    const { offset, limit: parsedLimit } = paginateQuery(page, limit);
    const userRole = req.user.role ? req.user.role.name : 'Employee';

    const where = {};

    // Role-based status filter
    if (userRole === 'Employee') {
      where.status = 'Approved';
    } else if (userRole === 'Author') {
      where[Op.or] = [{ status: 'Approved' }, { authorId: req.user.id }];
    }
    // Admin and Reviewer see all statuses

    // Text search
    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      const textCondition = {
        [Op.or]: [
          { title: { [Op.like]: searchTerm } },
          { description: { [Op.like]: searchTerm } },
          { content: { [Op.like]: searchTerm } },
        ],
      };

      if (where[Op.or]) {
        // Combine with existing OR (role-based)
        where[Op.and] = [{ [Op.or]: where[Op.or] }, textCondition];
        delete where[Op.or];
      } else {
        Object.assign(where, textCondition);
      }
    }

    // Category filter
    if (category) {
      // Support category id or name
      const catId = parseInt(category);
      if (!isNaN(catId)) {
        where.categoryId = catId;
      } else {
        const cat = await Category.findOne({ where: { name: { [Op.like]: `%${category}%` } } });
        if (cat) where.categoryId = cat.id;
      }
    }

    // Sort order
    const orderMap = {
      latest: [['createdAt', 'DESC']],
      popular: [['viewCount', 'DESC']],
      az: [['title', 'ASC']],
    };
    const order = orderMap[sort] || orderMap.latest;

    const includeOptions = [
      { model: Category, as: 'category', attributes: ['id', 'name'] },
      { model: User, as: 'author', attributes: ['id', 'name'] },
      { model: Tag, as: 'tags', through: { attributes: [] } },
    ];

    // Tag filter
    if (tag && tag.trim()) {
      const tagRecord = await Tag.findOne({ where: { name: tag.toLowerCase().trim() } });
      if (tagRecord) {
        // Find article IDs with this tag
        const articleTagRows = await ArticleTag.findAll({ where: { tagId: tagRecord.id } });
        const articleIds = articleTagRows.map((r) => r.articleId);
        where.id = { [Op.in]: articleIds };
      } else {
        // No articles with this tag
        return res.status(200).json({
          message: 'Search completed',
          data: { articles: [], total: 0, page: parseInt(page), totalPages: 0 },
        });
      }
    }

    const { count, rows } = await Article.findAndCountAll({
      where,
      include: includeOptions,
      offset,
      limit: parsedLimit,
      order,
      distinct: true,
    });

    const articles = rows.map((a) => a.toJSON());

    return res.status(200).json({
      message: 'Search completed',
      data: {
        articles,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / parsedLimit),
        query: q || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { search };
