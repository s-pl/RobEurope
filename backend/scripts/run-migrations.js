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
import * as addPostFeatures from '../migrations/20251122-add-post-features.js';
import * as fixTeamMembersConstraint from '../migrations/20251122-fix-team-members-constraint.js';
import * as addIsActiveToCompetitions from '../migrations/20251123-add-is-active-to-competitions.js';
import * as createTeamMessages from '../migrations/20251123-create-team-messages.js';
import * as updateNotificationTypeEnum from '../migrations/20251123-update-notification-type-enum.js';
import * as createRobotFiles from '../migrations/20251130-create-robot-files.js';
import * as createTeamLogs from '../migrations/20251130-create-team-logs.js';
import * as addAttachmentsToTeamMessages from '../migrations/20251130-add-attachments-to-team-messages.js';
import * as addIsPublicToRobotFiles from '../migrations/20251130-add-is-public-to-robot-files.js';
import * as addOauthFieldsToUsers from '../migrations/20251123215620-add-oauth-fields-to-users.js';
import * as createGalleryTable from '../migrations/20260111-create-gallery-table.js';
import * as addMetaToNotifications from '../migrations/20260112-add-meta-to-notifications.js';
import * as createEducationalCenters from '../migrations/20260118-create-educational-centers.js';
import * as createArchives from '../migrations/20260118-create-archives.js';
import * as updateUserRoles from '../migrations/20260118-update-user-roles.js';
import * as updateTeamsEducationalCenter from '../migrations/20260118-update-teams-educational-center.js';
import * as updateStreamsEducationalCenter from '../migrations/20260118-update-streams-educational-center.js';
import * as updateGalleryEnhanced from '../migrations/20260118-update-gallery-enhanced.js';
import * as updateRegistrationCenterApproval from '../migrations/20260118-update-registration-center-approval.js';
import * as addCenterAdminRequest from '../migrations/20251214-add-center-admin-request.js';
import * as addTeamSlugAndPages from '../migrations/20260228-add-team-slug-and-pages.js';

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

    // Add post features (is_pinned, PostLike, Comment)
    try {
      await addPostFeatures.up(qi, Sequelize);
      console.log('Added post features (is_pinned, PostLike, Comment)');
    } catch (e) {
      console.log('Skipping addPostFeatures (probably already exists):', e.message);
    }

    // Fix TeamMembers constraint
    try {
      await fixTeamMembersConstraint.up(qi, Sequelize);
      console.log('Fixed TeamMembers constraint');
    } catch (e) {
      console.log('Skipping fixTeamMembersConstraint:', e.message);
    }

    // Add is_active to Competitions
    try {
      await addIsActiveToCompetitions.up(qi, Sequelize);
      console.log('Added is_active to Competitions');
    } catch (e) {
      console.log('Skipping addIsActiveToCompetitions:', e.message);
    }

    // Create TeamMessages table
    try {
      await createTeamMessages.up(qi, Sequelize);
      console.log('Created TeamMessages table');
    } catch (e) {
      console.log('Skipping createTeamMessages (probably already exists):', e.message);
    }

    // Update Notification type ENUM
    try {
      await updateNotificationTypeEnum.up(qi, Sequelize);
      console.log('Updated Notification type ENUM');
    } catch (e) {
      console.log('Skipping updateNotificationTypeEnum:', e.message);
    }

    // Add meta payload to Notification
    try {
      await addMetaToNotifications.up(qi, Sequelize);
      console.log('Added meta column to Notification');
    } catch (e) {
      console.log('Skipping addMetaToNotifications:', e.message);
    }

    // Create RobotFiles table
    try {
      await createRobotFiles.up(qi, Sequelize);
      console.log('Created RobotFiles table');
    } catch (e) {
      console.log('Skipping createRobotFiles (probably already exists):', e.message);
    }

    // Create TeamLogs table
    try {
      await createTeamLogs.up(qi, Sequelize);
      console.log('Created TeamLogs table');
    } catch (e) {
      console.log('Skipping createTeamLogs (probably already exists):', e.message);
    }

    // Add attachments to TeamMessages
    try {
      await addAttachmentsToTeamMessages.up(qi, Sequelize);
      console.log('Added attachments to TeamMessages');
    } catch (e) {
      console.log('Skipping addAttachmentsToTeamMessages:', e.message);
    }

    // Add is_public to RobotFiles
    try {
      await addIsPublicToRobotFiles.up(qi, Sequelize);
      console.log('Added is_public to RobotFiles');
    } catch (e) {
      console.log('Skipping addIsPublicToRobotFiles:', e.message);
    }
    // Add OAuth fields to Users
    try {
      await addOauthFieldsToUsers.up(qi, Sequelize);
      console.log('Added OAuth fields to Users');
    } catch (e) {
      console.log('Skipping addOauthFieldsToUsers:', e.message);
    }

    // Create Gallery table
    try {
      await createGalleryTable.up(qi, Sequelize);
      console.log('Created Gallery table');
    } catch (e) {
      console.log('Skipping createGalleryTable (probably already exists):', e.message);
    }

    // ========== NEW MIGRATIONS (2026-01-18) ==========

    // Create EducationalCenters table
    try {
      await createEducationalCenters.default.up(qi, Sequelize);
      console.log('Created EducationalCenters table');
    } catch (e) {
      console.log('Skipping createEducationalCenters:', e.message);
    }

    // Create Archives table
    try {
      await createArchives.default.up(qi, Sequelize);
      console.log('Created Archives table');
    } catch (e) {
      console.log('Skipping createArchives:', e.message);
    }

    // Update User roles (add center_admin)
    try {
      await updateUserRoles.default.up(qi, Sequelize);
      console.log('Updated User roles');
    } catch (e) {
      console.log('Skipping updateUserRoles:', e.message);
    }

    // Add educational_center_id to Teams
    try {
      await updateTeamsEducationalCenter.default.up(qi, Sequelize);
      console.log('Added educational_center_id to Teams');
    } catch (e) {
      console.log('Skipping updateTeamsEducationalCenter:', e.message);
    }

    // Add educational_center_id to Streams
    try {
      await updateStreamsEducationalCenter.default.up(qi, Sequelize);
      console.log('Added educational_center_id to Streams');
    } catch (e) {
      console.log('Skipping updateStreamsEducationalCenter:', e.message);
    }

    // Enhance Gallery table (videos, competition_id, etc.)
    try {
      await updateGalleryEnhanced.default.up(qi, Sequelize);
      console.log('Enhanced Gallery table with video support');
    } catch (e) {
      console.log('Skipping updateGalleryEnhanced:', e.message);
    }

    // Add center approval fields to Registration
    try {
      await updateRegistrationCenterApproval.default.up(qi, Sequelize);
      console.log('Added center approval fields to Registration');
    } catch (e) {
      console.log('Skipping updateRegistrationCenterApproval:', e.message);
    }

    // Create CenterAdminRequest table and add pending_role to User
    try {
      const upFn = addCenterAdminRequest.up || addCenterAdminRequest.default?.up;
      if (upFn) {
        await upFn(qi, Sequelize);
        console.log('Created CenterAdminRequest table and added pending_role to User');
      }
    } catch (e) {
      console.log('Skipping addCenterAdminRequest:', e.message);
    }

    // Add slug to Team and create TeamPage table
    try {
      const upFn = addTeamSlugAndPages.up || addTeamSlugAndPages.default?.up;
      if (upFn) {
        await upFn(qi, Sequelize);
        console.log('Added Team.slug and created TeamPage table');
      }
    } catch (e) {
      console.log('Skipping addTeamSlugAndPages:', e.message);
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
