export async function up(queryInterface, Sequelize) {
  const cols = await queryInterface.describeTable('Stream');
  const now = new Date();

  const rows = [
    {
      id: 1,
      title: 'Example Competition Opening Ceremony',
      description: 'Live stream of the opening ceremony for Example Competition',
      stream_url: 'https://example.com/stream/1',
      status: 'scheduled',
      competition_id: 1,
      team_id: 1
    },
    {
      id: 2,
      title: 'Robotics Championship Finals',
      description: 'Final round of the Robotics Championship',
      stream_url: 'https://example.com/stream/2',
      status: 'offline',
      competition_id: 2,
      team_id: 1
    },
    {
      id: 3,
      title: 'AI Challenge Workshop',
      description: 'Interactive workshop for AI Challenge participants',
      stream_url: 'https://example.com/stream/3',
      status: 'live',
      competition_id: 3,
      team_id: 1
    },
    {
      id: 4,
      title: 'Example Competition Round 1',
      description: 'First round matches of Example Competition',
      stream_url: 'https://example.com/stream/4',
      status: 'scheduled',
      competition_id: 1,
      team_id: 1
    }
  ];

  for (const row of rows) {
    if (cols.createdAt) row.createdAt = now;
    if (cols.created_at) row.created_at = now;
    if (cols.updatedAt) row.updatedAt = now;
    if (cols.updated_at) row.updated_at = now;

    const existing = await queryInterface.rawSelect('Stream', { where: { id: row.id } }, 'id');
    if (!existing) {
      await queryInterface.bulkInsert('Stream', [row], {});
    } else {
      console.log(`Stream id=${row.id} already exists, skipping insert`);
    }
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete('Stream', { id: [1, 2, 3, 4] }, {});
}