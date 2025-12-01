import db from '../models/index.js';
import redisClient from './redis.js';
import { Op } from 'sequelize';
import { emitToUser } from './realtime.js';

const { Competition, Registration, Team, Notification } = db;

const REMINDER_WINDOW_HOURS = 24;

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

let intervalHandle = null;

export function startSchedulers() {
  if (intervalHandle) return;
  // run hourly
  intervalHandle = setInterval(() => {
    sendCompetitionReminders().catch(() => {});
  }, 60 * 60 * 1000);
  // run once at startup after small delay
  setTimeout(() => sendCompetitionReminders().catch(() => {}), 15 * 1000);
}

export function stopSchedulers() {
  if (intervalHandle) clearInterval(intervalHandle);
  intervalHandle = null;
}