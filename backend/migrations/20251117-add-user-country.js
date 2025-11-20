// Migration: add country_id to User table (nullable FK to Country)
export async function up(queryInterface, Sequelize) {
  // Only add column if it does not exist
  const rows = await queryInterface.sequelize.query(
    "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'User' AND COLUMN_NAME = 'country_id' LIMIT 1;",
    { type: Sequelize.QueryTypes.SELECT }
  );

  if (rows.length === 0) {
    await queryInterface.addColumn('User', 'country_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Country', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  }
}

export async function down(queryInterface, Sequelize) {
  const rows = await queryInterface.sequelize.query(
    "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'User' AND COLUMN_NAME = 'country_id' LIMIT 1;",
    { type: Sequelize.QueryTypes.SELECT }
  );
  if (rows.length > 0) {
    await queryInterface.removeColumn('User', 'country_id');
  }
}
