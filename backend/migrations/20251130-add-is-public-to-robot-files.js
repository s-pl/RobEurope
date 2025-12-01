export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('RobotFiles', 'is_public', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('RobotFiles', 'is_public');
}
