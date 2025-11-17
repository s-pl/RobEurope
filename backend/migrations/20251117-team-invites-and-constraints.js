// Migration: team invites/requests and single-team constraint
export async function up(queryInterface, Sequelize) {
  // Unique membership: each user can belong to only one team
  try {
    await queryInterface.addIndex('TeamMembers', ['user_id'], { unique: true, name: 'uniq_team_members_user' });
  } catch (e) {
    // ignore if already exists
  }

  // TeamInvite table
  try {
  await queryInterface.createTable('TeamInvite', {
    id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
    team_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Team', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    email: { type: Sequelize.STRING, allowNull: true },
    user_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    token: { type: Sequelize.STRING, allowNull: false, unique: true },
    status: { type: Sequelize.ENUM('pending', 'accepted', 'revoked', 'expired'), defaultValue: 'pending' },
    expires_at: { type: Sequelize.DATE, allowNull: true },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
  });
  } catch (e) {
    // table may already exist; skip
  }

  // TeamJoinRequest table
  try {
  await queryInterface.createTable('TeamJoinRequest', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    team_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Team', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    status: { type: Sequelize.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
  });
  } catch (e) {
    // table may already exist; skip
  }
  try {
    await queryInterface.addIndex('TeamJoinRequest', ['team_id', 'user_id'], { unique: true, name: 'uniq_join_request_team_user' });
  } catch (e) {
    // index may already exist; skip
  }
}

export async function down(queryInterface, Sequelize) {
  // Drop in safe order
  try { await queryInterface.removeIndex('TeamMembers', 'uniq_team_members_user'); } catch { }
  try { await queryInterface.removeIndex('TeamJoinRequest', 'uniq_join_request_team_user'); } catch { }
  await queryInterface.dropTable('TeamJoinRequest');
  await queryInterface.dropTable('TeamInvite');
}
