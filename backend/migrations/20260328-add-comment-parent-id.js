export async function up(queryInterface, Sequelize) {
  const tableDesc = await queryInterface.describeTable('Comment');
  if (!tableDesc.parent_id) {
    await queryInterface.addColumn('Comment', 'parent_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Comment', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  }
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('Comment', 'parent_id');
}
