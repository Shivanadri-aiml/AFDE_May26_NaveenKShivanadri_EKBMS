import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiEdit2, FiSave, FiX, FiLock, FiUser, FiMail, FiCalendar,
  FiFileText, FiCheck, FiClock, FiEye, FiEyeOff
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword } from '../services/authService';
import { getArticles } from '../services/articleService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import { formatDate, getInitials } from '../utils/helpers';
import { ARTICLE_STATUS, STATUS_COLORS } from '../utils/constants';

const Profile = () => {
  const { user, userRole, updateUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [profileLoading, setSaveProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  const [myArticles, setMyArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [activityStats, setActivityStats] = useState({ total: 0, approved: 0, pending: 0, draft: 0 });

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', email: user.email || '' });
    }
  }, [user]);

  useEffect(() => {
    fetchMyArticles();
  }, []);

  const fetchMyArticles = async () => {
    setArticlesLoading(true);
    try {
      // Pass authorId (user.id); service returns unwrapped: { articles, total }
      const data = await getArticles({ authorId: user?.id, limit: 10, sort: 'newest' });
      const articles = data.articles || [];
      setMyArticles(articles);
      setActivityStats({
        total: articles.length,
        approved: articles.filter(a => a.status === ARTICLE_STATUS.APPROVED).length,
        pending: articles.filter(a => a.status === ARTICLE_STATUS.PENDING).length,
        draft: articles.filter(a => a.status === ARTICLE_STATUS.DRAFT).length
      });
    } catch (err) {
      console.error('Failed to load articles:', err);
    } finally {
      setArticlesLoading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) { setProfileError('Name is required.'); return; }
    setSaveProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const data = await updateProfile({ name: profileForm.name.trim(), email: profileForm.email.trim() });
      updateUser(data.user || data);
      setProfileSuccess('Profile updated successfully!');
      setEditMode(false);
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      setProfileError(err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaveProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (!passwordForm.currentPassword) { setPasswordError('Current password required.'); return; }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.'); return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match.'); return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      setPasswordError(err?.response?.data?.message || 'Failed to change password. Check your current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const roleColors = { Admin: 'purple', Author: 'blue', Reviewer: 'green', Employee: 'gray' };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {getInitials(user?.name)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <Badge label={userRole} color={roleColors[userRole] || 'gray'} className="mt-1" />
                </div>
              </div>
              {!editMode ? (
                <button
                  onClick={() => { setEditMode(true); setProfileError(''); setProfileSuccess(''); }}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiEdit2 size={14} />
                  <span>Edit</span>
                </button>
              ) : (
                <button
                  onClick={() => { setEditMode(false); setProfileForm({ name: user?.name || '', email: user?.email || '' }); }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <FiX size={18} />
                </button>
              )}
            </div>

            {profileSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center space-x-2">
                <FiCheck size={15} />
                <span>{profileSuccess}</span>
              </div>
            )}

            {editMode ? (
              <form onSubmit={handleProfileSave} className="space-y-4">
                {profileError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{profileError}</div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <FiUser size={14} className="inline mr-1" /> Full Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <FiMail size={14} className="inline mr-1" /> Email
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {profileLoading ? <LoadingSpinner size="sm" /> : <FiSave size={14} />}
                    <span>Save Changes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <FiUser size={16} className="text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Full Name</p>
                    <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <FiMail size={16} className="text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm font-medium text-gray-800">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <FiCalendar size={16} className="text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Member Since</p>
                    <p className="text-sm font-medium text-gray-800">{formatDate(user?.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <FiUser size={16} className="text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Role</p>
                    <p className="text-sm font-medium text-gray-800">{userRole}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-5">
              <FiLock size={18} className="text-gray-600" />
              <h3 className="text-base font-semibold text-gray-800">Change Password</h3>
            </div>
            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center space-x-2">
                <FiCheck size={15} />
                <span>{passwordSuccess}</span>
              </div>
            )}
            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{passwordError}</div>
            )}
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {[
                { key: 'current', label: 'Current Password', placeholder: 'Enter current password', field: 'currentPassword' },
                { key: 'new', label: 'New Password', placeholder: 'Min. 6 characters', field: 'newPassword' },
                { key: 'confirm', label: 'Confirm New Password', placeholder: 'Re-enter new password', field: 'confirmPassword' }
              ].map(({ key, label, placeholder, field }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <div className="relative">
                    <input
                      type={showPasswords[key] ? 'text' : 'password'}
                      value={passwordForm[field]}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, [field]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords[key] ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="submit"
                disabled={passwordLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {passwordLoading ? <LoadingSpinner size="sm" /> : <FiLock size={14} />}
                <span>Update Password</span>
              </button>
            </form>
          </div>

          {/* My Articles */}
          {(userRole === 'Author' || userRole === 'Admin') && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FiFileText size={18} className="text-gray-600" />
                  <h3 className="text-base font-semibold text-gray-800">My Articles</h3>
                </div>
                <Link to="/articles" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View all
                </Link>
              </div>
              {articlesLoading ? (
                <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div>
              ) : myArticles.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No articles yet. <Link to="/articles/create" className="text-primary-600 hover:underline">Create one!</Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {myArticles.map(article => {
                    const articleId = article._id || article.id;
                    const statusColor = STATUS_COLORS[article.status] || 'gray';
                    return (
                      <div key={articleId} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/articles/${articleId}`}
                            className="text-sm font-medium text-gray-800 hover:text-primary-600 truncate block"
                          >
                            {article.title}
                          </Link>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDate(article.createdAt)}</p>
                        </div>
                        <Badge label={article.status} color={statusColor} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar: Activity Summary */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Activity Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FiFileText size={15} className="text-blue-600" />
                  <span className="text-sm text-gray-700">Total Articles</span>
                </div>
                <span className="text-base font-bold text-blue-700">{activityStats.total}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FiCheck size={15} className="text-green-600" />
                  <span className="text-sm text-gray-700">Approved</span>
                </div>
                <span className="text-base font-bold text-green-700">{activityStats.approved}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FiClock size={15} className="text-yellow-600" />
                  <span className="text-sm text-gray-700">Pending</span>
                </div>
                <span className="text-base font-bold text-yellow-700">{activityStats.pending}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FiFileText size={15} className="text-gray-500" />
                  <span className="text-sm text-gray-700">Drafts</span>
                </div>
                <span className="text-base font-bold text-gray-700">{activityStats.draft}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Links</h3>
            <div className="space-y-1.5">
              <Link to="/articles" className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <FiFileText size={15} className="text-gray-400" />
                <span>Browse Articles</span>
              </Link>
              <Link to="/bookmarks" className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <FiFileText size={15} className="text-gray-400" />
                <span>My Bookmarks</span>
              </Link>
              {(userRole === 'Author' || userRole === 'Admin') && (
                <Link to="/articles/create" className="flex items-center space-x-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium">
                  <FiFileText size={15} className="text-primary-500" />
                  <span>Create Article</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
