const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');
const authenticate = require('../middleware/auth');

// GET /api/bookmarks
router.get('/', authenticate, bookmarkController.getBookmarks);

// POST /api/bookmarks/:articleId
router.post('/:articleId', authenticate, bookmarkController.addBookmark);

// DELETE /api/bookmarks/:articleId
router.delete('/:articleId', authenticate, bookmarkController.removeBookmark);

module.exports = router;
