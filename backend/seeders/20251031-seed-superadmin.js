import bcrypt from 'bcryptjs';

export async function up(queryInterface, Sequelize) {
  const passwordHash = await bcrypt.hash('SuperSecret123!', 10);
  return queryInterface.bulkInsert('USERS', [
    {
      first_name: 'Super',
      last_name: 'Admin',
      email: 'admin@example.com',
      password_hash: passwordHash,
      role: 'super_admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ], {});
}

export async function down(queryInterface, Sequelize) {
  return queryInterface.bulkDelete('USERS', { email: 'admin@example.com' }, {});
}
