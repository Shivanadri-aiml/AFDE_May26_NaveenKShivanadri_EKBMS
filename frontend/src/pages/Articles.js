import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiFilter, FiFileText } from 'react-icons/fi';
import { getArticles } from '../services/articleService';
import { getCategories } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import ArticleCard from '../components/articles/ArticleCard';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ARTICLE_STATUS } from '../utils/constants';

const Articles = () => {
  const { user, userRole } = useAuth();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    categoryId: '',
    sort: '-createdAt'
  });

  const canCreate = userRole === 'Admin' || userRole === 'Author';
  const LIMIT = 12;

  useEffect(() => {
    getCategories()
      .then(data => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit: LIMIT,
        ...(filters.status && { status: filters.status }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        sort: filters.sort
      };
      const data = await getArticles(params);
      // service returns unwrapped: { articles, total, page, totalPages }
      setArticles(data.articles || []);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / LIMIT) || 1);
      setTotalCount(data.total || 0);
    } catch (err) {
      setError('Failed to load articles. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookmarkChange = (articleId, newState) => {
    setArticles(prev =>
      prev.map(a =>
        (a._id || a.id) === articleId ? { ...a, isBookmarked: newState } : a
      )
    );
  };

  const sortOptions = [
    { value: '-createdAt', label: 'Latest' },
    { value: '-viewCount', label: 'Most Popular' },
    { value: 'title', label: 'Title A-Z' },
    { value: '-title', label: 'Title Z-A' }
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: ARTICLE_STATUS.DRAFT, label: 'Draft' },
    { value: ARTICLE_STATUS.PENDING, label: 'Pending Approval' },
    { value: ARTICLE_STATUS.APPROVED, label: 'Approved' },
    { value: ARTICLE_STATUS.REJECTED, label: 'Rejected' },
    { value: ARTICLE_STATUS.ARCHIVED, label: 'Archived' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalCount > 0 ? `${totalCount.toLocaleString()} articles found` : 'Browse all knowledge articles'}
          </p>
        </div>
        {canCreate && (
          <Link
            to="/articles/create"
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <FiPlus size={18} />
            <span>Create Article</span>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600 font-medium">
            <FiFilter size={16} />
            <span>Filters:</span>
          </div>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={filters.categoryId}
            onChange={(e) => handleFilterChange('categoryId', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id || cat.id} value={cat._id || cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <div className="flex items-center space-x-2 ml-auto">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-red-500 mb-2">
            <FiFileText size={32} className="mx-auto opacity-50" />
          </div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchArticles}
            className="mt-4 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FiFileText size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No articles found</h3>
          <p className="text-gray-500 text-sm mb-6">
            {filters.status || filters.categoryId
              ? 'Try adjusting your filters to find articles.'
              : 'No articles have been created yet.'}
          </p>
          {canCreate && (
            <Link
              to="/articles/create"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
            >
              <FiPlus size={16} />
              <span>Create First Article</span>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {articles.map((article) => (
              <ArticleCard
                key={article._id || article.id}
                article={article}
                onBookmarkChange={handleBookmarkChange}
              />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default Articles;
