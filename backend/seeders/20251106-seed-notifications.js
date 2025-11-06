const SUPERADMIN_ID = '00000000-0000-0000-0000-000000000001';

export async function up(queryInterface, Sequelize) {
  const cols = await queryInterface.describeTable('Notification');
  const row = {
    id: '11111111-1111-1111-1111-111111111111',
    user_id: SUPERADMIN_ID,
    title: 'Welcome',
    message: 'Welcome to RobEurope — this is a seeded notification.',
    type: 'mention',
    is_read: false,
    created_at: new Date()
  };
  if (cols.createdAt) row.createdAt = new Date();
  if (cols.created_at) row.created_at = new Date();
  if (cols.updatedAt) row.updatedAt = new Date();
  if (cols.updated_at) row.updated_at = new Date();

  const existing = await queryInterface.rawSelect('Notification', { where: { id: row.id } }, 'id');
  if (!existing) {
    await queryInterface.bulkInsert('Notification', [row], {});
  } else {
    console.log(`Notification ${row.id} already exists, skipping insert`);
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete('Notification', { id: '11111111-1111-1111-1111-111111111111' }, {});
}
