export type Gender = 'Male' | 'Female' | 'Other';

export type VisitStatus =
  | 'Created'
  | 'Waiting'
  | 'In Progress'
  | 'Prescribed'
  | 'Sent to Pharmacy'
  | 'Dispensed'
  | 'Closed'
  | 'Cancelled';

export type PaymentMode = 'Cash' | 'UPI' | 'Card';

export type PaymentStatus = 'Pending' | 'Paid' | 'Refund';

export interface Patient {
  id: number;
  patient_code: string;
  first_name: string;
  last_name: string | null;
  gender: Gender;
  dob: string | null;
  age: number | null;
  blood_group: string | null;
  phone: string;
  email: string | null;
  emergency_contact: string | null;
  occupation: string | null;
  allergies: string | null;
  medical_history: string | null;
  created_at: string;
  updated_at: string;
  addresses?: PatientAddress[];
}

export interface PatientAddress {
  id: number;
  patient_id: number;
  address_line: string;
  city: string;
  district: string | null;
  state: string;
  country: string;
  pincode: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: number;
  department_name: string;
}

export interface Doctor {
  id: number;
  user_id: string;
  department_id: number | null;
  qualification: string | null;
  consultation_fee: number;
  profiles?: {
    full_name: string;
    email: string | null;
    phone: string | null;
  };
  departments?: {
    department_name: string;
  };
}

export interface Visit {
  id: number;
  visit_number: string;
  patient_id: number;
  doctor_id: number;
  visit_date: string;
  token_no: number;
  chief_complaint: string | null;
  status: VisitStatus;
  created_at: string;
  updated_at: string;
  patients?: Patient;
  doctors?: Doctor;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  visit_id: number | null;
  patient_id: number | null;
  total_amount: number;
  discount: number;
  tax: number;
  final_amount: number;
  paid_amount: number;
  status: 'Unpaid' | 'Paid' | 'Partially Paid';
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_mode: PaymentMode;
  payment_status: PaymentStatus;
  transaction_reference: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}
