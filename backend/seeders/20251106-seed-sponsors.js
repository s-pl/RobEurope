export async function up(queryInterface, Sequelize) {
  const cols = await queryInterface.describeTable('Sponsor');
  const row = {
    id: 1,
    name: 'Example Sponsor',
    logo_url: null,
    website_url: 'https://example.com',
    created_at: new Date(),
    updated_at: new Date()
  };
  if (cols.createdAt) row.createdAt = new Date();
  if (cols.created_at) row.created_at = new Date();
  if (cols.updatedAt) row.updatedAt = new Date();
  if (cols.updated_at) row.updated_at = new Date();

  const existing = await queryInterface.rawSelect('Sponsor', { where: { id: 1 } }, 'id');
  if (!existing) {
    await queryInterface.bulkInsert('Sponsor', [row], {});
  } else {
    console.log('Sponsor id=1 already exists, skipping insert');
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete('Sponsor', { id: 1 }, {});
}
