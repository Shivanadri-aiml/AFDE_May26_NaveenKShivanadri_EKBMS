import api from './api';

export const getArticles = async (params = {}) => {
  const response = await api.get('/articles', { params });
  return response.data?.data ?? response.data;
};

export const getArticle = async (id) => {
  const response = await api.get(`/articles/${id}`);
  return response.data?.data ?? response.data;
};

export const createArticle = async (data) => {
  const response = await api.post('/articles', data);
  return response.data?.data ?? response.data;
};

export const updateArticle = async (id, data) => {
  const response = await api.put(`/articles/${id}`, data);
  return response.data?.data ?? response.data;
};

export const deleteArticle = async (id) => {
  const response = await api.delete(`/articles/${id}`);
  return response.data?.data ?? response.data;
};

export const submitForApproval = async (id) => {
  const response = await api.post(`/articles/${id}/submit`);
  return response.data?.data ?? response.data;
};

// Approval actions live at /approvals/:id/...
export const approveArticle = async (id, comment = '') => {
  const response = await api.post(`/approvals/${id}/approve`, { comment });
  return response.data?.data ?? response.data;
};

export const rejectArticle = async (id, comment) => {
  const response = await api.post(`/approvals/${id}/reject`, { comment });
  return response.data?.data ?? response.data;
};

export const publishArticle = async (id) => {
  const response = await api.post(`/articles/${id}/publish`);
  return response.data?.data ?? response.data;
};

export const archiveArticle = async (id) => {
  const response = await api.post(`/articles/${id}/archive`);
  return response.data?.data ?? response.data;
};

export const uploadAttachment = async (articleId, formData) => {
  const response = await api.post(`/articles/${articleId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data?.data ?? response.data;
};

// Backend route: DELETE /api/attachments/:id
export const deleteAttachment = async (attachmentId) => {
  const response = await api.delete(`/attachments/${attachmentId}`);
  return response.data?.data ?? response.data;
};

export const getComments = async (articleId) => {
  const response = await api.get(`/articles/${articleId}/comments`);
  return response.data?.data ?? response.data;
};

// Backend expects { content } not { text }
export const addComment = async (articleId, text) => {
  const response = await api.post(`/articles/${articleId}/comments`, { content: text });
  return response.data?.data ?? response.data;
};

export const deleteComment = async (commentId) => {
  const response = await api.delete(`/comments/${commentId}`);
  return response.data?.data ?? response.data;
};

export const rateArticle = async (articleId, rating) => {
  const response = await api.post(`/articles/${articleId}/rate`, { rating });
  return response.data?.data ?? response.data;
};

export const getBookmarks = async () => {
  const response = await api.get('/bookmarks');
  return response.data?.data ?? response.data;
};

export const addBookmark = async (articleId) => {
  const response = await api.post(`/bookmarks/${articleId}`);
  return response.data?.data ?? response.data;
};

export const removeBookmark = async (articleId) => {
  const response = await api.delete(`/bookmarks/${articleId}`);
  return response.data?.data ?? response.data;
};
