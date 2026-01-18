import bcrypt from 'bcryptjs';

const CENTER_ADMIN_ID = '00000000-0000-0000-0000-000000000010';
const STUDENT_ID = '00000000-0000-0000-0000-000000000011';
const DEMO_CENTER_NAME = 'Centro Demo RobEurope';
const DEMO_TEAM_NAME = 'Equipo Demo Centro';

export async function up(queryInterface, Sequelize) {
  const now = new Date();

  const userCols = await queryInterface.describeTable('User');
  const centerCols = await queryInterface.describeTable('EducationalCenter');
  const teamCols = await queryInterface.describeTable('Team');
  const teamMembersCols = await queryInterface.describeTable('TeamMembers');
  const regCols = await queryInterface.describeTable('Registration');

  const centerAdminPassword = process.env.SEED_CENTER_ADMIN_PASSWORD || 'CenterAdmin123!';
  const studentPassword = process.env.SEED_STUDENT_PASSWORD || 'Student123!';

  const centerAdminHash = await bcrypt.hash(centerAdminPassword, 10);
  const studentHash = await bcrypt.hash(studentPassword, 10);

  const baseUserTimestamps = {};
  if (userCols.createdAt) baseUserTimestamps.createdAt = now;
  if (userCols.created_at) baseUserTimestamps.created_at = now;

  // Center admin user
  let centerAdminId = await queryInterface.rawSelect(
    'User',
    { where: { username: 'centeradmin' } },
    'id'
  );
  if (!centerAdminId) {
    const row = {
      id: CENTER_ADMIN_ID,
      first_name: 'Center',
      last_name: 'Admin',
      username: 'centeradmin',
      email: 'centeradmin@example.com',
      password_hash: centerAdminHash,
      role: 'center_admin',
      is_active: true,
      ...baseUserTimestamps
    };
    await queryInterface.bulkInsert('User', [row], {});
    centerAdminId = CENTER_ADMIN_ID;
  } else {
    await queryInterface.bulkUpdate(
      'User',
      { role: 'center_admin', is_active: true },
      { id: centerAdminId }
    );
  }

  // Student user
  let studentId = await queryInterface.rawSelect(
    'User',
    { where: { username: 'student1' } },
    'id'
  );
  if (!studentId) {
    const row = {
      id: STUDENT_ID,
      first_name: 'Alumno',
      last_name: 'Demo',
      username: 'student1',
      email: 'student1@example.com',
      password_hash: studentHash,
      role: 'user',
      is_active: true,
      ...baseUserTimestamps
    };
    await queryInterface.bulkInsert('User', [row], {});
    studentId = STUDENT_ID;
  }

  // Educational center
  let centerId = await queryInterface.rawSelect(
    'EducationalCenter',
    { where: { name: DEMO_CENTER_NAME } },
    'id'
  );

  if (!centerId) {
    const centerRow = {
      name: DEMO_CENTER_NAME,
      city: 'Madrid',
      email: 'centro.demo@example.com',
      website_url: 'https://demo-center.example.com',
      approval_status: 'approved',
      approved_at: now,
      admin_user_id: centerAdminId,
    };
    if (centerCols.createdAt) centerRow.createdAt = now;
    if (centerCols.created_at) centerRow.created_at = now;
    if (centerCols.updatedAt) centerRow.updatedAt = now;
    if (centerCols.updated_at) centerRow.updated_at = now;

    await queryInterface.bulkInsert('EducationalCenter', [centerRow], {});
    centerId = await queryInterface.rawSelect(
      'EducationalCenter',
      { where: { name: DEMO_CENTER_NAME } },
      'id'
    );
  }

  // Link users to center
  if (centerId) {
    await queryInterface.bulkUpdate(
      'User',
      { educational_center_id: centerId },
      { id: centerAdminId }
    );
    await queryInterface.bulkUpdate(
      'User',
      { educational_center_id: centerId },
      { id: studentId }
    );
  }

  // Team
  let teamId = await queryInterface.rawSelect(
    'Team',
    { where: { name: DEMO_TEAM_NAME } },
    'id'
  );
  if (!teamId) {
    const teamRow = {
      name: DEMO_TEAM_NAME,
      city: 'Madrid',
      institution: DEMO_CENTER_NAME,
      created_by_user_id: centerAdminId,
      educational_center_id: centerId || null
    };
    if (teamCols.createdAt) teamRow.createdAt = now;
    if (teamCols.created_at) teamRow.created_at = now;
    if (teamCols.updatedAt) teamRow.updatedAt = now;
    if (teamCols.updated_at) teamRow.updated_at = now;

    await queryInterface.bulkInsert('Team', [teamRow], {});
    teamId = await queryInterface.rawSelect(
      'Team',
      { where: { name: DEMO_TEAM_NAME } },
      'id'
    );
  }

  // Team members (owner + member)
  if (teamId) {
    const existingOwner = await queryInterface.rawSelect(
      'TeamMembers',
      { where: { team_id: teamId, user_id: centerAdminId } },
      'id'
    );
    if (!existingOwner) {
      const row = {
        team_id: teamId,
        user_id: centerAdminId,
        role: 'owner',
        joined_at: now,
        left_at: null
      };
      if (teamMembersCols.createdAt) row.createdAt = now;
      if (teamMembersCols.created_at) row.created_at = now;
      if (teamMembersCols.updatedAt) row.updatedAt = now;
      if (teamMembersCols.updated_at) row.updated_at = now;
      await queryInterface.bulkInsert('TeamMembers', [row], {});
    }

    const existingMember = await queryInterface.rawSelect(
      'TeamMembers',
      { where: { team_id: teamId, user_id: studentId } },
      'id'
    );
    if (!existingMember) {
      const row = {
        team_id: teamId,
        user_id: studentId,
        role: 'member',
        joined_at: now,
        left_at: null
      };
      if (teamMembersCols.createdAt) row.createdAt = now;
      if (teamMembersCols.created_at) row.created_at = now;
      if (teamMembersCols.updatedAt) row.updatedAt = now;
      if (teamMembersCols.updated_at) row.updated_at = now;
      await queryInterface.bulkInsert('TeamMembers', [row], {});
    }
  }

  // Registration for first competition
  if (teamId) {
    const [competitions] = await queryInterface.sequelize.query(
      'SELECT id FROM Competition ORDER BY id ASC LIMIT 1;'
    );
    const competitionId = competitions?.[0]?.id;
    if (competitionId) {
      const existingReg = await queryInterface.rawSelect(
        'Registration',
        { where: { team_id: teamId, competition_id: competitionId } },
        'id'
      );
      if (!existingReg) {
        const regRow = {
          team_id: teamId,
          competition_id: competitionId,
          status: 'pending',
          center_approval_status: 'pending',
          registration_date: now,
          is_password_registration: false
        };
        if (regCols.createdAt) regRow.createdAt = now;
        if (regCols.created_at) regRow.created_at = now;
        if (regCols.updatedAt) regRow.updatedAt = now;
        if (regCols.updated_at) regRow.updated_at = now;

        await queryInterface.bulkInsert('Registration', [regRow], {});
      }
    }
  }
}

export async function down(queryInterface, Sequelize) {
  const teamId = await queryInterface.rawSelect(
    'Team',
    { where: { name: DEMO_TEAM_NAME } },
    'id'
  );
  if (teamId) {
    await queryInterface.bulkDelete('Registration', { team_id: teamId }, {});
  }
  await queryInterface.bulkDelete('TeamMembers', { user_id: STUDENT_ID }, {});
  await queryInterface.bulkDelete('TeamMembers', { user_id: CENTER_ADMIN_ID }, {});
  await queryInterface.bulkDelete('Team', { name: DEMO_TEAM_NAME }, {});
  await queryInterface.bulkDelete('EducationalCenter', { name: DEMO_CENTER_NAME }, {});
  await queryInterface.bulkDelete('User', { username: 'student1' }, {});
  await queryInterface.bulkDelete('User', { username: 'centeradmin' }, {});
}
