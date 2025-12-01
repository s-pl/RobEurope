/**
 * Migration to expand SystemLog.action column length to prevent truncation errors.
 */

export async function up({ context: queryInterface, Sequelize }) {
  // Adjust table/column names based on your model mapping. Assuming table is `SystemLog` and column `action` VARCHAR(16)
  await queryInterface.changeColumn('SystemLog', 'action', {
    type: Sequelize.STRING(32),
    allowNull: false,
  });
}

export async function down({ context: queryInterface, Sequelize }) {
  await queryInterface.changeColumn('SystemLog', 'action', {
    type: Sequelize.STRING(16),
    allowNull: false,
  });
}
