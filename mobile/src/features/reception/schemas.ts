import { z } from 'zod';

export const patientSchema = z.object({
  first_name: z.string().min(1, 'Full name is required'),
  last_name: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other'], {
    message: 'Gender is required',
  }),
  dob: z.string().nullable().optional().transform(v => v === '' ? null : v).refine((val) => {
    if (!val) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
    const date = new Date(val);
    return !isNaN(date.getTime()) && val === date.toISOString().split('T')[0];
  }, 'Invalid date (YYYY-MM-DD)'),
  age: z
    .number({ message: 'Age must be a number' })
    .int('Age must be an integer')
    .nonnegative('Age cannot be negative')
    .nullable()
    .optional(),
  blood_group: z.string().optional(),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[0-9\s-]{10,15}$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email address').or(z.literal('')).nullable().optional(),
  emergency_contact: z.string().optional(),
  occupation: z.string().optional(),
  allergies: z.string().optional(),
  medical_history: z.string().optional(),
  
  // Address fields
  address_line: z.string().optional(),
  city: z.string().min(1, 'Village / Town is required'),
  district: z.string().optional(),
  state: z.string().min(1, 'State is required'),
  country: z.string().optional(),
  pincode: z.string().optional(),
});

export type PatientFormValues = z.infer<typeof patientSchema>;

export const visitSchema = z.object({
  patient_id: z.number({ message: 'Patient is required' }),
  department_id: z.number({ message: 'Department is required' }),
  doctor_id: z.number({ message: 'Doctor is required' }),
  chief_complaint: z.string().min(1, 'Chief complaint is required'),
  token_no: z.number().int().positive().optional(),
  consultation_fee: z.number().nonnegative().optional(),
  visit_date: z.string().optional(),
});

export type VisitFormValues = z.infer<typeof visitSchema>;

export const paymentSchema = z.object({
  visit_id: z.number(),
  invoice_id: z.number(),
  amount: z.number().nonnegative('Amount must be positive'),
  payment_mode: z.enum(['Cash', 'UPI', 'Card'], {
    message: 'Payment method is required',
  }),
  transaction_reference: z.string().optional(),
  payment_status: z.enum(['Pending', 'Paid', 'Refund']).default('Paid'),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

export const treatmentSchema = z.object({
  patient_id: z.number({ message: 'Please select a patient' }).min(1, 'Please select a patient'),
  diagnosis_name: z.string().min(1, 'Diagnosis name is required'),
  diagnosis_type: z.enum(['Hair Diagnosis', 'Skin Diagnosis', 'Both Hair & Skin'], {
    message: 'Please select a diagnosis type',
  }),
  treatment_amount: z
    .number({ message: 'Treatment amount must be a number' })
    .positive('Treatment amount must be a positive number greater than 0'),
  payment_mode: z.enum(['Cash', 'UPI', 'Debit/Credit Card'], {
    message: 'Please select a payment mode',
  }),
});

export type TreatmentFormValues = z.infer<typeof treatmentSchema>;

