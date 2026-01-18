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
    await queryInterface.addColumn('Gallery', 'competition_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Competition',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add media_type to distinguish between images and videos
    await queryInterface.addColumn('Gallery', 'media_type', {
      type: Sequelize.ENUM('image', 'video'),
      defaultValue: 'image',
      allowNull: false
    });

    // Add thumbnail_url for videos
    await queryInterface.addColumn('Gallery', 'thumbnail_url', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add duration for videos (in seconds)
    await queryInterface.addColumn('Gallery', 'duration', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // Add sort_order for custom ordering
    await queryInterface.addColumn('Gallery', 'sort_order', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    // Add is_featured flag
    await queryInterface.addColumn('Gallery', 'is_featured', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    // Add indexes
    await queryInterface.addIndex('Gallery', ['competition_id']);
    await queryInterface.addIndex('Gallery', ['media_type']);
    await queryInterface.addIndex('Gallery', ['is_featured']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Gallery', 'competition_id');
    await queryInterface.removeColumn('Gallery', 'media_type');
    await queryInterface.removeColumn('Gallery', 'thumbnail_url');
    await queryInterface.removeColumn('Gallery', 'duration');
    await queryInterface.removeColumn('Gallery', 'sort_order');
    await queryInterface.removeColumn('Gallery', 'is_featured');
  }
};
