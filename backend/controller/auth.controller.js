/**
 * @fileoverview Auth controller — Auth0 integration.
 *
 * Auth0 handles: login, register, OAuth (Google/GitHub), password reset.
 * This controller only returns the authenticated user already hydrated by middleware.
 */

/**
 * GET /api/auth/me
 *
 * Returns the authenticated DB user with role and center metadata.
 */
export const me = async (req, res) => {
  const user = req.user;
  if (!user?.id) return res.status(401).json({ error: 'Not authenticated' });

  return res.json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    role: user.role,
    educational_center_id: user.educational_center_id ?? null,
    profile_photo_url: user.profile_photo_url ?? null,
    is_active: user.is_active,
  });
};
