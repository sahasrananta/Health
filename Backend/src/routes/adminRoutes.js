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

// Admin: List Doctors needing verification
adminRoutes.get('/doctors/pending', requireAuth, requireRole('admin'), (req, res) => {
  const db = getDb();
  const pending = db.prepare(`
    SELECT id, first_name, last_name, specialization, license_number, hospital_affiliation, is_verified, created_at 
    FROM users 
    WHERE role = 'doctor' AND is_verified = 0
    ORDER BY created_at DESC
  `).all();
  res.json({ pending });
});

// Admin: Verify a Doctor
adminRoutes.post('/doctors/:id/verify', requireAuth, requireRole('admin'), (req, res) => {
  const { id } = req.params;
  const db = getDb();
  
  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id);
  if (!user || user.role !== 'doctor') return res.status(404).json({ error: 'Doctor not found' });

  db.prepare('UPDATE users SET is_verified = 1 WHERE id = ?').run(id);
  res.json({ message: 'Doctor verified successfully', id });
});

// Admin: List all Users (for management)
adminRoutes.get('/users', requireAuth, requireRole('admin'), (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT id, role, email, phone, first_name, last_name, is_verified, created_at FROM users ORDER BY created_at DESC').all();
  res.json({ users });
});

// Admin: System Audit Logs
adminRoutes.get('/audit-logs', requireAuth, requireRole('admin'), (req, res) => {
  const db = getDb();
  const logs = db.prepare(`
    SELECT l.*, u.first_name || ' ' || u.last_name AS actor_name
    FROM audit_logs l
    LEFT JOIN users u ON l.actor_user_id = u.id
    ORDER BY l.created_at DESC
    LIMIT 250
  `).all();
  res.json({ logs });
});

