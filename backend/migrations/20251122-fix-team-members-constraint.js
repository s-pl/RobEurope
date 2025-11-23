export async function up(queryInterface, Sequelize) {
  try {
    await queryInterface.removeIndex('TeamMembers', 'uniq_team_members_user');
  } catch (e) {
    console.log('Index uniq_team_members_user might not exist or already removed');
  }

  // Add a unique constraint on (user_id, team_id) to prevent duplicate rows for same team
  // But allow user to be in multiple teams (historically), app logic enforces single active team
  try {
    await queryInterface.addIndex('TeamMembers', ['user_id', 'team_id'], { unique: true, name: 'uniq_team_members_user_team' });
  } catch (e) {
    console.log('Index uniq_team_members_user_team might already exist');
  }
}

export async function down(queryInterface, Sequelize) {
  try {
    await queryInterface.removeIndex('TeamMembers', 'uniq_team_members_user_team');
  } catch (e) {}

  try {
    await queryInterface.addIndex('TeamMembers', ['user_id'], { unique: true, name: 'uniq_team_members_user' });
  } catch (e) {}
}
