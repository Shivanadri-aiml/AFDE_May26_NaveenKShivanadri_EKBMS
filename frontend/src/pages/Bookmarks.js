import React, { useState, useEffect } from 'react';
import { FiBookmark } from 'react-icons/fi';
import { getBookmarks, removeBookmark } from '../services/articleService';
import ArticleCard from '../components/articles/ArticleCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('-bookmarkedAt');

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    setLoading(true);
    setError('');
    try {
      // service returns unwrapped: { bookmarks, total }
      // each bookmark has b.Article (Sequelize model name — no alias on belongsTo)
      const data = await getBookmarks();
      const bookmarkRows = data.bookmarks || [];
      setBookmarks(bookmarkRows.map(b => ({
        ...(b.Article || b.article || b),
        isBookmarked: true,
        bookmarkedAt: b.createdAt
      })));
    } catch (err) {
      setError('Failed to load bookmarks.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkChange = (articleId, isBookmarked) => {
    if (!isBookmarked) {
      setBookmarks(prev => prev.filter(b => (b._id || b.id) !== articleId));
    }
  };

  const getSortedBookmarks = () => {
    return [...bookmarks].sort((a, b) => {
      switch (sortBy) {
        case '-bookmarkedAt':
          return new Date(b.bookmarkedAt || 0) - new Date(a.bookmarkedAt || 0);
        case '-viewCount':
          return (b.viewCount || 0) - (a.viewCount || 0);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case '-title':
          return (b.title || '').localeCompare(a.title || '');
        default:
          return 0;
      }
    });
  };

  const sorted = getSortedBookmarks();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookmarks</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {bookmarks.length} saved {bookmarks.length === 1 ? 'article' : 'articles'}
          </p>
        </div>
        {bookmarks.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="-bookmarkedAt">Recently Saved</option>
              <option value="-viewCount">Most Popular</option>
              <option value="title">Title A-Z</option>
              <option value="-title">Title Z-A</option>
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBookmark size={28} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No bookmarks yet</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
            Save articles you want to read later by clicking the bookmark icon on any article card.
          </p>
          <a
            href="/articles"
            className="inline-flex items-center px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            Browse Articles
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map(article => (
            <ArticleCard
              key={article._id || article.id}
              article={{ ...article, isBookmarked: true }}
              onBookmarkChange={handleBookmarkChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
