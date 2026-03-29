import multer from 'multer';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';

function safeName(name) {
  return (name || 'file')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 120);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const base = path.basename(file.originalname || 'upload', ext);
    cb(null, `${randomUUID()}_${safeName(base)}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB
});

