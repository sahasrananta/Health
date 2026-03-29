import { z } from 'zod';

export const roleSchema = z.enum(['patient', 'doctor', 'admin']);

export const registerSchema = z.object({
  role: z.enum(['patient', 'doctor']).default('patient'),
  email: z.string().email().optional(),
  phone: z.string().min(8).max(20).optional(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  dob: z.string().optional(),
  bloodType: z.string().optional(),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  hospitalAffiliation: z.string().optional(),
  otp: z.string().optional()
}).refine(v => v.email || v.phone, { message: 'Either email or phone is required' })
  .refine(v => v.role !== 'doctor' || (v.specialization && v.licenseNumber && v.hospitalAffiliation), {
    message: 'Doctor registration requires specialization, licenseNumber, and hospitalAffiliation'
  });

export const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(8).max(20).optional(),
  password: z.string().min(1).max(128)
}).refine(v => v.email || v.phone, { message: 'Either email or phone is required' });

