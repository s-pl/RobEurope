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
    // PostgreSQL: Replace ENUM type with new values
    // First, rename old enum and create new one
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Users_role" RENAME TO "enum_Users_role_old";
    `).catch(() => {
      // Enum might not exist or have different name
    });

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Users_role" AS ENUM('user', 'center_admin', 'super_admin');
    `).catch(() => {
      // Type might already exist
    });

    // Update column to use new enum
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" 
      ALTER COLUMN "role" TYPE "enum_Users_role" 
      USING (
        CASE 
          WHEN "role"::text = 'admin' THEN 'super_admin'::text
          ELSE COALESCE("role"::text, 'user')
        END
      )::"enum_Users_role";
    `).catch(async (err) => {
      // Fallback for different database structures
      console.log('Using fallback enum migration:', err.message);
      await queryInterface.changeColumn('Users', 'role', {
        type: Sequelize.STRING,
        defaultValue: 'user'
      });
    });

    // Add educational_center_id to Users table
    await queryInterface.addColumn('Users', 'educational_center_id', {
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
    await queryInterface.addIndex('Users', ['educational_center_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'educational_center_id');
    
    // Revert enum changes
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Users_role" RENAME TO "enum_Users_role_new";
      CREATE TYPE "enum_Users_role" AS ENUM('user', 'super_admin');
      ALTER TABLE "Users" 
      ALTER COLUMN "role" TYPE "enum_Users_role" 
      USING (
        CASE 
          WHEN "role"::text = 'center_admin' THEN 'user'::text
          ELSE "role"::text
        END
      )::"enum_Users_role";
      DROP TYPE "enum_Users_role_new";
    `).catch(() => {});
  }
};
