/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiRequest, setTokenGetter } from '../lib/apiClient';

/**
 * @fileoverview Auth context — backed by Auth0.
 *
 * Auth0 handles login, register, OAuth (Google/GitHub), and password reset.
 * This context fetches the corresponding DB user from our backend /api/auth/me
 * and exposes it alongside Auth0's helpers.
 */

const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const {
    isAuthenticated,
    isLoading: auth0Loading,
    user: auth0User,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0();

  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register the token getter so apiClient can attach Bearer tokens
  useEffect(() => {
    setTokenGetter(() =>
      getAccessTokenSilently({ authorizationParams: { audience: AUTH0_AUDIENCE } })
    );
  }, [getAccessTokenSilently]);

  // Fetch our DB user once Auth0 confirms the session
  const fetchDbUser = useCallback(async () => {
    if (!isAuthenticated) {
      setDbUser(null);
      setLoading(false);
      return;
    }
    try {
      const user = await apiRequest('/auth/me');
      setDbUser(user);
    } catch {
      setDbUser(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!auth0Loading) fetchDbUser();
  }, [auth0Loading, fetchDbUser]);

  const login = useCallback((options = {}) => {
    loginWithRedirect({
      authorizationParams: { audience: AUTH0_AUDIENCE, ...options },
    });
  }, [loginWithRedirect]);

  const logout = useCallback(() => {
    setDbUser(null);
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  }, [auth0Logout]);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await apiRequest('/users/me');
      setDbUser(profile);
      return profile;
    } catch {
      return null;
    }
  }, []);

  const updateProfile = useCallback(async (updates) => {
    const updated = await apiRequest('/users/me', { method: 'PATCH', body: updates });
    setDbUser(updated);
    return updated;
  }, []);

  const uploadProfilePhoto = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('profile_photo', file);
    const updated = await apiRequest('/users/me', { method: 'PATCH', body: formData, formData: true });
    setDbUser(updated);
    return updated;
  }, []);

  const value = useMemo(() => ({
    user: dbUser,
    auth0User,
    isAuthenticated: isAuthenticated && !!dbUser,
    loading: auth0Loading || loading,
    login,
    logout,
    refreshProfile,
    updateProfile,
    uploadProfilePhoto,
    // changePassword is handled by Auth0 Universal Login
  }), [dbUser, auth0User, isAuthenticated, auth0Loading, loading, login, logout, refreshProfile, updateProfile, uploadProfilePhoto]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};
