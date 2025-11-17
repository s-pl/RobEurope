import { useCallback } from 'react';
import { useApi } from './useApi';

export const useSponsors = () => {
  const api = useApi();

  const list = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api(`/sponsors${query ? `?${query}` : ''}`);
  }, [api]);

  const get = useCallback(async (id) => {
    return api(`/sponsors/${id}`);
  }, [api]);

  const create = useCallback(async (data) => {
    return api('/sponsors', { method: 'POST', body: data });
  }, [api]);

  const update = useCallback(async (id, data) => {
    return api(`/sponsors/${id}`, { method: 'PUT', body: data });
  }, [api]);

  const remove = useCallback(async (id) => {
    return api(`/sponsors/${id}`, { method: 'DELETE' });
  }, [api]);

  return { list, get, create, update, remove };
};