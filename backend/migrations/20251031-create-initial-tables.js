import bcrypt from 'bcryptjs';

export async function up(queryInterface, Sequelize) {
  // Create COUNTRIES first
  await queryInterface.createTable('COUNTRIES', {
    id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
    code: { type: Sequelize.STRING(8) },
    name: { type: Sequelize.STRING },
    flag_emoji: { type: Sequelize.STRING }
  });

  // USERS
  await queryInterface.createTable('USERS', {
    id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
    first_name: { type: Sequelize.STRING },
    last_name: { type: Sequelize.STRING },
    email: { type: Sequelize.STRING, allowNull: false, unique: true },
    password_hash: { type: Sequelize.STRING },
    phone: { type: Sequelize.STRING },
    profile_photo_url: { type: Sequelize.STRING },
    country_id: { type: Sequelize.BIGINT },
    role: { type: Sequelize.ENUM('super_admin','user'), allowNull: false, defaultValue: 'user' },
    is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
    created_at: { type: Sequelize.DATE },
    updated_at: { type: Sequelize.DATE }
  });

  // TEAMS
  await queryInterface.createTable('TEAMS', {
    id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
    name: { type: Sequelize.STRING },
    short_code: { type: Sequelize.STRING },
    country_id: { type: Sequelize.BIGINT },
    city: { type: Sequelize.STRING },
    institution: { type: Sequelize.STRING },
    logo_url: { type: Sequelize.STRING },
    description: { type: Sequelize.TEXT },
    contact_email: { type: Sequelize.STRING },
    website_url: { type: Sequelize.STRING },
    created_by_user_id: { type: Sequelize.BIGINT },
    is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
    created_at: { type: Sequelize.DATE },
    updated_at: { type: Sequelize.DATE }
  });

  // TEAM_MEMBERS
  await queryInterface.createTable('TEAM_MEMBERS', {
    id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
    team_id: { type: Sequelize.BIGINT },
    user_id: { type: Sequelize.BIGINT },
    role: { type: Sequelize.ENUM('captain','member','mentor') },
    is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
    joined_at: { type: Sequelize.DATE },
    left_at: { type: Sequelize.DATE }
  });

  // COMPETITIONS
  await queryInterface.createTable('COMPETITIONS', {
    id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
    title: { type: Sequelize.STRING },
    slug: { type: Sequelize.STRING },
    description: { type: Sequelize.TEXT },
    location: { type: Sequelize.STRING },
    country_id: { type: Sequelize.BIGINT },
    registration_start: { type: Sequelize.DATE },
    registration_end: { type: Sequelize.DATE },
    start_date: { type: Sequelize.DATE },
    end_date: { type: Sequelize.DATE },
    status: { type: Sequelize.ENUM('draft','open','closed','in_progress','completed','cancelled') },
    banner_url: { type: Sequelize.STRING },
    rules_url: { type: Sequelize.TEXT },
    max_teams: { type: Sequelize.INTEGER },
    created_at: { type: Sequelize.DATE },
    updated_at: { type: Sequelize.DATE }
  });

  // REGISTRATIONS
  await queryInterface.createTable('REGISTRATIONS', {
    id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
    competition_id: { type: Sequelize.BIGINT },
    team_id: { type: Sequelize.BIGINT },
    status: { type: Sequelize.ENUM('pending','approved','rejected','disqualified'), defaultValue: 'pending' },
    requested_at: { type: Sequelize.DATE },
    reviewed_at: { type: Sequelize.DATE },
    reviewed_by_user_id: { type: Sequelize.BIGINT }
  });

  // STREAMS
  await queryInterface.createTable('STREAMS', {
    id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
    title: { type: Sequelize.STRING },
    description: { type: Sequelize.TEXT },
    platform: { type: Sequelize.STRING },
    stream_url: { type: Sequelize.STRING },
    is_live: { type: Sequelize.BOOLEAN, defaultValue: false },
    host_team_id: { type: Sequelize.BIGINT },
    competition_id: { type: Sequelize.BIGINT },
    created_at: { type: Sequelize.DATE }
  });

  // TEAM_SOCIALS
  await queryInterface.createTable('TEAM_SOCIALS', {
    id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
    team_id: { type: Sequelize.BIGINT },
    platform: { type: Sequelize.STRING },
    url: { type: Sequelize.STRING },
    created_at: { type: Sequelize.DATE }
  });

  // GLOBAL_POSTS
  await queryInterface.createTable('GLOBAL_POSTS', {
    id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
    author_user_id: { type: Sequelize.BIGINT },
    title: { type: Sequelize.STRING },
    slug: { type: Sequelize.STRING },
    content: { type: Sequelize.TEXT },
    cover_image_url: { type: Sequelize.STRING },
    status: { type: Sequelize.ENUM('draft','published') },
    is_pinned: { type: Sequelize.BOOLEAN, defaultValue: false },
    views_count: { type: Sequelize.INTEGER, defaultValue: 0 },
    published_at: { type: Sequelize.DATE },
    created_at: { type: Sequelize.DATE },
    updated_at: { type: Sequelize.DATE }
  });

  // COMPETITION_POSTS
  await queryInterface.createTable('COMPETITION_POSTS', {
    id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
    competition_id: { type: Sequelize.BIGINT },
    team_id: { type: Sequelize.BIGINT },
    author_user_id: { type: Sequelize.BIGINT },
    title: { type: Sequelize.STRING },
    content: { type: Sequelize.TEXT },
    media_urls: { type: Sequelize.JSON },
    likes_count: { type: Sequelize.INTEGER, defaultValue: 0 },
    is_featured: { type: Sequelize.BOOLEAN, defaultValue: false },
    created_at: { type: Sequelize.DATE },
    updated_at: { type: Sequelize.DATE }
  });

  // CHAT_MESSAGES
  await queryInterface.createTable('CHAT_MESSAGES', {
    id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
    competition_id: { type: Sequelize.BIGINT },
    user_id: { type: Sequelize.BIGINT },
    parent_id: { type: Sequelize.BIGINT },
    content: { type: Sequelize.TEXT },
    is_pinned: { type: Sequelize.BOOLEAN, defaultValue: false },
    is_deleted: { type: Sequelize.BOOLEAN, defaultValue: false },
    created_at: { type: Sequelize.DATE }
  });

  // MEDIA
  await queryInterface.createTable('MEDIA', {
    id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
    uploaded_by_user_id: { type: Sequelize.BIGINT },
    object_type: { type: Sequelize.STRING },
    object_id: { type: Sequelize.BIGINT },
    type: { type: Sequelize.STRING },
    title: { type: Sequelize.STRING },
    file_path: { type: Sequelize.STRING },
    thumbnail_path: { type: Sequelize.STRING },
    is_featured: { type: Sequelize.BOOLEAN, defaultValue: false },
    uploaded_at: { type: Sequelize.DATE }
  });

  // SPONSORS
  await queryInterface.createTable('SPONSORS', {
    id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
    name: { type: Sequelize.STRING },
    logo_url: { type: Sequelize.STRING },
    website_url: { type: Sequelize.STRING },
    tier: { type: Sequelize.ENUM('platinum','gold','silver','bronze') },
    display_order: { type: Sequelize.INTEGER },
    is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
    created_at: { type: Sequelize.DATE }
  });

  // NOTIFICATIONS
  await queryInterface.createTable('NOTIFICATIONS', {
    id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
    user_id: { type: Sequelize.BIGINT },
    title: { type: Sequelize.STRING },
    message: { type: Sequelize.TEXT },
    type: { type: Sequelize.STRING },
    action_url: { type: Sequelize.STRING },
    is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
    created_at: { type: Sequelize.DATE }
  });

  // REACTIONS
  await queryInterface.createTable('REACTIONS', {
    id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
    user_id: { type: Sequelize.BIGINT },
    target_type: { type: Sequelize.STRING },
    global_post_id: { type: Sequelize.BIGINT },
    competition_post_id: { type: Sequelize.BIGINT },
    chat_message_id: { type: Sequelize.BIGINT },
    emoji: { type: Sequelize.STRING },
    created_at: { type: Sequelize.DATE }
  });
}

export async function down(queryInterface, Sequelize) {
  // Reverse in opposite order
  await queryInterface.dropTable('REACTIONS');
  await queryInterface.dropTable('NOTIFICATIONS');
  await queryInterface.dropTable('SPONSORS');
  await queryInterface.dropTable('MEDIA');
  await queryInterface.dropTable('CHAT_MESSAGES');
  await queryInterface.dropTable('COMPETITION_POSTS');
  await queryInterface.dropTable('GLOBAL_POSTS');
  await queryInterface.dropTable('TEAM_SOCIALS');
  await queryInterface.dropTable('STREAMS');
  await queryInterface.dropTable('REGISTRATIONS');
  await queryInterface.dropTable('COMPETITIONS');
  await queryInterface.dropTable('TEAM_MEMBERS');
  await queryInterface.dropTable('TEAMS');
  await queryInterface.dropTable('USERS');
  await queryInterface.dropTable('COUNTRIES');
}
