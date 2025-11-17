import { useApi } from './useApi';

export const useTeams = () => {
  const api = useApi();

  return {
    list: (q = '') => api(`/teams${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    create: (payload) => api('/teams', { method: 'POST', body: payload }),
    invite: (teamId, payload) => api(`/teams/${teamId}/invite`, { method: 'POST', body: payload }),
    acceptInvite: (token) => api('/teams/invitations/accept', { method: 'POST', body: { token } }),
    requestJoin: (teamId) => api(`/teams/${teamId}/requests`, { method: 'POST' }),
    approveRequest: (requestId) => api(`/teams/requests/${requestId}/approve`, { method: 'POST' }),
    registerInCompetition: (teamId, competition_id) => api(`/teams/${teamId}/register-competition`, { method: 'POST', body: { competition_id } }),
    mine: () => api('/teams/mine'),
    update: (teamId, payload) => api(`/teams/${teamId}`, { method: 'PUT', body: payload }),
    remove: (teamId) => api(`/teams/${teamId}`, { method: 'DELETE' }),
    listRequests: (teamId) => api(`/teams/${teamId}/requests`),
  };
};
