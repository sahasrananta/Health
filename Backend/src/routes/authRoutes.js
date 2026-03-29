import express from 'express';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getDb } from '../db.js';
import { registerSchema, loginSchema } from '../validation.js';
import { requireAuth, signToken } from '../auth.js';

export const authRoutes = express.Router();

authRoutes.post('/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const {
    role, email, phone, password, firstName, lastName, dob, bloodType,
    specialization, licenseNumber, hospitalAffiliation
  } = parsed.data;

  const db = getDb();

  if (email) {
    const exists = db.prepare('SELECT 1 FROM users WHERE email = ?').get(email);
    if (exists) return res.status(409).json({ error: 'Email already registered' });
  }
  if (phone) {
    const exists = db.prepare('SELECT 1 FROM users WHERE phone = ?').get(phone);
    if (exists) return res.status(409).json({ error: 'Phone already registered' });
  }

  const id = randomUUID();
  const passwordHash = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();
  const isVerified = role === 'doctor' ? 0 : 1;

  db.prepare(`
    INSERT INTO users
    (id, role, email, phone, password_hash, first_name, last_name, dob, blood_type,
     specialization, license_number, hospital_affiliation, is_verified, created_at)
    VALUES
    (@id, @role, @email, @phone, @passwordHash, @firstName, @lastName, @dob, @bloodType,
     @specialization, @licenseNumber, @hospitalAffiliation, @isVerified, @createdAt)
  `).run({
    id,
    role,
    email: email || null,
    phone: phone || null,
    passwordHash,
    firstName,
    lastName,
    dob: dob || null,
    bloodType: bloodType || null,
    specialization: specialization || null,
    licenseNumber: licenseNumber || null,
    hospitalAffiliation: hospitalAffiliation || null,
    isVerified,
    createdAt: now
  });

  const user = db.prepare('SELECT id, role, email, phone, first_name, last_name, is_verified, created_at FROM users WHERE id = ?')
    .get(id);
  const token = signToken(user);

  return res.status(201).json({ user, token });
});

authRoutes.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const { email, phone, password } = parsed.data;
  const db = getDb();

  const user = email
    ? db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    : db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const safeUser = {
    id: user.id,
    role: user.role,
    email: user.email,
    phone: user.phone,
    first_name: user.first_name,
    last_name: user.last_name,
    is_verified: user.is_verified,
    created_at: user.created_at
  };

  const token = signToken(safeUser);
  return res.json({ user: safeUser, token });
});

authRoutes.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

