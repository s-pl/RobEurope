export const up = async (queryInterface, Sequelize) => {
  // This project uses freezeTableName: true, so the table name is 'User'
  const tableName = 'User';
  const table = await queryInterface.describeTable(tableName);

  if (table.password_hash) {
    await queryInterface.changeColumn(tableName, 'password_hash', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }

  if (!table.google_id) {
    await queryInterface.addColumn(tableName, 'google_id', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }

  if (!table.github_id) {
    await queryInterface.addColumn(tableName, 'github_id', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }

  if (!table.apple_id) {
    await queryInterface.addColumn(tableName, 'apple_id', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }

  // Add unique indexes (idempotent)
  try { await queryInterface.addIndex(tableName, ['google_id'], { unique: true, name: 'user_google_id_unique' }); } catch (_) {}
  try { await queryInterface.addIndex(tableName, ['github_id'], { unique: true, name: 'user_github_id_unique' }); } catch (_) {}
  try { await queryInterface.addIndex(tableName, ['apple_id'], { unique: true, name: 'user_apple_id_unique' }); } catch (_) {}
};

export const down = async (queryInterface, Sequelize) => {
  const tableName = 'User';
  const table = await queryInterface.describeTable(tableName);

  // Remove indexes/columns if present
  try { await queryInterface.removeIndex(tableName, 'user_apple_id_unique'); } catch (_) {}
  try { await queryInterface.removeIndex(tableName, 'user_github_id_unique'); } catch (_) {}
  try { await queryInterface.removeIndex(tableName, 'user_google_id_unique'); } catch (_) {}

  if (table.apple_id) await queryInterface.removeColumn(tableName, 'apple_id');
  if (table.github_id) await queryInterface.removeColumn(tableName, 'github_id');
  if (table.google_id) await queryInterface.removeColumn(tableName, 'google_id');

  // Reverting password_hash NOT NULL is risky if there are NULLs; keep it nullable.
  // If you really need strict NOT NULL again, do it via a data-safe migration.
};
