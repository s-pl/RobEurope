/**
 * Migration: Create contact_messages and reviews tables
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('ContactMessage', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: Sequelize.STRING(120), allowNull: false },
    email: { type: Sequelize.STRING(200), allowNull: false },
    organization: { type: Sequelize.STRING(200), allowNull: true },
    message: { type: Sequelize.TEXT, allowNull: false },
    ip_address: { type: Sequelize.STRING(64), allowNull: true },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
  });

  await queryInterface.createTable('Review', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: Sequelize.CHAR(36), allowNull: false },
    rating: { type: Sequelize.TINYINT.UNSIGNED, allowNull: false },
    message: { type: Sequelize.TEXT, allowNull: false },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
  });

  await queryInterface.addIndex('Review', ['user_id'], { name: 'review_user_id' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('Review');
  await queryInterface.dropTable('ContactMessage');
}
