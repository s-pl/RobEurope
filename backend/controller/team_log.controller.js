import db from '../models/index.js';
const { TeamLog, TeamMembers } = db;

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
