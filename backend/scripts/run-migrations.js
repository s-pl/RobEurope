import { Sequelize } from 'sequelize';
import sequelize from '../controller/db.controller.js';
import * as initial from '../migrations/20251031-create-initial-tables.js';
import * as dropMedia from '../migrations/20251113-drop-media-table.js';
import * as addUserCountry from '../migrations/20251117-add-user-country.js';
import * as teamInvitesConstraints from '../migrations/20251117-team-invites-and-constraints.js';
import * as addRegistrationDecisionReason from '../migrations/20251117-add-decision-reason-to-registrations.js';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB authenticated — running migrations');
    const qi = sequelize.getQueryInterface();

    // Run initial migration only if core tables are missing
    const tables = await qi.showAllTables();
    const tableNames = Array.isArray(tables)
      ? tables.map(t => (typeof t === 'object' ? t.tableName || t.name : t))
      : [];
    const hasUser = tableNames.includes('User');
    const hasStream = tableNames.includes('Stream');

    if (!hasUser) {
      if (typeof initial.up !== 'function') {
        throw new Error('Initial migration does not export an up() function');
      }
      await initial.up(qi, Sequelize);
      console.log('Initial tables created');
    } else {
      console.log('Initial tables already exist — skipping initial migration');
    }

    // Create Stream table if missing (added later to initial migration)
    if (!hasStream) {
      console.log('Stream table missing, creating it...');
      await qi.createTable('Stream', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        title: { type: Sequelize.STRING, allowNull: false },
        description: { type: Sequelize.STRING, allowNull: true },
        platform: { type: Sequelize.ENUM('twitch', 'youtube', 'kick'), allowNull: false, defaultValue: 'twitch' },
        stream_url: { type: Sequelize.STRING, allowNull: true },
        is_live: { type: Sequelize.BOOLEAN, defaultValue: false },
        host_team_id: {
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
        created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      });
      console.log('Stream table created');
    }

    // Apply drop-media migration idempotently
    if (typeof dropMedia.up === 'function') {
      await dropMedia.up(qi, Sequelize);
      console.log('Applied drop-media migration (if needed)');
    }

    // Add country_id to User if missing
    if (typeof addUserCountry.up === 'function') {
      await addUserCountry.up(qi, Sequelize);
      console.log('Ensured User.country_id exists (if needed)');
    }

    // Create invites/requests tables and single-team constraint
    if (typeof teamInvitesConstraints.up === 'function') {
      await teamInvitesConstraints.up(qi, Sequelize);
      console.log('Ensured team invites/requests tables and constraints');
    }

    // Add decision_reason to Registration if missing
    if (typeof addRegistrationDecisionReason.up === 'function') {
      await addRegistrationDecisionReason.up(qi, Sequelize);
      console.log('Ensured Registration.decision_reason exists (if needed)');
    }

    console.log('Migrations applied successfully');
  } catch (err) {
    console.error('Migration error:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
