import { useCallback } from 'react';
import { apiRequest } from '../lib/apiClient';
import { useAuth } from './useAuth';

export const useApi = () => {
  const callApi = useCallback(
    (path, options = {}) => apiRequest(path, options),
    []
  );

  return callApi;
};
