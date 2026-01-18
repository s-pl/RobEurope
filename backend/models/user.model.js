/**
 * @fileoverview
 * User model definition for Sequelize ORM.
 * Represents registered users in the RobEurope platform.
 * @module models/User
 */

/**
 * @typedef {Object} UserAttributes
 * @property {string} id - UUID primary key.
 * @property {number} [country_id] - Foreign key to Country table.
 * @property {string} first_name - User's first name.
 * @property {string} last_name - User's last name.
 * @property {string} username - Unique username.
 * @property {string} email - Unique email address.
 * @property {string} [password_hash] - Bcrypt hashed password (nullable for OAuth users).
 * @property {string} [google_id] - Google OAuth identifier.
 * @property {string} [github_id] - GitHub OAuth identifier.
 * @property {string} [apple_id] - Apple OAuth identifier.
 * @property {string} [phone] - Phone number.
 * @property {string} [bio] - User biography.
 * @property {string} [profile_photo_url] - URL to profile photo.
 * @property {'user'|'super_admin'} role - User role for authorization.
 * @property {boolean} is_active - Whether the user account is active.
 * @property {Date} created_at - Account creation timestamp.
 */

/**
 * Defines the User model.
 * @async
 * @param {Object} sequelize - Sequelize instance.
 * @param {Object} DataTypes - Sequelize DataTypes.
 * @returns {Promise<Object>} The User model.
 */
export default async function defineUserModel(sequelize, DataTypes) {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    country_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Country',
        key: 'id'
      }
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: true
    },
    google_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    github_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    apple_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    profile_photo_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM('user', 'center_admin', 'super_admin'),
        defaultValue: 'user'
    },
    educational_center_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'EducationalCenters',
            key: 'id'
        }
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
  });

  /**
   * Defines model associations.
   * - User has many Posts (as author).
   * - User belongs to a Country.
   * - User has many PostLikes.
   * - User has many Comments (as author).
   * - User belongs to an EducationalCenter (for center_admin role).
   * @param {Object} models - All registered models.
   */
  User.associate = (models) => {
    User.hasMany(models.Post, { foreignKey: 'author_id' });
    User.belongsTo(models.Country, { foreignKey: 'country_id' });
    User.hasMany(models.PostLike, { foreignKey: 'user_id' });
    User.hasMany(models.Comment, { foreignKey: 'author_id' });
    if (models.EducationalCenter) {
      User.belongsTo(models.EducationalCenter, {
        foreignKey: 'educational_center_id',
        as: 'educationalCenter'
      });
    }
  };

  return User;
}