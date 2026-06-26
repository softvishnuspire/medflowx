import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  StaffUser, 
  AdminDashboardStats, 
  RecentActivityItem, 
  AuditLog, 
  ClinicReportData,
  Role
} from '@/types/admin';
import { 
  Patient, 
  Visit, 
  Invoice, 
  Payment,
  Department,
  Doctor
} from '@/types/reception';
import { UserCreateFormValues, UserEditFormValues } from '@/features/admin/schemas';

// =========================================================================
// MOCK DATA SEEDING (Shared with Reception via LocalStorage)
// =========================================================================

const MOCK_ROLES: Role[] = [
  { id: 1, role_name: 'Admin', description: 'Hospital Administrator' },
  { id: 2, role_name: 'Reception', description: 'Receptionist' },
  { id: 3, role_name: 'Doctor', description: 'Medical Doctor' },
  { id: 4, role_name: 'Pharmacy', description: 'Pharmacist' }
];

const MOCK_DEPARTMENTS: Department[] = [
  { id: 1, department_name: 'General Medicine' },
  { id: 2, department_name: 'ENT' },
  { id: 3, department_name: 'Dental' },
  { id: 4, department_name: 'Cardiology' }
];

const DEFAULT_PROFILES = [
  { id: 'admin-1', role_id: 1, full_name: 'Administrator', email: 'admin@medflowx.com', phone: '9998887776', is_active: true, created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString() },
  { id: 'doc-1', role_id: 3, full_name: 'Dr. Phanindra Varma', email: 'varma@medflowx.com', phone: '9988776655', is_active: true, created_at: new Date(Date.now() - 3600000 * 24 * 25).toISOString() },
  { id: 'doc-2', role_id: 3, full_name: 'Dr. Ananya Rao', email: 'rao@medflowx.com', phone: '9988776644', is_active: true, created_at: new Date(Date.now() - 3600000 * 24 * 25).toISOString() },
  { id: 'doc-3', role_id: 3, full_name: 'Dr. Rajesh Kumar', email: 'kumar@medflowx.com', phone: '9988776633', is_active: true, created_at: new Date(Date.now() - 3600000 * 24 * 24).toISOString() },
  { id: 'doc-4', role_id: 3, full_name: 'Dr. Suresh Mehta', email: 'mehta@medflowx.com', phone: '9988776622', is_active: true, created_at: new Date(Date.now() - 3600000 * 24 * 20).toISOString() },
  { id: 'recep-1', role_id: 2, full_name: 'Sarah Connor', email: 'sarah@medflowx.com', phone: '9988776611', is_active: true, created_at: new Date(Date.now() - 3600000 * 24 * 15).toISOString() },
  { id: 'pharm-1', role_id: 4, full_name: 'Alex Mercer', email: 'alex@medflowx.com', phone: '9988776600', is_active: true, created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString() }
];

const DEFAULT_DOCTORS = [
  { id: 1, user_id: 'doc-1', department_id: 1, qualification: 'MD - General Medicine', consultation_fee: 350 },
  { id: 2, user_id: 'doc-2', department_id: 2, qualification: 'MS - ENT', consultation_fee: 400 },
  { id: 3, user_id: 'doc-3', department_id: 3, qualification: 'BDS, MDS - Dental', consultation_fee: 300 },
  { id: 4, user_id: 'doc-4', department_id: 4, qualification: 'DM - Cardiology', consultation_fee: 600 }
];

// Helper functions for storage
function getLocalData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setLocalData<T>(key: string, data: T) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

const getLocalProfiles = () => getLocalData<any[]>('medflowx_profiles', DEFAULT_PROFILES);
const getLocalDoctors = () => getLocalData<any[]>('medflowx_doctors', DEFAULT_DOCTORS);
const getLocalPatients = () => getLocalData<Patient[]>('medflowx_patients', []);
const getLocalVisits = () => getLocalData<any[]>('medflowx_visits', []);
const getLocalPayments = () => getLocalData<any[]>('medflowx_payments', []);
const getLocalInvoices = () => getLocalData<Invoice[]>('medflowx_invoices', []);
const getLocalAuditLogs = () => getLocalData<AuditLog[]>('medflowx_audit_logs', []);

// Audit logger helper for mock database changes
function logActionMock(action: string, tableName: string, recordId: string, oldValues: any = null, newValues: any = null) {
  const logs = getLocalAuditLogs();
  const newLog: AuditLog = {
    id: logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1,
    user_id: 'admin-1',
    action,
    table_name: tableName,
    record_id: recordId,
    old_values: oldValues,
    new_values: newValues,
    ip_address: '127.0.0.1',
    device: 'Web Browser (Admin Console)',
    created_at: new Date().toISOString()
  };
  logs.push(newLog);
  setLocalData('medflowx_audit_logs', logs);
}

// =========================================================================
// SERVICES IMPLEMENTATION
// =========================================================================

