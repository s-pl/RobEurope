import { useCallback } from 'react';
import { apiRequest } from '../lib/apiClient';
import { useAuth } from './useAuth';

export const useApi = () => {
  const { token } = useAuth();

  const callApi = useCallback(
    (path, options = {}) => apiRequest(path, { token, ...options }),
    [token]
  );

  return callApi;
};
