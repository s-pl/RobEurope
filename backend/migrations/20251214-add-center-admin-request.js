'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add pending_role and educational_center_id to User table
    await queryInterface.addColumn('User', 'pending_role', {
      type: Sequelize.ENUM('user', 'center_admin', 'super_admin'),
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('User', 'educational_center_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'EducationalCenter',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Create CenterAdminRequest table
    await queryInterface.createTable('CenterAdminRequest', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'User',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      educational_center_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'EducationalCenter',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      request_type: {
        type: Sequelize.ENUM('create_center', 'join_center'),
        allowNull: false
      },
      decision_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      decided_by_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'User',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      decided_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('CenterAdminRequest');
    await queryInterface.removeColumn('User', 'educational_center_id');
    await queryInterface.removeColumn('User', 'pending_role');
  }
};
