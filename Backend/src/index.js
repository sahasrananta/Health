import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { config } from './config.js';
import { getDb } from './db.js';
import { authRoutes } from './routes/authRoutes.js';
import { recordRoutes } from './routes/recordRoutes.js';
import { departmentRoutes } from './routes/departmentRoutes.js';
import { consentRoutes } from './routes/consentRoutes.js';
import { doctorRoutes } from './routes/doctorRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';

function ensureDir(dir) {
  fs.mkdirSync(path.resolve(dir), { recursive: true });
}

// Initialize storage + DB
ensureDir(config.uploadDir);
getDb();

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://cdn.jsdelivr.net"
      ],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net"
      ],
      fontSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "data:"
      ],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "*"],
    },
  },
}));

app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin }));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.resolve(__dirname, '../../Frontend');

// Serve the frontend
app.use(express.static(frontendPath));


app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/consents', consentRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // Fallback to index.html for static frontend
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use((err, req, res, next) => {
  // Avoid leaking internals by default
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
});

