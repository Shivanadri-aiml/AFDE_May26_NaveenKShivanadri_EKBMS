import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCheck, FiX, FiClock, FiEye, FiCheckSquare
} from 'react-icons/fi';
import { getArticles, approveArticle, rejectArticle } from '../services/articleService';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import { formatDate } from '../utils/helpers';
import { ARTICLE_STATUS } from '../utils/constants';

const ApprovalQueue = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // Modal state
  const [actionModal, setActionModal] = useState({ open: false, type: '', article: null });
  const [reviewComment, setReviewComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const LIMIT = 10;

  useEffect(() => {
    fetchArticles();
  }, [activeTab, currentPage]);

  useEffect(() => {
    // Always get pending count (service now returns unwrapped data)
    getArticles({ status: ARTICLE_STATUS.PENDING, limit: 1 })
      .then(data => setPendingCount(data.total || 0))
      .catch(() => {});
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    setError('');
    try {
      const statusParam = activeTab === 'pending'
        ? ARTICLE_STATUS.PENDING
        : `${ARTICLE_STATUS.APPROVED},${ARTICLE_STATUS.REJECTED}`;

      const data = await getArticles({
        status: activeTab === 'pending' ? ARTICLE_STATUS.PENDING : undefined,
        page: currentPage,
        limit: LIMIT,
        sort: '-updatedAt'
      });

      // service returns unwrapped: { articles, total, page, totalPages }
      let filtered = data.articles || [];
      if (activeTab === 'history') {
        filtered = filtered.filter(a =>
          a.status === ARTICLE_STATUS.APPROVED || a.status === ARTICLE_STATUS.REJECTED
        );
      } else {
        filtered = filtered.filter(a => a.status === ARTICLE_STATUS.PENDING);
      }

      setArticles(filtered);
      setTotal(data.total || filtered.length);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError('Failed to load articles.');
    } finally {
      setLoading(false);
    }
  };

  const openApproveModal = (article) => {
    setActionModal({ open: true, type: 'approve', article });
    setReviewComment('');
    setCommentError('');
  };

  const openRejectModal = (article) => {
    setActionModal({ open: true, type: 'reject', article });
    setReviewComment('');
    setCommentError('');
  };

  const closeModal = () => {
    setActionModal({ open: false, type: '', article: null });
    setReviewComment('');
    setCommentError('');
  };

  const handleApprove = async () => {
    const articleId = actionModal.article?._id || actionModal.article?.id;
    setActionLoading(true);
    try {
      await approveArticle(articleId, reviewComment);
      setArticles(prev => prev.filter(a => (a._id || a.id) !== articleId));
      setPendingCount(prev => Math.max(0, prev - 1));
      closeModal();
    } catch (err) {
      setCommentError(err?.response?.data?.message || 'Approval failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reviewComment.trim()) {
      setCommentError('Please provide a rejection reason.');
      return;
    }
    const articleId = actionModal.article?._id || actionModal.article?.id;
    setActionLoading(true);
    try {
      await rejectArticle(articleId, reviewComment);
      setArticles(prev => prev.filter(a => (a._id || a.id) !== articleId));
      setPendingCount(prev => Math.max(0, prev - 1));
      closeModal();
    } catch (err) {
      setCommentError(err?.response?.data?.message || 'Rejection failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { id: 'pending', label: 'Pending Review', count: pendingCount },
    { id: 'history', label: 'Review History' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approval Queue</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and approve submitted articles</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center h-48 items-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FiCheckSquare size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {activeTab === 'pending' ? 'No pending reviews' : 'No review history'}
          </h3>
          <p className="text-gray-500 text-sm">
            {activeTab === 'pending'
              ? 'All articles have been reviewed. Check back later.'
              : 'No articles have been reviewed yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {articles.map(article => {
                    const articleId = article._id || article.id;
                    const statusColors = { 'Pending Approval': 'yellow', 'Approved': 'green', 'Rejected': 'red' };
                    return (
                      <tr key={articleId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 max-w-xs">
                          <Link
                            to={`/articles/${articleId}`}
                            className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-2"
                          >
                            {article.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 font-medium">
                            {article.author?.name || article.authorName || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-400">{article.author?.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {article.category?.name || article.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-1.5 text-sm text-gray-500">
                            <FiClock size={13} className="text-gray-400" />
                            <span>{formatDate(article.updatedAt || article.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge
                            label={article.status}
                            color={statusColors[article.status] || 'gray'}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/articles/${articleId}`}
                              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="View article"
                            >
                              <FiEye size={16} />
                            </Link>
                            {article.status === ARTICLE_STATUS.PENDING && (
                              <>
                                <button
                                  onClick={() => openApproveModal(article)}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  <FiCheck size={13} />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => openRejectModal(article)}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
                                >
                                  <FiX size={13} />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">{total} {total === 1 ? 'article' : 'articles'} total</p>
            </div>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => { setCurrentPage(p); }} />
        </>
      )}

      {/* Approve Modal */}
      <Modal
        isOpen={actionModal.open && actionModal.type === 'approve'}
        onClose={closeModal}
        title="Approve Article"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Approving: <strong>"{actionModal.article?.title}"</strong>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Comment (optional)</label>
            <textarea
              value={reviewComment}
              onChange={(e) => { setReviewComment(e.target.value); setCommentError(''); }}
              rows={3}
              placeholder="Add feedback for the author..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            {commentError && <p className="text-red-500 text-xs mt-1">{commentError}</p>}
          </div>
          <div className="flex justify-end space-x-3">
            <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {actionLoading ? <LoadingSpinner size="sm" /> : <FiCheck size={14} />}
              <span>Approve</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={actionModal.open && actionModal.type === 'reject'}
        onClose={closeModal}
        title="Reject Article"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Rejecting: <strong>"{actionModal.article?.title}"</strong>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => { setReviewComment(e.target.value); setCommentError(''); }}
              rows={4}
              placeholder="Explain why this article is being rejected..."
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${commentError ? 'border-red-400' : 'border-gray-300'}`}
            />
            {commentError && <p className="text-red-500 text-xs mt-1">{commentError}</p>}
          </div>
          <div className="flex justify-end space-x-3">
            <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading ? <LoadingSpinner size="sm" /> : <FiX size={14} />}
              <span>Reject</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ApprovalQueue;
