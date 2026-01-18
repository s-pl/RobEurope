'use strict';

/**
 * Migration: Update Gallery table
 * 
 * This migration enhances the Gallery table to support:
 * - Videos in addition to images
 * - Association with competitions
 * - Media type categorization
 */

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    // Add competition_id to Gallery
    await queryInterface.addColumn('Galleries', 'competition_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Competitions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add media_type to distinguish between images and videos
    await queryInterface.addColumn('Galleries', 'media_type', {
      type: Sequelize.ENUM('image', 'video'),
      defaultValue: 'image',
      allowNull: false
    });

    // Add thumbnail_url for videos
    await queryInterface.addColumn('Galleries', 'thumbnail_url', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add duration for videos (in seconds)
    await queryInterface.addColumn('Galleries', 'duration', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // Add sort_order for custom ordering
    await queryInterface.addColumn('Galleries', 'sort_order', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    // Add is_featured flag
    await queryInterface.addColumn('Galleries', 'is_featured', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    // Add indexes
    await queryInterface.addIndex('Galleries', ['competition_id']);
    await queryInterface.addIndex('Galleries', ['media_type']);
    await queryInterface.addIndex('Galleries', ['is_featured']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Galleries', 'competition_id');
    await queryInterface.removeColumn('Galleries', 'media_type');
    await queryInterface.removeColumn('Galleries', 'thumbnail_url');
    await queryInterface.removeColumn('Galleries', 'duration');
    await queryInterface.removeColumn('Galleries', 'sort_order');
    await queryInterface.removeColumn('Galleries', 'is_featured');
  }
};
