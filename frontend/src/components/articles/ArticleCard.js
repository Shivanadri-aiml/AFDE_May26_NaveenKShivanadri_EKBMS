import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiMessageCircle, FiStar, FiBookmark, FiClock, FiUser } from 'react-icons/fi';
import { formatDate, truncateText, getStatusColor, getInitials } from '../../utils/helpers';
import { STATUS_COLORS } from '../../utils/constants';
import Badge from '../common/Badge';
import { addBookmark, removeBookmark } from '../../services/articleService';

const ArticleCard = ({ article, onBookmarkChange }) => {
  const [isBookmarked, setIsBookmarked] = useState(article?.isBookmarked || false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const statusColor = STATUS_COLORS[article?.status] || 'gray';

  const handleBookmarkToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (bookmarkLoading) return;

    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await removeBookmark(article._id || article.id);
        setIsBookmarked(false);
      } else {
        await addBookmark(article._id || article.id);
        setIsBookmarked(true);
      }
      onBookmarkChange && onBookmarkChange(article._id || article.id, !isBookmarked);
    } catch (error) {
      console.error('Bookmark toggle failed:', error);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const articleId = article?._id || article?.id;
  const displayTags = article?.tags?.slice(0, 3) || [];
  const description = article?.summary || article?.description || '';
  const plainDescription = description.replace(/<[^>]+>/g, '');

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group">
      <div className="p-5 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2 flex-wrap gap-1">
            {article?.category && (
              <Badge label={article.category?.name || article.category} color="blue" />
            )}
            <Badge label={article?.status || 'Draft'} color={statusColor} />
          </div>
          <button
            onClick={handleBookmarkToggle}
            disabled={bookmarkLoading}
            className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ml-2 ${
              isBookmarked
                ? 'text-primary-600 bg-primary-50 hover:bg-primary-100'
                : 'text-gray-400 hover:text-primary-600 hover:bg-primary-50'
            }`}
          >
            <FiBookmark
              size={16}
              className={isBookmarked ? 'fill-current' : ''}
            />
          </button>
        </div>

        {/* Title */}
        <Link to={`/articles/${articleId}`}>
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-2 line-clamp-2 leading-tight">
            {article?.title || 'Untitled Article'}
          </h3>
        </Link>

        {/* Description */}
        {plainDescription && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
            {truncateText(plainDescription, 120)}
          </p>
        )}

        {/* Tags */}
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {displayTags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md font-medium"
              >
                #{tag?.name || tag}
              </span>
            ))}
            {article?.tags?.length > 3 && (
              <span className="text-xs text-gray-400">+{article.tags.length - 3} more</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-primary-700">
                {getInitials(article?.author?.name || article?.authorName || 'U')}
              </span>
            </div>
            <span className="text-xs text-gray-600 font-medium">
              {article?.author?.name || article?.authorName || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center space-x-3 text-xs text-gray-400">
            <span className="flex items-center space-x-1">
              <FiEye size={12} />
              <span>{(article?.viewCount || 0).toLocaleString()}</span>
            </span>
            <span className="flex items-center space-x-1">
              <FiMessageCircle size={12} />
              <span>{article?.commentCount || 0}</span>
            </span>
            {article?.rating > 0 && (
              <span className="flex items-center space-x-1">
                <FiStar size={12} className="text-yellow-400" />
                <span>{Number(article.rating).toFixed(1)}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center mt-1.5 text-xs text-gray-400">
          <FiClock size={11} className="mr-1" />
          <span>{formatDate(article?.updatedAt || article?.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
