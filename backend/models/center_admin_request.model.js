import { DataTypes } from 'sequelize';

/**
 * CenterAdminRequest model - tracks requests to become a center administrator
 * @param {import('sequelize').Sequelize} sequelize Sequelize instance.
 * @returns {import('sequelize').Model} The CenterAdminRequest model.
 */
export default (sequelize) => {
  const CenterAdminRequest = sequelize.define('CenterAdminRequest', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    educational_center_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'EducationalCenter',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    request_type: {
      type: DataTypes.ENUM('create_center', 'join_center'),
      allowNull: false
    },
    decision_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    decided_by_user_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    decided_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'CenterAdminRequest',
    timestamps: false
  });

  CenterAdminRequest.associate = (models) => {
    CenterAdminRequest.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'requestingUser'
    });
    CenterAdminRequest.belongsTo(models.EducationalCenter, {
      foreignKey: 'educational_center_id',
      as: 'center'
    });
    CenterAdminRequest.belongsTo(models.User, {
      foreignKey: 'decided_by_user_id',
      as: 'decidedBy'
    });
  };

  return CenterAdminRequest;
};
