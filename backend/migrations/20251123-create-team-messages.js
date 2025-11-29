export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('TeamMessages', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    team_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Team',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'User', // Note: Table name is usually plural 'Users' in DB
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    type: {
      type: Sequelize.ENUM('text', 'file', 'image'),
      defaultValue: 'text'
    },
    file_url: {
      type: Sequelize.STRING,
      allowNull: true
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    }
  });
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.dropTable('TeamMessages');
};
