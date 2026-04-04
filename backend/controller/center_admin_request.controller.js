import prisma from '../lib/prisma.js';
import SystemLogger from '../utils/systemLogger.js';

/**
 * Get all center admin requests (filtered by status)
 */
export const getRequests = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    const where = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      where.status = status;
    }

    const requests = await prisma.centerAdminRequest.findMany({
      where,
      include: {
        requestingUser: { select: { id: true, first_name: true, last_name: true, username: true, email: true } },
        center: { select: { id: true, name: true, city: true, approval_status: true } }
      },
      orderBy: { created_at: 'desc' }
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
    const adminUserId = req.user?.id;

    const request = await prisma.centerAdminRequest.findUnique({
      where: { id: Number(id) },
      include: {
        requestingUser: true,
        center: true
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    // Update the request
    const updated = await prisma.centerAdminRequest.update({
      where: { id: Number(id) },
      data: {
        status: 'approved',
        decided_by_user_id: adminUserId,
        decided_at: new Date(),
        updated_at: new Date()
      }
    });

    // Update the user role to center_admin
    await prisma.user.update({
      where: { id: request.user_id },
      data: {
        role: 'center_admin',
        pending_role: null,
        educational_center_id: request.educational_center_id
      }
    });

    // If the request was to create a center, approve the center too
    if (request.request_type === 'create_center' && request.center) {
      await prisma.educationalCenter.update({
        where: { id: request.educational_center_id },
        data: { approval_status: 'approved', approved_at: new Date() }
      });
    }

    await SystemLogger.logUpdate('CenterAdminRequest', id, {
      status: 'approved',
      user_id: request.user_id,
      center_id: request.educational_center_id
    }, req, 'Center admin request approved');

    return res.json({ message: 'Request approved successfully', request: updated });
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
    const adminUserId = req.user?.id;

    const request = await prisma.centerAdminRequest.findUnique({
      where: { id: Number(id) },
      include: { center: true }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    const updated = await prisma.centerAdminRequest.update({
      where: { id: Number(id) },
      data: {
        status: 'rejected',
        decision_reason: reason || null,
        decided_by_user_id: adminUserId,
        decided_at: new Date(),
        updated_at: new Date()
      }
    });

    // Clear the user's pending role
    await prisma.user.update({
      where: { id: request.user_id },
      data: { pending_role: null }
    });

    // If the request was to create a center, reject the center too
    if (request.request_type === 'create_center' && request.center) {
      await prisma.educationalCenter.update({
        where: { id: request.educational_center_id },
        data: { approval_status: 'rejected' }
      });
    }

    await SystemLogger.logUpdate('CenterAdminRequest', id, {
      status: 'rejected',
      reason,
      user_id: request.user_id
    }, req, 'Center admin request rejected');

    return res.json({ message: 'Request rejected', request: updated });
  } catch (err) {
    console.error('Error rejecting request:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Render the center requests page for the admin dashboard (EJS)
 */
export const renderCenterRequests = async (req, res) => {
  try {
    const requests = await prisma.centerAdminRequest.findMany({
      include: {
        requestingUser: { select: { id: true, first_name: true, last_name: true, username: true, email: true } },
        center: { select: { id: true, name: true, city: true, approval_status: true } },
        decidedBy: { select: { id: true, first_name: true, last_name: true, username: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    res.render('center-requests', {
      title: req.__('centerRequests.metaTitle') || 'Solicitudes de Centro Admin',
      pageKey: 'centerRequests',
      requests
    });
  } catch (err) {
    console.error('Error rendering center requests page:', err);
    res.status(500).send('Error loading requests');
  }
};

/**
 * Approve a request from the dashboard (POST with redirect)
 */
export const approveRequestDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user?.id;

    const request = await prisma.centerAdminRequest.findUnique({
      where: { id: Number(id) },
      include: { center: true }
    });

    if (!request || request.status !== 'pending') {
      return res.redirect('/admin/center-requests');
    }

    await prisma.centerAdminRequest.update({
      where: { id: Number(id) },
      data: {
        status: 'approved',
        decided_by_user_id: adminUserId,
        decided_at: new Date(),
        updated_at: new Date()
      }
    });

    await prisma.user.update({
      where: { id: request.user_id },
      data: {
        role: 'center_admin',
        pending_role: null,
        educational_center_id: request.educational_center_id
      }
    });

    if (request.request_type === 'create_center' && request.center) {
      await prisma.educationalCenter.update({
        where: { id: request.educational_center_id },
        data: { approval_status: 'approved', approved_at: new Date() }
      });
    }

    await SystemLogger.logUpdate('CenterAdminRequest', id, {
      status: 'approved',
      user_id: request.user_id
    }, req, 'Center admin request approved from dashboard');

    return res.redirect('/admin/center-requests');
  } catch (err) {
    console.error('Error approving request from dashboard:', err);
    return res.redirect('/admin/center-requests');
  }
};

/**
 * Reject a request from the dashboard (POST with redirect)
 */
export const rejectRequestDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminUserId = req.user?.id;

    const request = await prisma.centerAdminRequest.findUnique({
      where: { id: Number(id) },
      include: { center: true }
    });

    if (!request || request.status !== 'pending') {
      return res.redirect('/admin/center-requests');
    }

    await prisma.centerAdminRequest.update({
      where: { id: Number(id) },
      data: {
        status: 'rejected',
        decision_reason: reason || null,
        decided_by_user_id: adminUserId,
        decided_at: new Date(),
        updated_at: new Date()
      }
    });

    await prisma.user.update({
      where: { id: request.user_id },
      data: { pending_role: null }
    });

    if (request.request_type === 'create_center' && request.center) {
      await prisma.educationalCenter.update({
        where: { id: request.educational_center_id },
        data: { approval_status: 'rejected' }
      });
    }

    await SystemLogger.logUpdate('CenterAdminRequest', id, {
      status: 'rejected',
      reason
    }, req, 'Center admin request rejected from dashboard');

    return res.redirect('/admin/center-requests');
  } catch (err) {
    console.error('Error rejecting request from dashboard:', err);
    return res.redirect('/admin/center-requests');
  }
};

export default {
  getRequests,
  approveRequest,
  rejectRequest,
  renderCenterRequests,
  approveRequestDashboard,
  rejectRequestDashboard
};
