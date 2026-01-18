/**
 * @fileoverview
 * Archive model definition for Sequelize ORM.
 * Represents global information/files organized by competition/year.
 * @module models/Archive
 */

/**
 * @typedef {Object} ArchiveAttributes
 * @property {number} id - Auto-incrementing primary key.
 * @property {string} title - Title of the archive item.
 * @property {string} [description] - Text description/content.
 * @property {'file'|'text'|'mixed'} content_type - Type of content.
 * @property {string} [file_url] - URL to the uploaded file.
 * @property {string} [file_name] - Original file name.
 * @property {string} [file_mime_type] - MIME type of the file.
 * @property {number} [file_size] - File size in bytes.
 * @property {number} [competition_id] - Foreign key to Competition.
 * @property {'hidden'|'public'|'restricted'} visibility - Visibility mode.
 * @property {Object} [allowed_emails] - JSON array of emails allowed when visibility is 'restricted'.
 * @property {number} [sort_order] - Order for display purposes.
 * @property {string} uploaded_by - UUID of the admin who uploaded.
 * @property {Date} created_at - Creation timestamp.
 * @property {Date} updated_at - Last update timestamp.
 */

/**
 * Defines the Archive model.
 * @param {Object} sequelize - Sequelize instance.
 * @param {Object} DataTypes - Sequelize DataTypes.
 * @returns {Object} The Archive model.
 */
export default function defineArchiveModel(sequelize, DataTypes) {
  const Archive = sequelize.define('Archive', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    content_type: {
      type: DataTypes.ENUM('file', 'text', 'mixed'),
      defaultValue: 'text',
      allowNull: false
    },
    file_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    file_mime_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    competition_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Competition',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    visibility: {
      type: DataTypes.ENUM('hidden', 'public', 'restricted'),
      defaultValue: 'hidden',
      allowNull: false
    },
    allowed_emails: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'Archive',
    timestamps: false
  });

  /**
   * Defines model associations.
   * - Archive belongs to a Competition.
   * - Archive belongs to a User (uploader).
   * @param {Object} models - All registered models.
   */
  Archive.associate = (models) => {
    Archive.belongsTo(models.Competition, {
      foreignKey: 'competition_id',
      as: 'competition'
    });
    Archive.belongsTo(models.User, {
      foreignKey: 'uploaded_by',
      as: 'uploader'
    });
  };

  return Archive;
}
