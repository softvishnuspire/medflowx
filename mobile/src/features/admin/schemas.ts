import { z } from 'zod';

export const userCreateSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  role: z.enum(['Reception', 'Doctor', 'Pharmacy'], {
    message: 'Role is required',
  }),
  department_id: z.number().nullable().optional(),
  qualification: z.string().nullable().optional(),
  consultation_fee: z.number().nonnegative('Fee cannot be negative').nullable().optional(),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[0-9\s-]{10,15}$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  status: z.enum(['Active', 'Disabled']).default('Active'),
}).superRefine((data, ctx) => {
  if (data.role === 'Doctor') {
    if (!data.department_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Department is required for doctors',
        path: ['department_id'],
      });
    }
    if (!data.qualification || data.qualification.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Qualification is required for doctors',
        path: ['qualification'],
      });
    }
    if (data.consultation_fee === undefined || data.consultation_fee === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Consultation fee is required for doctors',
        path: ['consultation_fee'],
      });
    }
  }
});

export type UserCreateFormValues = z.infer<typeof userCreateSchema>;

export const userEditSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  role: z.enum(['Reception', 'Doctor', 'Pharmacy'], {
    message: 'Role is required',
  }),
  department_id: z.number().nullable().optional(),
  qualification: z.string().nullable().optional(),
  consultation_fee: z.number().nonnegative('Fee cannot be negative').nullable().optional(),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[0-9\s-]{10,15}$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').or(z.literal('')).optional(),
  status: z.enum(['Active', 'Disabled']).default('Active'),
}).superRefine((data, ctx) => {
  if (data.role === 'Doctor') {
    if (!data.department_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Department is required for doctors',
        path: ['department_id'],
      });
    }
    if (!data.qualification || data.qualification.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Qualification is required for doctors',
        path: ['qualification'],
      });
    }
    if (data.consultation_fee === undefined || data.consultation_fee === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Consultation fee is required for doctors',
        path: ['consultation_fee'],
      });
    }
  }
});

export type UserEditFormValues = z.infer<typeof userEditSchema>;

export const profileUpdateSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[0-9\s-]{10,15}$/, 'Invalid phone number format'),
});

export type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;

export const passwordChangeSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(6, 'New password must be at least 6 characters'),
  confirm_password: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;