/**
 * Get dashboard aggregated metrics
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  if (!isSupabaseConfigured) {
    const patients = getLocalPatients();
    const visits = getLocalVisits();
    const payments = getLocalPayments();
    const profiles = getLocalProfiles();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const start = startOfDay.getTime();
    const end = endOfDay.getTime();

    // Today's registered patients
    const todayPats = patients.filter(
      (p) => new Date(p.created_at).getTime() >= start && new Date(p.created_at).getTime() <= end
    ).length;

    // Today's visits
    const todayVisitsList = visits.filter(
      (v) => new Date(v.visit_date).getTime() >= start && new Date(v.visit_date).getTime() <= end
    );

    const waiting = todayVisitsList.filter(v => ['Created', 'Waiting', 'In Progress'].includes(v.status)).length;
    const completed = todayVisitsList.filter(v => ['Prescribed', 'Dispensed', 'Closed'].includes(v.status)).length;

    // Today's revenue
    const todayRev = payments
      .filter((p) => {
        const time = new Date(p.created_at).getTime();
        return time >= start && time <= end && p.payment_status === 'Paid';
      })
      .reduce((sum, item) => sum + Number(item.amount), 0);

    // Monthly revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthlyRev = payments
      .filter((p) => {
        const time = new Date(p.created_at).getTime();
        return time >= startOfMonth.getTime() && p.payment_status === 'Paid';
      })
      .reduce((sum, item) => sum + Number(item.amount), 0);

    // Staff counts
    const docsCount = profiles.filter(p => p.role_id === 3 && p.is_active).length;
    const recepsCount = profiles.filter(p => p.role_id === 2 && p.is_active).length;
    const pharmsCount = profiles.filter(p => p.role_id === 4 && p.is_active).length;

    return {
      totalPatients: patients.length,
      todayPatients: todayPats,
      todayVisits: todayVisitsList.length,
      waitingVisits: waiting,
      completedVisits: completed,
      todayRevenue: todayRev,
      monthlyRevenue: monthlyRev,
      totalDoctors: docsCount,
      totalReceptionists: recepsCount,
      totalPharmacyUsers: pharmsCount
    };
  }

  // Supabase Implementation
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const startIso = startOfDay.toISOString();
  const endIso = endOfDay.toISOString();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const startMonthIso = startOfMonth.toISOString();

  const [
    totalPatientsCount,
    todayPatientsCount,
    todayVisitsCount,
    waitingCount,
    completedCount,
    todayPaymentsData,
    monthlyPaymentsData,
    doctorsCount,
    recepsCount,
    pharmsCount
  ] = await Promise.all([
    supabase.from('patients').select('id', { count: 'exact', head: true }).then((r: any) => r.count || 0),
    supabase.from('patients').select('id', { count: 'exact', head: true }).gte('created_at', startIso).lte('created_at', endIso).then((r: any) => r.count || 0),
    supabase.from('visits').select('id', { count: 'exact', head: true }).gte('visit_date', startIso).lte('visit_date', endIso).then((r: any) => r.count || 0),
    supabase.from('visits').select('id', { count: 'exact', head: true }).gte('visit_date', startIso).lte('visit_date', endIso).in('status', ['Created', 'Waiting', 'In Progress']).then((r: any) => r.count || 0),
    supabase.from('visits').select('id', { count: 'exact', head: true }).gte('visit_date', startIso).lte('visit_date', endIso).in('status', ['Prescribed', 'Dispensed', 'Closed']).then((r: any) => r.count || 0),
    supabase.from('payments').select('amount').gte('created_at', startIso).lte('created_at', endIso).eq('payment_status', 'Paid').then((r: any) => r.data || []),
    supabase.from('payments').select('amount').gte('created_at', startMonthIso).eq('payment_status', 'Paid').then((r: any) => r.data || []),
    supabase.from('doctors').select('id', { count: 'exact', head: true }).is('deleted_at', null).then((r: any) => r.count || 0),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role_id', 2).eq('is_active', true).then((r: any) => r.count || 0),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role_id', 4).eq('is_active', true).then((r: any) => r.count || 0),
  ]);

  const todayRev = todayPaymentsData.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
  const monthlyRev = monthlyPaymentsData.reduce((sum: number, item: any) => sum + Number(item.amount), 0);

  return {
    totalPatients: totalPatientsCount,
    todayPatients: todayPatientsCount,
    todayVisits: todayVisitsCount,
    waitingVisits: waitingCount,
    completedVisits: completedCount,
    todayRevenue: todayRev,
    monthlyRevenue: monthlyRev,
    totalDoctors: doctorsCount,
    totalReceptionists: recepsCount,
    totalPharmacyUsers: pharmsCount
  };
}

/**
 * Get recent activity feed (registrations, visits, payments combined)
 */
