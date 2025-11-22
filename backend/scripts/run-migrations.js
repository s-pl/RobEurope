import { Sequelize } from 'sequelize';
import sequelize from '../controller/db.controller.js';
import * as initial from '../migrations/20251031-create-initial-tables.js';
import * as dropMedia from '../migrations/20251113-drop-media-table.js';
import * as addUserCountry from '../migrations/20251117-add-user-country.js';
import * as teamInvitesConstraints from '../migrations/20251117-team-invites-and-constraints.js';
import * as addRegistrationDecisionReason from '../migrations/20251117-add-decision-reason-to-registrations.js';
import * as createMediaTable from '../migrations/20251117-create-media-table.js';
import * as createStreamsTable from '../migrations/20251117-create-streams-table.js';
import * as addStreamUrlToTeams from '../migrations/20251122-add-stream-url-to-teams.js';
import * as enhanceModels from '../migrations/20251122-enhance-models.js';

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
    const hasTeam = tableNames.includes('Team');
    const hasCompetition = tableNames.includes('Competition');
    const hasTeamMembers = tableNames.includes('TeamMembers');

    if (!hasUser || !hasTeam || !hasCompetition || !hasTeamMembers) {
      console.log('Some initial tables missing, running initial migration...');
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

    // Add decision_reason to Registration if missing
    if (typeof addRegistrationDecisionReason.up === 'function') {
      await addRegistrationDecisionReason.up(qi, Sequelize);
      console.log('Ensured Registration.decision_reason exists (if needed)');
    }

    // Create Media table if missing
    if (typeof createMediaTable.up === 'function') {
      await createMediaTable.up(qi, Sequelize);
      console.log('Ensured Media table exists');
    }

    // Create Stream table if missing (using migration)
    const currentTables = await qi.showAllTables();
    const currentTableNames = Array.isArray(currentTables)
      ? currentTables.map(t => (typeof t === 'object' ? t.tableName || t.name : t))
      : [];
    console.log('Current tables:', currentTableNames);
    const hasStreamNow = currentTableNames.includes('Stream');

    if (!hasStreamNow) {
      console.log('Stream table missing, creating it...');
      if (typeof createStreamsTable.up === 'function') {
        await createStreamsTable.up(qi, Sequelize);
        console.log('Stream table created via migration');
      }
    } else {
      console.log('Stream table exists, checking for updates...');
      // Always try to run the streams migration to add missing columns
      if (typeof createStreamsTable.up === 'function') {
        await createStreamsTable.up(qi, Sequelize);
      }
    }

    // Add stream_url to Teams
    try {
      await addStreamUrlToTeams.up(qi, Sequelize);
      console.log('Added stream_url to Teams');
    } catch (e) {
      console.log('Skipping addStreamUrlToTeams (probably already exists):', e.message);
    }

    // Enhance models (Competitions, Teams, Users)
    try {
      await enhanceModels.up(qi, Sequelize);
      console.log('Enhanced models (Competitions, Teams, Users)');
    } catch (e) {
      console.log('Skipping enhanceModels (probably already exists):', e.message);
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
