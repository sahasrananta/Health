import express from 'express';
import { listDepartments } from '../classification.js';

export const departmentRoutes = express.Router();

departmentRoutes.get('/', (req, res) => {
  res.json({ departments: listDepartments() });
});

