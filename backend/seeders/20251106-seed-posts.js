export async function up(queryInterface, Sequelize) {
  // Resolve author id dynamically (superadmin)
  let superadminId = await queryInterface.rawSelect('User', { where: { username: 'superadmin' } }, 'id');
  if (!superadminId) {
    superadminId = await queryInterface.rawSelect(
      'User',
      { where: { id: '00000000-0000-0000-0000-000000000001' } },
      'id'
    );
  }
  const cols = await queryInterface.describeTable('Post');
  const row = {
    id: 1,
    title: 'Welcome to RobEurope',
    content: 'This is an example seeded post by the super admin.',
    author_id: superadminId || null,
    media_urls: null,
    likes_count: 0,
    views_count: 0,
    created_at: new Date(),
    updated_at: new Date()
  };
  if (cols.createdAt) row.createdAt = new Date();
  if (cols.created_at) row.created_at = new Date();
  if (cols.updatedAt) row.updatedAt = new Date();
  if (cols.updated_at) row.updated_at = new Date();

  const existing = await queryInterface.rawSelect('Post', { where: { id: 1 } }, 'id');
  if (!existing) {
    await queryInterface.bulkInsert('Post', [row], {});
  } else {
    console.log('Post id=1 already exists, skipping insert');
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete('Post', { id: 1 }, {});
}
