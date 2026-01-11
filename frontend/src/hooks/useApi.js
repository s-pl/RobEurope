/**
 * @fileoverview Hook that returns the shared API request function.
 */

import { useCallback } from 'react';
import { apiRequest } from '../lib/apiClient';

/**
 * Returns a stable function that calls the backend API.
 *
 * @returns {Function}
 */
export const useApi = () => {
  const callApi = useCallback(
    (path, options = {}) => apiRequest(path, options),
    []
  );

  return callApi;
};
