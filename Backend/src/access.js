import { getDb } from './db.js';

export function isConsentActive(consent, nowIso = new Date().toISOString()) {
  if (!consent) return false;
  if (consent.revoked_at) return false;
  if (!consent.expires_at) return true;
  return consent.expires_at > nowIso;
}

export function findActiveConsent(patientId, doctorId) {
  const db = getDb();
  const now = new Date().toISOString();
  return db.prepare(`
    SELECT *
    FROM consents
    WHERE patient_id = ?
      AND doctor_id = ?
      AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > ?)
    ORDER BY created_at DESC
    LIMIT 1
  `).get(patientId, doctorId, now);
}

