/**
 * @fileoverview
 * Educational Center model definition for Sequelize ORM.
 * Represents schools/institutions that teams belong to.
 * @module models/EducationalCenter
 */

/**
 * @typedef {Object} EducationalCenterAttributes
 * @property {number} id - Auto-incrementing primary key.
 * @property {string} name - Unique name of the educational center.
 * @property {number} [country_id] - Foreign key to Country table.
 * @property {string} [city] - City where the center is located.
 * @property {string} [address] - Physical address.
 * @property {string} [website_url] - Center website URL.
 * @property {string} [phone] - Contact phone number.
 * @property {string} [email] - Contact email.
 * @property {string} [logo_url] - URL to center logo.
 * @property {string} [description] - Description of the center.
 * @property {string} [admin_user_id] - UUID of the center administrator.
 * @property {'pending'|'approved'|'rejected'} approval_status - Approval status by super_admin.
 * @property {string} [approval_reason] - Reason for approval/rejection.
 * @property {Date} [approved_at] - When the center was approved.
 * @property {Date} created_at - Creation timestamp.
 * @property {Date} updated_at - Last update timestamp.
 */

/**
 * Defines the EducationalCenter model.
 * @param {Object} sequelize - Sequelize instance.
 * @param {Object} DataTypes - Sequelize DataTypes.
 * @returns {Object} The EducationalCenter model.
 */
export default function defineEducationalCenterModel(sequelize, DataTypes) {
  const EducationalCenter = sequelize.define('EducationalCenter', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    country_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Country',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    website_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    logo_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    admin_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'User',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    approval_status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
    },
    approval_reason: {
      type: DataTypes.STRING,
      allowNull: true
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true
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
    tableName: 'EducationalCenters',
    timestamps: false
  });

  /**
   * Defines model associations.
   * - EducationalCenter belongs to a Country.
   * - EducationalCenter belongs to an admin User.
   * - EducationalCenter has many Teams.
   * - EducationalCenter has many Streams.
   * @param {Object} models - All registered models.
   */
  EducationalCenter.associate = (models) => {
    EducationalCenter.belongsTo(models.Country, {
      foreignKey: 'country_id',
      as: 'country'
    });
    EducationalCenter.belongsTo(models.User, {
      foreignKey: 'admin_user_id',
      as: 'admin'
    });
    EducationalCenter.hasMany(models.Team, {
      foreignKey: 'educational_center_id',
      as: 'teams'
    });
    EducationalCenter.hasMany(models.Stream, {
      foreignKey: 'educational_center_id',
      as: 'streams'
    });
  };

  return EducationalCenter;
}
