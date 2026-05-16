import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiHome, FiFileText, FiPlusCircle, FiSearch, FiFolder,
  FiCheckSquare, FiBookmark, FiUsers, FiBarChart2, FiX, FiLogOut
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = userRole === 'Admin';
  const isAuthor = userRole === 'Author';
  const isReviewer = userRole === 'Reviewer';
  const isEmployee = userRole === 'Employee';

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: FiHome,
      show: true
    },
    {
      path: '/articles',
      label: 'Articles',
      icon: FiFileText,
      show: true
    },
    {
      path: '/articles/create',
      label: 'Create Article',
      icon: FiPlusCircle,
      show: !isEmployee
    },
    {
      path: '/search',
      label: 'Search',
      icon: FiSearch,
      show: true
    },
    {
      path: '/categories',
      label: 'Categories',
      icon: FiFolder,
      show: isAdmin
    },
    {
      path: '/approvals',
      label: 'Approval Queue',
      icon: FiCheckSquare,
      show: isAdmin || isReviewer,
      badge: true
    },
    {
      path: '/bookmarks',
      label: 'Bookmarks',
      icon: FiBookmark,
      show: true
    },
    {
      path: '/users',
      label: 'User Management',
      icon: FiUsers,
      show: isAdmin
    },
    {
      path: '/reports',
      label: 'Reports',
      icon: FiBarChart2,
      show: isAdmin
    }
  ].filter(item => item.show);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    Admin: 'bg-purple-100 text-purple-700',
    Author: 'bg-blue-100 text-blue-700',
    Reviewer: 'bg-green-100 text-green-700',
    Employee: 'bg-gray-100 text-gray-700'
  };
  const roleColor = roleColors[userRole] || roleColors.Employee;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:top-16 lg:h-[calc(100vh-4rem)]`}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 lg:hidden">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">KnowledgeBase</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                  end={item.path === '/articles'}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={18}
                        className={isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.path === '/articles/create' && (
                        <span className="text-xs bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded font-medium">
                          New
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleColor}`}>
                {userRole}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <FiLogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
