import db from '../models/index.js';
import SystemLogger from '../utils/systemLogger.js';
import { v4 as uuidv4 } from 'uuid';

const { User } = db;

/**
 * @fileoverview Auth controller — Auth0 integration.
 *
 * Auth0 handles: login, register, OAuth (Google/GitHub), password reset.
 * This controller only manages the mapping between Auth0 identities and our DB users.
 */

/**
 * GET /api/auth/me
 *
 * Validates the Auth0 JWT (via auth middleware), then finds or creates
 * the corresponding user in our database. Returns the DB user (with role,
 * educational_center_id, etc.).
 *
 * On first login: fetches user profile from Auth0 /userinfo and creates the DB record.
 */
export const me = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub;
    if (!auth0Id) return res.status(401).json({ error: 'Not authenticated' });

    // Look up user by Auth0 subject
    let user = await User.findOne({ where: { auth0_id: auth0Id } });

    if (!user) {
      // First login — fetch profile from Auth0 userinfo endpoint
      let profile = {};
      try {
        const infoRes = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
          headers: { Authorization: req.headers.authorization },
        });
        if (infoRes.ok) profile = await infoRes.json();
      } catch {
        // non-fatal — use fallback values
      }

      const email = profile.email || `${auth0Id.replace('|', '_')}@auth0.local`;
      const firstName = profile.given_name || profile.name?.split(' ')[0] || 'User';
      const lastName = profile.family_name || profile.name?.split(' ').slice(1).join(' ') || 'User';

      // Generate a unique username from email or nickname
      let username = (profile.nickname || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '_');
      const existing = await User.findOne({ where: { username } });
      if (existing) username = `${username}_${uuidv4().substring(0, 4)}`;

      user = await User.create({
        auth0_id: auth0Id,
        email,
        first_name: firstName,
        last_name: lastName,
        username,
        password_hash: null,
        role: 'user',
        created_at: new Date(),
      });

      await SystemLogger.logCreate('User', user.id, { email, auth0_id: auth0Id }, req, 'Auth0 first login');
    }

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
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
