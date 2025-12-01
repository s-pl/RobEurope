'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('CompetitionMessages', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    competition_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Competition',
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
    attachments: {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: []
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  await queryInterface.createTable('CompetitionMessageReactions', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    message_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'CompetitionMessages',
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
      type: Sequelize.STRING,
      allowNull: false
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('CompetitionMessageReactions');
  await queryInterface.dropTable('CompetitionMessages');
}
