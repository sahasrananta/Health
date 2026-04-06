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

// Patients: Search for Doctors (to grant consent)
doctorRoutes.get('/search', requireAuth, (req, res) => {
  const { q } = req.query;
  const db = getDb();
  
  if (!q || q.length < 2) {
    return res.json({ doctors: [] });
  }

  const query = `%${q}%`;
  const doctors = db.prepare(`
    SELECT id, first_name, last_name, specialization, hospital_affiliation
    FROM users
    WHERE role = 'doctor' 
      AND is_verified = 1
      AND (first_name LIKE ? OR last_name LIKE ? OR specialization LIKE ?)
    LIMIT 20
  `).all(query, query, query);

  res.json({ doctors });
});

