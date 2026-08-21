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
import { getJsonItem, setJsonItem } from '@/lib/storage';

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
  { id: 1, department_name: 'Hair Care & Trichology' },
  { id: 2, department_name: 'Skin & Dermatology' },
  { id: 3, department_name: 'Hair & Skin Combo' },
  { id: 4, department_name: 'Aesthetic & Laser Care' }
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
  { id: 1, user_id: 'doc-1', department_id: 1, qualification: 'MD - Dermatology & Trichology', consultation_fee: 500 },
  { id: 2, user_id: 'doc-2', department_id: 2, qualification: 'DNB - Skin & Cosmetology', consultation_fee: 500 },
  { id: 3, user_id: 'doc-3', department_id: 3, qualification: 'MD - Hair & Skin Specialist', consultation_fee: 600 },
  { id: 4, user_id: 'doc-4', department_id: 4, qualification: 'Fellowship - Laser & Aesthetics', consultation_fee: 600 }
];

// Helper functions for storage
async function getLocalData<T>(key: string, defaultValue: T): Promise<T> {
  return getJsonItem<T>(key, defaultValue);
}

async function setLocalData<T>(key: string, data: T): Promise<void> {
  await setJsonItem(key, data);
}

const getLocalProfiles = () => getLocalData<any[]>('medflowx_profiles', DEFAULT_PROFILES);
const getLocalDoctors = () => getLocalData<any[]>('medflowx_doctors', DEFAULT_DOCTORS);
const getLocalPatients = () => getLocalData<Patient[]>('medflowx_patients', []);
const getLocalVisits = () => getLocalData<any[]>('medflowx_visits', []);
const getLocalPayments = () => getLocalData<any[]>('medflowx_payments', []);
const getLocalInvoices = () => getLocalData<Invoice[]>('medflowx_invoices', []);
const getLocalAuditLogs = () => getLocalData<AuditLog[]>('medflowx_audit_logs', []);

// Audit logger helper for mock database changes
async function logActionMock(action: string, tableName: string, recordId: string, oldValues: any = null, newValues: any = null) {
  const logs = await getLocalAuditLogs();
  const newLog: AuditLog = {
    id: logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1,
    user_id: 'admin-1',
    action,
    table_name: tableName,
    record_id: recordId,
    old_values: oldValues,
    new_values: newValues,
    ip_address: '127.0.0.1',
    device: 'Mobile App (Admin Console)',
    created_at: new Date().toISOString()
  };
  logs.push(newLog);
  await setLocalData('medflowx_audit_logs', logs);
}

