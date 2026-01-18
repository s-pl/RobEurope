'use strict';

/**
 * Migration: Update Registration table
 * 
 * This migration adds:
 * - center_approval_status: For educational center admin approval
 * - center_approved_by: Who approved from the center
 * - password_registration: For password-based registration
 */

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    // Add center approval status
    await queryInterface.addColumn('Registration', 'center_approval_status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
    });

    // Add center approved by (center admin user id)
    await queryInterface.addColumn('Registration', 'center_approved_by', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'User',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add center approval reason
    await queryInterface.addColumn('Registration', 'center_approval_reason', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add center approved at timestamp
    await queryInterface.addColumn('Registration', 'center_approved_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add password for password-based registration
    await queryInterface.addColumn('Registration', 'registration_password', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add flag to indicate if this is a password-based registration
    await queryInterface.addColumn('Registration', 'is_password_registration', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    // Add indexes
    await queryInterface.addIndex('Registration', ['center_approval_status']);
    await queryInterface.addIndex('Registration', ['center_approved_by']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Registration', 'center_approval_status');
    await queryInterface.removeColumn('Registration', 'center_approved_by');
    await queryInterface.removeColumn('Registration', 'center_approval_reason');
    await queryInterface.removeColumn('Registration', 'center_approved_at');
    await queryInterface.removeColumn('Registration', 'registration_password');
    await queryInterface.removeColumn('Registration', 'is_password_registration');
  }
};
