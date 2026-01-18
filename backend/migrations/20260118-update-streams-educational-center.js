'use strict';

/**
 * Migration: Update Streams table
 * 
 * This migration adds educational_center_id to Streams table
 * so streams are associated with educational centers, not teams.
 */

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    // Add educational_center_id to Streams
    await queryInterface.addColumn('Streams', 'educational_center_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'EducationalCenters',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add index
    await queryInterface.addIndex('Streams', ['educational_center_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Streams', 'educational_center_id');
  }
};
