const { Op } = require('sequelize');
const { User, Role, Article } = require('../models');
const { paginateQuery } = require('../utils/helpers');

/**
 * GET /api/users — Admin only
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { search, roleId, isActive, page = 1, limit = 10 } = req.query;
    const { offset, limit: parsedLimit } = paginateQuery(page, limit);

    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    if (roleId) {
      where.roleId = parseInt(roleId);
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [{ model: Role, as: 'role' }],
      offset,
      limit: parsedLimit,
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      message: 'Users retrieved successfully',
      data: {
        users: rows,
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
 * GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.id },
      include: [{ model: Role, as: 'role' }],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ message: 'User retrieved successfully', data: { user } });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id — Admin only
 */
const updateUser = async (req, res, next) => {
  try {
    const { name, email, isActive, roleId } = req.body;

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {};
    if (name && name.trim()) updates.name = name.trim();
    if (isActive !== undefined) updates.isActive = isActive;
    if (roleId) {
      const role = await Role.findByPk(roleId);
      if (!role) return res.status(400).json({ error: 'Invalid role ID' });
      updates.roleId = roleId;
    }

    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Valid email required' });
      }
      if (email.toLowerCase() !== user.email) {
        const existing = await User.findOne({ where: { email: email.toLowerCase() } });
        if (existing) return res.status(409).json({ error: 'Email already in use' });
        updates.email = email.toLowerCase();
      }
    }

    await user.update(updates);

    const updated = await User.findOne({
      where: { id: user.id },
      include: [{ model: Role, as: 'role' }],
    });

    return res.status(200).json({ message: 'User updated successfully', data: { user: updated } });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:id — Admin only
 */
const deleteUser = async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id);

    if (targetId === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const user = await User.findByPk(targetId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Soft delete
    await user.update({ isActive: false });

    return res.status(200).json({ message: 'User deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id/role — Admin only
 */
const changeUserRole = async (req, res, next) => {
  try {
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({ error: 'roleId is required' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(400).json({ error: 'Invalid role ID' });
    }

    await user.update({ roleId });

    const updated = await User.findOne({
      where: { id: user.id },
      include: [{ model: Role, as: 'role' }],
    });

    return res.status(200).json({ message: 'User role updated successfully', data: { user: updated } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id/stats
 */
const getUserStats = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const statuses = ['Draft', 'Pending Approval', 'Approved', 'Rejected', 'Archived'];
    const counts = {};

    for (const status of statuses) {
      counts[status] = await Article.count({ where: { authorId: userId, status } });
    }

    counts.total = await Article.count({ where: { authorId: userId } });

    return res.status(200).json({
      message: 'User stats retrieved successfully',
      data: { userId: parseInt(userId), articleCounts: counts },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, changeUserRole, getUserStats };
