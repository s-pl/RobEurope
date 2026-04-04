import prisma from '../lib/prisma.js';
import { sanitizeUser } from '../utils/sanitize.js';

/**
 * @fileoverview
 * GDPR / RGPD compliance endpoints.
 *
 * - GET  /api/gdpr/my-data      Returns all personal data stored for the authenticated user.
 * - DELETE /api/gdpr/my-account  Anonymizes and soft-deletes the user account.
 */

/**
 * Returns ALL data stored about the authenticated user.
 *
 * @route GET /api/gdpr/my-data
 */
export const getMyData = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Gather all related data in parallel
    const [
      notifications,
      teamMembers,
      teamMessages,
      posts,
      comments,
      postLikes,
      reviews,
      teamInvites,
      teamJoinRequests,
      teamLogs,
      robotFiles,
    ] = await Promise.all([
      prisma.notification.findMany({ where: { user_id: userId } }),
      prisma.teamMember.findMany({ where: { user_id: userId } }),
      prisma.teamMessage.findMany({ where: { user_id: userId } }),
      prisma.post.findMany({ where: { author_id: userId } }),
      prisma.comment.findMany({ where: { author_id: userId } }),
      prisma.postLike.findMany({ where: { user_id: userId } }),
      prisma.review.findMany({ where: { user_id: userId } }),
      prisma.teamInvite.findMany({ where: { user_id: userId } }),
      prisma.teamJoinRequest.findMany({ where: { user_id: userId } }),
      prisma.teamLog.findMany({ where: { author_id: userId } }),
      prisma.robotFile.findMany({ where: { uploaded_by: userId } }),
    ]);

    // Registration has no user_id — find registrations for teams the user belongs to
    const userTeamIds = teamMembers.map(tm => tm.team_id).filter(Boolean);
    const registrations = userTeamIds.length > 0
      ? await prisma.registration.findMany({ where: { team_id: { in: userTeamIds } } })
      : [];

    res.json({
      profile: sanitizeUser(user),
      notifications,
      team_memberships: teamMembers,
      team_messages: teamMessages,
      posts,
      comments,
      post_likes: postLikes,
      registrations,
      reviews,
      team_invites: teamInvites,
      team_join_requests: teamJoinRequests,
      team_logs: teamLogs,
      robot_files: robotFiles,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Deletes the user account and anonymizes personal data.
 *
 * @route DELETE /api/gdpr/my-account
 */
export const deleteMyAccount = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Use a Prisma transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // 1. Delete user-owned data that has no structural dependency
      await Promise.all([
        tx.notification.deleteMany({ where: { user_id: userId } }),
        tx.postLike.deleteMany({ where: { user_id: userId } }),
        tx.teamInvite.deleteMany({ where: { user_id: userId } }),
        tx.teamJoinRequest.deleteMany({ where: { user_id: userId } }),
        tx.teamMessage.deleteMany({ where: { user_id: userId } }),
        tx.teamLog.deleteMany({ where: { author_id: userId } }),
        tx.robotFile.deleteMany({ where: { uploaded_by: userId } }),
        tx.comment.deleteMany({ where: { author_id: userId } }),
        tx.gallery.deleteMany({ where: { uploaded_by: userId } }),
        tx.media.deleteMany({ where: { uploaded_by: userId } }),
        tx.centerAdminRequest.deleteMany({ where: { user_id: userId } }),
      ]);

      // 2. Remove team memberships (keep team structures)
      await tx.teamMember.deleteMany({ where: { user_id: userId } });

      // 3. Anonymize the user record
      const anonymizedSuffix = userId.toString().slice(0, 8);
      await tx.user.update({
        where: { id: userId },
        data: {
          username: `deleted_user_${anonymizedSuffix}`,
          first_name: 'Deleted',
          last_name: 'User',
          email: `deleted_${anonymizedSuffix}@anonymized.local`,
          password_hash: null,
          google_id: null,
          github_id: null,
          apple_id: null,
          phone: null,
          bio: null,
          profile_photo_url: null,
          is_active: false,
        }
      });
    });

    res.json({ message: 'Your account has been anonymized and your personal data deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
