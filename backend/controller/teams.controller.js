import db from '../models/index.js';
const { Team, User, Country, TeamMembers, TeamInvite, TeamJoinRequest, Registration, Competition, Notification } = db;
import { Op } from 'sequelize';
import { getFileInfo } from '../middleware/upload.middleware.js';
import { v4 as uuidv4 } from 'uuid';
import { emitToUser } from '../utils/realtime.js';

export const createTeam = async (req, res) => {
  try {
    // The creator is the authenticated user
    const created_by_user_id = req.user?.id;
    if (!created_by_user_id) return res.status(401).json({ error: 'No autorizado' });

    // A user can only belong to ONE team (enforced by index and app logic)
    const existingMembership = await TeamMembers.findOne({ where: { user_id: created_by_user_id, left_at: null } }).catch(() => null);
    if (existingMembership) return res.status(400).json({ error: 'Ya perteneces a un equipo' });

    // Validate foreign keys before attempting insert to return a friendly 400
    const { country_id } = req.body;
    if (country_id) {
      // Country may be optional in some deployments
      if (Country) {
        const c = await Country.findByPk(country_id);
        if (!c) return res.status(400).json({ error: `country_id '${country_id}' does not exist` });
      }
    }

    const teamData = { ...req.body, created_by_user_id };

    // Handle file upload
    const fileInfo = getFileInfo(req);
    if (fileInfo) {
      teamData.logo_url = fileInfo.url;
    }

    const team = await Team.create(teamData);
    // Make creator the owner in TeamMembers
    await TeamMembers.create({ team_id: team.id, user_id: created_by_user_id, role: 'owner', joined_at: new Date(), left_at: null });
    // optional: notify creator (could be useful for consistency)
    try {
      const notif = await Notification.create({
        user_id: created_by_user_id,
        title: 'Equipo creado',
        message: `Has creado el equipo ${team.name}`,
        type: 'team_invite'
      });
      emitToUser(created_by_user_id, 'notification', notif.toJSON());
    } catch (_) {}
    res.status(201).json(team);
  } catch (err) {
    // Map common DB constraint errors to 400 for better client experience
    if (err && (err.name === 'SequelizeForeignKeyConstraintError' || err.name === 'SequelizeUniqueConstraintError')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

export const getTeams = async (req, res) => {
  try {
    const { q, country_id, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (q) where.name = { [Op.like]: `%${q}%` };
    if (country_id) where.country_id = country_id;

    const items = await Team.findAll({ where, limit: Number(limit), offset: Number(offset), order: [['name', 'ASC']] });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTeamById = async (req, res) => {
  try {
    const item = await Team.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Team not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTeam = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Handle file upload
    const fileInfo = getFileInfo(req);
    if (fileInfo) {
      updates.logo_url = fileInfo.url;
    }

    const [updated] = await Team.update(updates, { where: { id: req.params.id } });
    // Note: updated might be 0 if no changes were made, so we don't return 404 here.
    
    const updatedItem = await Team.findByPk(req.params.id);
    if (!updatedItem) return res.status(404).json({ error: 'Team not found' });
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    const deleted = await Team.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Team not found' });
    res.json({ message: 'Team deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Invite a user (by email or user_id) to join a team
export const inviteToTeam = async (req, res) => {
  try {
    const teamId = Number(req.params.id);
    const team = await Team.findByPk(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // requireOwnership middleware already checked ownership by created_by_user_id
    const { email, username, user_id, expires_in_hours = 168 } = req.body || {};
    if (!email && !username && !user_id) return res.status(400).json({ error: 'email o username requerido' });

    let targetUserId = user_id || null;
    if (!targetUserId && (username || email)) {
      const where = username ? { username } : { email };
      const found = await User.findOne({ where });
      if (!found && username) return res.status(400).json({ error: `username '${username}' no existe` });
      if (!found && email) {
        // Invite by email only (no user yet) is allowed
      } else if (found) {
        targetUserId = found.id;
      }
    }

    if (targetUserId) {
      const u = await User.findByPk(targetUserId);
      if (!u) return res.status(400).json({ error: 'Usuario no existe' });
      // user must not already belong to a team
      const exists = await TeamMembers.findOne({ where: { user_id: targetUserId, left_at: null } });
      if (exists) return res.status(400).json({ error: 'El usuario ya pertenece a un equipo' });
    }

    const token = uuidv4();
    const expires_at = new Date(Date.now() + Number(expires_in_hours) * 3600 * 1000);
    const invite = await TeamInvite.create({ team_id: teamId, email: email || null, user_id: targetUserId || null, token, status: 'pending', expires_at });

    // Realtime + Notification to invited user (if user_id provided)
    if (targetUserId) {
      try {
        const notif = await Notification.create({
          user_id: targetUserId,
          title: 'Invitación de equipo',
          message: `Has sido invitado a unirte a ${team.name}`,
          type: 'team_invite'
        });
        emitToUser(targetUserId, 'notification', notif.toJSON());
      } catch (_) {}
    }

    return res.status(201).json({ token: invite.token, invite });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Accept an invitation by token
export const acceptInvite = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'token requerido' });

    const invite = await TeamInvite.findOne({ where: { token } });
    if (!invite) return res.status(404).json({ error: 'Invitación no encontrada' });
    if (invite.status !== 'pending') return res.status(400).json({ error: 'Invitación no disponible' });
    if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) return res.status(400).json({ error: 'Invitación expirada' });

    // Check single-team rule
    const existing = await TeamMembers.findOne({ where: { user_id: userId, left_at: null } });
    if (existing) return res.status(400).json({ error: 'Ya perteneces a un equipo' });

    await TeamMembers.create({ team_id: invite.team_id, user_id: userId, role: 'member', joined_at: new Date(), left_at: null });
    await invite.update({ status: 'accepted' });

    // Notify team owner
    try {
      const team = await Team.findByPk(invite.team_id);
      if (team) {
        const notif = await Notification.create({
          user_id: team.created_by_user_id,
          title: 'Invitación aceptada',
          message: `Un usuario se ha unido a ${team.name}`,
          type: 'team_invite'
        });
        emitToUser(team.created_by_user_id, 'notification', notif.toJSON());
      }
    } catch (_) {}
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Request to join a team by searching it in the frontend
export const requestJoinTeam = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    const teamId = Number(req.params.id);
    const team = await Team.findByPk(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const existingMembership = await TeamMembers.findOne({ where: { user_id: userId, left_at: null } });
    if (existingMembership) return res.status(400).json({ error: 'Ya perteneces a un equipo' });

    const reqRow = await TeamJoinRequest.create({ team_id: teamId, user_id: userId, status: 'pending' });

    // Notify team owner about the join request
    try {
      const notif = await Notification.create({
        user_id: team.created_by_user_id,
        title: 'Solicitud de unión',
        message: `Un usuario ha solicitado unirse a ${team.name}`,
        type: 'team_invite'
      });
      emitToUser(team.created_by_user_id, 'notification', notif.toJSON());
    } catch (_) {}
    return res.status(201).json(reqRow);
  } catch (err) {
    if (err && err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Ya solicitaste unirte a este equipo' });
    }
    return res.status(500).json({ error: err.message });
  }
};

// Approve a join request (only team owner)
export const approveJoinRequest = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    const requestId = Number(req.params.requestId);
    const jr = await TeamJoinRequest.findByPk(requestId);
    if (!jr) return res.status(404).json({ error: 'Solicitud no encontrada' });

    const team = await Team.findByPk(jr.team_id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    if (team.created_by_user_id !== userId) return res.status(403).json({ error: 'Solo el propietario del equipo puede aprobar' });
    if (jr.status !== 'pending') return res.status(400).json({ error: 'La solicitud no está pendiente' });

    // Ensure the user still isn't member of any team
    const existing = await TeamMembers.findOne({ where: { user_id: jr.user_id, left_at: null } });
    if (existing) return res.status(400).json({ error: 'El usuario ya pertenece a un equipo' });

    await TeamMembers.create({ team_id: jr.team_id, user_id: jr.user_id, role: 'member', joined_at: new Date(), left_at: null });
    await jr.update({ status: 'approved' });

    // Notify the user about approval
    try {
      const notif = await Notification.create({
        user_id: jr.user_id,
        title: 'Solicitud aprobada',
        message: 'Tu solicitud para unirte al equipo ha sido aprobada',
        type: 'team_invite'
      });
      emitToUser(jr.user_id, 'notification', notif.toJSON());
    } catch (_) {}
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Register a team into a competition (uses Registration table)
export const registerTeamInCompetition = async (req, res) => {
  try {
    const teamId = Number(req.params.id);
    const { competition_id } = req.body || {};
    if (!competition_id) return res.status(400).json({ error: 'competition_id requerido' });

    const team = await Team.findByPk(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const comp = await Competition.findByPk(competition_id);
    if (!comp) return res.status(404).json({ error: 'Competition not found' });

    const existing = await Registration.findOne({ where: { team_id: teamId, competition_id } });
    if (existing) return res.status(400).json({ error: 'El equipo ya está registrado en esta competición' });

    const reg = await Registration.create({ team_id: teamId, competition_id, status: 'pending', registration_date: new Date() });
    return res.status(201).json(reg);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Return the team the current user belongs to (owner or member)
export const getMyTeam = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });

    // Find active membership
    const membership = await TeamMembers.findOne({ 
      where: { user_id: userId, left_at: null } 
    });

    if (!membership) {
      // Fallback: check if they own a team (legacy/safety check)
      const owned = await Team.findOne({ where: { created_by_user_id: userId } });
      if (owned) return res.json(owned);
      return res.json(null);
    }

    const team = await Team.findByPk(membership.team_id);
    return res.json(team || null);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// List join requests for a team (owner only)
export const listJoinRequests = async (req, res) => {
  try {
    const teamId = Number(req.params.id);
    const items = await TeamJoinRequest.findAll({ where: { team_id: teamId }, order: [['created_at', 'DESC']] });
    const userIds = [...new Set(items.map(i => i.user_id))];
    let usersById = {};
    if (userIds.length) {
      const users = await User.findAll({ where: { id: { [Op.in]: userIds } }, attributes: ['id', 'username', 'email', 'first_name', 'last_name'] });
      usersById = Object.fromEntries(users.map(u => [u.id, u]));
    }
    const enriched = items.map(i => {
      const u = usersById[i.user_id];
      const plain = i.toJSON();
      return { ...plain, user_username: u?.username || null, user_email: u?.email || null, user_name: u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : null };
    });
    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Leave current team (non-owners only): sets left_at on membership
export const leaveTeam = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    const membership = await TeamMembers.findOne({ where: { user_id: userId, left_at: null } });
    if (!membership) return res.status(400).json({ error: 'No perteneces a ningún equipo' });
    const team = await Team.findByPk(membership.team_id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    if (team.created_by_user_id === userId) return res.status(400).json({ error: 'El propietario no puede salir del equipo' });
    await membership.update({ left_at: new Date() });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get membership/ownership status for current user
export const getMembershipStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    const owned = await Team.findOne({ where: { created_by_user_id: userId } });
    const membership = await TeamMembers.findOne({ where: { user_id: userId, left_at: null } });
    return res.json({
      ownsTeam: Boolean(owned),
      ownedTeamId: owned ? owned.id : null,
      memberOfTeamId: membership ? membership.team_id : null
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
