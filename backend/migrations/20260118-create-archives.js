'use strict';

/**
 * Migration: Create Archives table
 * 
 * This migration creates the Archives table for storing global
 * information/files organized by competition/year with visibility control.
 */

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Archives', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      content_type: {
        type: Sequelize.ENUM('file', 'text', 'mixed'),
        defaultValue: 'text',
        allowNull: false
      },
      file_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      file_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      file_mime_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      competition_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Competitions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      visibility: {
        type: Sequelize.ENUM('hidden', 'public', 'restricted'),
        defaultValue: 'hidden',
        allowNull: false
      },
      allowed_emails: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: '[]'
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for faster lookups
    await queryInterface.addIndex('Archives', ['competition_id']);
    await queryInterface.addIndex('Archives', ['visibility']);
    await queryInterface.addIndex('Archives', ['uploaded_by']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Archives');
  }
};
