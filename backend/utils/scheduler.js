import prisma from '../lib/prisma.js';
import redisClient from './redis.js';
import { emitToUser } from './realtime.js';

/**
 * @fileoverview
 * Background scheduler for periodic tasks.
 * @module utils/scheduler
 */

const REMINDER_WINDOW_HOURS = 24;

export async function sendCompetitionReminders() {
  const now = new Date();
  const inWindow = new Date(now.getTime() + REMINDER_WINDOW_HOURS * 3600 * 1000);

  const comps = await prisma.competition.findMany({
    where: {
      start_date: { lte: inWindow, gte: now },
    },
    select: { id: true, title: true, start_date: true },
  });

  if (!comps.length) return;

  for (const comp of comps) {
    const regs = await prisma.registration.findMany({
      where: { competition_id: comp.id, status: 'approved' },
      select: { id: true, team_id: true },
    });

    for (const reg of regs) {
      if (!reg.team_id) continue;
      const team = await prisma.team.findUnique({
        where: { id: reg.team_id },
        select: { id: true, name: true, created_by_user_id: true },
      });
      if (!team?.created_by_user_id) continue;

      const dedupKey = `reminder:comp:${comp.id}:team:${team.id}`;
      const already = await redisClient.get(dedupKey);
      if (already) continue;
      await redisClient.set(dedupKey, '1', { ex: 48 * 3600 });

      try {
        const notif = await prisma.notification.create({
          data: {
            user_id: team.created_by_user_id,
            title: 'Competition Reminder',
            message: `Your team ${team.name} is competing soon: ${comp.title}`,
            type: 'team_message', // closest available enum value
          },
        });
        emitToUser(team.created_by_user_id, 'notification', notif);
      } catch (_) {}
    }
  }
}

let intervalHandle = null;

export function startSchedulers() {
  if (intervalHandle) return;
  intervalHandle = setInterval(() => {
    sendCompetitionReminders().catch(() => {});
  }, 60 * 60 * 1000);
  setTimeout(() => sendCompetitionReminders().catch(() => {}), 15 * 1000);
}

export function stopSchedulers() {
  if (intervalHandle) clearInterval(intervalHandle);
  intervalHandle = null;
}
