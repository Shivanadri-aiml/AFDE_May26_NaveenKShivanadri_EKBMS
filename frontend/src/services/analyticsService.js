import api from './api';

export const getDashboardStats = async () => {
  const response = await api.get('/analytics/dashboard');
  return response.data?.data ?? response.data;
};

export const getArticleAnalytics = async (params = {}) => {
  const response = await api.get('/analytics/articles', { params });
  return response.data?.data ?? response.data;
};

export const getUserAnalytics = async (params = {}) => {
  const response = await api.get('/analytics/users', { params });
  return response.data?.data ?? response.data;
};

export const getSearchTrends = async (params = {}) => {
  const response = await api.get('/analytics/search-trends', { params });
  return response.data?.data ?? response.data;
};
