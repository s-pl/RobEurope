/**
 * Migration: create conversations and direct message tables
 */

function normalizeTableName(tableEntry) {
  if (typeof tableEntry === 'string') return tableEntry;
  if (!tableEntry || typeof tableEntry !== 'object') return '';
  if (tableEntry.tableName) return tableEntry.tableName;
  if (tableEntry.name) return tableEntry.name;
  const firstValue = Object.values(tableEntry)[0];
  return typeof firstValue === 'string' ? firstValue : '';
}

async function tableExists(queryInterface, Sequelize, tableName) {
  const tables = await queryInterface.showAllTables();
  const tableNames = (tables || []).map(normalizeTableName);
  return tableNames.includes(tableName);
}

export async function up(queryInterface, Sequelize) {
  const hasConversations = await tableExists(queryInterface, Sequelize, 'Conversations');
  if (!hasConversations) {
    await queryInterface.createTable('Conversations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      type: {
        type: Sequelize.ENUM('direct', 'group'),
        allowNull: false,
        defaultValue: 'direct',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      avatar_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'User',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      last_message_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('Conversations', ['last_message_at'], {
      name: 'idx_conversations_last_message_at',
    });
  }

  const hasParticipants = await tableExists(queryInterface, Sequelize, 'ConversationParticipants');
  if (!hasParticipants) {
    await queryInterface.createTable('ConversationParticipants', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      conversation_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Conversations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'User',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.ENUM('admin', 'member'),
        allowNull: false,
        defaultValue: 'member',
      },
      last_read_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      left_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('ConversationParticipants', ['conversation_id'], {
      name: 'idx_conversation_participants_conversation_id',
    });
    await queryInterface.addIndex('ConversationParticipants', ['user_id'], {
      name: 'idx_conversation_participants_user_id',
    });
    await queryInterface.addIndex('ConversationParticipants', ['conversation_id', 'user_id'], {
      name: 'idx_conversation_participants_conversation_user',
      unique: false,
    });
  }

  const hasDirectMessages = await tableExists(queryInterface, Sequelize, 'DirectMessages');
  if (!hasDirectMessages) {
    await queryInterface.createTable('DirectMessages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      conversation_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Conversations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      sender_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'User',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.ENUM('text', 'file', 'image', 'system'),
        allowNull: false,
        defaultValue: 'text',
      },
      file_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      file_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      file_mime_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      reply_to_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'DirectMessages',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      is_edited: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('DirectMessages', ['conversation_id', 'created_at'], {
      name: 'idx_direct_messages_conversation_created_at',
    });
    await queryInterface.addIndex('DirectMessages', ['sender_id'], {
      name: 'idx_direct_messages_sender_id',
    });
    await queryInterface.addIndex('DirectMessages', ['reply_to_id'], {
      name: 'idx_direct_messages_reply_to_id',
    });
  }
}

export async function down(queryInterface, Sequelize) {
  const hasDirectMessages = await tableExists(queryInterface, Sequelize, 'DirectMessages');
  if (hasDirectMessages) {
    await queryInterface.dropTable('DirectMessages');
  }

  const hasParticipants = await tableExists(queryInterface, Sequelize, 'ConversationParticipants');
  if (hasParticipants) {
    await queryInterface.dropTable('ConversationParticipants');
  }

  const hasConversations = await tableExists(queryInterface, Sequelize, 'Conversations');
  if (hasConversations) {
    await queryInterface.dropTable('Conversations');
  }
}
