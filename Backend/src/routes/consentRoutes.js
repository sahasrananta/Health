import express from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { requireAuth, requireRole } from '../auth.js';
import { getDb } from '../db.js';
import { isConsentActive } from '../access.js';

export const consentRoutes = express.Router();

const createConsentSchema = z.object({
  doctorId: z.string().uuid(),
  accessLevel: z.enum(['full', 'view', 'limited']).default('view'),
  expiresAt: z.string().datetime().nullish()
});

// Patient: create consent for a doctor
consentRoutes.post('/', requireAuth, requireRole('patient'), (req, res) => {
  const parsed = createConsentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const { doctorId, accessLevel, expiresAt } = parsed.data;
  const db = getDb();

  const doctor = db.prepare('SELECT id, role, is_verified, first_name, last_name FROM users WHERE id = ?').get(doctorId);
  if (!doctor || doctor.role !== 'doctor') return res.status(404).json({ error: 'Doctor not found' });
  if (!doctor.is_verified) return res.status(400).json({ error: 'Doctor is not yet verified' });

  // Reuse existing active consent if present by updating level/expiry
  const now = new Date().toISOString();
  const existing = db.prepare(`
    SELECT *
    FROM consents
    WHERE patient_id = ?
      AND doctor_id = ?
      AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > ?)
    ORDER BY created_at DESC
    LIMIT 1
  `).get(req.user.id, doctorId, now);

  if (existing) {
    db.prepare('UPDATE consents SET access_level = ?, expires_at = ? WHERE id = ?')
      .run(accessLevel, expiresAt ?? null, existing.id);
    const updated = db.prepare('SELECT * FROM consents WHERE id = ?').get(existing.id);
    return res.json({ consent: updated, updated: true });
  }

  const id = randomUUID();
  db.prepare(`
    INSERT INTO consents (id, patient_id, doctor_id, access_level, expires_at, revoked_at, created_at)
    VALUES (?, ?, ?, ?, ?, NULL, ?)
  `).run(id, req.user.id, doctorId, accessLevel, expiresAt ?? null, now);

  const consent = db.prepare('SELECT * FROM consents WHERE id = ?').get(id);
  return res.status(201).json({ consent, updated: false });
});

// Patient: list my consents
consentRoutes.get('/mine', requireAuth, requireRole('patient'), (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.*, u.first_name AS doctor_first_name, u.last_name AS doctor_last_name
    FROM consents c
    JOIN users u ON u.id = c.doctor_id
    WHERE c.patient_id = ?
    ORDER BY c.created_at DESC
  `).all(req.user.id);

  const now = new Date().toISOString();
  const consents = rows.map(row => ({
    ...row,
    isActive: isConsentActive(row, now)
  }));

  res.json({ consents });
});

// Doctor: list consents where I am the doctor
consentRoutes.get('/for-me', requireAuth, requireRole('doctor'), (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.*, p.first_name AS patient_first_name, p.last_name AS patient_last_name
    FROM consents c
    JOIN users p ON p.id = c.patient_id
    WHERE c.doctor_id = ?
    ORDER BY c.created_at DESC
  `).all(req.user.id);

  const now = new Date().toISOString();
  const consents = rows.map(row => ({
    ...row,
    isActive: isConsentActive(row, now)
  }));

  res.json({ consents });
});

// Patient: revoke a consent
consentRoutes.patch('/:consentId/revoke', requireAuth, requireRole('patient'), (req, res) => {
  const db = getDb();
  const consent = db.prepare('SELECT * FROM consents WHERE id = ?').get(req.params.consentId);
  if (!consent) return res.status(404).json({ error: 'Consent not found' });
  if (consent.patient_id !== req.user.id) return res.status(403).json({ error: 'Cannot revoke someone else’s consent' });

  if (consent.revoked_at) return res.json({ consent, alreadyRevoked: true });

  const now = new Date().toISOString();
  db.prepare('UPDATE consents SET revoked_at = ? WHERE id = ?').run(now, consent.id);
  const updated = db.prepare('SELECT * FROM consents WHERE id = ?').get(consent.id);
  return res.json({ consent: updated, alreadyRevoked: false });
});

