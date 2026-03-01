/**
 * @fileoverview
 * Teams API hook providing thin wrappers around `/api/teams` endpoints.
 * @module hooks/useTeams
 */

import { useApi } from './useApi';
import { useCallback } from 'react';

/**
 * @typedef {Object} Team
 * @property {number} id - Team ID.
 * @property {string} name - Team name.
 * @property {string} [description] - Team description.
 * @property {string} [logo_url] - URL to team logo.
 * @property {number} [country_id] - Country ID.
 */

/**
 * @typedef {Object} UseTeamsApi
 * @property {Function} list - List teams with optional filters.
 * @property {Function} create - Create a new team.
 * @property {Function} invite - Invite a user to a team.
 * @property {Function} acceptInvite - Accept a team invitation.
 * @property {Function} requestJoin - Request to join a team.
 * @property {Function} approveRequest - Approve a join request.
 * @property {Function} registerInCompetition - Register team in a competition.
 * @property {Function} mine - Get current user's team.
 * @property {Function} update - Update team details.
 * @property {Function} remove - Delete a team.
 * @property {Function} listRequests - List pending join requests.
 * @property {Function} getMembers - Get team members.
 * @property {Function} removeMember - Remove a team member.
 * @property {Function} leave - Leave current team.
 */

/**
 * Custom hook providing team-related API methods.
 * All methods are memoized with useCallback for performance.
 * 
 * @returns {UseTeamsApi} Object containing team API methods.
 * @example
 * const { list, create, mine } = useTeams();
 * const teams = await list('robotics', 1);
 * const myTeam = await mine();
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

  const getMyRequests = useCallback(() => api('/teams/my-requests'), [api]);
  const cancelRequest = useCallback((requestId) => api(`/teams/requests/${requestId}`, { method: 'DELETE' }), [api]);

  return { list, create, invite, acceptInvite, requestJoin, approveRequest, registerInCompetition, mine, update, remove, listRequests, getMembers, removeMember, leave, getMyRequests, cancelRequest };
};
