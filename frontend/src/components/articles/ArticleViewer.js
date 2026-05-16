import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiEdit2, FiTrash2, FiSend, FiCheck, FiX, FiArchive,
  FiEye, FiCalendar, FiUser, FiTag, FiPaperclip, FiDownload
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ARTICLE_STATUS, STATUS_COLORS } from '../../utils/constants';
import {
  submitForApproval, approveArticle, rejectArticle,
  publishArticle, archiveArticle, deleteArticle
} from '../../services/articleService';
import { formatDate, formatFileSize, getStatusColor } from '../../utils/helpers';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';

const ArticleViewer = ({ article, onStatusChange }) => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [approveModal, setApproveModal] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [commentError, setCommentError] = useState('');

  if (!article) return null;

  const articleId = article.id;
  // user.role is { id, name } — use userRole (string) from context
  const isAuthor = userRole === ROLES.AUTHOR;
  const isReviewer = userRole === ROLES.REVIEWER;
  const isAdmin = userRole === ROLES.ADMIN;
  const isOwnArticle = user?.id === (article.author?.id || article.authorId);

  const statusColor = STATUS_COLORS[article.status] || 'gray';

  const handleAction = async (actionFn, actionName, successMessage) => {
    setActionLoading(actionName);
    try {
      await actionFn();
      onStatusChange && onStatusChange(successMessage);
    } catch (err) {
      console.error(`${actionName} failed:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitForApproval = () =>
    handleAction(() => submitForApproval(articleId), 'submit', ARTICLE_STATUS.PENDING);

  const handleApprove = async () => {
    setActionLoading('approve');
    try {
      await approveArticle(articleId, reviewComment);
      setApproveModal(false);
      setReviewComment('');
      onStatusChange && onStatusChange(ARTICLE_STATUS.APPROVED);
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!reviewComment.trim()) {
      setCommentError('Please provide a rejection reason.');
      return;
    }
    setActionLoading('reject');
    try {
      await rejectArticle(articleId, reviewComment);
      setRejectModal(false);
      setReviewComment('');
      setCommentError('');
      onStatusChange && onStatusChange(ARTICLE_STATUS.REJECTED);
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublish = () =>
    handleAction(() => publishArticle(articleId), 'publish', ARTICLE_STATUS.APPROVED);

  const handleArchive = () =>
    handleAction(() => archiveArticle(articleId), 'archive', ARTICLE_STATUS.ARCHIVED);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) return;
    setActionLoading('delete');
    try {
      await deleteArticle(articleId);
      navigate('/articles');
    } catch (err) {
      console.error('Delete failed:', err);
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Article Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        {/* Breadcrumb handled by parent */}

        {/* Status & Category */}
        <div className="flex items-center flex-wrap gap-2 mb-4">
          <Badge label={article.status || 'Draft'} color={statusColor} />
          {article.category && (
            <Badge label={article.category?.name || article.category} color="blue" />
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{article.title}</h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-1.5">
            <FiUser size={15} className="text-gray-400" />
            <span className="font-medium text-gray-700">
              {article.author?.name || article.authorName || 'Unknown Author'}
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <FiCalendar size={15} className="text-gray-400" />
            <span>{formatDate(article.updatedAt || article.createdAt)}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <FiEye size={15} className="text-gray-400" />
            <span>{(article.viewCount || 0).toLocaleString()} views</span>
          </div>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex items-center flex-wrap gap-2 mb-6">
            <FiTag size={14} className="text-gray-400" />
            {article.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium"
              >
                #{tag?.name || tag}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div
          className="article-content prose max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content || '' }}
        />

        {/* Attachments */}
        {article.attachments && article.attachments.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center space-x-2 mb-4">
              <FiPaperclip size={16} className="text-gray-500" />
              <h4 className="font-semibold text-gray-800">Attachments ({article.attachments.length})</h4>
            </div>
            <div className="space-y-2">
              {article.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded flex items-center justify-center">
                      <FiPaperclip size={14} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {attachment.name || attachment.filename}
                      </p>
                      {attachment.size && (
                        <p className="text-xs text-gray-400">{formatFileSize(attachment.size)}</p>
                      )}
                    </div>
                  </div>
                  <a
                    href={attachment.url || attachment.path}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <FiDownload size={13} />
                    <span>Download</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Actions</h4>
        <div className="flex flex-wrap gap-2">
          {/* Author actions */}
          {(isAuthor && isOwnArticle) || isAdmin ? (
            <>
              <button
                onClick={() => navigate(`/articles/${articleId}/edit`)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiEdit2 size={15} />
                <span>Edit</span>
              </button>
              {(article.status === ARTICLE_STATUS.DRAFT || article.status === ARTICLE_STATUS.REJECTED) && (
                <button
                  onClick={handleSubmitForApproval}
                  disabled={actionLoading === 'submit'}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === 'submit' ? <LoadingSpinner size="sm" /> : <FiSend size={15} />}
                  <span>Submit for Review</span>
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={actionLoading === 'delete'}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading === 'delete' ? <LoadingSpinner size="sm" /> : <FiTrash2 size={15} />}
                <span>Delete</span>
              </button>
            </>
          ) : null}

          {/* Reviewer/Admin actions */}
          {(isReviewer || isAdmin) && article.status === ARTICLE_STATUS.PENDING && (
            <>
              <button
                onClick={() => setApproveModal(true)}
                disabled={actionLoading === 'approve'}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <FiCheck size={15} />
                <span>Approve</span>
              </button>
              <button
                onClick={() => { setRejectModal(true); setReviewComment(''); setCommentError(''); }}
                disabled={actionLoading === 'reject'}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <FiX size={15} />
                <span>Reject</span>
              </button>
            </>
          )}

          {/* Admin-only actions */}
          {isAdmin && article.status === ARTICLE_STATUS.APPROVED && (
            <button
              onClick={handlePublish}
              disabled={actionLoading === 'publish'}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'publish' ? <LoadingSpinner size="sm" /> : <FiCheck size={15} />}
              <span>Publish</span>
            </button>
          )}
          {isAdmin && article.status !== ARTICLE_STATUS.ARCHIVED && (
            <button
              onClick={handleArchive}
              disabled={actionLoading === 'archive'}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'archive' ? <LoadingSpinner size="sm" /> : <FiArchive size={15} />}
              <span>Archive</span>
            </button>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      <Modal
        isOpen={approveModal}
        onClose={() => setApproveModal(false)}
        title="Approve Article"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You're about to approve <strong>"{article.title}"</strong>. You can optionally add a comment.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={3}
              placeholder="Add a comment for the author..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setApproveModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={actionLoading === 'approve'}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {actionLoading === 'approve' ? <LoadingSpinner size="sm" /> : <FiCheck size={14} />}
              <span>Confirm Approval</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModal}
        onClose={() => { setRejectModal(false); setCommentError(''); }}
        title="Reject Article"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Please provide a reason for rejecting <strong>"{article.title}"</strong>. This will be shared with the author.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => { setReviewComment(e.target.value); setCommentError(''); }}
              rows={4}
              placeholder="Explain why this article is being rejected..."
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                commentError ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {commentError && <p className="text-red-500 text-xs mt-1">{commentError}</p>}
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => { setRejectModal(false); setCommentError(''); }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={actionLoading === 'reject'}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading === 'reject' ? <LoadingSpinner size="sm" /> : <FiX size={14} />}
              <span>Confirm Rejection</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ArticleViewer;
