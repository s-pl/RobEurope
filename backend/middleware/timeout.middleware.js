const timeoutMiddleware = (req, res, next) => {
  const TIMEOUT_MS = 15000; // 15 seconds
  let finished = false;

  const timer = setTimeout(() => {
    finished = true;
    if (!res.headersSent) {
      try {
        res.status(503).json({ error: 'Service Unavailable: Request timed out' });
      } catch (e) {
        // ignore
      }
    }
    // try to destroy the socket to avoid lingering resources
    try { req.socket && req.socket.destroy(); } catch (e) { /* ignore */ }
  }, TIMEOUT_MS);

  // clear timer when response finishes or connection closes
  res.once('finish', () => { clearTimeout(timer); });
  res.once('close', () => { clearTimeout(timer); });

  // If a previous middleware already ended the response, skip next()
  if (finished) return;
  next();
};

export default timeoutMiddleware;