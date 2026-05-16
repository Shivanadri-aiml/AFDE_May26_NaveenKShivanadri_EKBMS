const path = require('path');
const fs = require('fs');
const { Attachment, Article } = require('../models');

/**
 * POST /api/articles/:id/attachments
 */
const uploadAttachment = async (req, res, next) => {
  try {
    const { id: articleId } = req.params;
    const userRole = req.user.role ? req.user.role.name : 'Employee';

    const article = await Article.findByPk(articleId);
    if (!article) {
      // Remove uploaded file if article not found
      if (req.file) fs.unlinkSync(req.file.path);
      if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
      return res.status(404).json({ error: 'Article not found' });
    }

    // Only author or admin can attach files
    if (userRole !== 'Admin' && article.authorId !== req.user.id) {
      if (req.file) fs.unlinkSync(req.file.path);
      if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
      return res.status(403).json({ error: 'You do not have permission to upload attachments to this article' });
    }

    const files = req.files || (req.file ? [req.file] : []);

    if (files.length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const attachments = [];
    for (const file of files) {
      const attachment = await Attachment.create({
        articleId: parseInt(articleId),
        uploadedBy: req.user.id,
        fileName: file.filename,
        originalName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        filePath: file.path,
      });
      attachments.push(attachment);
    }

    return res.status(201).json({
      message: 'File(s) uploaded successfully',
      data: { attachments },
    });
  } catch (error) {
    // Cleanup uploaded files on error
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    if (req.files) req.files.forEach((f) => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
    next(error);
  }
};

/**
 * GET /api/attachments/:id — Download attachment
 */
const downloadAttachment = async (req, res, next) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id);
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const filePath = path.join(__dirname, '../../uploads', attachment.fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.download(filePath, attachment.originalName, (err) => {
      if (err && !res.headersSent) {
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/attachments/:id
 */
const deleteAttachment = async (req, res, next) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id, {
      include: [{ model: Article }],
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const userRole = req.user.role ? req.user.role.name : 'Employee';
    const article = await Article.findByPk(attachment.articleId);

    if (userRole !== 'Admin' && attachment.uploadedBy !== req.user.id && article && article.authorId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this attachment' });
    }

    // Delete file from disk
    const filePath = path.join(__dirname, '../../uploads', attachment.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await attachment.destroy();

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadAttachment, downloadAttachment, deleteAttachment };
