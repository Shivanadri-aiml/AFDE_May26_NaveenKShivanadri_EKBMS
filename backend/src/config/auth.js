module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'enterprise_kb_secret_2024',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
