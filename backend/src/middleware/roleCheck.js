const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Access denied. No role assigned.' });
    }

    const userRole = req.user.role.name;

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.',
        required: roles,
        current: userRole,
      });
    }

    next();
  };
};

module.exports = requireRole;
