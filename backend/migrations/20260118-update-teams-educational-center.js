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
    // Add educational_center_id to Team
    await queryInterface.addColumn('Team', 'educational_center_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'EducationalCenter',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add competition_id to Team for associating teams with competitions
    await queryInterface.addColumn('Team', 'competition_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Competition',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add indexes
    await queryInterface.addIndex('Team', ['educational_center_id']);
    await queryInterface.addIndex('Team', ['competition_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Team', 'educational_center_id');
    await queryInterface.removeColumn('Team', 'competition_id');
  }
};
