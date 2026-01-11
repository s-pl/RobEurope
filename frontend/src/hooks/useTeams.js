/**
 * @fileoverview Teams API hook.
 *
 * Provides thin wrappers around `/api/teams` endpoints.
 */

import { useApi } from './useApi';
import { useCallback } from 'react';

/**
 * @typedef {object} UseTeamsApi
 * @property {Function} list
 * @property {Function} create
 * @property {Function} invite
 * @property {Function} acceptInvite
 * @property {Function} requestJoin
 * @property {Function} approveRequest
 * @property {Function} registerInCompetition
 * @property {Function} mine
 * @property {Function} update
 * @property {Function} remove
 * @property {Function} listRequests
 * @property {Function} getMembers
 * @property {Function} removeMember
 * @property {Function} leave
 */

/**
 * Returns team-related API helpers.
 * @returns {UseTeamsApi}
 */
export const useTeams = () => {
  const api = useApi();

  const list = useCallback((q = '', country_id = '') => {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (country_id) params.append('country_id', country_id);
    return api(`/teams?${params.toString()}`);
  }, [api]);
  const create = useCallback((payload) => api('/teams', { method: 'POST', body: payload }), [api]);
  const invite = useCallback((teamId, payload) => api(`/teams/${teamId}/invite`, { method: 'POST', body: payload }), [api]);
  const acceptInvite = useCallback((token) => api('/teams/invitations/accept', { method: 'POST', body: { token } }), [api]);
  const requestJoin = useCallback((teamId) => api(`/teams/${teamId}/requests`, { method: 'POST' }), [api]);
  const approveRequest = useCallback((requestId) => api(`/teams/requests/${requestId}/approve`, { method: 'POST' }), [api]);
  const registerInCompetition = useCallback((teamId, competition_id) => api(`/teams/${teamId}/register-competition`, { method: 'POST', body: { competition_id } }), [api]);
  const mine = useCallback(() => api('/teams/mine'), [api]);
  const update = useCallback((teamId, payload) => api(`/teams/${teamId}`, { method: 'PUT', body: payload }), [api]);
  const remove = useCallback((teamId) => api(`/teams/${teamId}`, { method: 'DELETE' }), [api]);
  const listRequests = useCallback((teamId) => api(`/teams/${teamId}/requests`), [api]);
  const getMembers = useCallback((teamId) => api(`/team-members?team_id=${teamId}`), [api]);
  const removeMember = useCallback((memberId) => api(`/team-members/${memberId}`, { method: 'DELETE' }), [api]);
  const leave = useCallback(() => api('/teams/leave', { method: 'POST' }), [api]);

  return { list, create, invite, acceptInvite, requestJoin, approveRequest, registerInCompetition, mine, update, remove, listRequests, getMembers, removeMember, leave };
};
