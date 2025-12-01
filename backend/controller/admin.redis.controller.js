import redisClient from '../utils/redis.js';

// Helpers
const parseCount = (v, def = 50) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 500) : def;
};

export async function renderRedisExplorer(req, res) {
  return res.render('redis', {
    pageTitle: 'Redis Explorer',
    user: req.session.adminUser || null
  });
}

// List keys using SCAN to avoid blocking Redis
export async function listKeys(req, res) {
  try {
    const pattern = (req.query.pattern || '*').toString();
    const count = parseCount(req.query.count);
    const cursor = req.query.cursor ? parseInt(req.query.cursor, 10) : 0;

    // Ensure client connected
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

  const result = await redisClient.scan(String(cursor), { MATCH: pattern, COUNT: count });
    // Support both object and tuple forms (defensive)
    let nextCursor, keys;
    if (Array.isArray(result)) {
      nextCursor = parseInt(result[0], 10) || 0;
      keys = result[1] || [];
    } else {
      nextCursor = parseInt(result.cursor, 10) || 0;
      keys = result.keys || [];
    }

    res.json({ cursor: nextCursor, keys });
  } catch (err) {
    res.status(500).json({ error: 'Failed to scan keys', details: err.message });
  }
}

export async function getKeyInfo(req, res) {
  try {
    const key = req.params.key;
    if (!key) return res.status(400).json({ error: 'Key is required' });

    const type = await redisClient.type(key);
    let value = null;
    switch (type) {
      case 'string':
        value = await redisClient.get(key);
        break;
      case 'list':
        value = await redisClient.lRange(key, 0, -1);
        break;
      case 'set':
        value = await redisClient.sMembers(key);
        break;
      case 'zset':
        value = await redisClient.zRangeWithScores(key, 0, -1);
        break;
      case 'hash':
        value = await redisClient.hGetAll(key);
        break;
      default:
        value = null;
    }
    const ttl = await redisClient.ttl(key);
    res.json({ key, type, ttl, value });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get key info', details: err.message });
  }
}

export async function deleteKey(req, res) {
  try {
    const key = req.params.key;
    if (!key) return res.status(400).json({ error: 'Key is required' });
    const deleted = await redisClient.del(key);
    res.json({ key, deleted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete key', details: err.message });
  }
}

export async function getOverview(req, res) {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    // Ping
    const ping = await redisClient.ping();
    // DB size (number of keys)
    const dbsize = await redisClient.dbSize();
    // Basic INFO parsing (avoid huge payload)
    const infoRaw = await redisClient.info();
    const info = {};
    infoRaw.split('\n').forEach(line => {
      const m = line.match(/^([a-zA-Z_]+):(.+)$/);
      if (m) {
        const k = m[1];
        const v = m[2];
        if ([
          'redis_version','uptime_in_seconds','connected_clients','used_memory_human','maxmemory_human','instantaneous_ops_per_sec','role'
        ].includes(k)) {
          info[k] = v;
        }
      }
    });
    res.json({ ping, dbsize, info });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get overview', details: err.message });
  }
}
