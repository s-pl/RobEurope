/* eslint-disable react-refresh/only-export-components */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../lib/apiClient';

const AuthContext = createContext(null);

// Use cookie-based session on server; avoid localStorage persistence

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistSession = (nextUser) => {
    setUser(nextUser || null);
  };

  const logout = useCallback(async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout failed', e);
    }
    persistSession(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await apiRequest('/users/me');
      persistSession(profile);
      return profile;
    } catch {
      persistSession(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = useCallback(async ({ email, password }) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    persistSession(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: payload
    });

    persistSession(data.user);
    return data.user;
  }, []);

  const updateProfile = useCallback(async (updates) => {
    const updatedUser = await apiRequest('/users/me', {
      method: 'PATCH',
      body: updates
    });
    persistSession(updatedUser);
    return updatedUser;
  }, []);

  const uploadProfilePhoto = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('profile_photo', file);

    const updatedUser = await apiRequest('/users/me', {
      method: 'PATCH',
      body: formData,
      formData: true
    });

    persistSession(updatedUser);
    return updatedUser;
  }, []);

  const changePassword = useCallback(async ({ current_password, new_password }) => {
    await apiRequest('/auth/change-password', {
      method: 'POST',
      body: { current_password, new_password }
    });
    return true;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      login,
      register,
      logout,
      refreshProfile,
      updateProfile,
      uploadProfilePhoto,
      changePassword
    }),
    [user, loading, login, register, logout, refreshProfile, updateProfile, uploadProfilePhoto, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};
