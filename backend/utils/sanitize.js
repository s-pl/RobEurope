/**
 * Strips sensitive fields from a user object before sending it in an API response.
 * Works with both Sequelize model instances and plain objects.
 *
 * @param {Object|null} user - User model instance or plain object.
 * @returns {Object|null} Sanitized user object, or null if input is falsy.
 */
export const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = user.toJSON ? user.toJSON() : { ...user };
  delete obj.password;
  delete obj.password_hash;
  delete obj.google_id;
  delete obj.github_id;
  delete obj.apple_id;
  delete obj.reset_token;
  delete obj.reset_token_expires;
  return obj;
};
