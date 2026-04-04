/* eslint-disable react-refresh/only-export-components */

/**
 * @fileoverview
 * Authentication session context provider.
 * 
 * The frontend uses cookie-based sessions. This provider keeps the current user
 * in memory, refreshes `/users/me` on mount, and exposes helpers for login,
 * register, logout, profile updates, and password changes.
 * @module context/AuthContext
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../lib/apiClient';

/**
 * React context for authentication state.
 * @type {React.Context<AuthContextValue|null>}
 */
const AuthContext = createContext(null);

// Use cookie-based session on server; avoid localStorage persistence

/**
 * @typedef {Object} User
 * @property {string} id - User UUID.
 * @property {string} email - User email address.
 * @property {string} first_name - User's first name.
 * @property {string} last_name - User's last name.
 * @property {string} username - Unique username.
 * @property {'user'|'super_admin'} role - User role.
 * @property {string} [profile_photo_url] - URL to profile photo.
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {User|null} user - Current authenticated user or null.
 * @property {boolean} isAuthenticated - Whether user is logged in.
 * @property {boolean} loading - Whether auth state is being loaded.
 * @property {Function} login - Authenticate with email/password.
 * @property {Function} register - Create new account.
 * @property {Function} logout - End current session.
 * @property {Function} refreshProfile - Reload user data from server.
 * @property {Function} updateProfile - Update user profile fields.
 * @property {Function} uploadProfilePhoto - Upload new profile photo.
 * @property {Function} changePassword - Change user password.
 */

/**
 * Authentication provider component.
 * Wraps the application to provide authentication state and methods.
 * 
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components.
 * @returns {JSX.Element} Provider component.
 */
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

/**
 * Access the authentication context.
 * @returns {AuthContextValue}
 */
export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};
