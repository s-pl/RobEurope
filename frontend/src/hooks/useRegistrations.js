import { useCallback } from 'react';
import { useApi } from './useApi';

export const useRegistrations = () => {
  const api = useApi();

  const list = useCallback((params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const suffix = qs ? `?${qs}` : '';
    return api(`/registrations${suffix}`);
  }, [api]);

  const create = useCallback((payload) => api('/registrations', { method: 'POST', body: payload }), [api]);

  // Admin actions (optional on UI)
  const approve = useCallback((id, body = {}) => api(`/registrations/${id}/approve`, { method: 'POST', body }), [api]);
  const reject = useCallback((id, decision_reason) => api(`/registrations/${id}/reject`, { method: 'POST', body: { decision_reason } }), [api]);

  return { list, create, approve, reject };
};
