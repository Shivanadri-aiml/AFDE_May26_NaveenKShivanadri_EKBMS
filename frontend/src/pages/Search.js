import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { search } from '../services/searchService';
import { getCategories } from '../services/categoryService';
import ArticleCard from '../components/articles/ArticleCard';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { debounce } from '../utils/helpers';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [allTags, setAllTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const LIMIT = 12;

  useEffect(() => {
    getCategories()
      .then(data => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  const performSearch = useCallback(async (searchQuery, page = 1) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const filters = {
        sort: sortBy,
        page,
        limit: LIMIT,
        ...(selectedCategories.length > 0 && { category: selectedCategories.join(',') }),
        ...(selectedTags.length > 0 && { tag: selectedTags.join(',') })
      };
      // service returns unwrapped: { articles, total, page, totalPages, query }
      const data = await search(searchQuery, filters);
      const articles = data.articles || [];
      setResults(articles);
      setTotal(data.total || articles.length);
      setTotalPages(data.totalPages || Math.ceil((data.total || articles.length) / LIMIT) || 1);

      // Extract unique tag names from results for filter
      const tags = [...new Set(articles.flatMap(a => (a.tags || []).map(t => t?.name || t)))];
      setAllTags(prev => [...new Set([...prev, ...tags])]);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [sortBy, selectedCategories, selectedTags]);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    setInputValue(q);
    if (q) performSearch(q, 1);
  }, [searchParams]);

  useEffect(() => {
    if (query) {
      setCurrentPage(1);
      performSearch(query, 1);
    }
  }, [sortBy, selectedCategories, selectedTags]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = inputValue.trim();
    if (q) {
      setSearchParams({ q });
      setCurrentPage(1);
      setQuery(q);
      performSearch(q, 1);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    performSearch(query, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleCategory = (catId) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedTags([]);
    setSortBy('relevance');
  };

  const hasFilters = selectedCategories.length > 0 || selectedTags.length > 0 || sortBy !== 'relevance';

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    return text; // Highlighting is applied through article card display
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Search</h1>
        <p className="text-sm text-gray-500 mt-0.5">Find articles across the knowledge base</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form onSubmit={handleSearchSubmit}>
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search articles, topics, tags..."
                autoFocus
                className="w-full pl-12 pr-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => { setInputValue(''); setQuery(''); setResults([]); setTotal(0); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX size={18} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors whitespace-nowrap"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-3 border rounded-xl text-sm font-medium transition-colors ${
                hasFilters || showFilters
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FiFilter size={16} />
              <span className="hidden sm:inline">Filters</span>
              {hasFilters && (
                <span className="w-4 h-4 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                  {selectedCategories.length + selectedTags.length + (sortBy !== 'relevance' ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results summary */}
      {query && !loading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {total > 0 ? (
              <>
                <span className="font-semibold">{total.toLocaleString()}</span> result{total !== 1 ? 's' : ''} found for{' '}
                <span className="font-semibold text-primary-600">"{query}"</span>
              </>
            ) : (
              <>No results found for <span className="font-semibold">"{query}"</span></>
            )}
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="relevance">Relevance</option>
              <option value="-createdAt">Latest</option>
              <option value="-viewCount">Most Popular</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Filter Sidebar */}
        {showFilters && (
          <aside className="w-56 flex-shrink-0 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Filters</h3>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-primary-600 hover:text-primary-700">
                    Clear all
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Categories</p>
                <div className="space-y-1.5">
                  {categories.map(cat => {
                    const catId = cat._id || cat.id;
                    return (
                      <label key={catId} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(catId)}
                          onChange={() => toggleCategory(catId)}
                          className="w-3.5 h-3.5 text-primary-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              {allTags.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.slice(0, 15).map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-primary-100 text-primary-700 border border-primary-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Results */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <LoadingSpinner size="lg" />
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map(article => (
                  <ArticleCard
                    key={article._id || article.id}
                    article={article}
                  />
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          ) : query && !loading ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <FiSearch size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No results found</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                We couldn't find any articles matching "{query}". Try different keywords or check your spelling.
              </p>
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Suggestions:</p>
                <ul className="space-y-1 text-gray-500">
                  <li>• Try more general keywords</li>
                  <li>• Check for spelling mistakes</li>
                  <li>• Browse categories instead</li>
                </ul>
              </div>
            </div>
          ) : !query ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <FiSearch size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Search the Knowledge Base</h3>
              <p className="text-gray-500 text-sm">Enter a search term above to find articles</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Search;
