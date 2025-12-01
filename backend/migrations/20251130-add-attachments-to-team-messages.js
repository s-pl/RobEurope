export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('TeamMessages', 'attachments', {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: []
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('TeamMessages', 'attachments');
}
