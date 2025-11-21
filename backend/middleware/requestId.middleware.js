import { randomUUID } from 'crypto';

export default function requestId() {
  return (req, res, next) => {
    const id = randomUUID();
    req.id = id;
    res.locals.requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
  };
}