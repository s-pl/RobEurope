/**
 * Migration: create media table for file uploads
 * Exports up and down functions for use with QueryInterface
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('Media', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    media_type: {
      type: Sequelize.ENUM('user', 'team', 'post', 'sponsor'),
      allowNull: false
    },
    media_id: {
      type: Sequelize.STRING, // To accommodate UUID and INTEGER ids
      allowNull: false
    },
    filename: {
      type: Sequelize.STRING,
      allowNull: false
    },
    path: {
      type: Sequelize.STRING,
      allowNull: false
    },
    url: {
      type: Sequelize.STRING,
      allowNull: false
    },
    mime_type: {
      type: Sequelize.STRING,
      allowNull: false
    },
    size: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    uploaded_by: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('Media');
}