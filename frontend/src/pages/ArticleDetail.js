import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiHome, FiChevronRight } from 'react-icons/fi';
import { getArticle, getArticles } from '../services/articleService';
import ArticleViewer from '../components/articles/ArticleViewer';
import RatingStars from '../components/articles/RatingStars';
import CommentSection from '../components/articles/CommentSection';
import ArticleCard from '../components/articles/ArticleCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    setLoading(true);
    setError('');
    try {
      // service returns unwrapped: { article, isBookmarked, userRating }
      const data = await getArticle(id);
      const articleData = data.article || data;
      setArticle(articleData);

      // Fetch related articles by category
      if (articleData?.category || articleData?.categoryId) {
        const categoryId = articleData.category?.id || articleData.categoryId;
        if (categoryId) {
          const related = await getArticles({ categoryId, limit: 4, status: 'Approved' }).catch(() => null);
          if (related) {
            // service returns unwrapped: { articles }
            const articles = related.articles || [];
            setRelatedArticles(articles.filter(a => String(a.id) !== String(id)).slice(0, 3));
          }
        }
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setError('Article not found.');
      } else {
        setError('Failed to load article. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    setArticle(prev => ({ ...prev, status: newStatus }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <div className="text-red-400 text-5xl mb-4">⚠</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{error}</h3>
        <button
          onClick={() => navigate('/articles')}
          className="mt-4 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
        >
          Back to Articles
        </button>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <Link to="/dashboard" className="flex items-center hover:text-primary-600 transition-colors">
          <FiHome size={15} className="mr-1" />
          Home
        </Link>
        <FiChevronRight size={14} className="text-gray-400" />
        <Link to="/articles" className="hover:text-primary-600 transition-colors">
          Articles
        </Link>
        <FiChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-800 font-medium truncate max-w-xs">{article.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <ArticleViewer article={article} onStatusChange={handleStatusChange} />

          {/* Rating */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Rate this Article</h3>
            <RatingStars
              articleId={article._id || article.id}
              currentRating={article.averageRating || article.rating || 0}
              userRating={article.userRating || 0}
              totalRatings={article.totalRatings || article.ratingCount || 0}
            />
          </div>

          {/* Comments */}
          <CommentSection articleId={article._id || article.id} />
        </div>

        {/* Sidebar - Related Articles */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">
              Related Articles
            </h3>
            {relatedArticles.length > 0 ? (
              <div className="space-y-3">
                {relatedArticles.map(related => (
                  <Link
                    key={related._id || related.id}
                    to={`/articles/${related._id || related.id}`}
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <p className="text-sm font-medium text-gray-800 group-hover:text-primary-600 line-clamp-2 leading-tight">
                      {related.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {related.author?.name || 'Unknown'}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                No related articles found
              </p>
            )}
          </div>

          {/* Article Info Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">
              Article Info
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Category</span>
                <span className="font-medium text-gray-700">
                  {article.category?.name || article.category || 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Views</span>
                <span className="font-medium text-gray-700">
                  {(article.viewCount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Comments</span>
                <span className="font-medium text-gray-700">{article.commentCount || 0}</span>
              </div>
              {article.tags && article.tags.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-gray-500 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {article.tags.map((tag, i) => (
                      <Link
                        key={i}
                        to={`/search?q=${encodeURIComponent(tag?.name || tag)}`}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md hover:bg-primary-100 hover:text-primary-700 transition-colors"
                      >
                        #{tag?.name || tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
