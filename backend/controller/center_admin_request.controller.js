import db from '../models/index.js';
import SystemLogger from '../utils/systemLogger.js';

const { CenterAdminRequest, User, EducationalCenter } = db;

/**
 * Get all center admin requests (filtered by status)
 */
export const getRequests = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    
    const whereClause = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      whereClause.status = status;
    }

    const requests = await CenterAdminRequest.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'requestingUser',
          attributes: ['id', 'first_name', 'last_name', 'username', 'email']
        },
        {
          model: EducationalCenter,
          as: 'center',
          attributes: ['id', 'name', 'city', 'approval_status']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.json(requests);
  } catch (err) {
    console.error('Error fetching center admin requests:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Approve a center admin request
 */
export const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.session?.user?.id;

    const request = await CenterAdminRequest.findByPk(id, {
      include: [
        { model: User, as: 'requestingUser' },
        { model: EducationalCenter, as: 'center' }
      ]
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    // Update the request
    await request.update({
      status: 'approved',
      decided_by_user_id: adminUserId,
      decided_at: new Date(),
      updated_at: new Date()
    });

    // Update the user role to center_admin
    const user = await User.findByPk(request.user_id);
    if (user) {
      await user.update({
        role: 'center_admin',
        pending_role: null,
        educational_center_id: request.educational_center_id
      });
    }

    // If the request was to create a center, approve the center too
    if (request.request_type === 'create_center' && request.center) {
      await request.center.update({
        approval_status: 'approved',
        approved_by_user_id: adminUserId,
        approved_at: new Date()
      });
    }

    // Log the action
    await SystemLogger.logUpdate('CenterAdminRequest', id, {
      status: 'approved',
      user_id: request.user_id,
      center_id: request.educational_center_id
    }, req, 'Center admin request approved');

    return res.json({ message: 'Request approved successfully', request });
  } catch (err) {
    console.error('Error approving request:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Reject a center admin request
 */
export const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminUserId = req.session?.user?.id;

    const request = await CenterAdminRequest.findByPk(id, {
      include: [
        { model: User, as: 'requestingUser' },
        { model: EducationalCenter, as: 'center' }
      ]
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    // Update the request
    await request.update({
      status: 'rejected',
      decision_reason: reason || null,
      decided_by_user_id: adminUserId,
      decided_at: new Date(),
      updated_at: new Date()
    });

    // Clear the user's pending role
    const user = await User.findByPk(request.user_id);
    if (user) {
      await user.update({
        pending_role: null
      });
    }

    // If the request was to create a center, reject the center too
    if (request.request_type === 'create_center' && request.center) {
      await request.center.update({
        approval_status: 'rejected'
      });
    }

    // Log the action
    await SystemLogger.logUpdate('CenterAdminRequest', id, {
      status: 'rejected',
      reason,
      user_id: request.user_id
    }, req, 'Center admin request rejected');

    return res.json({ message: 'Request rejected', request });
  } catch (err) {
    console.error('Error rejecting request:', err);
    return res.status(500).json({ error: err.message });
  }
};

export default {
  getRequests,
  approveRequest,
  rejectRequest
};