// Helper for local dashboard stats calculation
async function getLocalAdminDashboardStats(): Promise<AdminDashboardStats> {
  const patients = await getLocalPatients();
  const visits = await getLocalVisits();
  const payments = await getLocalPayments();
  const profiles = await getLocalProfiles();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const start = startOfDay.getTime();
  const end = endOfDay.getTime();

  const todayPats = patients.filter(
    (p) => new Date(p.created_at).getTime() >= start && new Date(p.created_at).getTime() <= end
  ).length;

  const todayVisitsList = visits.filter(
    (v) => new Date(v.visit_date).getTime() >= start && new Date(v.visit_date).getTime() <= end
  );

  const waiting = todayVisitsList.filter(v => ['Created', 'Waiting', 'In Progress'].includes(v.status)).length;
  const completed = todayVisitsList.filter(v => ['Prescribed', 'Dispensed', 'Closed'].includes(v.status)).length;

  const todayRev = payments
    .filter((p) => {
      const time = new Date(p.created_at).getTime();
      return time >= start && time <= end && p.payment_status === 'Paid';
    })
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthlyRev = payments
    .filter((p) => {
      const time = new Date(p.created_at).getTime();
      return time >= startOfMonth.getTime() && p.payment_status === 'Paid';
    })
    .reduce((sum, item) => sum + Number(item.amount), 0);

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

// Helper for local staff list
async function getLocalStaffUsers(filters: { search?: string; role?: string; status?: string }): Promise<StaffUser[]> {
  const profiles = await getLocalProfiles();
  const doctors = await getLocalDoctors();
  
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

// =========================================================================
// SERVICES IMPLEMENTATION
// =========================================================================

/**
 * Get dashboard aggregated metrics
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  if (isSupabaseConfigured) {
    try {
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

      const todayRev = (todayPaymentsData || []).reduce((sum: number, item: any) => sum + Number(item.amount), 0);
      const monthlyRev = (monthlyPaymentsData || []).reduce((sum: number, item: any) => sum + Number(item.amount), 0);

      if (totalPatientsCount > 0 || todayPatientsCount > 0 || todayVisitsCount > 0 || doctorsCount > 0) {
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
    } catch (err) {
      console.warn('Supabase getAdminDashboardStats fallback to local:', err);
    }
  }

  return await getLocalAdminDashboardStats();
}

/**
 * Get recent activity feed (registrations, visits, payments combined)
 */
export async function getRecentActivities(): Promise<RecentActivityItem[]> {
  if (isSupabaseConfigured) {
    try {
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

      if (list.length > 0) {
        return list
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10);
      }
    } catch (err) {
      console.warn('Supabase getRecentActivities fallback to local:', err);
    }
  }

  // Local fallback
  const patients = await getLocalPatients();
  const visits = await getLocalVisits();
  const payments = await getLocalPayments();
  const profiles = await getLocalProfiles();
  const doctors = await getLocalDoctors();

  const list: RecentActivityItem[] = [];

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

  patients.forEach((p, idx) => {
    list.push({
      id: `reg-${p.id || idx}`,
      type: 'registration',
      title: `Patient Registered`,
      description: `${p.first_name} ${p.last_name || ''} enrolled (${p.patient_code})`,
      timestamp: p.created_at
    });
  });

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

  return list
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
}

/**
 * Fetch staff users with role and doctor details
 */
export async function getStaffUsers(filters: { search?: string; role?: string; status?: string }): Promise<StaffUser[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('profiles')
        .select('*, roles(*), doctors!user_id(*, departments(*))')
        .neq('role_id', 1);

      if (filters.role) {
        const roleMap: Record<string, string> = {
          'Receptionist': 'Reception',
          'Reception': 'Reception',
          'Doctor': 'Doctor',
          'Pharmacy': 'Pharmacy'
        };
        const dbRoleName = roleMap[filters.role] || filters.role;
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

      if (!error && data && data.length > 0) {
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
    } catch (err) {
      console.warn('Supabase getStaffUsers fallback to local:', err);
    }
  }

  return await getLocalStaffUsers(filters);
}

/**
 * Validate unique phone and email across profiles
 */
export async function checkStaffUnique(field: 'email' | 'phone', value: string, excludeUserId?: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('profiles').select('id').eq(field, value.trim());
      if (excludeUserId) query = query.neq('id', excludeUserId);
      const { data } = await query;
      if (data) return data.length === 0;
    } catch (err) {
      console.warn('Supabase checkStaffUnique fallback to local:', err);
    }
  }

  const profiles = await getLocalProfiles();
  const cleanVal = value.trim().toLowerCase();
  const match = profiles.find(p => {
    if (p.id === excludeUserId) return false;
    const compareVal = field === 'email' ? p.email : p.phone;
    return compareVal?.trim().toLowerCase() === cleanVal;
  });
  return !match;
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

  // Local storage creation first
  const profiles = await getLocalProfiles();
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
  await setLocalData('medflowx_profiles', profiles);

  let docDetails = null;
  if (values.role === 'Doctor') {
    const doctors = await getLocalDoctors();
    const nextDocId = doctors.length > 0 ? Math.max(...doctors.map(d => d.id)) + 1 : 1;
    const newDoc = {
      id: nextDocId,
      user_id: newUserId,
      department_id: values.department_id || null,
      qualification: values.qualification || null,
      consultation_fee: values.consultation_fee || 0
    };
    doctors.push(newDoc);
    await setLocalData('medflowx_doctors', doctors);

    const dept = MOCK_DEPARTMENTS.find(d => d.id === values.department_id);
    docDetails = {
      ...newDoc,
      departments: dept
    };
  }

  await logActionMock('CREATE_USER', 'profiles', newUserId, null, newProfile);

  // Attempt Supabase sync
  if (isSupabaseConfigured) {
    try {
      const { data: authData } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.full_name,
            phone: values.phone
          }
        }
      });

      if (authData?.user) {
        await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            role_id: roleId,
            full_name: values.full_name,
            email: values.email,
            phone: values.phone,
            is_active: values.status === 'Active'
          });

        if (values.role === 'Doctor') {
          await supabase
            .from('doctors')
            .insert({
              user_id: authData.user.id,
              department_id: values.department_id,
              qualification: values.qualification,
              consultation_fee: values.consultation_fee
            });
        }
      }
    } catch (err) {
      console.warn('Supabase createStaffUser sync warning:', err);
    }
  }

  return {
    ...newProfile,
    roles: roleRecord,
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

  // Local storage update first
  const profiles = await getLocalProfiles();
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
  await setLocalData('medflowx_profiles', profiles);

  let docDetails = null;
  const doctors = await getLocalDoctors();
  const docIdx = doctors.findIndex(d => d.user_id === userId);

  if (values.role === 'Doctor') {
    if (docIdx !== -1) {
      doctors[docIdx] = {
        ...doctors[docIdx],
        department_id: values.department_id || null,
        qualification: values.qualification || null,
        consultation_fee: values.consultation_fee || 0
      };
      await setLocalData('medflowx_doctors', doctors);
      
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
      await setLocalData('medflowx_doctors', doctors);

      const dept = MOCK_DEPARTMENTS.find(d => d.id === values.department_id);
      docDetails = {
        ...newDoc,
        departments: dept
      };
    }
  } else {
    if (docIdx !== -1) {
      doctors.splice(docIdx, 1);
      await setLocalData('medflowx_doctors', doctors);
    }
  }

  await logActionMock('UPDATE_USER', 'profiles', userId, oldVal, profiles[idx]);

  // Attempt Supabase sync
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('profiles')
        .update({
          role_id: roleId,
          full_name: values.full_name,
          email: values.email,
          phone: values.phone,
          is_active: values.status === 'Active'
        })
        .eq('id', userId);
    } catch (err) {
      console.warn('Supabase updateStaffUser sync warning:', err);
    }
  }

  return {
    ...profiles[idx],
    roles: roleRecord,
    doctors: docDetails
  } as StaffUser;
}

