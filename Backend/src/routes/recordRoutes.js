import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { requireAuth, requireRole } from '../auth.js';
import { getDb } from '../db.js';
import { classifyRecord, listDepartments } from '../classification.js';
import { upload } from '../upload.js';
import { findActiveConsent } from '../access.js';

export const recordRoutes = express.Router();

const createRecordSchema = z.object({
  description: z.string().max(500).optional(),
  departmentOverride: z.string().optional(),
  patientId: z.string().uuid().optional()
});

function canAccessPatient(reqUser, patientId) {
  if (reqUser.role === 'admin') return true;
  if (reqUser.role === 'patient' && reqUser.id === patientId) return true;
  return false;
}

function audit(db, { actorUserId, action, recordId, patientId, ip }) {
  db.prepare(`
    INSERT INTO audit_logs (id, actor_user_id, action, record_id, patient_id, ip, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), actorUserId || null, action, recordId || null, patientId || null, ip || null, new Date().toISOString());
}

// Upload a record. Patients upload for themselves; admins can upload for any patient via patientId.
recordRoutes.post(
  '/patients/me',
  requireAuth,
  upload.single('file'),
  (req, res) => {
    const parsed = createRecordSchema.safeParse(req.body);
    if (!parsed.success) {
      if (req.file?.path) fs.rmSync(req.file.path, { force: true });
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    if (!req.file) return res.status(400).json({ error: 'Missing file' });

    const { description, departmentOverride, patientId } = parsed.data;
    const db = getDb();

    const targetPatientId = req.user.role === 'admin'
      ? (patientId || null)
      : req.user.id;

    if (!targetPatientId) {
      fs.rmSync(req.file.path, { force: true });
      return res.status(400).json({ error: 'patientId is required for admin uploads' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'patient') {
      fs.rmSync(req.file.path, { force: true });
      return res.status(403).json({ error: 'Only patients or admins can upload' });
    }

    if (req.user.role === 'patient' && targetPatientId !== req.user.id) {
      fs.rmSync(req.file.path, { force: true });
      return res.status(403).json({ error: 'Cannot upload for another patient' });
    }

    const patient = db.prepare('SELECT id, role FROM users WHERE id = ?').get(targetPatientId);
    if (!patient || patient.role !== 'patient') {
      fs.rmSync(req.file.path, { force: true });
      return res.status(404).json({ error: 'Patient not found' });
    }

    let department = null;
    let confidence = null;
    let manualOverride = 0;

    if (departmentOverride) {
      if (!listDepartments().includes(departmentOverride)) {
        fs.rmSync(req.file.path, { force: true });
        return res.status(400).json({ error: 'Invalid departmentOverride' });
      }
      department = departmentOverride;
      confidence = 1;
      manualOverride = 1;
    } else {
      const ocrText = req.body.ocrText || '';
      const classified = classifyRecord({
        name: req.file.originalname,
        content: ocrText,
        description: description || null,
        metadata: {
          mimeType: req.file.mimetype,
          size: req.file.size,
          ocrTextLength: ocrText ? ocrText.length : 0
        }
      });

      department = classified.department;
      confidence = classified.confidence;
    }

    const recordId = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO records
      (id, patient_id, uploaded_by, file_name, mime_type, size, storage_path, department, confidence, manual_override, description, classified_at, created_at)
      VALUES
      (@id, @patientId, @uploadedBy, @fileName, @mimeType, @size, @storagePath, @department, @confidence, @manualOverride, @description, @classifiedAt, @createdAt)
    `).run({
      id: recordId,
      patientId: targetPatientId,
      uploadedBy: req.user.id,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storagePath: req.file.path,
      department,
      confidence,
      manualOverride,
      description: description || null,
      classifiedAt: now,
      createdAt: now
    });

    audit(db, { actorUserId: req.user.id, action: 'record.upload', recordId, patientId: targetPatientId, ip: req.ip });

    const record = db.prepare('SELECT * FROM records WHERE id = ?').get(recordId);
    return res.status(201).json({ record });
  }
);

