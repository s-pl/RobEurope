import { Sequelize } from 'sequelize';
import sequelize from '../controller/db.controller.js';
import * as initial from '../migrations/20251031-create-initial-tables.js';
import * as dropMedia from '../migrations/20251113-drop-media-table.js';
import * as addUserCountry from '../migrations/20251117-add-user-country.js';
import * as teamInvitesConstraints from '../migrations/20251117-team-invites-and-constraints.js';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB authenticated — running migrations');
    const qi = sequelize.getQueryInterface();

    // Run initial migration only if core tables are missing
    const tables = await qi.showAllTables();
    const hasUser = Array.isArray(tables)
      ? tables.map(t => (typeof t === 'object' ? t.tableName || t.name : t)).includes('User')
      : false;

    if (!hasUser) {
      if (typeof initial.up !== 'function') {
        throw new Error('Initial migration does not export an up() function');
      }
      await initial.up(qi, Sequelize);
      console.log('Initial tables created');
    } else {
      console.log('Initial tables already exist — skipping initial migration');
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

    console.log('Migrations applied successfully');
  } catch (err) {
    console.error('Migration error:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