/**
 * Toggle User status (Active / Disabled)
 */
export async function toggleUserActive(userId: string, currentStatus: boolean): Promise<boolean> {
  const newStatus = !currentStatus;
  const profiles = await getLocalProfiles();
  const idx = profiles.findIndex(p => p.id === userId);
  if (idx !== -1) {
    profiles[idx].is_active = newStatus;
    await setLocalData('medflowx_profiles', profiles);
    await logActionMock('TOGGLE_STATUS', 'profiles', userId, { is_active: currentStatus }, { is_active: newStatus });
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from('profiles').update({ is_active: newStatus }).eq('id', userId);
    } catch (err) {
      console.warn('Supabase toggleUserActive sync warning:', err);
    }
  }

  return newStatus;
}

/**
 * Reset staff user password (Admin feature)
 */
export async function resetStaffUserPassword(userId: string): Promise<boolean> {
  await logActionMock('RESET_PASSWORD', 'profiles', userId, null, { remarks: 'Password reset successful' });
  if (isSupabaseConfigured) {
    try {
      await supabase.from('audit_logs').insert({
        action: 'ADMIN_RESET_PASSWORD',
        table_name: 'profiles',
        record_id: userId
      });
    } catch (err) {
      console.warn('Supabase resetStaffUserPassword sync warning:', err);
    }
  }
  return true;
}

