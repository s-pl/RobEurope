'use strict';

/**
 * Migration: Update Teams table
 * 
 * This migration adds educational_center_id to Teams table
 * and adds approved_by_center field for center admin approval.
 */

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    // Add educational_center_id to Teams
    await queryInterface.addColumn('Teams', 'educational_center_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'EducationalCenters',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add competition_id to Teams for associating teams with competitions
    await queryInterface.addColumn('Teams', 'competition_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Competitions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add indexes
    await queryInterface.addIndex('Teams', ['educational_center_id']);
    await queryInterface.addIndex('Teams', ['competition_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Teams', 'educational_center_id');
    await queryInterface.removeColumn('Teams', 'competition_id');
  }
};
