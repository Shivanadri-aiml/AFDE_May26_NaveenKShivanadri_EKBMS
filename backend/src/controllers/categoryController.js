const { Op } = require('sequelize');
const { Category, Article, User } = require('../models');

/**
 * GET /api/categories
 */
const getCategories = async (req, res, next) => {
  try {
    const { includeSubCategories } = req.query;

    const include = [
      { model: Category, as: 'parent', attributes: ['id', 'name'] },
    ];

    if (includeSubCategories === 'true') {
      include.push({ model: Category, as: 'subCategories', attributes: ['id', 'name', 'description'] });
    }

    const categories = await Category.findAll({
      include,
      order: [['name', 'ASC']],
    });

    // Add article count for each category
    const result = await Promise.all(
      categories.map(async (cat) => {
        const plain = cat.toJSON();
        plain.articleCount = await Article.count({
          where: { categoryId: cat.id, status: 'Approved' },
        });
        return plain;
      })
    );

    return res.status(200).json({ message: 'Categories retrieved successfully', data: { categories: result } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/categories/:id
 */
const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'parent', attributes: ['id', 'name'] },
        { model: Category, as: 'subCategories', attributes: ['id', 'name', 'description'] },
      ],
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const plain = category.toJSON();
    plain.articleCount = await Article.count({
      where: { categoryId: category.id, status: 'Approved' },
    });

    return res.status(200).json({ message: 'Category retrieved successfully', data: { category: plain } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/categories — Admin only
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, description, parentId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check uniqueness
    const existing = await Category.findOne({ where: { name: name.trim() } });
    if (existing) {
      return res.status(409).json({ error: 'A category with this name already exists' });
    }

    if (parentId) {
      const parent = await Category.findByPk(parentId);
      if (!parent) return res.status(400).json({ error: 'Parent category not found' });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description ? description.trim() : null,
      parentId: parentId ? parseInt(parentId) : null,
      createdBy: req.user.id,
    });

    return res.status(201).json({ message: 'Category created successfully', data: { category } });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/categories/:id — Admin only
 */
const updateCategory = async (req, res, next) => {
  try {
    const { name, description, parentId } = req.body;

    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const updates = {};

    if (name && name.trim()) {
      if (name.trim() !== category.name) {
        const existing = await Category.findOne({ where: { name: name.trim() } });
        if (existing) return res.status(409).json({ error: 'A category with this name already exists' });
      }
      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description = description ? description.trim() : null;
    }

    if (parentId !== undefined) {
      if (parentId) {
        if (parseInt(parentId) === category.id) {
          return res.status(400).json({ error: 'A category cannot be its own parent' });
        }
        const parent = await Category.findByPk(parentId);
        if (!parent) return res.status(400).json({ error: 'Parent category not found' });
        updates.parentId = parseInt(parentId);
      } else {
        updates.parentId = null;
      }
    }

    await category.update(updates);

    const updated = await Category.findByPk(category.id, {
      include: [
        { model: Category, as: 'parent', attributes: ['id', 'name'] },
      ],
    });

    return res.status(200).json({ message: 'Category updated successfully', data: { category: updated } });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/categories/:id — Admin only
 */
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Nullify articleCategoryId for articles in this category
    await Article.update({ categoryId: null }, { where: { categoryId: category.id } });

    // Nullify parentId for sub-categories
    await Category.update({ parentId: null }, { where: { parentId: category.id } });

    await category.destroy();

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
