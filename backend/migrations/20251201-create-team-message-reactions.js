export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('TeamMessageReactions', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    message_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'TeamMessages',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'User',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    emoji: {
      type: Sequelize.STRING(10),
      allowNull: false
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  await queryInterface.addIndex('TeamMessageReactions', ['message_id']);
  await queryInterface.addIndex('TeamMessageReactions', ['user_id']);
  // Unique constraint for user+message+emoji
  await queryInterface.addConstraint('TeamMessageReactions', {
    fields: ['message_id', 'user_id', 'emoji'],
    type: 'unique',
    name: 'unique_user_message_reaction'
  });
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.dropTable('TeamMessageReactions');
};
