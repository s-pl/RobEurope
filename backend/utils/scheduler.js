import db from '../models/index.js';
import redisClient from './redis.js';
import { Op } from 'sequelize';
import { emitToUser } from './realtime.js';

/**
 * @fileoverview
 * Background scheduler for periodic tasks.
 * Currently handles competition reminder notifications.
 * @module utils/scheduler
 */

const { Competition, Registration, Team, Notification } = db;

/**
 * Time window in hours before competition start to send reminders.
 * @constant {number}
 */
const REMINDER_WINDOW_HOURS = 24;

/**
 * Sends reminder notifications for upcoming competitions.
 * Finds competitions starting within the reminder window and notifies
 * team owners with approved registrations.
 * Uses Redis for deduplication to prevent duplicate notifications.
 * @async
 * @private
 * @returns {Promise<void>}
 */
async function sendCompetitionReminders() {
  const now = new Date();
  const inWindow = new Date(now.getTime() + REMINDER_WINDOW_HOURS * 3600 * 1000);

  // competitions starting within next 24h
  const comps = await Competition.findAll({
    where: {
      start_date: { [Op.lte]: inWindow, [Op.gte]: now }
    },
    attributes: ['id', 'title', 'start_date']
  });

  if (!comps.length) return;

  for (const comp of comps) {
    // find approved registrations for this competition
    const regs = await Registration.findAll({ where: { competition_id: comp.id, status: 'approved' }, attributes: ['id','team_id'] });
    for (const reg of regs) {
      const team = await Team.findByPk(reg.team_id, { attributes: ['id','name','created_by_user_id'] });
      if (!team) continue;
      const dedupKey = `reminder:comp:${comp.id}:team:${team.id}`;
      const already = await redisClient.get(dedupKey);
      if (already) continue;
      await redisClient.set(dedupKey, '1', { EX: 48 * 3600 }); // avoid duplicates for 48h

      try {
        const notif = await Notification.create({
          user_id: team.created_by_user_id,
          title: 'Competition Reminder',
          message: `Your team ${team.name} is competing soon: ${comp.title}`,
          type: 'competition_reminder'
        });
        emitToUser(team.created_by_user_id, 'notification', notif.toJSON());
      } catch (_) {}
    }
  }
}

/**
 * Handle for the scheduler interval.
 * @type {NodeJS.Timeout|null}
 * @private
 */
let intervalHandle = null;

/**
 * Starts the background schedulers.
 * Runs reminder check hourly and once at startup (after 15s delay).
 * Safe to call multiple times - subsequent calls are no-ops.
 * @returns {void}
 */
export function startSchedulers() {
  if (intervalHandle) return;
  // run hourly
  intervalHandle = setInterval(() => {
    sendCompetitionReminders().catch(() => {});
  }, 60 * 60 * 1000);
  // run once at startup after small delay
  setTimeout(() => sendCompetitionReminders().catch(() => {}), 15 * 1000);
}

/**
 * Stops all background schedulers.
 * Safe to call even if schedulers are not running.
 * @returns {void}
 */
export function stopSchedulers() {
  if (intervalHandle) clearInterval(intervalHandle);
  intervalHandle = null;
}