import db from '../models/index.js';
const { RobotFile, TeamMembers, Registration } = db;
import { getFileInfo } from '../middleware/upload.middleware.js';

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

export const getRobotFiles = async (req, res) => {
    try {
        const { team_id, competition_id } = req.query;
        
        // Basic validation
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
