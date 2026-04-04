export async function up(queryInterface, Sequelize) {
  await queryInterface.changeColumn('Notification', 'type', {
    type: Sequelize.ENUM('registration_team_status', 'team_invite', 'mention', 'team_message'),
    allowNull: false,
  });
}

export async function down(queryInterface, Sequelize) {
  // This may fail if data already uses the removed enum value.
  await queryInterface.changeColumn('Notification', 'type', {
    type: Sequelize.ENUM('registration_team_status', 'team_invite', 'mention'),
    allowNull: false,
  });
}
