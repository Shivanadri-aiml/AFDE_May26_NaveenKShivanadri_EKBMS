import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { FiFileText, FiUsers, FiEye, FiSearch, FiBarChart2, FiRefreshCw } from 'react-icons/fi';
import { getDashboardStats, getArticleAnalytics, getUserAnalytics, getSearchTrends } from '../services/analyticsService';
import MetricCard from '../components/dashboard/MetricCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PIE_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6'];
const BAR_COLOR = '#2563eb';

const dateRanges = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' }
];

const Reports = () => {
  const [dateRange, setDateRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [articleAnalytics, setArticleAnalytics] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [searchTrends, setSearchTrends] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, [dateRange]);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    const params = { days: dateRange === 'all' ? undefined : parseInt(dateRange) };
    try {
      const [dashStats, artAnalytics, userAnal, searchData] = await Promise.all([
        getDashboardStats().catch(() => null),
        getArticleAnalytics(params).catch(() => null),
        getUserAnalytics(params).catch(() => null),
        getSearchTrends(params).catch(() => null)
      ]);
      setStats(dashStats || {});
      setArticleAnalytics(artAnalytics || {});
      setUserAnalytics(userAnal || {});
      setSearchTrends(searchData || {});
    } catch (err) {
      setError('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  // Sample data fallbacks
  const monthlyData = articleAnalytics?.monthly || [
    { month: 'Jan', articles: 0 }, { month: 'Feb', articles: 0 }, { month: 'Mar', articles: 0 },
    { month: 'Apr', articles: 0 }, { month: 'May', articles: 0 }, { month: 'Jun', articles: 0 },
    { month: 'Jul', articles: 0 }, { month: 'Aug', articles: 0 }, { month: 'Sep', articles: 0 },
    { month: 'Oct', articles: 0 }, { month: 'Nov', articles: 0 }, { month: 'Dec', articles: 0 }
  ];

  const statusData = stats?.articlesByStatus || [
    { name: 'Draft', value: 0 }, { name: 'Pending', value: 0 },
    { name: 'Approved', value: 0 }, { name: 'Rejected', value: 0 }, { name: 'Archived', value: 0 }
  ];

  const topArticles = articleAnalytics?.topArticles || [];
  const topCategories = articleAnalytics?.topCategories || stats?.articlesByCategory || [];
  const topAuthors = userAnalytics?.topAuthors || [];
  const searchTerms = searchTrends?.topSearches || [];

  const overviewCards = [
    { title: 'Total Articles', value: stats?.totalArticles ?? 0, icon: FiFileText, color: 'blue' },
    { title: 'Total Users', value: stats?.activeUsers ?? 0, icon: FiUsers, color: 'purple' },
    { title: 'Total Views', value: stats?.totalViews ?? 0, icon: FiEye, color: 'green' },
    { title: 'Total Searches', value: stats?.totalSearches ?? searchTrends?.totalSearches ?? 0, icon: FiSearch, color: 'yellow' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Insights and statistics for your knowledge base</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            {dateRanges.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button
            onClick={fetchAllData}
            className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
          >
            <FiRefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card, i) => (
          <MetricCard key={i} title={card.title} value={card.value} icon={card.icon} color={card.color} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Articles */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800">Articles Created (Monthly)</h3>
            <FiBarChart2 size={18} className="text-gray-400" />
          </div>
          {monthlyData.some(d => d.articles > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Bar dataKey="articles" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data available</div>
          )}
        </div>

        {/* Articles by Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800">Articles by Status</h3>
            <FiFileText size={18} className="text-gray-400" />
          </div>
          {statusData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data available</div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Articles */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Top 10 Most Viewed Articles</h3>
          {topArticles.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topArticles.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="title"
                  type="category"
                  width={120}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v.length > 15 ? v.substring(0, 15) + '...' : v}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  formatter={(val) => [val.toLocaleString(), 'Views']}
                />
                <Bar dataKey="viewCount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data available</div>
          )}
        </div>

        {/* Popular Categories */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Articles by Category</h3>
          {topCategories.length > 0 && topCategories.some(c => (c.count || c.articles) > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topCategories} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v.length > 8 ? v.substring(0, 8) + '..' : v}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data available</div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Active Authors */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-800">Most Active Authors</h3>
          </div>
          {topAuthors.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {topAuthors.slice(0, 8).map((author, index) => (
                <div key={index} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 text-sm text-gray-400 font-medium">{index + 1}.</span>
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {(author.name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{author.name}</p>
                      <p className="text-xs text-gray-400">{author.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{author.articleCount || 0}</p>
                    <p className="text-xs text-gray-400">articles</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No data available</div>
          )}
        </div>

        {/* Top Search Terms */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-800">Top Search Terms</h3>
          </div>
          {searchTerms.length > 0 ? (
            <div className="p-6">
              <div className="space-y-3">
                {searchTerms.slice(0, 8).map((term, index) => {
                  const maxCount = Math.max(...searchTerms.map(t => t.count || 0), 1);
                  const percentage = Math.round(((term.count || 0) / maxCount) * 100);
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">"{term.query || term.term}"</span>
                        <span className="text-gray-500">{term.count || 0}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-400 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No search data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