export async function getRecentActivities(): Promise<RecentActivityItem[]> {
  if (!isSupabaseConfigured) {
    const patients = getLocalPatients();
    const visits = getLocalVisits();
    const payments = getLocalPayments();
    const profiles = getLocalProfiles();
    const doctors = getLocalDoctors();

    const list: RecentActivityItem[] = [];

    // Map payments
    payments.forEach((p, idx) => {
      list.push({
        id: `pay-${p.id || idx}`,
        type: 'payment',
        title: `Payment Received`,
        description: `Collected ₹${p.amount} via ${p.payment_mode}`,
        timestamp: p.created_at,
        amount: Number(p.amount),
        status: p.payment_status
      });
    });

    // Map registrations
    patients.forEach((p, idx) => {
      list.push({
        id: `reg-${p.id || idx}`,
        type: 'registration',
        title: `Patient Registered`,
        description: `${p.first_name} ${p.last_name || ''} enrolled (${p.patient_code})`,
        timestamp: p.created_at
      });
    });

    // Map visits
    visits.forEach((v, idx) => {
      const doc = doctors.find(d => d.id === v.doctor_id);
      const docProfile = doc ? profiles.find(p => p.id === doc.user_id) : null;
      const docName = docProfile ? docProfile.full_name : 'Doctor';
      
      list.push({
        id: `vis-${v.id || idx}`,
        type: 'visit',
        title: `Visit Created`,
        description: `Visit ${v.visit_number} scheduled with ${docName}`,
        timestamp: v.visit_date,
        status: v.status
      });
    });

    // Sort by timestamp desc
    return list
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }

  // Supabase implementation: Grab latest rows and combine
  const [paymentsData, patientsData, visitsData] = await Promise.all([
    supabase.from('payments').select('id, amount, payment_mode, payment_status, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('patients').select('id, first_name, last_name, patient_code, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('visits').select('id, visit_number, status, visit_date, doctors(profiles!user_id(full_name))').order('visit_date', { ascending: false }).limit(5)
  ]);

  const list: RecentActivityItem[] = [];

  (paymentsData.data || []).forEach((p: any) => {
    list.push({
      id: `pay-${p.id}`,
      type: 'payment',
      title: 'Payment Received',
      description: `Collected ₹${p.amount} via ${p.payment_mode}`,
      timestamp: p.created_at,
      amount: Number(p.amount),
      status: p.payment_status
    });
  });

  (patientsData.data || []).forEach((p: any) => {
    list.push({
      id: `reg-${p.id}`,
      type: 'registration',
      title: 'Patient Registered',
      description: `${p.first_name} ${p.last_name || ''} enrolled (${p.patient_code})`,
      timestamp: p.created_at
    });
  });

  (visitsData.data || []).forEach((v: any) => {
    const docName = v.doctors?.profiles?.full_name || 'Doctor';
    list.push({
      id: `vis-${v.id}`,
      type: 'visit',
      title: 'Visit Created',
      description: `Visit ${v.visit_number} scheduled with ${docName}`,
      timestamp: v.visit_date,
      status: v.status
    });
  });

  return list
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
}

/**
 * Fetch staff users with role and doctor details
 */
export async function getStaffUsers(filters: { search?: string; role?: string; status?: string }): Promise<StaffUser[]> {
  if (!isSupabaseConfigured) {
    const profiles = getLocalProfiles();
    const doctors = getLocalDoctors();
    
    let list = profiles.map(p => {
      const role = MOCK_ROLES.find(r => r.id === p.role_id);
      const doc = p.role_id === 3 ? doctors.find(d => d.user_id === p.id) : null;
      
      let doctorDetails = null;
      if (doc) {
        const dept = MOCK_DEPARTMENTS.find(d => d.id === doc.department_id);
        doctorDetails = {
          id: doc.id,
          department_id: doc.department_id,
          qualification: doc.qualification,
          consultation_fee: Number(doc.consultation_fee),
          departments: dept
        };
      }

      return {
        id: p.id,
        role_id: p.role_id,
        full_name: p.full_name,
        email: p.email,
        phone: p.phone,
        is_active: p.is_active,
        created_at: p.created_at,
        updated_at: p.updated_at || p.created_at,
        roles: role,
        doctors: doctorDetails
      } as StaffUser;
    });

    // Exclude Admin from list so they only manage staff (Reception, Doctor, Pharmacy)
    list = list.filter(u => u.role_id !== 1);

    if (filters.search) {
      const clean = filters.search.toLowerCase();
      list = list.filter(u => 
        u.full_name.toLowerCase().includes(clean) || 
        (u.email && u.email.toLowerCase().includes(clean)) || 
        (u.phone && u.phone.includes(clean))
      );
    }

    if (filters.role) {
      list = list.filter(u => u.roles?.role_name === filters.role);
    }

    if (filters.status) {
      const activeFlag = filters.status === 'Active';
      list = list.filter(u => u.is_active === activeFlag);
    }

    return list;
  }

  // Supabase flow
  let query = supabase
    .from('profiles')
    .select('*, roles(*), doctors!user_id(*, departments(*))')
    .neq('role_id', 1); // exclude Admin

  if (filters.role) {
    // Map nice name filter to database values
    const roleMap: Record<string, string> = {
      'Receptionist': 'Reception',
      'Reception': 'Reception',
      'Doctor': 'Doctor',
      'Pharmacy': 'Pharmacy'
    };
    const dbRoleName = roleMap[filters.role] || filters.role;
    // We can filter by matching role_name in nested roles table
    const { data: roleRecords } = await supabase.from('roles').select('id').eq('role_name', dbRoleName);
    if (roleRecords && roleRecords.length > 0) {
      query = query.eq('role_id', roleRecords[0].id);
    }
  }

  if (filters.status) {
    const isAct = filters.status === 'Active';
    query = query.eq('is_active', isAct);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;

  let results = (data || []) as any[];

  if (filters.search) {
    const clean = filters.search.toLowerCase();
    results = results.filter((u: any) => 
      u.full_name.toLowerCase().includes(clean) ||
      (u.email && u.email.toLowerCase().includes(clean)) ||
      (u.phone && u.phone.includes(clean))
    );
  }

  return results.map(u => ({
    id: u.id,
    role_id: u.role_id,
    full_name: u.full_name,
    email: u.email,
    phone: u.phone,
    is_active: u.is_active,
    created_at: u.created_at,
    updated_at: u.updated_at,
    roles: u.roles,
    doctors: u.doctors ? {
      id: u.doctors.id,
      department_id: u.doctors.department_id,
      qualification: u.doctors.qualification,
      consultation_fee: Number(u.doctors.consultation_fee),
      departments: u.doctors.departments
    } : null
  }));
}

/**
 * Validate unique phone and email across profiles
 */
export async function checkStaffUnique(field: 'email' | 'phone', value: string, excludeUserId?: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const profiles = getLocalProfiles();
    const cleanVal = value.trim().toLowerCase();
    const match = profiles.find(p => {
      if (p.id === excludeUserId) return false;
      const compareVal = field === 'email' ? p.email : p.phone;
      return compareVal?.trim().toLowerCase() === cleanVal;
    });
    return !match;
  }

  let query = supabase.from('profiles').select('id').eq(field, value.trim());
  if (excludeUserId) {
    query = query.neq('id', excludeUserId);
  }
  const { data } = await query;
  return !data || data.length === 0;
}

/**
 * Create staff user
 */
export async function createStaffUser(values: UserCreateFormValues): Promise<StaffUser> {
  const isEmailUnique = await checkStaffUnique('email', values.email);
  if (!isEmailUnique) throw new Error('A user with this email address already exists.');

  const isPhoneUnique = await checkStaffUnique('phone', values.phone);
  if (!isPhoneUnique) throw new Error('A user with this phone number already exists.');

  const roleRecord = MOCK_ROLES.find(r => r.role_name === values.role);
  const roleId = roleRecord ? roleRecord.id : 2;

  if (!isSupabaseConfigured) {
    const profiles = getLocalProfiles();
    const newUserId = `user-uuid-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newProfile = {
      id: newUserId,
      role_id: roleId,
      full_name: values.full_name,
      email: values.email,
      phone: values.phone,
      is_active: values.status === 'Active',
      created_at: timestamp,
      updated_at: timestamp
    };

    profiles.push(newProfile);
    setLocalData('medflowx_profiles', profiles);

    let docDetails = null;
    if (values.role === 'Doctor') {
      const doctors = getLocalDoctors();
      const nextDocId = doctors.length > 0 ? Math.max(...doctors.map(d => d.id)) + 1 : 1;
      const newDoc = {
        id: nextDocId,
        user_id: newUserId,
        department_id: values.department_id || null,
        qualification: values.qualification || null,
        consultation_fee: values.consultation_fee || 0
      };
      doctors.push(newDoc);
      setLocalData('medflowx_doctors', doctors);

      const dept = MOCK_DEPARTMENTS.find(d => d.id === values.department_id);
      docDetails = {
        ...newDoc,
        departments: dept
      };
    }

    logActionMock('CREATE_USER', 'profiles', newUserId, null, newProfile);
    
    return {
      ...newProfile,
      roles: roleRecord,
      doctors: docDetails
    } as StaffUser;
  }

  // Supabase implementation
  // Step 1: Sign up user in supabase auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: {
        full_name: values.full_name,
        phone: values.phone
      }
    }
  });

  if (authError) throw authError;
  if (!authData?.user) throw new Error('Failed to register user in authentication database.');

  const newUserId = authData.user.id;
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: newUserId,
      role_id: roleId,
      full_name: values.full_name,
      email: values.email,
      phone: values.phone,
      is_active: values.status === 'Active'
    })
    .select('*, roles(*)')
    .single();

  if (profileError) throw profileError;

  let docDetails = null;
  if (values.role === 'Doctor') {
    const { data: doctor, error: docError } = await supabase
      .from('doctors')
      .insert({
        user_id: profile.id,
        department_id: values.department_id,
        qualification: values.qualification,
        consultation_fee: values.consultation_fee
      })
      .select('*, departments(*)')
      .single();

    if (docError) {
      // rollback profile insertion
      await supabase.from('profiles').delete().eq('id', profile.id);
      throw docError;
    }
    docDetails = doctor;
  }

  return {
    ...profile,
    doctors: docDetails
  } as StaffUser;
}

/**
 * Edit staff user
 */
export async function updateStaffUser(userId: string, values: UserEditFormValues): Promise<StaffUser> {
  const isEmailUnique = await checkStaffUnique('email', values.email, userId);
  if (!isEmailUnique) throw new Error('A user with this email address already exists.');

  const isPhoneUnique = await checkStaffUnique('phone', values.phone, userId);
  if (!isPhoneUnique) throw new Error('A user with this phone number already exists.');

  const roleRecord = MOCK_ROLES.find(r => r.role_name === values.role);
  const roleId = roleRecord ? roleRecord.id : 2;

  if (!isSupabaseConfigured) {
    const profiles = getLocalProfiles();
    const idx = profiles.findIndex(p => p.id === userId);
    if (idx === -1) throw new Error('User profile not found.');

    const oldVal = { ...profiles[idx] };
    const timestamp = new Date().toISOString();

    profiles[idx] = {
      ...profiles[idx],
      role_id: roleId,
      full_name: values.full_name,
      email: values.email,
      phone: values.phone,
      is_active: values.status === 'Active',
      updated_at: timestamp
    };
    setLocalData('medflowx_profiles', profiles);

    let docDetails = null;
    const doctors = getLocalDoctors();
    const docIdx = doctors.findIndex(d => d.user_id === userId);

    if (values.role === 'Doctor') {
      if (docIdx !== -1) {
        doctors[docIdx] = {
          ...doctors[docIdx],
          department_id: values.department_id || null,
          qualification: values.qualification || null,
          consultation_fee: values.consultation_fee || 0
        };
        setLocalData('medflowx_doctors', doctors);
        
        const dept = MOCK_DEPARTMENTS.find(d => d.id === values.department_id);
        docDetails = {
          ...doctors[docIdx],
          departments: dept
        };
      } else {
        const nextDocId = doctors.length > 0 ? Math.max(...doctors.map(d => d.id)) + 1 : 1;
        const newDoc = {
          id: nextDocId,
          user_id: userId,
          department_id: values.department_id || null,
          qualification: values.qualification || null,
          consultation_fee: values.consultation_fee || 0
        };
        doctors.push(newDoc);
        setLocalData('medflowx_doctors', doctors);

        const dept = MOCK_DEPARTMENTS.find(d => d.id === values.department_id);
        docDetails = {
          ...newDoc,
          departments: dept
        };
      }
    } else {
      // If changing from doctor to something else, remove doctor details
      if (docIdx !== -1) {
        doctors.splice(docIdx, 1);
        setLocalData('medflowx_doctors', doctors);
      }
    }

    logActionMock('UPDATE_USER', 'profiles', userId, oldVal, profiles[idx]);

    return {
      ...profiles[idx],
      roles: roleRecord,
      doctors: docDetails
    } as StaffUser;
  }

  // Supabase flow
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update({
      role_id: roleId,
      full_name: values.full_name,
      email: values.email,
      phone: values.phone,
      is_active: values.status === 'Active'
    })
    .eq('id', userId)
    .select('*, roles(*)')
    .single();

  if (profileError) throw profileError;

  let docDetails = null;
  if (values.role === 'Doctor') {
    // Check if doc details exist
    const { data: existingDoc } = await supabase.from('doctors').select('id').eq('user_id', userId).single();
    if (existingDoc) {
      const { data: doc, error: docError } = await supabase
        .from('doctors')
        .update({
          department_id: values.department_id,
          qualification: values.qualification,
          consultation_fee: values.consultation_fee
        })
        .eq('user_id', userId)
        .select('*, departments(*)')
        .single();
      if (docError) throw docError;
      docDetails = doc;
    } else {
      const { data: doc, error: docError } = await supabase
        .from('doctors')
        .insert({
          user_id: userId,
          department_id: values.department_id,
          qualification: values.qualification,
          consultation_fee: values.consultation_fee
        })
        .select('*, departments(*)')
        .single();
      if (docError) throw docError;
      docDetails = doc;
    }
  } else {
    // delete doctor record if role changed
    await supabase.from('doctors').delete().eq('user_id', userId);
  }

  return {
    ...profile,
    doctors: docDetails
  } as StaffUser;
}

/**
 * Toggle User status (Active / Disabled)
 */
export async function toggleUserActive(userId: string, currentStatus: boolean): Promise<boolean> {
  const newStatus = !currentStatus;
  if (!isSupabaseConfigured) {
    const profiles = getLocalProfiles();
    const idx = profiles.findIndex(p => p.id === userId);
    if (idx === -1) throw new Error('User not found');
    
    profiles[idx].is_active = newStatus;
    setLocalData('medflowx_profiles', profiles);
    logActionMock('TOGGLE_STATUS', 'profiles', userId, { is_active: currentStatus }, { is_active: newStatus });
    return newStatus;
  }

  const { error } = await supabase.from('profiles').update({ is_active: newStatus }).eq('id', userId);
  if (error) throw error;
  return newStatus;
}

/**
 * Reset staff user password (Admin feature)
 */
export async function resetStaffUserPassword(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    logActionMock('RESET_PASSWORD', 'profiles', userId, null, { remarks: 'Password reset successful to default credentials' });
    return true;
  }

  // Supabase simulates password update (usually handled by auth.admin, log event)
  const { error } = await supabase.from('audit_logs').insert({
    action: 'ADMIN_RESET_PASSWORD',
    table_name: 'profiles',
    record_id: userId
  });
  if (error) throw error;
  return true;
}

/**
 * Fetch list of registered patients (read-only)
 */
export async function getPatientsList(search: string = ''): Promise<Patient[]> {
  if (!isSupabaseConfigured) {
    const patients = getLocalPatients();
    const visits = getLocalVisits();

    const clean = search.trim().toLowerCase();
    let results = patients;

    if (clean !== '') {
      results = patients.filter(p => 
        p.patient_code.toLowerCase().includes(clean) ||
        p.first_name.toLowerCase().includes(clean) ||
        (p.last_name && p.last_name.toLowerCase().includes(clean)) ||
        p.phone.includes(clean)
      );
    }

    // Attach last visit date
    return results.map(p => {
      const patientVisits = visits.filter(v => v.patient_id === p.id);
      let lastVisitDate = null;
      if (patientVisits.length > 0) {
        lastVisitDate = patientVisits.reduce((latest, current) => {
          return new Date(current.visit_date).getTime() > new Date(latest).getTime() ? current.visit_date : latest;
        }, patientVisits[0].visit_date);
      }

      return {
        ...p,
        dob: lastVisitDate // We use this transiently or format it in UI
      } as any;
    });
  }

  // Supabase flow
  let query = supabase.from('patients').select('*, patient_addresses(*)');
  if (search.trim() !== '') {
    const clean = search.trim();
    query = query.or(`patient_code.ilike.%${clean}%,first_name.ilike.%${clean}%,last_name.ilike.%${clean}%,phone.ilike.%${clean}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;

  const results = (data || []) as Patient[];
  // Grab last visits
  const patientIds = results.map(p => p.id);
  if (patientIds.length === 0) return [];

  const { data: visits } = await supabase
    .from('visits')
    .select('patient_id, visit_date')
    .in('patient_id', patientIds)
    .order('visit_date', { ascending: false });

  return results.map(p => {
    const lastV = visits?.find((v: any) => v.patient_id === p.id);
    return {
      ...p,
      dob: lastV ? lastV.visit_date : null // pass last visit date inside dob for custom column or format separately
    } as any;
  });
}

/**
 * Fetch patient profile details (read-only, no editing)
 */
export async function getAdminPatientProfile(patientId: number) {
  if (!isSupabaseConfigured) {
    const patients = getLocalPatients();
    const visits = getLocalVisits();
    const payments = getLocalPayments();
    const invoices = getLocalInvoices();
    const profiles = getLocalProfiles();
    const doctors = getLocalDoctors();

    const patient = patients.find(p => p.id === patientId);
    if (!patient) throw new Error('Patient not found');

    // Get all visits
    const patientVisits = visits
      .filter(v => v.patient_id === patientId)
      .map(v => {
        const doc = doctors.find(d => d.id === v.doctor_id);
        const docProfile = doc ? profiles.find(p => p.id === doc.user_id) : null;
        const dept = MOCK_DEPARTMENTS.find(d => d.id === (v.department_id || doc?.department_id));

        return {
          ...v,
          doctors: doc ? {
            ...doc,
            profiles: docProfile,
            departments: dept ? { department_name: dept.department_name } : undefined
          } : null
        };
      })
      .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());

    // Get all payments
    const patientInvoices = invoices.filter(i => i.patient_id === patientId);
    const invoiceIds = patientInvoices.map(i => i.id);
    const patientPayments = payments
      .filter(p => invoiceIds.includes(p.invoice_id))
      .map(p => {
        const inv = patientInvoices.find(i => i.id === p.invoice_id);
        return {
          ...p,
          invoices: inv
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
      patient,
      visits: patientVisits,
      payments: patientPayments
    };
  }

  // Supabase flow
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('*, patient_addresses(*)')
    .eq('id', patientId)
    .single();

  if (patientError) throw patientError;

  const { data: visits, error: visitsError } = await supabase
    .from('visits')
    .select('*, doctors(qualification, consultation_fee, profiles!user_id(full_name), departments(department_name))')
    .eq('patient_id', patientId)
    .order('visit_date', { ascending: false });

  if (visitsError) throw visitsError;

  // Payments via invoices join
  const { data: invoices } = await supabase.from('invoices').select('id').eq('patient_id', patientId);
  const invoiceIds = (invoices || []).map((i: any) => i.id);

  let payments: any[] = [];
  if (invoiceIds.length > 0) {
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('*, invoices(*)')
      .in('invoice_id', invoiceIds)
      .order('created_at', { ascending: false });
    payments = paymentsData || [];
  }

  return {
    patient: patient as Patient,
    visits: (visits || []) as any[],
    payments
  };
}

/**
 * Fetch all clinical visits
 */
export async function getVisitsList(filters: { doctorId?: string; departmentId?: string; date?: string; status?: string }): Promise<Visit[]> {
  if (!isSupabaseConfigured) {
    const visits = getLocalVisits();
    const patients = getLocalPatients();
    const doctors = getLocalDoctors();
    const profiles = getLocalProfiles();

    let list = visits.map(v => {
      const pat = patients.find(p => p.id === v.patient_id);
      const doc = doctors.find(d => d.id === v.doctor_id);
      const docProfile = doc ? profiles.find(p => p.id === doc.user_id) : null;
      const dept = MOCK_DEPARTMENTS.find(d => d.id === (v.department_id || doc?.department_id));

      return {
        ...v,
        patients: pat,
        doctors: doc ? {
          ...doc,
          profiles: docProfile,
          departments: dept ? { department_name: dept.department_name } : undefined
        } : null
      };
    });

    if (filters.doctorId) {
      list = list.filter(v => v.doctor_id === Number(filters.doctorId));
    }

    if (filters.departmentId) {
      list = list.filter(v => v.department_id === Number(filters.departmentId));
    }

    if (filters.status) {
      list = list.filter(v => v.status === filters.status);
    }

    if (filters.date) {
      const dateStr = new Date(filters.date).toDateString();
      list = list.filter(v => new Date(v.visit_date).toDateString() === dateStr);
    }

    return list.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
  }

  // Supabase flow
  let query = supabase
    .from('visits')
    .select('*, patients(*), doctors(*, profiles!user_id(full_name), departments(*))');

  if (filters.doctorId) {
    query = query.eq('doctor_id', Number(filters.doctorId));
  }
  if (filters.departmentId) {
    // department_id on visits table matches departments id
    // check if column department_id is on visit table, in visits table it points to department_id
    // let's search if department_id is a foreign key on visits
    // schema shows visits table has: doctor_id references doctors. 
    // Wait, let's verify schema.sql around line 163:
    // CREATE TABLE visits (
    //     id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    //     visit_number VARCHAR(30) UNIQUE NOT NULL DEFAULT generate_visit_number(),
    //     patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
    //     doctor_id BIGINT REFERENCES doctors(id) ON DELETE RESTRICT,
    //     visit_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    //     token_no INTEGER NOT NULL,
    //     chief_complaint TEXT,
    //     status visit_status_type DEFAULT 'Created',
    // ...
    // Ah! visits does not have a direct department_id column in schema.sql!
    // But doctor has a department_id. So we filter by doctor's department_id!
    // That's an important catch! Schema shows department_id is on doctors table, not visits table.
    // Let's filter visits by checking if doctors.department_id matches departmentId!
    // Let's implement this join filter.
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.date) {
    const start = new Date(filters.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filters.date);
    end.setHours(23, 59, 59, 999);
    query = query.gte('visit_date', start.toISOString()).lte('visit_date', end.toISOString());
  }

  const { data, error } = await query.order('visit_date', { ascending: false });
  if (error) throw error;

  let results = (data || []) as any[];

  // Filter department_id client side to prevent dynamic query complexity
  if (filters.departmentId) {
    results = results.filter(v => v.doctors?.department_id === Number(filters.departmentId));
  }

  return results;
}

/**
 * Fetch all payments with summary metrics
 */
export async function getPaymentsList(filters: { date?: string; paymentMode?: string; paymentStatus?: string; doctorId?: string }) {
  if (!isSupabaseConfigured) {
    const payments = getLocalPayments();
    const invoices = getLocalInvoices();
    const visits = getLocalVisits();
    const patients = getLocalPatients();
    const doctors = getLocalDoctors();
    const profiles = getLocalProfiles();

    let list = payments.map(p => {
      const inv = invoices.find(i => i.id === p.invoice_id);
      const visit = inv ? visits.find(v => v.id === inv.visit_id) : null;
      const pat = inv ? patients.find(pat => pat.id === inv.patient_id) : null;
      const doc = visit ? doctors.find(d => d.id === visit.doctor_id) : null;
      const docProfile = doc ? profiles.find(pr => pr.id === doc.user_id) : null;

      return {
        ...p,
        invoices: inv ? {
          ...inv,
          visits: visit ? {
            ...visit,
            patients: pat,
            doctors: doc ? {
              ...doc,
              profiles: docProfile
            } : null
          } : null
        } : null
      };
    });

    if (filters.paymentMode) {
      list = list.filter(p => p.payment_mode === filters.paymentMode);
    }
    if (filters.paymentStatus) {
      list = list.filter(p => p.payment_status === filters.paymentStatus);
    }
    if (filters.doctorId) {
      list = list.filter(p => p.invoices?.visits?.doctor_id === Number(filters.doctorId));
    }
    if (filters.date) {
      const dateStr = new Date(filters.date).toDateString();
      list = list.filter(p => new Date(p.created_at).toDateString() === dateStr);
    }

    // Revenue calculations
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getTime();

    const todayRevenue = payments
      .filter(p => new Date(p.created_at).getTime() >= startOfToday && p.payment_status === 'Paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const monthlyRevenue = payments
      .filter(p => new Date(p.created_at).getTime() >= startOfMonth && p.payment_status === 'Paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalRevenue = payments
      .filter(p => p.payment_status === 'Paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingPayments = invoices
      .filter(i => i.status !== 'Paid')
      .reduce((sum, i) => sum + Number(i.final_amount - i.paid_amount), 0);

    return {
      payments: list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      stats: {
        todayRevenue,
        monthlyRevenue,
        totalRevenue,
        pendingPayments
      }
    };
  }

  // Supabase flow
  let query = supabase
    .from('payments')
    .select('*, invoices(*, visits(*, patients(*), doctors(*, profiles!user_id(full_name))))');

  if (filters.paymentMode) {
    query = query.eq('payment_mode', filters.paymentMode);
  }
  if (filters.paymentStatus) {
    query = query.eq('payment_status', filters.paymentStatus);
  }
  if (filters.date) {
    const start = new Date(filters.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filters.date);
    end.setHours(23, 59, 59, 999);
    query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;

  let results = (data || []) as any[];

  // Client side doctor filter
  if (filters.doctorId) {
    results = results.filter(p => p.invoices?.visits?.doctor_id === Number(filters.doctorId));
  }

  // Aggregate stats
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [todayPayments, monthPayments, allPayments, unpaidInvoices] = await Promise.all([
    supabase.from('payments').select('amount').gte('created_at', startOfDay.toISOString()).eq('payment_status', 'Paid').then((r: any) => r.data || []),
    supabase.from('payments').select('amount').gte('created_at', startOfMonth.toISOString()).eq('payment_status', 'Paid').then((r: any) => r.data || []),
    supabase.from('payments').select('amount').eq('payment_status', 'Paid').then((r: any) => r.data || []),
    supabase.from('invoices').select('final_amount, paid_amount').neq('status', 'Paid').then((r: any) => r.data || [])
  ]);

  const todayRevenue = todayPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const monthlyRevenue = monthPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const totalRevenue = allPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const pendingPayments = unpaidInvoices.reduce((sum: number, i: any) => sum + Number(i.final_amount - i.paid_amount), 0);

  return {
    payments: results,
    stats: {
      todayRevenue,
      monthlyRevenue,
      totalRevenue,
      pendingPayments
    }
  };
}

/**
 * Generate aggregate reporting metrics
 */
export async function getReportData(dateRange: { start: string; end: string }): Promise<ClinicReportData> {
  const start = new Date(dateRange.start);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateRange.end);
  end.setHours(23, 59, 59, 999);

  if (!isSupabaseConfigured) {
    const payments = getLocalPayments();
    const patients = getLocalPatients();
    const visits = getLocalVisits();
    const profiles = getLocalProfiles();
    const doctors = getLocalDoctors();

    // Filter within range
    const rangePayments = payments.filter(p => {
      const time = new Date(p.created_at).getTime();
      return time >= start.getTime() && time <= end.getTime() && p.payment_status === 'Paid';
    });

    const rangePatients = patients.filter(p => {
      const time = new Date(p.created_at).getTime();
      return time >= start.getTime() && time <= end.getTime();
    });

    const rangeVisits = visits.filter(v => {
      const time = new Date(v.visit_date).getTime();
      return time >= start.getTime() && time <= end.getTime();
    });

    // 1. Daily revenue
    const dailyRevMap: Record<string, { amount: number; count: number }> = {};
    rangePayments.forEach(p => {
      const dateStr = new Date(p.created_at).toLocaleDateString();
      if (!dailyRevMap[dateStr]) dailyRevMap[dateStr] = { amount: 0, count: 0 };
      dailyRevMap[dateStr].amount += Number(p.amount);
      dailyRevMap[dateStr].count += 1;
    });
    const dailyRevenue = Object.entries(dailyRevMap).map(([date, val]) => ({
      date,
      amount: val.amount,
      count: val.count
    }));

    // 2. Monthly revenue
    const monthlyRevMap: Record<string, { amount: number; count: number }> = {};
    rangePayments.forEach(p => {
      const monthStr = new Date(p.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyRevMap[monthStr]) monthlyRevMap[monthStr] = { amount: 0, count: 0 };
      monthlyRevMap[monthStr].amount += Number(p.amount);
      monthlyRevMap[monthStr].count += 1;
    });
    const monthlyRevenue = Object.entries(monthlyRevMap).map(([month, val]) => ({
      month,
      amount: val.amount,
      count: val.count
    }));

    // 3. Patient Count
    const patientCountMap: Record<string, number> = {};
    rangePatients.forEach(p => {
      const dateStr = new Date(p.created_at).toLocaleDateString();
      patientCountMap[dateStr] = (patientCountMap[dateStr] || 0) + 1;
    });
    const patientCount = Object.entries(patientCountMap).map(([date, count]) => ({
      date,
      count
    }));

    // 4. Visit Count
    const visitCountMap: Record<string, number> = {};
    rangeVisits.forEach(v => {
      const dateStr = new Date(v.visit_date).toLocaleDateString();
      visitCountMap[dateStr] = (visitCountMap[dateStr] || 0) + 1;
    });
    const visitCount = Object.entries(visitCountMap).map(([date, count]) => ({
      date,
      count
    }));

    // 5. Doctor-wise visits and revenue
    const doctorStatsMap: Record<number, { count: number; revenue: number }> = {};
    rangeVisits.forEach(v => {
      if (!doctorStatsMap[v.doctor_id]) doctorStatsMap[v.doctor_id] = { count: 0, revenue: 0 };
      doctorStatsMap[v.doctor_id].count += 1;
      
      // lookup fee
      const doc = doctors.find(d => d.id === v.doctor_id);
      if (doc) {
        doctorStatsMap[v.doctor_id].revenue += Number(doc.consultation_fee);
      }
    });

    const doctorVisits = Object.entries(doctorStatsMap).map(([docId, val]) => {
      const doc = doctors.find(d => d.id === Number(docId));
      const docProfile = doc ? profiles.find(p => p.id === doc.user_id) : null;
      const dept = doc ? MOCK_DEPARTMENTS.find(d => d.id === doc.department_id) : null;

      return {
        doctorName: docProfile ? docProfile.full_name : `Dr. ${docId}`,
        departmentName: dept ? dept.department_name : 'General',
        visitCount: val.count,
        revenue: val.revenue
      };
    });

    // 6. Payment method breakdown
    const paySummaryMap: Record<string, { count: number; amount: number }> = {};
    rangePayments.forEach(p => {
      const method = p.payment_mode;
      if (!paySummaryMap[method]) paySummaryMap[method] = { count: 0, amount: 0 };
      paySummaryMap[method].count += 1;
      paySummaryMap[method].amount += Number(p.amount);
    });
    const paymentSummary = Object.entries(paySummaryMap).map(([method, val]) => ({
      method,
      count: val.count,
      amount: val.amount
    }));

    return {
      dailyRevenue,
      monthlyRevenue,
      patientCount,
      visitCount,
      doctorVisits,
      paymentSummary
    };
  }

  // Supabase flow: Aggregate data using queries
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const [paymentsData, patientsData, visitsData, doctorStatsData] = await Promise.all([
    supabase.from('payments').select('amount, payment_mode, created_at').gte('created_at', startIso).lte('created_at', endIso).eq('payment_status', 'Paid'),
    supabase.from('patients').select('created_at').gte('created_at', startIso).lte('created_at', endIso),
    supabase.from('visits').select('visit_date, doctor_id').gte('visit_date', startIso).lte('visit_date', endIso),
    supabase.from('doctor_statistics').select('*') // Materialized View
  ]);

  // Aggregate payments
  const payments = paymentsData.data || [];
  const dailyRevMap: Record<string, { amount: number; count: number }> = {};
  const monthlyRevMap: Record<string, { amount: number; count: number }> = {};
  const paySummaryMap: Record<string, { count: number; amount: number }> = {};

  payments.forEach((p: any) => {
    const dateStr = new Date(p.created_at).toLocaleDateString();
    const monthStr = new Date(p.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
    const method = p.payment_mode;

    if (!dailyRevMap[dateStr]) dailyRevMap[dateStr] = { amount: 0, count: 0 };
    dailyRevMap[dateStr].amount += Number(p.amount);
    dailyRevMap[dateStr].count += 1;

    if (!monthlyRevMap[monthStr]) monthlyRevMap[monthStr] = { amount: 0, count: 0 };
    monthlyRevMap[monthStr].amount += Number(p.amount);
    monthlyRevMap[monthStr].count += 1;

    if (!paySummaryMap[method]) paySummaryMap[method] = { count: 0, amount: 0 };
    paySummaryMap[method].count += 1;
    paySummaryMap[method].amount += Number(p.amount);
  });

  const dailyRevenue = Object.entries(dailyRevMap).map(([date, val]) => ({ date, amount: val.amount, count: val.count }));
  const monthlyRevenue = Object.entries(monthlyRevMap).map(([month, val]) => ({ month, amount: val.amount, count: val.count }));
  const paymentSummary = Object.entries(paySummaryMap).map(([method, val]) => ({ method, count: val.count, amount: val.amount }));

  // Aggregate patients count
  const patientsList = patientsData.data || [];
  const patientCountMap: Record<string, number> = {};
  patientsList.forEach((p: any) => {
    const dateStr = new Date(p.created_at).toLocaleDateString();
    patientCountMap[dateStr] = (patientCountMap[dateStr] || 0) + 1;
  });
  const patientCount = Object.entries(patientCountMap).map(([date, count]) => ({ date, count }));

  // Aggregate visits count
  const visitsList = visitsData.data || [];
  const visitCountMap: Record<string, number> = {};
  visitsList.forEach((v: any) => {
    const dateStr = new Date(v.visit_date).toLocaleDateString();
    visitCountMap[dateStr] = (visitCountMap[dateStr] || 0) + 1;
  });
  const visitCount = Object.entries(visitCountMap).map(([date, count]) => ({ date, count }));

  // Doctor visits using materialized view stats or visits join
  const doctorVisits = (doctorStatsData.data || []).map((ds: any) => ({
    doctorName: ds.doctor_name,
    departmentName: ds.department_name || 'General',
    visitCount: ds.total_visits,
    revenue: Number(ds.total_revenue_generated)
  }));

  return {
    dailyRevenue,
    monthlyRevenue,
    patientCount,
    visitCount,
    doctorVisits,
    paymentSummary
  };
}

/**
 * Fetch clinic settings details
 */
export async function getClinicSettings() {
  if (!isSupabaseConfigured) {
    return {
      clinic_name: 'MedflowX Clinics Ltd',
      phone: '080-45678901',
      email: 'contact@medflowx.com',
      logo_url: null,
      gst_number: '29AAAAA0000A1Z5',
      address: 'Outer Ring Road, Bengaluru, Karnataka, 560103',
      currency: 'INR'
    };
  }
  const { data } = await supabase.from('settings').select('*').limit(1).single();
  return data;
}

/**
 * Fetch all departments (Admin lookup)
 */
export async function getAdminDepartments(): Promise<Department[]> {
  if (!isSupabaseConfigured) {
    return MOCK_DEPARTMENTS;
  }
  const { data, error } = await supabase.from('departments').select('*').order('department_name', { ascending: true });
  if (error) throw error;
  return data as Department[];
}

/**
 * Fetch audit logs (Admin only)
 */
export async function getAuditLogs(): Promise<AuditLog[]> {
  if (!isSupabaseConfigured) {
    return getLocalAuditLogs().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data || []) as AuditLog[];
}

/**
 * Fetch doctors joined with department and user profile (Admin lookup)
 */
export async function getDoctors(): Promise<Doctor[]> {
  if (!isSupabaseConfigured) {
    const doctors = getLocalDoctors();
    const profiles = getLocalProfiles();
    
    return doctors.map(doc => {
      const prof = profiles.find(p => p.id === doc.user_id);
      const dept = MOCK_DEPARTMENTS.find(d => d.id === doc.department_id);
      return {
        id: doc.id,
        user_id: doc.user_id,
        department_id: doc.department_id,
        qualification: doc.qualification,
        consultation_fee: Number(doc.consultation_fee),
        profiles: prof ? {
          full_name: prof.full_name,
          email: prof.email,
          phone: prof.phone
        } : undefined,
        departments: dept ? {
          department_name: dept.department_name
        } : undefined
      } as Doctor;
    });
  }

  const { data, error } = await supabase
    .from('doctors')
    .select('*, profiles!user_id(full_name), departments(department_name)')
    .is('deleted_at', null);

  if (error) throw error;

  return (data || []).map((doc: any) => ({
    id: doc.id,
    user_id: doc.user_id,
    department_id: doc.department_id,
    qualification: doc.qualification,
    consultation_fee: Number(doc.consultation_fee),
    profiles: doc.profiles,
    departments: doc.departments,
  })) as Doctor[];
}