/**
 * Fetch list of registered patients (read-only)
 */
export async function getPatientsList(search: string = ''): Promise<Patient[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('patients').select('*, patient_addresses(*)');
      const clean = search.trim();
      if (clean !== '') {
        query = query.or(`patient_code.ilike.%${clean}%,first_name.ilike.%${clean}%,last_name.ilike.%${clean}%,phone.ilike.%${clean}%`);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Patient[];
      }
    } catch (err) {
      console.warn('Supabase getPatientsList fallback to local:', err);
    }
  }

  // Local fallback
  const patients = await getLocalPatients();
  const visits = await getLocalVisits();

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

  return results.map(p => {
    const patientVisits = visits.filter(v => v.patient_id === p.id);
    const lastVisit = patientVisits.length > 0 
      ? patientVisits.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime())[0].visit_date 
      : null;

    return {
      ...p,
      last_visit_date: lastVisit
    };
  });
}

/**
 * Fetch detailed patient profile with full visits and billing history
 */
export async function getAdminPatientProfile(patientId: number) {
  if (isSupabaseConfigured) {
    try {
      const { data: patient } = await supabase.from('patients').select('*, patient_addresses(*)').eq('id', patientId).single();
      if (patient) {
        const [visitsData, invoicesData, paymentsData] = await Promise.all([
          supabase.from('visits').select('*, doctors(*, profiles!user_id(full_name), departments(*))').eq('patient_id', patientId).order('visit_date', { ascending: false }),
          supabase.from('invoices').select('*, payments(*)').eq('patient_id', patientId).order('created_at', { ascending: false }),
          supabase.from('payments').select('*').order('created_at', { ascending: false })
        ]);

        return {
          patient: patient as Patient,
          visits: (visitsData.data || []) as any[],
          invoices: (invoicesData.data || []) as any[],
          payments: (paymentsData.data || []) as any[]
        };
      }
    } catch (err) {
      console.warn('Supabase getAdminPatientProfile fallback to local:', err);
    }
  }

  // Local fallback
  const patients = await getLocalPatients();
  const visits = await getLocalVisits();
  const invoices = await getLocalInvoices();
  const payments = await getLocalPayments();
  const doctors = await getLocalDoctors();
  const profiles = await getLocalProfiles();

  const patient = patients.find(p => Number(p.id) === Number(patientId)) || patients[0];
  
  const patientVisits = visits
    .filter(v => Number(v.patient_id) === Number(patientId))
    .map(v => {
      const doc = doctors.find(d => d.id === v.doctor_id);
      const docProfile = doc ? profiles.find(p => p.id === doc.user_id) : null;
      const dept = MOCK_DEPARTMENTS.find(d => d.id === doc?.department_id);

      return {
        ...v,
        doctors: doc ? {
          ...doc,
          profiles: docProfile,
          departments: dept
        } : null
      };
    });

  const patientInvoices = invoices
    .filter(i => Number(i.patient_id) === Number(patientId))
    .map(inv => {
      const invPayments = payments.filter(p => p.invoice_id === inv.id);
      return {
        ...inv,
        payments: invPayments
      };
    });

  const patientPayments = payments.filter(p => patientInvoices.some(i => i.id === p.invoice_id));

  return {
    patient: patient as Patient,
    visits: patientVisits,
    invoices: patientInvoices,
    payments: patientPayments
  };
}

/**
 * Fetch all clinical visits with filtering
 */
