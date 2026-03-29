import express from 'express';
import { requireAuth, requireRole } from '../auth.js';
import { getDb } from '../db.js';

export const adminRoutes = express.Router();

adminRoutes.get('/overview', requireAuth, requireRole('admin'), (req, res) => {
  const db = getDb();
  const totalUsers = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const totalPatients = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'patient'").get().c;
  const totalDoctors = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'doctor'").get().c;
  const totalRecords = db.prepare('SELECT COUNT(*) AS c FROM records').get().c;
  const totalConsents = db.prepare('SELECT COUNT(*) AS c FROM consents').get().c;

  res.json({
    overview: {
      totalUsers,
      totalPatients,
      totalDoctors,
      totalRecords,
      totalConsents
    }
  });
});

