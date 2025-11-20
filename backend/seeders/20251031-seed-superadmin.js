import bcrypt from 'bcryptjs';

// Preferred fixed UUID for superadmin when creating it fresh
const PREFERRED_SUPERADMIN_ID = '00000000-0000-0000-0000-000000000001';

export async function up(queryInterface, Sequelize) {
  // 1) Ensure a super_admin user exists, idempotently
  const passwordPlain = process.env.SEED_SUPERADMIN_PASSWORD || 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  const userCols = await queryInterface.describeTable('User');

  // Try to find by username first (unique in schema)
  let superadminId = await queryInterface.rawSelect(
    'User',
    { where: { username: 'superadmin' } },
    'id'
  );

  if (!superadminId) {
    // If not found by username, try by preferred fixed id (in case an earlier run inserted it)
    superadminId = await queryInterface.rawSelect(
      'User',
      { where: { id: PREFERRED_SUPERADMIN_ID } },
      'id'
    );
  }

  const baseUserRow = {
    first_name: 'Super',
    last_name: 'Admin',
    username: 'superadmin',
    email: 'admin@example.com',
    password_hash: passwordHash,
    phone: null,
    profile_photo_url: null,
    role: 'super_admin',
    is_active: true,
  };
  if (userCols.createdAt) baseUserRow.createdAt = new Date();
  if (userCols.created_at) baseUserRow.created_at = new Date();
  if (userCols.updatedAt) baseUserRow.updatedAt = new Date();
  if (userCols.updated_at) baseUserRow.updated_at = new Date();

  if (!superadminId) {
    // Create with preferred fixed id for deterministic references
    const row = { id: PREFERRED_SUPERADMIN_ID, ...baseUserRow };
    try {
      await queryInterface.bulkInsert('User', [row], {});
      superadminId = PREFERRED_SUPERADMIN_ID;
    } catch (e) {
      // Handle rare race/unique cases: if duplicate username/email, fetch id and continue
      console.warn('Superadmin insert conflict, resolving by lookup. Error:', e?.parent?.sqlMessage || e?.message);
      superadminId = await queryInterface.rawSelect(
        'User',
        { where: { username: 'superadmin' } },
        'id'
      );
    }
  } else {
    // Ensure baseline fields are set (keep existing id and username)
    await queryInterface.bulkUpdate(
      'User',
      {
        first_name: baseUserRow.first_name,
        last_name: baseUserRow.last_name,
        email: baseUserRow.email,
        role: baseUserRow.role,
        is_active: baseUserRow.is_active,
        // Do not overwrite password unless explicitly requested
      },
      { id: superadminId }
    );
  }

  // 2) Ensure an Admin Team exists (created_by_user_id can be null if not available)
  const teamCols = await queryInterface.describeTable('Team');
  const teamRow = {
    id: 1,
    name: 'Admin Team',
    country_id: null,
    city: null,
    institution: null,
    logo_url: null,
    social_links: null,
    created_by_user_id: superadminId || null,
  };
  if (teamCols.createdAt) teamRow.createdAt = new Date();
  if (teamCols.created_at) teamRow.created_at = new Date();
  if (teamCols.updatedAt) teamRow.updatedAt = new Date();
  if (teamCols.updated_at) teamRow.updated_at = new Date();

  const existingTeam = await queryInterface.rawSelect('Team', { where: { id: 1 } }, 'id');
  if (!existingTeam) {
    await queryInterface.bulkInsert('Team', [teamRow], {});
  } else {
    // Optionally update created_by_user_id if it was null before
    if (superadminId) {
      await queryInterface.bulkUpdate('Team', { created_by_user_id: superadminId }, { id: 1 });
    }
    console.log('Admin Team already exists, ensured linkage');
  }
}

export async function down(queryInterface, Sequelize) {
  // remove seeded records
  await queryInterface.bulkDelete('Team', { id: 1 }, {});
  await queryInterface.bulkDelete('User', { username: 'superadmin' }, {});
}
