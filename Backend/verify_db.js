import Database from 'better-sqlite3';
const db = new Database('./data/app.db');
const user = db.prepare('SELECT id, email, first_name, last_name, role FROM users WHERE email=?').get('test@patient.com');
console.log(JSON.stringify(user, null, 2));
