const { Op } = require('sequelize');
const { Tag, Article, ArticleTag } = require('../models');

/**
 * GET /api/tags
 */
const getTags = async (req, res, next) => {
  try {
    const { search } = req.query;

    const where = {};
    if (search) {
      where.name = { [Op.like]: `%${search.toLowerCase()}%` };
    }

    const tags = await Tag.findAll({
      where,
      order: [['name', 'ASC']],
    });

    // Add article count for each tag
    const result = await Promise.all(
      tags.map(async (tag) => {
        const plain = tag.toJSON();
        plain.articleCount = await ArticleTag.count({ where: { tagId: tag.id } });
        return plain;
      })
    );

    return res.status(200).json({ message: 'Tags retrieved successfully', data: { tags: result } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tags — Author/Admin
 */
const createTag = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const normalizedName = name.toLowerCase().trim();

    const existing = await Tag.findOne({ where: { name: normalizedName } });
    if (existing) {
      return res.status(409).json({ error: 'A tag with this name already exists' });
    }

    const tag = await Tag.create({ name: normalizedName });

    return res.status(201).json({ message: 'Tag created successfully', data: { tag } });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tags/:id — Admin only
 */
const deleteTag = async (req, res, next) => {
  try {
    const tag = await Tag.findByPk(req.params.id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Remove from junction table
    await ArticleTag.destroy({ where: { tagId: tag.id } });

    await tag.destroy();

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = { getTags, createTag, deleteTag };
