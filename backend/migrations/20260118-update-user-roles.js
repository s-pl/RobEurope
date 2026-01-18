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
    // MySQL: Modify ENUM column to add new value 'center_admin'
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE User MODIFY COLUMN role ENUM('user', 'center_admin', 'super_admin') DEFAULT 'user';
      `);
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
    
    // Revert enum changes for MySQL
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE User MODIFY COLUMN role ENUM('user', 'super_admin') DEFAULT 'user';
      `);
    } catch (err) {
      console.log('Could not revert role ENUM:', err.message);
    }
  }
};
