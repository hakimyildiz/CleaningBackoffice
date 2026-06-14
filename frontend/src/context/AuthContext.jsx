import React, { createContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken } from '../config/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [accessToken, setTokenState] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const handleAuthSuccess = useCallback((token, userData) => {
    setAccessToken(token);
    setTokenState(token);
    setUser(userData);
    setRole(userData.Role || userData.role);
  }, []);

  const handleLogoutState = useCallback(() => {
    setAccessToken('');
    setTokenState('');
    setUser(null);
    setRole(null);
  }, []);

  // Silent refresh on app mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.post('/auth/refresh');
        const { accessToken, user } = response.data.data;
        handleAuthSuccess(accessToken, user);
      } catch (err) {
        // Silent fail is fine, means no refresh cookie exists or it is invalid
        handleLogoutState();
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [handleAuthSuccess, handleLogoutState]);

  // Set up global window method for axios interceptor to call if refresh fails
  useEffect(() => {
    window.handleGlobalLogout = () => {
      handleLogoutState();
    };
    return () => {
      delete window.handleGlobalLogout;
    };
  }, [handleLogoutState]);

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      const { accessToken, user } = response.data.data;
      handleAuthSuccess(accessToken, user);
      return { success: true };
    } catch (err) {
      handleLogoutState();
      const message = err.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error on server:', err.message);
    } finally {
      handleLogoutState();
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, accessToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
export default AuthContext;
