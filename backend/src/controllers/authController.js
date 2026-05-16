const bcrypt = require('bcryptjs');
const { User, Role } = require('../models');
const { generateToken } = require('../utils/helpers');

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, roleName } = req.body;

    // Basic validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check email uniqueness
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email address is already registered' });
    }

    // Find role — default to Employee
    const targetRoleName = roleName || 'Employee';
    let role = await Role.findOne({ where: { name: targetRoleName } });
    if (!role) {
      role = await Role.findOne({ where: { name: 'Employee' } });
    }
    if (!role) {
      return res.status(500).json({ error: 'Default role not found. Please seed the database.' });
    }

    // Create user (password hashed via beforeCreate hook)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      roleId: role.id,
    });

    const userWithRole = await User.findOne({
      where: { id: user.id },
      include: [{ model: Role, as: 'role' }],
    });

    const token = generateToken({ id: user.id, email: user.email, role: role.name });

    return res.status(201).json({
      message: 'Registration successful',
      data: {
        token,
        user: {
          id: userWithRole.id,
          name: userWithRole.name,
          email: userWithRole.email,
          role: userWithRole.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({
      where: { email: email.toLowerCase() },
      include: [{ model: Role, as: 'role' }],
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated. Please contact an administrator.' });
    }

    const isMatch = await user.validatePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    const token = generateToken({ id: user.id, email: user.email, role: user.role ? user.role.name : null });

    return res.status(200).json({
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
          lastLogin: user.lastLogin,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  return res.status(200).json({
    message: 'Current user retrieved',
    data: { user: req.user },
  });
};

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  // We don't reveal whether the user exists for security reasons
  if (!user) {
    return res.status(200).json({ message: 'Password reset instructions sent to your email' });
  }

  // In production, generate a reset token, save it, and send email
  // For now, we just return success
  return res.status(200).json({ message: 'Password reset instructions sent to your email' });
};

/**
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    const updates = {};

    if (name && name.trim()) {
      updates.name = name.trim();
    }

    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Valid email is required' });
      }
      // Check uniqueness if email changed
      if (email.toLowerCase() !== req.user.email) {
        const existing = await User.findOne({ where: { email: email.toLowerCase() } });
        if (existing) {
          return res.status(409).json({ error: 'Email address is already in use' });
        }
        updates.email = email.toLowerCase();
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    await req.user.update(updates);

    const updated = await User.findOne({
      where: { id: userId },
      include: [{ model: Role, as: 'role' }],
    });

    return res.status(200).json({ message: 'Profile updated successfully', data: { user: updated } });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Re-fetch user with password for validation
    const userWithPwd = await User.findByPk(req.user.id);
    const isMatch = await userWithPwd.validatePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    // Update directly to bypass beforeUpdate hook (already hashing here)
    await User.update({ password: hashed }, { where: { id: req.user.id }, individualHooks: false });

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, forgotPassword, updateProfile, changePassword };
