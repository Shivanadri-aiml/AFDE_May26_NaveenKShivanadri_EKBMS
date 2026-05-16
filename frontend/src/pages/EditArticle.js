import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiX, FiUpload, FiFile, FiTrash2, FiSave } from 'react-icons/fi';
import { getArticle, updateArticle, uploadAttachment, deleteAttachment } from '../services/articleService';
import { getCategories } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import ArticleEditor from '../components/articles/ArticleEditor';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FILE_TYPES, MAX_FILE_SIZE, ARTICLE_STATUS } from '../utils/constants';
import { formatFileSize } from '../utils/helpers';

const EditArticle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const fileInputRef = useRef(null);
  const [article, setArticle] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '',
    categoryId: '',
    content: '',
    tags: [],
    summary: '',
    status: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [newAttachments, setNewAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    Promise.all([
      getArticle(id),
      getCategories().catch(() => ({ categories: [] }))
    ]).then(([articleData, catData]) => {
      const art = articleData.article || articleData;
      setArticle(art);
      setCategories(catData.categories || catData || []);
      setForm({
        title: art.title || '',
        categoryId: art.category?._id || art.category?.id || art.categoryId || '',
        content: art.content || '',
        tags: (art.tags || []).map(t => t?.name || t),
        summary: art.summary || art.description || '',
        status: art.status || ARTICLE_STATUS.DRAFT
      });
      setExistingAttachments(art.attachments || []);
    }).catch(() => {
      setErrors({ api: 'Failed to load article.' });
    }).finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleTagKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,/g, '');
      if (tag && !form.tags.includes(tag)) {
        setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const validateFile = (file) => {
    const ext = file.name.split('.').pop().toUpperCase();
    if (!FILE_TYPES.includes(ext)) return `File type .${ext} is not allowed.`;
    if (file.size > MAX_FILE_SIZE) return `File "${file.name}" exceeds 10MB limit.`;
    return null;
  };

  const handleFileAdd = (files) => {
    setFileError('');
    const fileList = Array.from(files);
    for (const file of fileList) {
      const err = validateFile(file);
      if (err) { setFileError(err); return; }
    }
    setNewAttachments(prev => [...prev, ...fileList]);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileAdd(e.dataTransfer.files);
  };

  const removeExistingAttachment = async (attachment) => {
    const attachId = attachment._id || attachment.id;
    if (!window.confirm('Remove this attachment?')) return;
    try {
      await deleteAttachment(id, attachId);
      setExistingAttachments(prev => prev.filter(a => (a._id || a.id) !== attachId));
    } catch (err) {
      console.error('Failed to delete attachment:', err);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required.';
    if (!form.content || form.content === '<p><br></p>' || form.content.trim() === '') {
      newErrors.content = 'Content is required.';
    }
    return newErrors;
  };

  const handleSave = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content,
        tags: form.tags,
        summary: form.summary.trim(),
        ...(form.categoryId && { categoryId: form.categoryId }),
        ...(userRole === 'Admin' && { status: form.status })
      };
      await updateArticle(id, payload);

      // Upload new attachments
      for (const file of newAttachments) {
        const formData = new FormData();
        formData.append('file', file);
        await uploadAttachment(id, formData).catch(console.error);
      }

      navigate(`/articles/${id}`);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update article.';
      setErrors({ api: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Article</h1>
          <p className="text-sm text-gray-500 mt-0.5">Update article content and settings</p>
        </div>
        <button
          onClick={() => navigate(`/articles/${id}`)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      {errors.api && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {errors.api}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${errors.title ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
            <textarea
              name="summary"
              value={form.summary}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <ArticleEditor
              value={form.content}
              onChange={(content) => {
                setForm(prev => ({ ...prev, content }));
                if (errors.content) setErrors(prev => ({ ...prev, content: '' }));
              }}
            />
            {errors.content && <p className="text-red-500 text-xs mt-2">{errors.content}</p>}
          </div>

          {/* Attachments */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-3">Attachments</label>

            {/* Existing */}
            {existingAttachments.length > 0 && (
              <div className="mb-3 space-y-2">
                <p className="text-xs text-gray-500 mb-1">Existing files:</p>
                {existingAttachments.map((att, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <FiFile size={15} className="text-blue-500" />
                      <span className="text-sm text-gray-700 truncate">{att.name || att.filename}</span>
                      {att.size && <span className="text-xs text-gray-400">{formatFileSize(att.size)}</span>}
                    </div>
                    <button onClick={() => removeExistingAttachment(att)} className="p-1 text-gray-400 hover:text-red-500">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
            >
              <FiUpload size={20} className="mx-auto mb-1 text-gray-400" />
              <p className="text-sm text-gray-600">Drop files or click to upload</p>
              <p className="text-xs text-gray-400 mt-0.5">Max 10MB per file</p>
            </div>
            <input ref={fileInputRef} type="file" multiple onChange={(e) => handleFileAdd(e.target.files)} className="hidden" />
            {fileError && <p className="text-red-500 text-xs mt-1">{fileError}</p>}

            {newAttachments.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {newAttachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FiFile size={14} className="text-gray-400" />
                      <span className="text-xs text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
                    </div>
                    <button onClick={() => setNewAttachments(prev => prev.filter((_, i) => i !== index))} className="text-gray-400 hover:text-red-500">
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Category */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="">No category</option>
              {categories.map(cat => (
                <option key={cat._id || cat.id} value={cat._id || cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="min-h-[72px] border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-primary-500">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center space-x-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                    <span>#{tag}</span>
                    <button onClick={() => removeTag(tag)}><FiX size={11} /></button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tags..."
                className="w-full text-sm bg-transparent outline-none placeholder-gray-400"
              />
            </div>
          </div>

          {/* Admin Status */}
          {userRole === 'Admin' && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                {Object.values(ARTICLE_STATUS).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <LoadingSpinner size="sm" /> : <FiSave size={16} />}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditArticle;
