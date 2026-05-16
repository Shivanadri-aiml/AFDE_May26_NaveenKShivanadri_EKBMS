import api from './api';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data?.data ?? response.data;
};

export const register = async (name, email, password, role) => {
  const response = await api.post('/auth/register', { name, email, password, roleName: role });
  return response.data?.data ?? response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data?.data ?? response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data?.data ?? response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put('/auth/profile', data);
  return response.data?.data ?? response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put('/auth/change-password', { currentPassword, newPassword });
  return response.data?.data ?? response.data;
};
