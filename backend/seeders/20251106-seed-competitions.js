export async function up(queryInterface, Sequelize) {
  const cols = await queryInterface.describeTable('Competition');
  const row = {
    id: 1,
    title: 'Example Competition',
    slug: 'example-competition',
    description: 'Competition seeded for development',
    country_id: null,
    registration_start: new Date(),
    registration_end: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    start_date: new Date(Date.now() + 14 * 24 * 3600 * 1000),
    end_date: new Date(Date.now() + 16 * 24 * 3600 * 1000),
    rules_url: null,
    stream_url: null
  };
  if (cols.createdAt) row.createdAt = new Date();
  if (cols.created_at) row.created_at = new Date();
  if (cols.updatedAt) row.updatedAt = new Date();
  if (cols.updated_at) row.updated_at = new Date();

  const existing = await queryInterface.rawSelect('Competition', { where: { id: 1 } }, 'id');
  if (!existing) {
    await queryInterface.bulkInsert('Competition', [row], {});
  } else {
    console.log('Competition id=1 already exists, skipping insert');
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete('Competition', { id: 1 }, {});
}
