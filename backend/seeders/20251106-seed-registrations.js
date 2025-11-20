export async function up(queryInterface, Sequelize) {
  const cols = await queryInterface.describeTable('Registration');
  const now = new Date();
  // Helper to attach timestamp columns that may exist under different naming conventions
  const attachTimestamps = (row) => {
    if (cols.createdAt) row.createdAt = now;
    if (cols.created_at) row.created_at = now;
    if (cols.updatedAt) row.updatedAt = now;
    if (cols.updated_at) row.updated_at = now;
    return row;
  };

  const rows = [
    attachTimestamps({ id: 1, team_id: 1, competition_id: 1, status: 'pending', registration_date: now }),
    attachTimestamps({ id: 2, team_id: 1, competition_id: 2, status: 'approved', decision_reason: 'Meets all entry criteria', registration_date: now }),
    attachTimestamps({ id: 3, team_id: 1, competition_id: 3, status: 'rejected', decision_reason: 'Roster incomplete', registration_date: now })
  ];

  for (const r of rows) {
    const exists = await queryInterface.rawSelect('Registration', { where: { id: r.id } }, 'id');
    if (!exists) {
      await queryInterface.bulkInsert('Registration', [r], {});
    } else {
      console.log(`Registration id=${r.id} already exists, skipping insert`);
    }
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete('Registration', { id: [1,2,3] }, {});
}
