import db from '../models/index.js';
import { sanitizeUser } from '../utils/sanitize.js';

const {
  User,
  Notification,
  TeamMembers,
  Team,
  TeamMessage,
  Post,
  Comment,
  Review,
  Registration,
  PostLike,
  TeamInvite,
  TeamJoinRequest,
  TeamLog,
  RobotFile,
  Gallery,
  Media,
  CenterAdminRequest,
} = db;

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

    const user = await User.findByPk(userId);
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
      Notification      ? Notification.findAll({ where: { user_id: userId } })      : [],
      TeamMembers       ? TeamMembers.findAll({ where: { user_id: userId } })        : [],
      TeamMessage       ? TeamMessage.findAll({ where: { user_id: userId } })        : [],
      Post              ? Post.findAll({ where: { author_id: userId } })             : [],
      Comment           ? Comment.findAll({ where: { author_id: userId } })          : [],
      PostLike          ? PostLike.findAll({ where: { user_id: userId } })           : [],
      Review            ? Review.findAll({ where: { user_id: userId } })             : [],
      TeamInvite        ? TeamInvite.findAll({ where: { user_id: userId } })         : [],
      TeamJoinRequest   ? TeamJoinRequest.findAll({ where: { user_id: userId } })    : [],
      TeamLog           ? TeamLog.findAll({ where: { author_id: userId } })          : [],
      RobotFile         ? RobotFile.findAll({ where: { uploaded_by: userId } })      : [],
    ]);

    // Registration has no user_id — it links to teams via team_id.
    // Find registrations for teams the user belongs to.
    const userTeamIds = teamMembers.map(tm => tm.team_id).filter(Boolean);
    const registrations = (Registration && userTeamIds.length > 0)
      ? await Registration.findAll({ where: { team_id: userTeamIds } })
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
 * The approach:
 * 1. Anonymize the user record (username -> "deleted_user_<id>", clear personal fields).
 * 2. Delete notifications, messages, likes, invites, join requests.
 * 3. Keep posts/comments but anonymize authorship (author_id set to null or kept for structural integrity).
 * 4. Remove team memberships (teams themselves stay intact).
 * 5. Destroy the session.
 *
 * @route DELETE /api/gdpr/my-account
 */
export const deleteMyAccount = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const userId = req.user?.id;
    if (!userId) {
      await transaction.rollback();
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ error: 'User not found' });
    }

    // 1. Delete user-owned data that has no structural dependency
    const deletions = [];
    if (Notification)       deletions.push(Notification.destroy({ where: { user_id: userId }, transaction }));
    if (PostLike)           deletions.push(PostLike.destroy({ where: { user_id: userId }, transaction }));
    if (TeamInvite)         deletions.push(TeamInvite.destroy({ where: { user_id: userId }, transaction }));
    if (TeamJoinRequest)    deletions.push(TeamJoinRequest.destroy({ where: { user_id: userId }, transaction }));
    if (TeamMessage)        deletions.push(TeamMessage.destroy({ where: { user_id: userId }, transaction }));
    if (TeamLog)            deletions.push(TeamLog.destroy({ where: { author_id: userId }, transaction }));
    if (RobotFile)          deletions.push(RobotFile.destroy({ where: { uploaded_by: userId }, transaction }));
    if (Comment)            deletions.push(Comment.destroy({ where: { author_id: userId }, transaction }));
    if (Gallery)            deletions.push(Gallery.destroy({ where: { uploaded_by: userId }, transaction }));
    if (Media)              deletions.push(Media.destroy({ where: { uploaded_by: userId }, transaction }));
    if (CenterAdminRequest) deletions.push(CenterAdminRequest.destroy({ where: { user_id: userId }, transaction }));
    await Promise.all(deletions);

    // 2. Remove team memberships (keep team structures)
    if (TeamMembers) {
      await TeamMembers.destroy({ where: { user_id: userId }, transaction });
    }

    // 3. Anonymize the user record instead of hard-deleting to keep referential integrity
    const anonymizedSuffix = userId.toString().slice(0, 8);
    await user.update({
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
    }, { transaction });

    await transaction.commit();

    res.json({ message: 'Your account has been anonymized and your personal data deleted.' });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ error: err.message });
  }
};
