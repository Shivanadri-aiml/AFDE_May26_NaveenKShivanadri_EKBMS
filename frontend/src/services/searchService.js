import api from './api';

export const search = async (query, filters = {}) => {
  const params = { q: query, ...filters };
  const response = await api.get('/search', { params });
  return response.data?.data ?? response.data;
};
