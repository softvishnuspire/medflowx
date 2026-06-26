import { 
  Gender, 
  VisitStatus, 
  PaymentMode, 
  PaymentStatus, 
  Patient, 
  PatientAddress, 
  Department, 
  Doctor, 
  Visit, 
  Invoice, 
  Payment 
} from './reception';

export interface Role {
  id: number;
  role_name: string;
  description: string | null;
}

export interface StaffUser {
  id: string; // UUID
  role_id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles?: Role;
  doctors?: {
    id: number;
    department_id: number | null;
    qualification: string | null;
    consultation_fee: number;
    departments?: Department;
  } | null;
}

export interface AdminDashboardStats {
  totalPatients: number;
  todayPatients: number;
  todayVisits: number;
  waitingVisits: number;
  completedVisits: number;
  todayRevenue: number;
  monthlyRevenue: number;
  totalDoctors: number;
  totalReceptionists: number;
  totalPharmacyUsers: number;
}

export interface RecentActivityItem {
  id: string;
  type: 'payment' | 'registration' | 'visit';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  status?: string;
}

export interface AuditLog {
  id: number;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  device: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
  } | null;
}

// Report Types
export interface DailyRevenueReport {
  date: string;
  amount: number;
  count: number;
}

export interface MonthlyRevenueReport {
  month: string;
  amount: number;
  count: number;
}

export interface PatientCountReport {
  date: string;
  count: number;
}

export interface VisitCountReport {
  date: string;
  count: number;
}

export interface DoctorVisitsReport {
  doctorName: string;
  departmentName: string;
  visitCount: number;
  revenue: number;
}

export interface PaymentSummaryReport {
  method: string;
  count: number;
  amount: number;
}

export interface ClinicReportData {
  dailyRevenue: DailyRevenueReport[];
  monthlyRevenue: MonthlyRevenueReport[];
  patientCount: PatientCountReport[];
  visitCount: VisitCountReport[];
  doctorVisits: DoctorVisitsReport[];
  paymentSummary: PaymentSummaryReport[];
}
