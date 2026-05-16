import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // authService now returns unwrapped data:
  // login/register → { token, user }
  // getMe          → { user }

  const restoreSession = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setLoading(false);
      return;
    }
    try {
      const data = await authService.getMe();
      // data = { user: { id, name, email, role: { id, name } } }
      const restoredUser = data?.user ?? data;
      setUser(restoredUser);
      setToken(storedToken);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (email, password) => {
    // data = { token, user }
    const data = await authService.login(email, password);
    const newToken = data?.token;
    const newUser = data?.user;
    if (newToken) {
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    }
    return data;
  };

  const register = async (name, email, password, role) => {
    // data = { token, user }
    const data = await authService.register(name, email, password, role);
    const newToken = data?.token;
    const newUser = data?.user;
    if (newToken) {
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedData) => {
    const merged = { ...user, ...updatedData };
    setUser(merged);
    localStorage.setItem('user', JSON.stringify(merged));
  };

  // user.role is { id, name, description } — expose role name as a convenience
  const userRole = user?.role?.name ?? user?.role ?? null;

  const value = {
    user,
    token,
    loading,
    userRole,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
