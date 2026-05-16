const express = require('express');
const router = express.Router();
const attachmentController = require('../controllers/attachmentController');
const authenticate = require('../middleware/auth');

// GET /api/attachments/:id — Download
router.get('/:id', authenticate, attachmentController.downloadAttachment);

// DELETE /api/attachments/:id
router.delete('/:id', authenticate, attachmentController.deleteAttachment);

module.exports = router;