// List my records (patient) or all records (admin)
recordRoutes.get('/patients/me', requireAuth, (req, res) => {
  const db = getDb();

  if (req.user.role === 'patient') {
    const records = db.prepare('SELECT * FROM records WHERE patient_id = ? ORDER BY created_at DESC').all(req.user.id);
    return res.json({ records });
  }

  if (req.user.role === 'admin') {
    const records = db.prepare('SELECT * FROM records ORDER BY created_at DESC LIMIT 200').all();
    return res.json({ records });
  }

  return res.status(403).json({ error: 'Forbidden' });
});

// List records for a specific patient (admin; or doctor with active consent)
recordRoutes.get('/patients/:patientId', requireAuth, (req, res) => {
  const patientId = req.params.patientId;
  const db = getDb();

  if (canAccessPatient(req.user, patientId)) {
    const records = db.prepare('SELECT * FROM records WHERE patient_id = ? ORDER BY created_at DESC').all(patientId);
    return res.json({ records });
  }

  if (req.user.role === 'doctor') {
    if (!req.user.is_verified) return res.status(403).json({ error: 'Doctor not verified' });
    const consent = findActiveConsent(patientId, req.user.id);
    if (!consent) return res.status(403).json({ error: 'No active consent' });
    const records = db.prepare('SELECT * FROM records WHERE patient_id = ? ORDER BY created_at DESC').all(patientId);
    audit(db, { actorUserId: req.user.id, action: 'record.list', recordId: null, patientId, ip: req.ip });
    return res.json({ records });
  }

  return res.status(403).json({ error: 'Forbidden' });
});

// Download a record file
recordRoutes.get('/:recordId/download', requireAuth, (req, res) => {
  const db = getDb();
  const record = db.prepare('SELECT * FROM records WHERE id = ?').get(req.params.recordId);
  if (!record) return res.status(404).json({ error: 'Record not found' });

  const patientId = record.patient_id;
  if (canAccessPatient(req.user, patientId)) {
    audit(db, { actorUserId: req.user.id, action: 'record.download', recordId: record.id, patientId, ip: req.ip });
    return res.download(path.resolve(record.storage_path), record.file_name);
  }

  if (req.user.role === 'doctor') {
    if (!req.user.is_verified) return res.status(403).json({ error: 'Doctor not verified' });
    const consent = findActiveConsent(patientId, req.user.id);
    if (!consent) return res.status(403).json({ error: 'No active consent' });
    audit(db, { actorUserId: req.user.id, action: 'record.download', recordId: record.id, patientId, ip: req.ip });
    return res.download(path.resolve(record.storage_path), record.file_name);
  }

  return res.status(403).json({ error: 'Forbidden' });
});

// Delete a record (owner patient or admin)
recordRoutes.delete('/:recordId', requireAuth, (req, res) => {
  const db = getDb();
  const record = db.prepare('SELECT * FROM records WHERE id = ?').get(req.params.recordId);
  if (!record) return res.status(404).json({ error: 'Record not found' });

  if (!canAccessPatient(req.user, record.patient_id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    fs.rmSync(record.storage_path, { force: true });
  } catch {
    // ignore filesystem issues; still remove DB row
  }

  db.prepare('DELETE FROM records WHERE id = ?').run(record.id);
  audit(db, { actorUserId: req.user.id, action: 'record.delete', recordId: record.id, patientId: record.patient_id, ip: req.ip });
  return res.json({ ok: true });
});

// Move record to another department (admin)
recordRoutes.patch('/:recordId/move', requireAuth, requireRole('admin'), (req, res) => {
  const schema = z.object({ department: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });

  const { department } = parsed.data;
  if (!listDepartments().includes(department)) return res.status(400).json({ error: 'Invalid department' });

  const db = getDb();
  const record = db.prepare('SELECT * FROM records WHERE id = ?').get(req.params.recordId);
  if (!record) return res.status(404).json({ error: 'Record not found' });

  db.prepare('UPDATE records SET department = ?, manual_override = 1, confidence = 1 WHERE id = ?')
    .run(department, record.id);

  audit(db, { actorUserId: req.user.id, action: 'record.move', recordId: record.id, patientId: record.patient_id, ip: req.ip });
  const updated = db.prepare('SELECT * FROM records WHERE id = ?').get(record.id);
  return res.json({ record: updated });
});

