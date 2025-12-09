'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Users', 'password_hash', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'google_id', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn('Users', 'github_id', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn('Users', 'apple_id', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'apple_id');
    await queryInterface.removeColumn('Users', 'github_id');
    await queryInterface.removeColumn('Users', 'google_id');

    // We can't easily revert password_hash to not null without data loss or default values if there are nulls.
    // But for down migration, we can try:
    await queryInterface.changeColumn('Users', 'password_hash', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  }
};
