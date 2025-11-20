export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('Media', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    filename: {
      type: Sequelize.STRING,
      allowNull: false
    },
    original_name: {
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
    url: {
      type: Sequelize.STRING,
      allowNull: false
    },
    thumbnail_url: {
      type: Sequelize.STRING,
      allowNull: true
    },
    uploaded_by: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'User',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  // Add indexes for better performance
  await queryInterface.addIndex('Media', ['uploaded_by']);
  await queryInterface.addIndex('Media', ['created_at']);
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.dropTable('Media');
};