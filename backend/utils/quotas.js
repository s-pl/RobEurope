/**
 * Cloudflare R2 free-tier quota enforcement.
 *
 * Free tier limits (monthly, reset every calendar month):
 *   Storage      10 GB-month   (we enforce 10 GB at any point in time)
 *   Class A ops   1 M/month    (writes: upload, delete, multipart)
 *   Class B ops  10 M/month    (reads: list, head, get metadata)
 *   Egress        free
 *
 * Per-team soft cap: 250 MB
 */

import prisma from '../lib/prisma.js';

export const LIMITS = {
  TEAM_BYTES:    250  * 1024 * 1024,
  GLOBAL_BYTES:  10   * 1024 * 1024 * 1024,
  CLASS_A_MONTH: 1_000_000,
  CLASS_B_MONTH: 10_000_000,
};

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export async function getTeamStorageBytes(teamId) {
  const result = await prisma.teamFile.aggregate({
    _sum: { size: true },
    where: { team_id: Number(teamId) },
  });
  return Number(result._sum.size ?? 0);
}

export async function getGlobalStorageBytes() {
  const result = await prisma.teamFile.aggregate({
    _sum: { size: true },
  });
  return Number(result._sum.size ?? 0);
}

async function getOrCreateMonthStats() {
  const month = currentMonth();
  return prisma.r2Stats.upsert({
    where: { month },
    create: { month, class_a_ops: 0, class_b_ops: 0 },
    update: {},
  });
}

export async function incrementClassA(delta = 1) {
  const month = currentMonth();
  await prisma.r2Stats.upsert({
    where: { month },
    create: { month, class_a_ops: BigInt(delta), class_b_ops: 0 },
    update: { class_a_ops: { increment: BigInt(delta) } },
  });
}

export async function incrementClassB(delta = 1) {
  const month = currentMonth();
  await prisma.r2Stats.upsert({
    where: { month },
    create: { month, class_a_ops: 0, class_b_ops: BigInt(delta) },
    update: { class_b_ops: { increment: BigInt(delta) } },
  });
}

export async function assertUploadAllowed(teamId, incomingBytes) {
  const [teamBytes, globalBytes, stats] = await Promise.all([
    getTeamStorageBytes(teamId),
    getGlobalStorageBytes(),
    getOrCreateMonthStats(),
  ]);

  if (teamBytes + incomingBytes > LIMITS.TEAM_BYTES) {
    const usedMB  = (teamBytes / 1024 / 1024).toFixed(1);
    const limitMB = (LIMITS.TEAM_BYTES / 1024 / 1024).toFixed(0);
    const err = new Error(
      `El equipo ha alcanzado su límite de almacenamiento (${usedMB} MB / ${limitMB} MB). Elimina archivos para subir nuevos.`
    );
    err.status = 413;
    throw err;
  }

  if (globalBytes + incomingBytes > LIMITS.GLOBAL_BYTES) {
    const usedGB  = (globalBytes / 1024 / 1024 / 1024).toFixed(2);
    const limitGB = (LIMITS.GLOBAL_BYTES / 1024 / 1024 / 1024).toFixed(0);
    const err = new Error(
      `Se ha alcanzado el límite de almacenamiento global (${usedGB} GB / ${limitGB} GB). Contacta con el administrador.`
    );
    err.status = 507;
    throw err;
  }

  const classAUsed = Number(stats.class_a_ops ?? 0);
  if (classAUsed >= LIMITS.CLASS_A_MONTH) {
    const err = new Error(
      `Se ha alcanzado el límite mensual de escrituras en el almacenamiento (${classAUsed.toLocaleString()} / ${LIMITS.CLASS_A_MONTH.toLocaleString()}). Disponible el próximo mes.`
    );
    err.status = 429;
    throw err;
  }
}

export async function getUsageSnapshot(teamId) {
  const [teamBytes, globalBytes, stats] = await Promise.all([
    getTeamStorageBytes(teamId),
    getGlobalStorageBytes(),
    getOrCreateMonthStats(),
  ]);

  return {
    team: {
      used:  teamBytes,
      limit: LIMITS.TEAM_BYTES,
      pct:   Math.min(100, (teamBytes / LIMITS.TEAM_BYTES) * 100),
    },
    global: {
      used:  globalBytes,
      limit: LIMITS.GLOBAL_BYTES,
      pct:   Math.min(100, (globalBytes / LIMITS.GLOBAL_BYTES) * 100),
    },
    ops: {
      classA:      Number(stats.class_a_ops ?? 0),
      classALimit: LIMITS.CLASS_A_MONTH,
      classB:      Number(stats.class_b_ops ?? 0),
      classBLimit: LIMITS.CLASS_B_MONTH,
      month:       stats.month,
    },
  };
}
