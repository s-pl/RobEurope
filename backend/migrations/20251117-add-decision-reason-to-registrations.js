export async function up(queryInterface, Sequelize) {
  // Project uses singular table name `Registration` (not `Registrations`)
  try {
    // Skip if column already exists
    const cols = await queryInterface.describeTable('Registration');
    if (!cols.decision_reason) {
      await queryInterface.addColumn('Registration', 'decision_reason', { type: Sequelize.STRING, allowNull: true });
    }
  } catch (e) {
    console.error('Migration add decision_reason failed', e.message);
  }
}

export async function down(queryInterface, Sequelize) {
  try {
    const cols = await queryInterface.describeTable('Registration');
    if (cols.decision_reason) {
      await queryInterface.removeColumn('Registration', 'decision_reason');
    }
  } catch (e) {
    console.error('Rollback remove decision_reason failed', e.message);
  }
}
