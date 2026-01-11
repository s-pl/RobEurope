/**
 * @fileoverview Robot file upload/list/delete endpoints.
 *
 * Robot files are uploaded for a team and competition and can be toggled public.
 * Access checks are enforced for team members (or admins).
 */

import db from '../models/index.js';
const { RobotFile, TeamMembers, Registration } = db;
import { getFileInfo } from '../middleware/upload.middleware.js';

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
 * @property {Function} status
 * @property {Function} json
 */

/**
 * Upload a robot file.
 *
 * Requires membership in the given team (unless admin). The file is provided by
 * route-level upload middleware and inspected via `getFileInfo`.
 *
 * @route POST /api/robot_file
 * @param {Request} req
 * @param {Response} res
 */
export const uploadRobotFile = async (req, res) => {
    try {
        const { team_id, competition_id, description } = req.body;
        const fileInfo = getFileInfo(req);

        if (!fileInfo) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

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

        const newFile = await RobotFile.create({
            team_id,
            competition_id,
            file_url: fileInfo.url,
            file_name: fileInfo.originalname,
            file_type: fileInfo.mimetype,
            description,
            uploaded_by: req.user.id
        });

        res.status(201).json(newFile);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * List robot files.
 *
 * - When `competition_id` is provided without `team_id`, returns public files for that competition.
 * - When both are provided, returns files for that team+competition.
 *
 * @route GET /api/robot_file
 * @param {Request} req
 * @param {Response} res
 */
export const getRobotFiles = async (req, res) => {
    try {
        const { team_id, competition_id } = req.query;
        
       
        if (competition_id && !team_id) {
            const files = await RobotFile.findAll({
                where: { 
                    competition_id,
                    is_public: true
                },
                include: [
                    { model: db.User, as: 'uploader', attributes: ['username'] },
                    { model: db.Team, attributes: ['name', 'id'] }
                ],
                order: [['created_at', 'DESC']]
            });
            return res.json(files);
        }

   
        if (!team_id || !competition_id) {
            return res.status(400).json({ error: 'team_id and competition_id are required' });
        }

        const files = await RobotFile.findAll({
            where: { team_id, competition_id },
            include: [{ model: db.User, as: 'uploader', attributes: ['username'] }],
            order: [['created_at', 'DESC']]
        });

        res.json(files);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Delete a robot file.
 * Requires team membership or admin.
 *
 * @route DELETE /api/robot_file/:id
 * @param {Request} req
 * @param {Response} res
 */
export const deleteRobotFile = async (req, res) => {
    try {
        const file = await RobotFile.findByPk(req.params.id);
        if (!file) return res.status(404).json({ error: 'File not found' });

        // Check permissions
        if (req.user.role !== 'admin') {
             const membership = await TeamMembers.findOne({
                where: {
                    team_id: file.team_id,
                    user_id: req.user.id,
                    left_at: null
                }
            });
            if (!membership) return res.status(403).json({ error: 'Permission denied' });
        }

        await file.destroy();
        res.json({ message: 'File deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Toggle a robot file's public visibility.
 * Requires team membership or admin.
 *
 * @route PUT /api/robot_file/:id/visibility
 * @param {Request} req
 * @param {Response} res
 */
export const toggleFileVisibility = async (req, res) => {
    try {
        const file = await RobotFile.findByPk(req.params.id);
        if (!file) return res.status(404).json({ error: 'File not found' });

        // Check permissions (Admin or Team Member)
        if (req.user.role !== 'admin') {
             const membership = await TeamMembers.findOne({
                where: {
                    team_id: file.team_id,
                    user_id: req.user.id,
                    left_at: null
                }
            });
            if (!membership) return res.status(403).json({ error: 'Permission denied' });
        }

        file.is_public = !file.is_public;
        await file.save();

        res.json(file);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
