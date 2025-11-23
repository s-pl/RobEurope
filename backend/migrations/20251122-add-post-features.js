export async function up(queryInterface, Sequelize) {
  // Add is_pinned to Post
  await queryInterface.addColumn('Post', 'is_pinned', {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: false
  });

  // Create PostLike table
  await queryInterface.createTable('PostLike', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    post_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Post', key: 'id' },
      onDelete: 'CASCADE'
    },
    user_id: {
      type: Sequelize.UUID,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onDelete: 'CASCADE'
    },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
  });

  // Add unique constraint for user_id + post_id
  await queryInterface.addConstraint('PostLike', {
    fields: ['user_id', 'post_id'],
    type: 'unique',
    name: 'unique_user_post_like'
  });

  // Create Comment table
  await queryInterface.createTable('Comment', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    content: { type: Sequelize.TEXT, allowNull: false },
    post_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Post', key: 'id' },
      onDelete: 'CASCADE'
    },
    author_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onDelete: 'CASCADE'
    },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('Comment');
  await queryInterface.dropTable('PostLike');
  await queryInterface.removeColumn('Post', 'is_pinned');
}
