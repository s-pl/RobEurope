export async function up(queryInterface, Sequelize) {
  const cols = await queryInterface.describeTable('Registration');
  const row = {
    id: 1,
    team_id: 1,
    competition_id: 1,
    status: 'pending',
    registration_date: new Date()
  };
  if (cols.createdAt) row.createdAt = new Date();
  if (cols.created_at) row.created_at = new Date();
  if (cols.updatedAt) row.updatedAt = new Date();
  if (cols.updated_at) row.updated_at = new Date();

  const existing = await queryInterface.rawSelect('Registration', { where: { id: 1 } }, 'id');
  if (!existing) {
    await queryInterface.bulkInsert('Registration', [row], {});
  } else {
    console.log('Registration id=1 already exists, skipping insert');
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete('Registration', { id: 1 }, {});
}
