import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiFileText, FiCheckCircle, FiClock, FiUsers,
  FiFolder, FiEye, FiArrowRight, FiTrendingUp
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats } from '../services/analyticsService';
import { getArticles } from '../services/articleService';
import MetricCard from '../components/dashboard/MetricCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import { formatDate, getStatusColor } from '../utils/helpers';
import { STATUS_COLORS } from '../utils/constants';

const PIE_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard = () => {
  const { user, userRole } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentArticles, setRecentArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, articlesData] = await Promise.all([
          getDashboardStats().catch(() => null),
          getArticles({ page: 1, limit: 5, sort: 'newest' }).catch(() => null)
        ]);
        // Both services now return unwrapped data directly
        setStats(statsData || generateMockStats());
        setRecentArticles(articlesData?.articles || []);
      } catch (err) {
        setStats(generateMockStats());
        setError('Failed to load some dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const generateMockStats = () => ({
    totalArticles: 0,
    approvedArticles: 0,
    pendingApprovals: 0,
    activeUsers: 0,
    totalCategories: 0,
    totalViews: 0,
    articlesByCategory: [],
    articlesByStatus: [],
    recentActivity: []
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-500 text-sm mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Total Articles',
      value: stats?.totalArticles ?? 0,
      icon: FiFileText,
      color: 'blue',
      subtitle: 'All articles in system'
    },
    {
      title: 'Approved Articles',
      value: stats?.approvedArticles ?? 0,
      icon: FiCheckCircle,
      color: 'green',
      subtitle: 'Published & approved'
    },
    {
      title: 'Pending Approvals',
      value: stats?.pendingApprovals ?? 0,
      icon: FiClock,
      color: 'yellow',
      subtitle: 'Awaiting review'
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers ?? 0,
      icon: FiUsers,
      color: 'purple',
      subtitle: 'Registered users'
    },
    {
      title: 'Total Categories',
      value: stats?.totalCategories ?? 0,
      icon: FiFolder,
      color: 'indigo',
      subtitle: 'Knowledge categories'
    },
    {
      title: 'Total Views',
      value: stats?.totalViews ?? 0,
      icon: FiEye,
      color: 'red',
      subtitle: 'Article page views'
    }
  ];

  const categoryData = stats?.articlesByCategory?.length > 0
    ? stats.articlesByCategory
    : [
        { name: 'Technology', count: 0 },
        { name: 'HR', count: 0 },
        { name: 'Finance', count: 0 },
        { name: 'Operations', count: 0 }
      ];

  const statusData = stats?.articlesByStatus?.length > 0
    ? stats.articlesByStatus
    : [
        { name: 'Draft', value: 0 },
        { name: 'Pending', value: 0 },
        { name: 'Approved', value: 0 },
        { name: 'Rejected', value: 0 },
        { name: 'Archived', value: 0 }
      ];

  return (
    <div className="space-y-8">
      {/* Greeting Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting()}, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Here's what's happening with your knowledge base today.
          </p>
        </div>
        {(userRole === 'Admin' || userRole === 'Author') && (
          <Link
            to="/articles/create"
            className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm"
          >
            <span>+ New Article</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((card, index) => (
          <MetricCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            subtitle={card.subtitle}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Articles by Category Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800">Articles by Category</h3>
            <FiTrendingUp className="text-gray-400" size={18} />
          </div>
          {categoryData.length > 0 && categoryData.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No category data available
            </div>
          )}
        </div>

        {/* Articles by Status Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800">Articles by Status</h3>
            <FiFileText className="text-gray-400" size={18} />
          </div>
          {statusData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No status data available
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Articles */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800">Recent Articles</h3>
            <Link
              to="/articles"
              className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all <FiArrowRight size={15} className="ml-1" />
            </Link>
          </div>
          {recentArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <FiFileText size={24} className="mb-2" />
              <p className="text-sm">No articles yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentArticles.map((article) => {
                const articleId = article._id || article.id;
                const statusColor = STATUS_COLORS[article.status] || 'gray';
                return (
                  <Link
                    key={articleId}
                    to={`/articles/${articleId}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FiFileText size={14} className="text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 group-hover:text-primary-600 truncate">
                          {article.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {article.author?.name || 'Unknown'} · {formatDate(article.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge label={article.status} color={statusColor} />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Recent Activity</h3>
          <ActivityFeed activities={stats?.recentActivity || []} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
