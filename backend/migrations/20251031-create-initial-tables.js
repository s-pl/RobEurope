/**
 * Migration: create initial tables based on models in backend/models
 * Exports up and down functions for use with QueryInterface
 */
export async function up(queryInterface, Sequelize) {
  // Create User table (UUID primary key)
  await queryInterface.createTable('User', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    first_name: { type: Sequelize.STRING, allowNull: false },
    last_name: { type: Sequelize.STRING, allowNull: false },
    username: { type: Sequelize.STRING, allowNull: false, unique: true },
    email: { type: Sequelize.STRING, allowNull: false, unique: true },
    password_hash: { type: Sequelize.STRING, allowNull: false },
    phone: { type: Sequelize.STRING, allowNull: true },
    profile_photo_url: { type: Sequelize.STRING, allowNull: true },
    role: { type: Sequelize.ENUM('user', 'super_admin'), defaultValue: 'user' },
    is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
  });

  // Country table
  await queryInterface.createTable('Country', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: Sequelize.STRING, allowNull: false },
    code: { type: Sequelize.STRING, allowNull: false },
    flag_emoji: { type: Sequelize.STRING, allowNull: true }
  });

  // Competition table
  await queryInterface.createTable('Competition', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: Sequelize.STRING, allowNull: false },
    slug: { type: Sequelize.STRING, allowNull: false },
    description: { type: Sequelize.STRING, allowNull: true },
    country_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Country', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    registration_start: { type: Sequelize.DATE, allowNull: true },
    registration_end: { type: Sequelize.DATE, allowNull: true },
    start_date: { type: Sequelize.DATE, allowNull: true },
    end_date: { type: Sequelize.DATE, allowNull: true },
    rules_url: { type: Sequelize.STRING, allowNull: true },
    stream_url: { type: Sequelize.JSON, allowNull: true }
  });

  // Team table
  await queryInterface.createTable('Team', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: Sequelize.STRING, allowNull: false },
    country_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Country', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    city: { type: Sequelize.STRING, allowNull: true },
    institution: { type: Sequelize.STRING, allowNull: true },
    logo_url: { type: Sequelize.STRING, allowNull: true },
    social_links: { type: Sequelize.JSON, allowNull: true },
    created_by_user_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
  });

  // TeamMembers table (note: model references were inconsistent; FK points to Team table)
  await queryInterface.createTable('TeamMembers', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    team_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Team', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    role: { type: Sequelize.STRING, allowNull: false },
    joined_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    left_at: { type: Sequelize.DATE, allowNull: true }
  });

  // Registration table
  await queryInterface.createTable('Registration', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    team_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Team', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    competition_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Competition', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    status: { type: Sequelize.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
    registration_date: { type: Sequelize.DATE, allowNull: false }
  });

  // Post table
  await queryInterface.createTable('Post', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: Sequelize.STRING, allowNull: false },
    content: { type: Sequelize.TEXT, allowNull: false },
    author_id: {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    media_urls: { type: Sequelize.JSON, allowNull: true },
    likes_count: { type: Sequelize.INTEGER, defaultValue: 0 },
    views_count: { type: Sequelize.INTEGER, defaultValue: 0 },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
  });

  // Sponsor table
  await queryInterface.createTable('Sponsor', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: Sequelize.STRING, allowNull: false },
    logo_url: { type: Sequelize.STRING, allowNull: true },
    website_url: { type: Sequelize.STRING, allowNull: true },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
  });

  // Notification table
  await queryInterface.createTable('Notification', {
    id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'User', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    title: { type: Sequelize.STRING, allowNull: false },
    message: { type: Sequelize.STRING, allowNull: false },
    type: { type: Sequelize.ENUM('registration_team_status', 'team_invite', 'mention'), allowNull: false },
    is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
  });
}

export async function down(queryInterface, Sequelize) {
  // Drop in reverse order to satisfy foreign key constraints
  await queryInterface.dropTable('Notification');
  await queryInterface.dropTable('Sponsor');
  await queryInterface.dropTable('Post');
  await queryInterface.dropTable('Registration');
  await queryInterface.dropTable('TeamMembers');
  await queryInterface.dropTable('Team');
  await queryInterface.dropTable('Competition');
  await queryInterface.dropTable('Country');
  // Note: ENUM types created by Sequelize will be removed automatically when the table is dropped in MySQL.
  await queryInterface.dropTable('User');
}
