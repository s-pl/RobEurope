import { useCallback } from 'react';
import { apiRequest } from '../lib/apiClient';

export const useApi = () => {
  const callApi = useCallback(
    (path, options = {}) => apiRequest(path, options),
    []
  );

  return callApi;
};
