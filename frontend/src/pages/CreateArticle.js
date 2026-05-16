import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiUpload, FiFile, FiTrash2, FiSend, FiSave } from 'react-icons/fi';
import { createArticle, uploadAttachment, submitForApproval } from '../services/articleService';
import { getCategories } from '../services/categoryService';
import ArticleEditor from '../components/articles/ArticleEditor';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FILE_TYPES, MAX_FILE_SIZE } from '../utils/constants';
import { formatFileSize } from '../utils/helpers';

const CreateArticle = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '',
    categoryId: '',
    content: '',
    tags: [],
    summary: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    getCategories()
      .then(data => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

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
    if (!FILE_TYPES.includes(ext)) {
      return `File type .${ext} is not allowed.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" exceeds 10MB limit.`;
    }
    return null;
  };

  const handleFileAdd = (files) => {
    setFileError('');
    const fileList = Array.from(files);
    for (const file of fileList) {
      const err = validateFile(file);
      if (err) {
        setFileError(err);
        return;
      }
    }
    setAttachments(prev => {
      const existing = prev.map(a => a.name);
      const newFiles = fileList.filter(f => !existing.includes(f.name));
      return [...prev, ...newFiles];
    });
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileAdd(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required.';
    if (!form.content || form.content === '<p><br></p>' || form.content.trim() === '') {
      newErrors.content = 'Article content is required.';
    }
    return newErrors;
  };

  const saveArticle = async (andSubmit = false) => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const setter = andSubmit ? setSubmitting : setSaving;
    setter(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content,
        tags: form.tags,
        summary: form.summary.trim(),
        ...(form.categoryId && { categoryId: form.categoryId })
      };
      // service returns unwrapped: { article }
      const response = await createArticle(payload);
      const newArticle = response.article || response;
      const articleId = newArticle.id;

      // Upload attachments
      for (const file of attachments) {
        const formData = new FormData();
        formData.append('file', file);
        await uploadAttachment(articleId, formData).catch(console.error);
      }

      // Submit for approval if requested
      if (andSubmit) {
        await submitForApproval(articleId).catch(console.error);
      }

      navigate(`/articles/${articleId}`);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to save article. Please try again.';
      setErrors({ api: msg });
    } finally {
      setter(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Article</h1>
          <p className="text-sm text-gray-500 mt-0.5">Write and publish knowledge articles</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/articles')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {errors.api && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {errors.api}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Article Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter a descriptive title..."
              className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                errors.title ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Summary <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="summary"
              value={form.summary}
              onChange={handleChange}
              placeholder="Brief description of the article..."
              rows={2}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
            />
          </div>

          {/* Content Editor */}
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
              placeholder="Write your article content here..."
            />
            {errors.content && <p className="text-red-500 text-xs mt-2">{errors.content}</p>}
          </div>

          {/* Attachments */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Attachments <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
            >
              <FiUpload size={24} className={`mx-auto mb-2 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`} />
              <p className="text-sm font-medium text-gray-700">Drop files here or click to upload</p>
              <p className="text-xs text-gray-400 mt-1">
                Supports: {FILE_TYPES.join(', ')} — Max 10MB per file
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={FILE_TYPES.map(t => `.${t.toLowerCase()}`).join(',')}
              onChange={(e) => handleFileAdd(e.target.files)}
              className="hidden"
            />
            {fileError && <p className="text-red-500 text-xs mt-2">{fileError}</p>}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <FiFile size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                      <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
                    </div>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <FiTrash2 size={14} />
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
              <option value="">Select a category...</option>
              {categories.map(cat => (
                <option key={cat._id || cat.id} value={cat._id || cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className={`min-h-[80px] border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent`}>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full"
                  >
                    <span>#{tag}</span>
                    <button onClick={() => removeTag(tag)} className="hover:text-primary-900">
                      <FiX size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={form.tags.length === 0 ? "Type tag and press Enter..." : "Add more tags..."}
                className="w-full text-sm bg-transparent outline-none placeholder-gray-400"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add tags</p>
          </div>

          {/* Save Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Publish</h3>
            <button
              onClick={() => saveArticle(false)}
              disabled={saving || submitting}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {saving ? <LoadingSpinner size="sm" /> : <FiSave size={16} />}
              <span>Save as Draft</span>
            </button>
            <button
              onClick={() => saveArticle(true)}
              disabled={saving || submitting}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? <LoadingSpinner size="sm" /> : <FiSend size={16} />}
              <span>Submit for Review</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateArticle;