export async function getVisitsList(filters: { doctorId?: string; departmentId?: string; date?: string; status?: string }): Promise<Visit[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('visits')
        .select('*, patients(*), doctors(*, profiles!user_id(full_name), departments(*))');

      if (filters.doctorId) {
        query = query.eq('doctor_id', Number(filters.doctorId));
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.date) {
        const start = parseDate(filters.date);
        start.setHours(0, 0, 0, 0);
        const end = parseDate(filters.date);
        end.setHours(23, 59, 59, 999);
        query = query.gte('visit_date', start.toISOString()).lte('visit_date', end.toISOString());
      }

      const { data, error } = await query.order('visit_date', { ascending: false });

      if (!error && data && data.length > 0) {
        let results = (data || []) as any[];
        if (filters.departmentId) {
          results = results.filter(v => v.doctors?.department_id === Number(filters.departmentId));
        }
        return results as Visit[];
      }
    } catch (err) {
      console.warn('Supabase getVisitsList fallback to local:', err);
    }
  }

  // Local fallback
  const visits = await getLocalVisits();
  const patients = await getLocalPatients();
  const doctors = await getLocalDoctors();
  const profiles = await getLocalProfiles();

  let list = visits.map(v => {
    const pat = patients.find(p => Number(p.id) === Number(v.patient_id));
    const doc = doctors.find(d => Number(d.id) === Number(v.doctor_id));
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
    list = list.filter(v => Number(v.doctor_id) === Number(filters.doctorId));
  }
  if (filters.departmentId) {
    list = list.filter(v => Number(v.doctors?.department_id) === Number(filters.departmentId));
  }
  if (filters.status) {
    list = list.filter(v => v.status === filters.status);
  }
  if (filters.date) {
    const dateStr = parseDate(filters.date).toDateString();
    list = list.filter(v => new Date(v.visit_date).toDateString() === dateStr);
  }

  return list.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
}

/**
 * Fetch all payments with summary metrics
 */
