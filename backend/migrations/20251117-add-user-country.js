// Migration: add country_id to User table (nullable FK to Country)
async function hasColumn(queryInterface, tableName, columnName) {
  try {
    const columns = await queryInterface.describeTable(tableName);
    return Object.prototype.hasOwnProperty.call(columns, columnName);
  } catch {
    return false;
  }
}

export async function up(queryInterface, Sequelize) {
  // Only add column if it does not exist
  if (!(await hasColumn(queryInterface, 'User', 'country_id'))) {
    await queryInterface.addColumn('User', 'country_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Country', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  }
}

export async function down(queryInterface) {
  if (await hasColumn(queryInterface, 'User', 'country_id')) {
    await queryInterface.removeColumn('User', 'country_id');
  }
}
