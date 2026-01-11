export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('Gallery', {
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
    title: {
      type: Sequelize.STRING,
      allowNull: true
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    uploaded_by: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
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

  await queryInterface.addIndex('Gallery', ['created_at']);
  await queryInterface.addIndex('Gallery', ['uploaded_by']);
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.dropTable('Gallery');
};
