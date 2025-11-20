export async function up(queryInterface, Sequelize) {
  const cols = await queryInterface.describeTable('Competition');
  const now = new Date();
  const rows = [
    {
      id: 1,
      title: 'Example Competition',
      slug: 'example-competition',
      description: 'Competition seeded for development',
      registration_start: now,
      registration_end: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
      start_date: new Date(now.getTime() + 14 * 24 * 3600 * 1000),
      end_date: new Date(now.getTime() + 16 * 24 * 3600 * 1000),
      rules_url: null,
      stream_url: null
    },
    {
      id: 2,
      title: 'Robotics Championship',
      slug: 'robotics-championship',
      description: 'Annual robotics competition',
      registration_start: now,
      registration_end: new Date(now.getTime() + 10 * 24 * 3600 * 1000),
      start_date: new Date(now.getTime() + 20 * 24 * 3600 * 1000),
      end_date: new Date(now.getTime() + 22 * 24 * 3600 * 1000),
      rules_url: null,
      stream_url: null
    },
    {
      id: 3,
      title: 'AI Challenge',
      slug: 'ai-challenge',
      description: 'Artificial intelligence programming challenge',
      registration_start: now,
      registration_end: new Date(now.getTime() + 5 * 24 * 3600 * 1000),
      start_date: new Date(now.getTime() + 12 * 24 * 3600 * 1000),
      end_date: new Date(now.getTime() + 14 * 24 * 3600 * 1000),
      rules_url: null,
      stream_url: null
    }
  ];

  for (const row of rows) {
    if (cols.country_id) row.country_id = null;
    if (cols.createdAt) row.createdAt = now;
    if (cols.created_at) row.created_at = now;
    if (cols.updatedAt) row.updatedAt = now;
    if (cols.updated_at) row.updated_at = now;

    const existing = await queryInterface.rawSelect('Competition', { where: { id: row.id } }, 'id');
    if (!existing) {
      await queryInterface.bulkInsert('Competition', [row], {});
    } else {
      console.log(`Competition id=${row.id} already exists, skipping insert`);
    }
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete('Competition', { id: [1, 2, 3] }, {});
}
