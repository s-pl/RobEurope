export async function up(queryInterface, Sequelize) {
  await queryInterface.changeColumn('DirectMessages', 'type', {
    type: Sequelize.ENUM('text', 'file', 'image', 'system', 'ai'),
    allowNull: false,
    defaultValue: 'text',
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn('DirectMessages', 'type', {
    type: Sequelize.ENUM('text', 'file', 'image', 'system'),
    allowNull: false,
    defaultValue: 'text',
  });
}
