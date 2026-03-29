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

import { Op, fn, col, literal } from 'sequelize';
import db from '../models/index.js';

const { TeamFile, R2Stats } = db;

// ── Hard limits ─────────────────────────────────────────────────────────────

export const LIMITS = {
  TEAM_BYTES:    250  * 1024 * 1024,         //  250 MB per team
  GLOBAL_BYTES:  10   * 1024 * 1024 * 1024,  //   10 GB global
  CLASS_A_MONTH: 1_000_000,                   //    1 M Class A ops / month
  CLASS_B_MONTH: 10_000_000,                  //   10 M Class B ops / month
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Current month string: "YYYY-MM" */
function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Sum of file sizes (bytes) stored by a specific team.
 * @param {number|string} teamId
 * @returns {Promise<number>}
 */
export async function getTeamStorageBytes(teamId) {
  const result = await TeamFile.findOne({
    attributes: [[fn('COALESCE', fn('SUM', col('size')), literal('0')), 'total']],
    where: { team_id: Number(teamId) },
    raw: true,
  });
  return Number(result?.total ?? 0);
}

/**
 * Sum of file sizes (bytes) across ALL teams (global storage).
 * @returns {Promise<number>}
 */
export async function getGlobalStorageBytes() {
  const result = await TeamFile.findOne({
    attributes: [[fn('COALESCE', fn('SUM', col('size')), literal('0')), 'total']],
    raw: true,
  });
  return Number(result?.total ?? 0);
}

/**
 * Fetch (or upsert) the R2Stats row for the current month.
 * @returns {Promise<import('../models/r2_stats.model.js').default>}
 */
async function getOrCreateMonthStats() {
  const month = currentMonth();
  const [row] = await R2Stats.findOrCreate({
    where: { month },
    defaults: { class_a_ops: 0, class_b_ops: 0 },
  });
  return row;
}

/**
 * Increment Class A operations by `delta` for the current month.
 * Class A = writes (upload, delete).
 * @param {number} [delta=1]
 */
export async function incrementClassA(delta = 1) {
  const month = currentMonth();
  await R2Stats.findOrCreate({
    where: { month },
    defaults: { class_a_ops: 0, class_b_ops: 0 },
  });
  await R2Stats.increment('class_a_ops', { by: delta, where: { month } });
}

/**
 * Increment Class B operations by `delta` for the current month.
 * Class B = reads (list, head).
 * @param {number} [delta=1]
 */
export async function incrementClassB(delta = 1) {
  const month = currentMonth();
  await R2Stats.findOrCreate({
    where: { month },
    defaults: { class_a_ops: 0, class_b_ops: 0 },
  });
  await R2Stats.increment('class_b_ops', { by: delta, where: { month } });
}

// ── Quota checks (throw on violation) ───────────────────────────────────────

/**
 * Check all quotas before an upload. Throws an error with HTTP status if any limit is exceeded.
 *
 * @param {number|string} teamId
 * @param {number} incomingBytes  Size of the file about to be uploaded
 */
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

// ── Usage summary (for API response) ────────────────────────────────────────

/**
 * Full usage snapshot for a team.
 *
 * @param {number|string} teamId
 * @returns {Promise<{
 *   team:   { used: number, limit: number, pct: number },
 *   global: { used: number, limit: number, pct: number },
 *   ops:    { classA: number, classALimit: number, classB: number, classBLimit: number, month: string }
 * }>}
 */
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
