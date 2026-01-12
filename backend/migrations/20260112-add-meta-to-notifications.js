/**
 * @fileoverview Adds a nullable `meta` JSON column to the `Notification` table.
 * This enables actionable notifications (e.g., team invites with tokens).
 */

/**
 * Apply migration.
 * @param {QueryInterface} queryInterface Sequelize query interface.
 * @param {object} Sequelize Sequelize library.
 * @returns {Promise<void>}
 */
export const up = async (queryInterface, Sequelize) => {
  const tableName = 'Notification';
  const table = await queryInterface.describeTable(tableName);

  if (!table.meta) {
    await queryInterface.addColumn(tableName, 'meta', {
      type: Sequelize.JSON,
      allowNull: true
    });
  }
};

/**
 * Revert migration.
 * @param {QueryInterface} queryInterface Sequelize query interface.
 * @returns {Promise<void>}
 */
export const down = async (queryInterface) => {
  const tableName = 'Notification';
  const table = await queryInterface.describeTable(tableName);

  if (table.meta) {
    await queryInterface.removeColumn(tableName, 'meta');
  }
};
