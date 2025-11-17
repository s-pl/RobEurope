/**
 * Migration: drop media table
 * Exports up and down functions for use with QueryInterface
 */
export async function up(queryInterface, Sequelize) {
  // Check if table exists before dropping (MySQL)
  const rows = await queryInterface.sequelize.query(
    "SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Media' LIMIT 1;",
    { type: Sequelize.QueryTypes.SELECT }
  );

  if (rows.length > 0) {
    await queryInterface.dropTable('Media');
  } else {
    // no-op if table doesn't exist
  }
}

export async function down(queryInterface, Sequelize) {
  // Recreate the Media table if needed for rollback
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
      type: Sequelize.STRING,
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