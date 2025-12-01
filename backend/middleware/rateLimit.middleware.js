
const stores = new Map();

export default function rateLimit(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const max = options.max || 1e100; // (no limit by default)

  return (req, res, next) => {
    try {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      let entry = stores.get(ip);
      if (!entry || entry.resetAt <= now) {
        entry = { count: 1, resetAt: now + windowMs };
        stores.set(ip, entry);
      } else {
        entry.count += 1;
      }

      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)));
      res.setHeader('X-RateLimit-Reset', String(Math.floor(entry.resetAt / 1000)));

      if (entry.count > max) {
        res.status(429).json({ error: 'Too many requests' });
        return;
      }

      next();
    } catch (err) {
      next();
    }
  };
}
