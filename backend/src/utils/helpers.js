const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/auth');

/**
 * Generate a JWT token for a given payload.
 * @param {Object} payload - Data to encode in the token.
 * @returns {string} Signed JWT string.
 */
const generateToken = (payload) => {
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
};

/**
 * Calculate Sequelize offset/limit for pagination.
 * @param {number|string} page - 1-based page number.
 * @param {number|string} limit - Items per page.
 * @returns {{ offset: number, limit: number }}
 */
const paginateQuery = (page = 1, limit = 10) => {
  const parsedPage = Math.max(1, parseInt(page) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const offset = (parsedPage - 1) * parsedLimit;
  return { offset, limit: parsedLimit };
};

/**
 * Format an article response by stripping sensitive fields and adding computed fields.
 * @param {Object} article - Sequelize article instance or plain object.
 * @returns {Object} Formatted article object.
 */
const formatArticleResponse = (article) => {
  const plain = article.toJSON ? article.toJSON() : { ...article };

  // Calculate average rating if ratings array present
  if (plain.ratings && Array.isArray(plain.ratings)) {
    plain.avgRating = calculateAverageRating(plain.ratings);
    plain.ratingCount = plain.ratings.length;
  } else {
    plain.avgRating = 0;
    plain.ratingCount = 0;
  }

  return plain;
};

/**
 * Remove special characters from a filename, keeping alphanumerics, dots, dashes and underscores.
 * @param {string} filename - Original filename.
 * @returns {string} Sanitized filename.
 */
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
};

/**
 * Calculate the average rating from an array of rating objects.
 * @param {Array} ratings - Array of objects with a `rating` numeric field.
 * @returns {number} Average rating rounded to 2 decimal places, or 0 if empty.
 */
const calculateAverageRating = (ratings) => {
  if (!ratings || ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, r) => acc + (r.rating || 0), 0);
  return parseFloat((sum / ratings.length).toFixed(2));
};

module.exports = {
  generateToken,
  paginateQuery,
  formatArticleResponse,
  sanitizeFilename,
  calculateAverageRating,
};
