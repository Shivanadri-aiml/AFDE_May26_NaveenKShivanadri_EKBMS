import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiSearch, FiUsers, FiEdit2, FiTrash2, FiUserCheck, FiUserX } from 'react-icons/fi';
import api from '../services/api';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import { formatDate, getInitials } from '../utils/helpers';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [addUserModal, setAddUserModal] = useState(false);
  const [editRoleModal, setEditRoleModal] = useState({ open: false, user: null });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', roleName: 'Employee' });
  const [formErrors, setFormErrors] = useState({});
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const LIMIT = 10;

  // Fetch available roles for dropdowns
  useEffect(() => {
    api.get('/auth/roles')
      .then(res => {
        const data = res.data?.data ?? res.data;
        setRoles(data.roles || []);
      })
      .catch(() => {});
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: currentPage, limit: LIMIT, ...(searchQuery && { search: searchQuery }) };
      const response = await api.get('/users', { params });
      // Backend returns { message, data: { users, total, totalPages } }
      const data = response.data?.data ?? response.data;
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Admin creates user via /auth/register
  const handleAddUser = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!newUser.name.trim()) errors.name = 'Name is required';
    if (!newUser.email.trim()) errors.email = 'Email is required';
    if (!newUser.password || newUser.password.length < 6) errors.password = 'Minimum 6 characters';
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

    setFormLoading(true);
    try {
      const response = await api.post('/auth/register', {
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
        roleName: newUser.roleName,
      });
      const data = response.data?.data ?? response.data;
      if (data?.user) {
        setUsers(prev => [data.user, ...prev]);
      }
      setAddUserModal(false);
      setNewUser({ name: '', email: '', password: '', roleName: 'Employee' });
      setFormErrors({});
      fetchUsers(); // Refresh to get latest data with role association
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Failed to add user.';
      setFormErrors({ api: msg });
    } finally {
      setFormLoading(false);
    }
  };

  // Change role uses PUT /users/:id/role with roleId
  const handleChangeRole = async () => {
    const userId = editRoleModal.user?.id;
    if (!selectedRoleId || !userId) return;
    setFormLoading(true);
    try {
      const response = await api.put(`/users/${userId}/role`, { roleId: parseInt(selectedRoleId) });
      const data = response.data?.data ?? response.data;
      if (data?.user) {
        setUsers(prev => prev.map(u => u.id === userId ? data.user : u));
      }
      setEditRoleModal({ open: false, user: null });
    } catch (err) {
      console.error('Role change failed:', err);
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle active status using PUT /users/:id with isActive
  const handleToggleStatus = async (targetUser) => {
    const userId = targetUser.id;
    const newIsActive = !targetUser.isActive;
    try {
      const response = await api.put(`/users/${userId}`, { isActive: newIsActive });
      const data = response.data?.data ?? response.data;
      if (data?.user) {
        setUsers(prev => prev.map(u => u.id === userId ? data.user : u));
      } else {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: newIsActive } : u));
      }
    } catch (err) {
      console.error('Status toggle failed:', err);
    }
  };

  // Delete (soft-delete) via DELETE /users/:id
  const handleDelete = async (userId) => {
    setDeleteLoading(true);
    try {
      await api.delete(`/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setDeleteConfirm(null);
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const roleColors = { Admin: 'purple', Author: 'blue', Reviewer: 'green', Employee: 'gray' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage system users and their access roles</p>
        </div>
        <button
          onClick={() => { setAddUserModal(true); setFormErrors({}); }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <FiPlus size={18} />
          <span>Add User</span>
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center h-48 items-center"><LoadingSpinner size="lg" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FiUsers size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No users found</h3>
          <p className="text-gray-500 text-sm">{searchQuery ? 'Try a different search term.' : 'No users in the system yet.'}</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(user => {
                    const userId = user.id;
                    const roleName = user.role?.name || user.role || 'Employee';
                    const isActive = user.isActive !== false;
                    const isDeleting = deleteConfirm === userId;
                    return (
                      <tr key={userId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                              {getInitials(user.name)}
                            </div>
                            <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 text-center">
                          <Badge label={roleName} color={roleColors[roleName] || 'gray'} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge label={isActive ? 'Active' : 'Inactive'} color={isActive ? 'green' : 'red'} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-1">
                            {/* Change Role */}
                            <button
                              onClick={() => {
                                setEditRoleModal({ open: true, user });
                                setSelectedRoleId(String(user.role?.id || ''));
                              }}
                              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Change role"
                            >
                              <FiEdit2 size={15} />
                            </button>
                            {/* Toggle Active */}
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isActive
                                  ? 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                              }`}
                              title={isActive ? 'Deactivate user' : 'Activate user'}
                            >
                              {isActive ? <FiUserX size={16} /> : <FiUserCheck size={16} />}
                            </button>
                            {/* Delete */}
                            {isDeleting ? (
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleDelete(userId)}
                                  disabled={deleteLoading}
                                  className="px-2 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                  {deleteLoading ? '...' : 'Confirm'}
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(userId)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete user"
                              >
                                <FiTrash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">{total} {total === 1 ? 'user' : 'users'} total</p>
            </div>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}

      {/* Add User Modal */}
      <Modal isOpen={addUserModal} onClose={() => { setAddUserModal(false); setFormErrors({}); }} title="Add New User" size="md">
        <form onSubmit={handleAddUser} className="space-y-4">
          {formErrors.api && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formErrors.api}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={newUser.name}
              onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
              className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${formErrors.name ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="John Doe"
            />
            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={newUser.email}
              onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
              className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${formErrors.email ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="john@company.com"
            />
            {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
            <input
              type="password"
              value={newUser.password}
              onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
              className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${formErrors.password ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Minimum 6 characters"
            />
            {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
            <select
              value={newUser.roleName}
              onChange={e => setNewUser(p => ({ ...p, roleName: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {roles.length > 0
                ? roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)
                : ['Employee', 'Author', 'Reviewer', 'Admin'].map(r => <option key={r} value={r}>{r}</option>)
              }
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={() => setAddUserModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={formLoading} className="flex items-center space-x-2 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {formLoading && <LoadingSpinner size="sm" />}
              <span>Add User</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={editRoleModal.open}
        onClose={() => setEditRoleModal({ open: false, user: null })}
        title="Change User Role"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Change role for <strong>{editRoleModal.user?.name}</strong>
          </p>
          <select
            value={selectedRoleId}
            onChange={e => setSelectedRoleId(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">Select a role...</option>
            {roles.map(r => (
              <option key={r.id} value={String(r.id)}>{r.name}</option>
            ))}
          </select>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setEditRoleModal({ open: false, user: null })}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleChangeRole}
              disabled={formLoading || !selectedRoleId}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {formLoading && <LoadingSpinner size="sm" />}
              <span>Update Role</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
