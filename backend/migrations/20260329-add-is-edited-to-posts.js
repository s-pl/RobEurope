export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('posts', 'is_edited', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('posts', 'is_edited');
}
