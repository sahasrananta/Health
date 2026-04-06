import { getDb } from './src/db.js';

const db = getDb();
console.log('--- Database Verification (with hashes) ---');

const users = db.prepare("SELECT id, role, email, password_hash, is_verified FROM users").all();
console.log('Users:', JSON.stringify(users, null, 2));
