/**
 * @fileoverview Team management endpoints.
 *
 * Includes team CRUD, invitations (accept/decline), join requests, membership
 * status helpers, and competition registration.
 */

import prisma from '../lib/prisma.js';
import { getFileInfo } from '../middleware/upload.middleware.js';
import { v4 as uuidv4 } from 'uuid';
import { emitToUser } from '../utils/realtime.js';

/**
 * Helper: create a TeamLog entry for activity tracking.
 * Silently catches errors so it never breaks the main flow.
 */
const logTeamActivity = async ({ team_id, content, author_id = null, competition_id = 0 }) => {
  try {
    await prisma.teamLog.create({ data: { team_id, competition_id, content, author_id } });
  } catch (_) { /* never break the main flow */ }
};


/**
 * Create a new team (authenticated).
 *
 * @route POST /api/teams
 */
export const createTeam = async (req, res) => {
  try {
    const created_by_user_id = req.user?.id;
    if (!created_by_user_id) return res.status(401).json({ error: 'No autorizado' });

    const existingMembership = await prisma.teamMember.findFirst({ where: { user_id: created_by_user_id, left_at: null } }).catch(() => null);
    if (existingMembership) return res.status(400).json({ error: 'Ya perteneces a un equipo' });

    const { country_id, educational_center_id } = req.body;
    if (country_id) {
      const c = await prisma.country.findUnique({ where: { id: Number(country_id) } });
      if (!c) return res.status(400).json({ error: `country_id '${country_id}' does not exist` });
    }

    if (educational_center_id) {
      const center = await prisma.educationalCenter.findUnique({ where: { id: Number(educational_center_id) } });
      if (!center) return res.status(400).json({ error: `educational_center_id '${educational_center_id}' does not exist` });
      if (center.approval_status !== 'approved') {
        return res.status(400).json({ error: 'El centro educativo aún no ha sido aprobado' });
      }
    }

    const teamData = { ...req.body, created_by_user_id };

    const fileInfo = getFileInfo(req);
    if (fileInfo) {
      teamData.logo_url = fileInfo.url;
    }

    const team = await prisma.team.create({ data: teamData });

    await prisma.teamMember.create({ data: { team_id: team.id, user_id: created_by_user_id, role: 'owner', joined_at: new Date(), left_at: null } });

    try {
      const notif = await prisma.notification.create({
        data: {
          user_id: created_by_user_id,
          title: 'Equipo creado',
          message: `Has creado el equipo ${team.name}`,
          type: 'team_invite'
        }
      });
      emitToUser(created_by_user_id, 'notification', notif);
    } catch (_) {}
    await logTeamActivity({ team_id: team.id, content: `Team "${team.name}" created`, author_id: created_by_user_id });
    res.status(201).json(team);
  } catch (err) {
    if (err && (err.code === 'P2003' || err.code === 'P2002')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

/**
 * List teams with optional filtering.
 *
 * @route GET /api/teams
 */
export const getTeams = async (req, res) => {
  try {
    const { q, country_id, limit = 50, offset = 0, sort = 'name', order = 'ASC', withCount } = req.query;
    const where = {};
    if (q) where.name = { contains: q, mode: 'insensitive' };
    if (country_id) where.country_id = Number(country_id);

    const orderBy = { [sort]: String(order).toLowerCase() === 'desc' ? 'desc' : 'asc' };

    if (String(withCount) === 'true') {
      const [items, total] = await prisma.$transaction([
        prisma.team.findMany({ where, take: Number(limit), skip: Number(offset), orderBy }),
        prisma.team.count({ where })
      ]);
      return res.json({ items, total });
    }

    const items = await prisma.team.findMany({ where, take: Number(limit), skip: Number(offset), orderBy });
    return res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get a team by id.
 *
 * @route GET /api/teams/:id
 */
export const getTeamById = async (req, res) => {
  try {
    const item = await prisma.team.findUnique({ where: { id: Number(req.params.id) } });
    if (!item) return res.status(404).json({ error: 'Team not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update a team by id (owner only via middleware).
 *
 * @route PUT /api/teams/:id
 */
export const updateTeam = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updates = { ...req.body };

    const fileInfo = getFileInfo(req);
    if (fileInfo) {
      updates.logo_url = fileInfo.url;
    }

    const updatedItem = await prisma.team.update({ where: { id }, data: updates }).catch(() => null);
    if (!updatedItem) return res.status(404).json({ error: 'Team not found' });
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete a team by id (owner only via middleware).
 *
 * @route DELETE /api/teams/:id
 */
export const deleteTeam = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.team.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Team not found' });
    await prisma.team.delete({ where: { id } });
    res.json({ message: 'Team deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Creates a team invitation.
 *
 * @route POST /api/teams/:id/invite
 */
export const inviteToTeam = async (req, res) => {
  try {
    const teamId = Number(req.params.id);
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const { email, username, user_id, expires_in_hours = 168 } = req.body || {};
    if (!email && !username && !user_id) return res.status(400).json({ error: 'email o username requerido' });

    let targetUserId = user_id || null;
    if (!targetUserId && (username || email)) {
      const where = username ? { username } : { email };
      const found = await prisma.user.findFirst({ where });
      if (!found && username) return res.status(400).json({ error: `username '${username}' no existe` });
      if (!found && email) {
        // Invite by email only (no user yet) is allowed
      } else if (found) {
        targetUserId = found.id;
      }
    }

    if (targetUserId) {
      const u = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (!u) return res.status(400).json({ error: 'Usuario no existe' });
      const exists = await prisma.teamMember.findFirst({ where: { user_id: targetUserId, left_at: null } });
      if (exists) return res.status(400).json({ error: 'El usuario ya pertenece a un equipo' });
    }

    const token = uuidv4();
    const expires_at = new Date(Date.now() + Number(expires_in_hours) * 3600 * 1000);
    const invite = await prisma.teamInvite.create({ data: { team_id: teamId, email: email || null, user_id: targetUserId || null, token, status: 'pending', expires_at } });

    if (targetUserId) {
      try {
        const notif = await prisma.notification.create({
          data: {
            user_id: targetUserId,
            title: 'Invitación de equipo',
            message: `Has sido invitado a unirte a ${team.name}`,
            type: 'team_invite',
            meta: {
              kind: 'team_invite',
              invite_token: token,
              team_id: teamId,
              team_name: team.name
            }
          }
        });
        emitToUser(targetUserId, 'notification', notif);
      } catch (_) {}
    }

    await logTeamActivity({ team_id: teamId, content: `Invitation sent${targetUserId ? ` to user #${targetUserId}` : ` to email ${email}`}`, author_id: req.user?.id });
    return res.status(201).json({ token: invite.token, invite });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Declines a team invitation by token.
 *
 * @route POST /api/teams/invitations/decline
 */
export const declineInvite = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'token requerido' });

    const invite = await prisma.teamInvite.findUnique({ where: { token } });
    if (!invite) return res.status(404).json({ error: 'Invitación no encontrada' });
    if (invite.status !== 'pending') return res.status(400).json({ error: 'Invitación no disponible' });
    if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) return res.status(400).json({ error: 'Invitación expirada' });

    if (invite.user_id && invite.user_id !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    await prisma.teamInvite.update({ where: { id: invite.id }, data: { status: 'revoked' } });

    try {
      const team = await prisma.team.findUnique({ where: { id: invite.team_id } });
      if (team && team.created_by_user_id) {
        const notif = await prisma.notification.create({
          data: {
            user_id: team.created_by_user_id,
            title: 'Invitación rechazada',
            message: `Un usuario ha rechazado la invitación a ${team.name}`,
            type: 'team_invite'
          }
        });
        emitToUser(team.created_by_user_id, 'notification', notif);
      }
    } catch (_) {}
    await logTeamActivity({ team_id: invite.team_id, content: `Invitation declined by user #${userId}`, author_id: userId });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Accepts a team invitation by token.
 *
 * @route POST /api/teams/invitations/accept
 */
export const acceptInvite = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'token requerido' });

    const invite = await prisma.teamInvite.findUnique({ where: { token } });
    if (!invite) return res.status(404).json({ error: 'Invitación no encontrada' });
    if (invite.status !== 'pending') return res.status(400).json({ error: 'Invitación no disponible' });
    if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) return res.status(400).json({ error: 'Invitación expirada' });

    const existing = await prisma.teamMember.findFirst({ where: { user_id: userId, left_at: null } });
    if (existing) return res.status(400).json({ error: 'Ya perteneces a un equipo' });

    await prisma.teamMember.create({ data: { team_id: invite.team_id, user_id: userId, role: 'member', joined_at: new Date(), left_at: null } });
    await prisma.teamInvite.update({ where: { id: invite.id }, data: { status: 'accepted' } });

    try {
      const team = await prisma.team.findUnique({ where: { id: invite.team_id } });
      if (team && team.created_by_user_id) {
        const notif = await prisma.notification.create({
          data: {
            user_id: team.created_by_user_id,
            title: 'Invitación aceptada',
            message: `Un usuario se ha unido a ${team.name}`,
            type: 'team_invite'
          }
        });
        emitToUser(team.created_by_user_id, 'notification', notif);
      }
    } catch (_) {}
    await logTeamActivity({ team_id: invite.team_id, content: `Member added (user #${userId}) via invitation`, author_id: userId });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Create a request to join a team.
 *
 * @route POST /api/teams/:id/requests
 */
export const requestJoinTeam = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    const teamId = Number(req.params.id);
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const existingMembership = await prisma.teamMember.findFirst({ where: { user_id: userId, left_at: null } });
    if (existingMembership) return res.status(400).json({ error: 'Ya perteneces a un equipo' });

    const reqRow = await prisma.teamJoinRequest.create({ data: { team_id: teamId, user_id: userId, status: 'pending' } });

    try {
      if (team.created_by_user_id) {
        const notif = await prisma.notification.create({
          data: {
            user_id: team.created_by_user_id,
            title: 'Solicitud de unión',
            message: `Un usuario ha solicitado unirse a ${team.name}`,
            type: 'team_invite'
          }
        });
        emitToUser(team.created_by_user_id, 'notification', notif);
      }
    } catch (_) {}
    return res.status(201).json(reqRow);
  } catch (err) {
    if (err && err.code === 'P2002') {
      return res.status(400).json({ error: 'Ya solicitaste unirte a este equipo' });
    }
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Approve a join request (team owner only).
 *
 * @route POST /api/teams/requests/:requestId/approve
 */
export const approveJoinRequest = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    const requestId = Number(req.params.requestId);
    const jr = await prisma.teamJoinRequest.findUnique({ where: { id: requestId } });
    if (!jr) return res.status(404).json({ error: 'Solicitud no encontrada' });

    const team = await prisma.team.findUnique({ where: { id: jr.team_id } });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    if (team.created_by_user_id !== userId) return res.status(403).json({ error: 'Solo el propietario del equipo puede aprobar' });
    if (jr.status !== 'pending') return res.status(400).json({ error: 'La solicitud no está pendiente' });

    const existing = await prisma.teamMember.findFirst({ where: { user_id: jr.user_id, left_at: null } });
    if (existing) return res.status(400).json({ error: 'El usuario ya pertenece a un equipo' });

    await prisma.teamMember.create({ data: { team_id: jr.team_id, user_id: jr.user_id, role: 'member', joined_at: new Date(), left_at: null } });
    await prisma.teamJoinRequest.update({ where: { id: requestId }, data: { status: 'approved' } });

    try {
      const notif = await prisma.notification.create({
        data: {
          user_id: jr.user_id,
          title: 'Solicitud aprobada',
          message: 'Tu solicitud para unirte al equipo ha sido aprobada',
          type: 'team_invite'
        }
      });
      emitToUser(jr.user_id, 'notification', notif);
    } catch (_) {}
    await logTeamActivity({ team_id: jr.team_id, content: `Join request approved for user #${jr.user_id}`, author_id: userId });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Register a team into a competition.
 *
 * @route POST /api/teams/:id/register-competition
 */
export const registerTeamInCompetition = async (req, res) => {
  try {
    const teamId = Number(req.params.id);
    const { competition_id } = req.body || {};
    if (!competition_id) return res.status(400).json({ error: 'competition_id requerido' });

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const comp = await prisma.competition.findUnique({ where: { id: Number(competition_id) } });
    if (!comp) return res.status(404).json({ error: 'Competition not found' });

    const existing = await prisma.registration.findFirst({ where: { team_id: teamId, competition_id: Number(competition_id) } });
    if (existing) return res.status(400).json({ error: 'El equipo ya está registrado en esta competición' });

    const reg = await prisma.registration.create({ data: { team_id: teamId, competition_id: Number(competition_id), status: 'pending', registration_date: new Date() } });
    await logTeamActivity({ team_id: teamId, content: `Registration sent for competition #${competition_id}`, author_id: req.user?.id, competition_id: Number(competition_id) });
    return res.status(201).json(reg);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Return the team the current user belongs to (or null).
 *
 * @route GET /api/teams/mine
 */
export const getMyTeam = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });

    const membership = await prisma.teamMember.findFirst({ where: { user_id: userId, left_at: null } });

    if (!membership) {
      const owned = await prisma.team.findFirst({ where: { created_by_user_id: userId } });
      if (owned) return res.json(owned);
      return res.json(null);
    }

    const team = await prisma.team.findUnique({ where: { id: membership.team_id } });
    return res.json(team || null);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * List join requests for a team (owner only via middleware).
 *
 * @route GET /api/teams/:id/requests
 */
export const listJoinRequests = async (req, res) => {
  try {
    const teamId = Number(req.params.id);
    const items = await prisma.teamJoinRequest.findMany({ where: { team_id: teamId }, orderBy: { created_at: 'desc' } });
    const userIds = [...new Set(items.map(i => i.user_id))];
    let usersById = {};
    if (userIds.length) {
      const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, username: true, email: true, first_name: true, last_name: true } });
      usersById = Object.fromEntries(users.map(u => [u.id, u]));
    }
    const enriched = items.map(i => {
      const u = usersById[i.user_id];
      return { ...i, user_username: u?.username || null, user_email: u?.email || null, user_name: u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : null };
    });
    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Leave the current team (non-owner only).
 *
 * @route POST /api/teams/leave
 */
export const leaveTeam = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    const membership = await prisma.teamMember.findFirst({ where: { user_id: userId, left_at: null } });
    if (!membership) return res.status(400).json({ error: 'No perteneces a ningún equipo' });
    const team = await prisma.team.findUnique({ where: { id: membership.team_id } });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    if (team.created_by_user_id === userId) return res.status(400).json({ error: 'El propietario no puede salir del equipo' });
    await prisma.teamMember.update({ where: { id: membership.id }, data: { left_at: new Date() } });
    await logTeamActivity({ team_id: membership.team_id, content: `Member removed (user #${userId} left the team)`, author_id: userId });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get the current user's membership/ownership status.
 *
 * @route GET /api/teams/status
 */
export const getMembershipStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    const owned = await prisma.team.findFirst({ where: { created_by_user_id: userId } });
    const membership = await prisma.teamMember.findFirst({ where: { user_id: userId, left_at: null } });
    return res.json({
      ownsTeam: Boolean(owned),
      ownedTeamId: owned ? owned.id : null,
      memberOfTeamId: membership ? membership.team_id : null
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get all join requests the current user has sent to any team.
 *
 * @route GET /api/teams/my-requests
 */
export const getMyJoinRequests = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    const items = await prisma.teamJoinRequest.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' } });
    const teamIds = [...new Set(items.map(i => i.team_id))];
    let teamsById = {};
    if (teamIds.length) {
      const teams = await prisma.team.findMany({ where: { id: { in: teamIds } }, select: { id: true, name: true, city: true, description: true } });
      teamsById = Object.fromEntries(teams.map(t => [t.id, t]));
    }
    return res.json(items.map(i => ({ ...i, team: teamsById[i.team_id] || null })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Cancel a pending join request (only the request's author can cancel).
 *
 * @route DELETE /api/teams/requests/:requestId
 */
export const cancelJoinRequest = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    const requestId = Number(req.params.requestId);
    const jr = await prisma.teamJoinRequest.findUnique({ where: { id: requestId } });
    if (!jr) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (String(jr.user_id) !== String(userId)) return res.status(403).json({ error: 'No autorizado' });
    if (jr.status !== 'pending') return res.status(400).json({ error: 'Solo se pueden cancelar solicitudes pendientes' });
    await prisma.teamJoinRequest.delete({ where: { id: requestId } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
