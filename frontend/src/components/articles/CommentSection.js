import React, { useState, useEffect } from 'react';
import { FiMessageCircle, FiTrash2, FiSend } from 'react-icons/fi';
import { getComments, addComment, deleteComment } from '../../services/articleService';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getInitials, timeAgo } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';

const CommentSection = ({ articleId }) => {
  const { user, userRole, isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await getComments(articleId);
      // service returns unwrapped: { comments, total, page, totalPages }
      setComments(data.comments || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    setError('');
    try {
      const data = await addComment(articleId, newComment.trim());
      // service returns unwrapped: { comment }
      setComments(prev => [data.comment || data, ...prev]);
      setNewComment('');
    } catch (err) {
      setError('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    setDeletingId(commentId);
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => (c._id || c.id) !== commentId));
    } catch (err) {
      console.error('Delete comment failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const canDelete = (comment) => {
    const commentUserId = comment.user?.id || comment.userId;
    const currentUserId = user?.id;
    return currentUserId === commentUserId || userRole === 'Admin';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <FiMessageCircle size={20} className="text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Add Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
              />
              {error && (
                <p className="text-red-500 text-xs mt-1">{error}</p>
              )}
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <FiSend size={14} />
                      <span>Post Comment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-600">
            Please{' '}
            <a href="/login" className="text-primary-600 font-medium hover:underline">
              sign in
            </a>{' '}
            to leave a comment.
          </p>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <FiMessageCircle size={32} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const commentId = comment._id || comment.id;
            const authorName = comment.author?.name || comment.authorName || 'Unknown User';
            return (
              <div key={commentId} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-sm font-semibold flex-shrink-0">
                  {getInitials(authorName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-gray-900">{authorName}</span>
                      <span className="text-xs text-gray-400">
                        {timeAgo(comment.createdAt)}
                      </span>
                    </div>
                    {canDelete(comment) && (
                      <button
                        onClick={() => handleDeleteComment(commentId)}
                        disabled={deletingId === commentId}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        {deletingId === commentId ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <FiTrash2 size={14} />
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{comment.text || comment.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
