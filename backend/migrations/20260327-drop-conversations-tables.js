export async function up(queryInterface) {
  await queryInterface.dropTable('DirectMessages', { cascade: true });
  await queryInterface.dropTable('ConversationParticipants', { cascade: true });
  await queryInterface.dropTable('Conversations', { cascade: true });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.createTable('Conversations', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    type: { type: Sequelize.ENUM('direct', 'group'), allowNull: false, defaultValue: 'direct' },
    name: { type: Sequelize.STRING },
    avatar_url: { type: Sequelize.STRING },
    created_by: { type: Sequelize.INTEGER },
    last_message_at: { type: Sequelize.DATE },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });
  await queryInterface.createTable('ConversationParticipants', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    conversation_id: { type: Sequelize.INTEGER },
    user_id: { type: Sequelize.INTEGER },
    role: { type: Sequelize.ENUM('admin', 'member'), defaultValue: 'member' },
    last_read_at: { type: Sequelize.DATE },
    joined_at: { type: Sequelize.DATE },
    left_at: { type: Sequelize.DATE },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });
  await queryInterface.createTable('DirectMessages', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    conversation_id: { type: Sequelize.INTEGER },
    sender_id: { type: Sequelize.INTEGER },
    content: { type: Sequelize.TEXT },
    type: { type: Sequelize.ENUM('text', 'file', 'image', 'system', 'ai'), defaultValue: 'text' },
    file_url: { type: Sequelize.STRING },
    file_name: { type: Sequelize.STRING },
    file_size: { type: Sequelize.INTEGER },
    reply_to_id: { type: Sequelize.INTEGER },
    is_edited: { type: Sequelize.BOOLEAN, defaultValue: false },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });
}
