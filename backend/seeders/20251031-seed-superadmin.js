import bcrypt from 'bcryptjs';

// Use a fixed UUID for the seeded superadmin so other seeders can reference it deterministically
const SUPERADMIN_ID = '00000000-0000-0000-0000-000000000001';

export async function up(queryInterface, Sequelize) {
  // Create a super_admin user (no Country insert here as requested)
  const passwordPlain = process.env.SEED_SUPERADMIN_PASSWORD || 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  // Describe table to detect timestamp column names
  const userCols = await queryInterface.describeTable('User');
  const userRow = {
    id: SUPERADMIN_ID,
    first_name: 'Super',
    last_name: 'Admin',
    username: 'superadmin',
    email: 'admin@example.com',
    password_hash: passwordHash,
    phone: null,
    profile_photo_url: null,
    role: 'super_admin',
    is_active: true
  };
  if (userCols.createdAt) userRow.createdAt = new Date();
  if (userCols.created_at) userRow.created_at = new Date();
  if (userCols.updatedAt) userRow.updatedAt = new Date();
  if (userCols.updated_at) userRow.updated_at = new Date();

  const existingUser = await queryInterface.rawSelect('User', { where: { id: SUPERADMIN_ID } }, 'id');
  if (!existingUser) {
    await queryInterface.bulkInsert('User', [userRow], {});
  } else {
    console.log('Superadmin already exists, skipping User insert');
  }

  // Insert a sample team for the super admin; country_id left null to avoid FK issues when Country is not seeded
  const teamCols = await queryInterface.describeTable('Team');
  const teamRow = {
    id: 1,
    name: 'Admin Team',
    country_id: null,
    city: null,
    institution: null,
    logo_url: null,
    social_links: null,
    created_by_user_id: SUPERADMIN_ID
  };
  if (teamCols.createdAt) teamRow.createdAt = new Date();
  if (teamCols.created_at) teamRow.created_at = new Date();
  if (teamCols.updatedAt) teamRow.updatedAt = new Date();
  if (teamCols.updated_at) teamRow.updated_at = new Date();

  const existingTeam = await queryInterface.rawSelect('Team', { where: { id: 1 } }, 'id');
  if (!existingTeam) {
    await queryInterface.bulkInsert('Team', [teamRow], {});
  } else {
    console.log('Admin Team already exists, skipping Team insert');
  }
}

export async function down(queryInterface, Sequelize) {
  // remove seeded records
  await queryInterface.bulkDelete('Team', { id: 1 }, {});
  await queryInterface.bulkDelete('User', { username: 'superadmin' }, {});
}
