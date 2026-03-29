import express from 'express';
import { requireAuth, requireRole } from '../auth.js';
import { getDb } from '../db.js';

export const doctorRoutes = express.Router();

// Overview cards for doctor dashboard
doctorRoutes.get('/overview', requireAuth, requireRole('doctor'), (req, res) => {
  const db = getDb();
  const totalPatients = db.prepare(`
    SELECT COUNT(DISTINCT patient_id) AS c
    FROM consents
    WHERE doctor_id = ?
  `).get(req.user.id).c;

  const totalRecords = db.prepare(`
    SELECT COUNT(DISTINCT r.id) AS c
    FROM records r
    JOIN consents c ON c.patient_id = r.patient_id
    WHERE c.doctor_id = ?
  `).get(req.user.id).c;

  const pendingConsents = db.prepare(`
    SELECT COUNT(*) AS c
    FROM consents
    WHERE doctor_id = ?
      AND revoked_at IS NULL
  `).get(req.user.id).c;

  res.json({
    overview: {
      totalPatients,
      totalRecords,
      activeConsents: pendingConsents
    }
  });
});

// List patients that doctor has consent to view
doctorRoutes.get('/patients', requireAuth, requireRole('doctor'), (req, res) => {
  const db = getDb();
  const patients = db.prepare(`
    SELECT DISTINCT
      p.id,
      p.first_name,
      p.last_name,
      p.dob,
      p.blood_type
    FROM consents c
    JOIN users p ON p.id = c.patient_id
    WHERE c.doctor_id = ?
  `).all(req.user.id);

  res.json({ patients });
});

