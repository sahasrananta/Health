import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { randomUUID, randomBytes } from 'node:crypto';
import { config } from './config.js';

let dbInstance = null;

function ensureParentDir(filePath) {
  const dir = path.dirname(path.resolve(filePath));
  fs.mkdirSync(dir, { recursive: true });
}

function migrate(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('patient','doctor','admin')),
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      dob TEXT,
      blood_type TEXT,
      specialization TEXT,
      license_number TEXT,
      hospital_affiliation TEXT,
      is_verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      uploaded_by TEXT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
      file_name TEXT NOT NULL,
      mime_type TEXT,
      size INTEGER,
      storage_path TEXT NOT NULL,
      department TEXT NOT NULL,
      confidence REAL NOT NULL,
      manual_override INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      classified_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_records_patient ON records(patient_id);
    CREATE INDEX IF NOT EXISTS idx_records_department ON records(department);

    CREATE TABLE IF NOT EXISTS consents (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      doctor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      access_level TEXT NOT NULL CHECK (access_level IN ('full','view','limited')),
      expires_at TEXT,
      revoked_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_consents_patient ON consents(patient_id);
    CREATE INDEX IF NOT EXISTS idx_consents_doctor ON consents(doctor_id);

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      doctor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      starts_at TEXT NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      record_id TEXT,
      patient_id TEXT,
      ip TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_audit_patient ON audit_logs(patient_id);
  `);

  // Seed default admin if no admin exists
  const adminExists = db.prepare("SELECT 1 FROM users WHERE role = 'admin'").get();
  if (!adminExists) {
    const defaultAdminPassword = config.adminPassword || randomBytes(12).toString('hex');
    const passwordHash = bcrypt.hashSync(defaultAdminPassword, 10);
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (id, role, email, phone, password_hash, first_name, last_name, is_verified, created_at)
      VALUES (?, 'admin', 'admin@healthclo.com', NULL, ?, 'System', 'Admin', 1, ?)
    `).run(randomUUID(), passwordHash, now);
    console.log('✅ Default admin seeded (admin@healthclo.com)');
  } else if (config.adminPassword) {
    // If admin exists and a custom password is provided, ensure it's up to date
    const passwordHash = bcrypt.hashSync(config.adminPassword, 10);
    db.prepare("UPDATE users SET password_hash = ? WHERE role = 'admin' AND email = 'admin@healthclo.com'").run(passwordHash);
    console.log('✅ Admin password synchronized with environment configuration');
  }
}

export function getDb() {
  if (dbInstance) return dbInstance;

  ensureParentDir(config.databasePath);
  dbInstance = new Database(config.databasePath);
  migrate(dbInstance);
  return dbInstance;
}

