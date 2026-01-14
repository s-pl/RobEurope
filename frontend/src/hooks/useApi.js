/**
 * @fileoverview
 * Hook that returns the shared API request function.
 * @module hooks/useApi
 */

import { useCallback } from 'react';
import { apiRequest } from '../lib/apiClient';

/**
 * @typedef {Object} ApiOptions
 * @property {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} [method='GET'] - HTTP method.
 * @property {Object|FormData} [body] - Request body (auto-serialized to JSON if object).
 * @property {Object} [headers] - Additional headers.
 */

/**
 * Custom hook that returns a memoized function for making API calls.
 * Uses the shared apiClient for consistent error handling and authentication.
 * 
 * @returns {Function} API request function.
 * @example
 * const api = useApi();
 * const users = await api('/users');
 * await api('/users', { method: 'POST', body: { name: 'John' } });
 */
export const useApi = () => {
  const callApi = useCallback(
    (path, options = {}) => apiRequest(path, options),
    []
  );

  return callApi;
};
