import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../lib/apiClient';

const AuthContext = createContext(null);

const TOKEN_KEY = 'robeurope_token';
const USER_KEY = 'robeurope_user';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem(USER_KEY);
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(true);

  const persistSession = (nextToken, nextUser) => {
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
      setToken(nextToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }

    if (nextUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
    } else {
      localStorage.removeItem(USER_KEY);
      setUser(null);
    }
  };

  const logout = useCallback(() => {
    persistSession(null, null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const profile = await apiRequest('/users/me', { token });
      persistSession(token, profile);
      return profile;
    } catch (error) {
      console.error('Failed to refresh profile', error);
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = useCallback(async ({ email, password }) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    persistSession(data.token, data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: payload
    });

    persistSession(data.token, data.user);
    return data.user;
  }, []);

  const updateProfile = useCallback(async (updates) => {
    if (!token) throw new Error('Not authenticated');
    const updatedUser = await apiRequest('/users/me', {
      method: 'PATCH',
      body: updates,
      token
    });
    persistSession(token, updatedUser);
    return updatedUser;
  }, [token]);

  const uploadProfilePhoto = useCallback(async (file) => {
    if (!token) throw new Error('Not authenticated');
    const formData = new FormData();
    formData.append('profile_photo', file);

    const updatedUser = await apiRequest('/users/me', {
      method: 'PATCH',
      body: formData,
      token,
      formData: true
    });

    persistSession(token, updatedUser);
    return updatedUser;
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      loading,
      login,
      register,
      logout,
      refreshProfile,
      updateProfile,
      uploadProfilePhoto
    }),
    [user, token, loading, login, register, logout, refreshProfile, updateProfile, uploadProfilePhoto]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};
