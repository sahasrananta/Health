import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { getDb } from './db.js';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const db = getDb();
    const user = db.prepare('SELECT id, role, email, phone, first_name, last_name, is_verified, created_at FROM users WHERE id = ?')
      .get(payload.sub);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  };
}

