'use strict';

/**
 * Migration: Update User roles
 * 
 * This migration updates the User table to support new roles:
 * - user: Regular participant
 * - center_admin: Educational center administrator
 * - super_admin: Global administrator
 */

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    // Update enum values in a dialect-agnostic way.
    try {
      await queryInterface.changeColumn('User', 'role', {
        type: Sequelize.ENUM('user', 'center_admin', 'super_admin'),
        allowNull: false,
        defaultValue: 'user',
      });
      console.log('Updated User.role ENUM with center_admin');
    } catch (err) {
      console.log('Could not modify role ENUM:', err.message);
    }

    // Add educational_center_id to User table
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

    // Add index
    await queryInterface.addIndex('User', ['educational_center_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('User', 'educational_center_id');
    
    // Revert enum values in a dialect-agnostic way.
    try {
      await queryInterface.changeColumn('User', 'role', {
        type: Sequelize.ENUM('user', 'super_admin'),
        allowNull: false,
        defaultValue: 'user',
      });
    } catch (err) {
      console.log('Could not revert role ENUM:', err.message);
    }
  }
};
