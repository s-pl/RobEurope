export async function up(queryInterface, Sequelize) {
  // Resolve superadmin user id dynamically to avoid FK issues if it already exists with a different id
  let superadminId = await queryInterface.rawSelect('User', { where: { username: 'superadmin' } }, 'id');
  if (!superadminId) {
    superadminId = await queryInterface.rawSelect(
      'User',
      { where: { id: '00000000-0000-0000-0000-000000000001' } },
      'id'
    );
  }
  const cols = await queryInterface.describeTable('TeamMembers');
  const row = {
    id: 1,
    team_id: 1,
    user_id: superadminId || '00000000-0000-0000-0000-000000000001',
    role: 'owner',
    joined_at: new Date(),
    left_at: null
  };
  if (cols.createdAt) row.createdAt = new Date();
  if (cols.created_at) row.created_at = new Date();
  if (cols.updatedAt) row.updatedAt = new Date();
  if (cols.updated_at) row.updated_at = new Date();

  const existing = await queryInterface.rawSelect('TeamMembers', { where: { id: 1 } }, 'id');
  if (!existing) {
    await queryInterface.bulkInsert('TeamMembers', [row], {});
  } else {
    console.log('TeamMembers id=1 already exists, skipping insert');
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete('TeamMembers', { id: 1 }, {});
}
