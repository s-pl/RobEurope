
/**
 * Migration: Add CenterAdminRequest table and pending_role to User
 */

export async function up(queryInterface, Sequelize) {
  // Add pending_role to User table if not exists
  const userTableDesc = await queryInterface.describeTable('User');
  
  if (!userTableDesc.pending_role) {
    await queryInterface.addColumn('User', 'pending_role', {
      type: Sequelize.ENUM('user', 'center_admin', 'super_admin'),
      allowNull: true,
      defaultValue: null
    });
  }

  // Create CenterAdminRequest table if not exists
  const tables = await queryInterface.showAllTables();
  const tableNames = tables.map(t => (typeof t === 'object' ? t.tableName || t.name : t));
  
  if (!tableNames.includes('CenterAdminRequest')) {
    await queryInterface.createTable('CenterAdminRequest', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      educational_center_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'EducationalCenter',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      request_type: {
        type: Sequelize.ENUM('create_center', 'join_center'),
        allowNull: false
      },
      decision_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      decided_by_user_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      decided_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('CenterAdminRequest');
  await queryInterface.removeColumn('User', 'pending_role');
}

export default { up, down };
