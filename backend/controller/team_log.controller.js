/**
 * @fileoverview Team log endpoints.
 *
 * Team logs are internal notes/entries associated with a team and competition.
 * Only team members (or admins) can create/read/delete entries.
 */

import db from '../models/index.js';
const { TeamLog, TeamMembers } = db;

/**
 * Express request.
 * @typedef {object} Request
 * @property {object} params
 * @property {object} query
 * @property {object} body
 * @property {object} user
 * @property {number} user.id
 * @property {string} [user.role]
 */

/**
 * Express response.
 * @typedef {object} Response
 * @property {(status:number)=>Response} status
 * @property {(body:any)=>void} json
 */

/**
 * Create a team log entry.
 *
 * @route POST /api/team_log
 * @param {Request} req
 * @param {Response} res
 */
export const createLogEntry = async (req, res) => {
    try {
        const { team_id, competition_id, content } = req.body;

        // Check permissions
        const membership = await TeamMembers.findOne({
            where: {
                team_id,
                user_id: req.user.id,
                left_at: null
            }
        });

        if (!membership && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not a member of this team' });
        }

        const log = await TeamLog.create({
            team_id,
            competition_id,
            content,
            author_id: req.user.id
        });

        const logWithAuthor = await TeamLog.findByPk(log.id, {
             include: [{ model: db.User, as: 'author', attributes: ['username'] }]
        });

        res.status(201).json(logWithAuthor);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Get team log entries for a team and competition.
 *
 * @route GET /api/team_log
 * @param {Request} req
 * @param {Response} res
 */
export const getTeamLogs = async (req, res) => {
    try {
        const { team_id, competition_id } = req.query;

        if (!team_id || !competition_id) {
            return res.status(400).json({ error: 'team_id and competition_id are required' });
        }

        const logs = await TeamLog.findAll({
            where: { team_id, competition_id },
            include: [{ model: db.User, as: 'author', attributes: ['username'] }],
            order: [['created_at', 'DESC']]
        });

        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Delete a team log entry.
 *
 * @route DELETE /api/team_log/:id
 * @param {Request} req
 * @param {Response} res
 */
export const deleteLogEntry = async (req, res) => {
    try {
        const logId = req.params.id;
        const log = await TeamLog.findByPk(logId);
        if (!log) {
            return res.status(404).json({ error: 'Log entry not found' });
        }
        // Check permissions
        const membership = await TeamMembers.findOne({
            where: {
                team_id: log.team_id,
                user_id: req.user.id,
                left_at: null
            }
        });
        if (!membership && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not a member of this team' });
        }
        await log.destroy();
        res.json({ message: 'Log entry deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};