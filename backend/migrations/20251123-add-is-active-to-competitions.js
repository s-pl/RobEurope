
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Competition', 'is_active', {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: false
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('Competition', 'is_active');
}