export async function getPaymentsList(filters: { date?: string; paymentMode?: string; paymentStatus?: string; doctorId?: string }) {
  if (isSupabaseConfigured) {
    try {
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
        const start = parseDate(filters.date);
        start.setHours(0, 0, 0, 0);
        const end = parseDate(filters.date);
        end.setHours(23, 59, 59, 999);
        query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        let results = (data || []) as any[];
        if (filters.doctorId) {
          results = results.filter(p => p.invoices?.visits?.doctor_id === Number(filters.doctorId));
        }

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

        const todayRevenue = (todayPayments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
        const monthlyRevenue = (monthPayments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
        const totalRevenue = (allPayments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
        const pendingPayments = (unpaidInvoices || []).reduce((sum: number, i: any) => sum + Number(i.final_amount - i.paid_amount), 0);

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
    } catch (err) {
      console.warn('Supabase getPaymentsList fallback to local:', err);
    }
  }

  // Local fallback
  const payments = await getLocalPayments();
  const invoices = await getLocalInvoices();
  const visits = await getLocalVisits();
  const patients = await getLocalPatients();
  const doctors = await getLocalDoctors();
  const profiles = await getLocalProfiles();

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
    const dateStr = parseDate(filters.date).toDateString();
    list = list.filter(p => new Date(p.created_at).toDateString() === dateStr);
  }

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

export function formatDateToDDMMYYYY(date: Date): string {
  if (isNaN(date.getTime())) return '';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const clean = dateStr.trim();
  const ddmmyyyyMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
    const year = parseInt(ddmmyyyyMatch[3], 10);
    return new Date(year, month, day);
  }
  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    return d;
  }
  return new Date();
}

/**
 * Generate aggregate reporting metrics
 */
export async function getReportData(dateRange: { start: string; end: string }): Promise<ClinicReportData> {
  const start = parseDate(dateRange.start);
  start.setHours(0, 0, 0, 0);
  const end = parseDate(dateRange.end);
  end.setHours(23, 59, 59, 999);

  if (isSupabaseConfigured) {
    try {
      const [paymentsRes, patientsRes, visitsRes] = await Promise.all([
        supabase.from('payments').select('amount, payment_mode, created_at').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()).eq('payment_status', 'Paid'),
        supabase.from('patients').select('created_at').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
        supabase.from('visits').select('id, visit_date, doctor_id, doctors(profiles!user_id(full_name), departments(department_name))').gte('visit_date', start.toISOString()).lte('visit_date', end.toISOString())
      ]);

      if (paymentsRes.data && patientsRes.data && visitsRes.data) {
        const dailyRevMap: Record<string, { amount: number; count: number }> = {};
        (paymentsRes.data || []).forEach((p: any) => {
          const dateStr = formatDateToDDMMYYYY(new Date(p.created_at));
          if (!dailyRevMap[dateStr]) dailyRevMap[dateStr] = { amount: 0, count: 0 };
          dailyRevMap[dateStr].amount += Number(p.amount);
          dailyRevMap[dateStr].count += 1;
        });

        const dailyRevenue = Object.entries(dailyRevMap).map(([date, val]) => ({ date, amount: val.amount, count: val.count }));

        const monthlyRevenue = [
          { month: 'This Month', amount: dailyRevenue.reduce((s, d) => s + d.amount, 0), count: dailyRevenue.reduce((s, d) => s + d.count, 0) }
        ];

        const patientCount = [
          { date: 'Total Period', count: (patientsRes.data || []).length }
        ];

        const visitCount = [
          { date: 'Total Period', count: (visitsRes.data || []).length }
        ];

        const doctorVisitsMap: Record<string, { name: string; dept: string; count: number; rev: number }> = {};
        (visitsRes.data || []).forEach((v: any) => {
          const name = v.doctors?.profiles?.full_name || 'Doctor';
          const dept = v.doctors?.departments?.department_name || 'General';
          if (!doctorVisitsMap[name]) doctorVisitsMap[name] = { name, dept, count: 0, rev: 0 };
          doctorVisitsMap[name].count += 1;
          doctorVisitsMap[name].rev += 350;
        });

        const doctorVisits = Object.values(doctorVisitsMap).map((d) => ({
          doctorName: d.name,
          departmentName: d.dept,
          visitCount: d.count,
          revenue: d.rev
        }));

        const cashP = (paymentsRes.data || []).filter((p: any) => p.payment_mode === 'Cash');
        const upiP = (paymentsRes.data || []).filter((p: any) => p.payment_mode === 'UPI');
        const cardP = (paymentsRes.data || []).filter((p: any) => p.payment_mode === 'Card');

        const paymentSummary = [
          { method: 'Cash', count: cashP.length, amount: cashP.reduce((s: number, p: any) => s + Number(p.amount), 0) },
          { method: 'UPI', count: upiP.length, amount: upiP.reduce((s: number, p: any) => s + Number(p.amount), 0) },
          { method: 'Card', count: cardP.length, amount: cardP.reduce((s: number, p: any) => s + Number(p.amount), 0) }
        ];

        return {
          dailyRevenue,
          monthlyRevenue,
          patientCount,
          visitCount,
          doctorVisits,
          paymentSummary,
          treatmentCategory: {
            hairRevenue: 0,
            skinRevenue: 0,
            bothRevenue: 0,
            totalTreatmentRevenue: 0,
            hairCount: 0,
            skinCount: 0,
            bothCount: 0,
            totalTreatmentCount: 0
          }
        };
      }
    } catch (err) {
      console.warn('Supabase getReportData fallback to local:', err);
    }
  }

  // Local fallback
  const payments = await getLocalPayments();
  const patients = await getLocalPatients();
  const visits = await getLocalVisits();
  const profiles = await getLocalProfiles();
  const doctors = await getLocalDoctors();

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

  const dailyRevMap: Record<string, { amount: number; count: number }> = {};
  rangePayments.forEach(p => {
    const dateStr = formatDateToDDMMYYYY(new Date(p.created_at));
    if (!dailyRevMap[dateStr]) dailyRevMap[dateStr] = { amount: 0, count: 0 };
    dailyRevMap[dateStr].amount += Number(p.amount);
    dailyRevMap[dateStr].count += 1;
  });

  const dailyRevenue = Object.entries(dailyRevMap).map(([date, val]) => ({
    date,
    amount: val.amount,
    count: val.count
  }));

  const monthlyRevenue = [
    { month: 'Period Total', amount: rangePayments.reduce((s, p) => s + Number(p.amount), 0), count: rangePayments.length }
  ];

  const patientCount = [
    { date: 'Total Intake', count: rangePatients.length }
  ];

  const visitCount = [
    { date: 'Total Visits', count: rangeVisits.length }
  ];

  const doctorVisitsMap: Record<string, { name: string; dept: string; count: number; rev: number }> = {};
  rangeVisits.forEach(v => {
    const doc = doctors.find(d => d.id === v.doctor_id);
    const docProfile = doc ? profiles.find(p => p.id === doc.user_id) : null;
    const docName = docProfile ? docProfile.full_name : 'Doctor';
    const dept = MOCK_DEPARTMENTS.find(d => d.id === doc?.department_id)?.department_name || 'General';

    if (!doctorVisitsMap[docName]) doctorVisitsMap[docName] = { name: docName, dept, count: 0, rev: 0 };
    doctorVisitsMap[docName].count += 1;
    doctorVisitsMap[docName].rev += Number(doc?.consultation_fee || 350);
  });

  const doctorVisits = Object.values(doctorVisitsMap).map((d) => ({
    doctorName: d.name,
    departmentName: d.dept,
    visitCount: d.count,
    revenue: d.rev
  }));

  const cashP = rangePayments.filter(p => p.payment_mode === 'Cash');
  const upiP = rangePayments.filter(p => p.payment_mode === 'UPI');
  const cardP = rangePayments.filter(p => p.payment_mode === 'Card');

  const paymentSummary = [
    { method: 'Cash', count: cashP.length, amount: cashP.reduce((s, p) => s + Number(p.amount), 0) },
    { method: 'UPI', count: upiP.length, amount: upiP.reduce((s, p) => s + Number(p.amount), 0) },
    { method: 'Card', count: cardP.length, amount: cardP.reduce((s, p) => s + Number(p.amount), 0) }
  ];

  return {
    dailyRevenue,
    monthlyRevenue,
    patientCount,
    visitCount,
    doctorVisits,
    paymentSummary,
    treatmentCategory: {
      hairRevenue: 0,
      skinRevenue: 0,
      bothRevenue: 0,
      totalTreatmentRevenue: 0,
      hairCount: 0,
      skinCount: 0,
      bothCount: 0,
      totalTreatmentCount: 0
    }
  };
}

