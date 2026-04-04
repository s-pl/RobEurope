/**
 * Migration: drop media table
 * Exports up and down functions for use with QueryInterface
 */
function normalizeTableName(tableEntry) {
  if (typeof tableEntry === 'string') return tableEntry;
  if (!tableEntry || typeof tableEntry !== 'object') return '';
  if (tableEntry.tableName) return tableEntry.tableName;
  if (tableEntry.name) return tableEntry.name;
  const firstValue = Object.values(tableEntry)[0];
  return typeof firstValue === 'string' ? firstValue : '';
}

async function hasTable(queryInterface, tableName) {
  const tables = await queryInterface.showAllTables();
  const tableNames = (tables || []).map(normalizeTableName);
  return tableNames.includes(tableName);
}

export async function up(queryInterface) {
  if (await hasTable(queryInterface, 'Media')) {
    await queryInterface.dropTable('Media');
  }
}

export async function down(queryInterface, Sequelize) {
  // Recreate the Media table if needed for rollback
  await queryInterface.createTable('Media', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    media_type: {
      type: Sequelize.ENUM('user', 'team', 'post', 'sponsor'),
      allowNull: false
    },
    media_id: {
      type: Sequelize.STRING,
      allowNull: false
    },
    filename: {
      type: Sequelize.STRING,
      allowNull: false
    },
    path: {
      type: Sequelize.STRING,
      allowNull: false
    },
    url: {
      type: Sequelize.STRING,
      allowNull: false
    },
    mime_type: {
      type: Sequelize.STRING,
      allowNull: false
    },
    size: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    uploaded_by: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });
}