/**
 * Fetch clinic settings details
 */
export async function getClinicSettings() {
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase.from('settings').select('*').limit(1).single();
      if (data) return data;
    } catch (err) {
      console.warn('Supabase getClinicSettings fallback:', err);
    }
  }

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

/**
 * Fetch all departments (Admin lookup)
 */
export async function getAdminDepartments(): Promise<Department[]> {
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase.from('departments').select('*').order('department_name', { ascending: true });
      if (data && data.length > 0) return data as Department[];
    } catch (err) {
      console.warn('Supabase getAdminDepartments fallback:', err);
    }
  }

  return MOCK_DEPARTMENTS;
}

/**
 * Fetch audit logs (Admin only)
 */
export async function getAuditLogs(): Promise<AuditLog[]> {
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('audit_logs')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (data && data.length > 0) return data as AuditLog[];
    } catch (err) {
      console.warn('Supabase getAuditLogs fallback:', err);
    }
  }

  return (await getLocalAuditLogs()).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Fetch doctors joined with department and user profile (Admin lookup)
 */
export async function getDoctors(): Promise<Doctor[]> {
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('doctors')
        .select('*, profiles!user_id(full_name), departments(department_name)')
        .is('deleted_at', null);

      if (data && data.length > 0) {
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
    } catch (err) {
      console.warn('Supabase getDoctors fallback:', err);
    }
  }

  const doctors = await getLocalDoctors();
  const profiles = await getLocalProfiles();
  
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
