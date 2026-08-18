import { supabase, isSupabaseConfigured } from '../config/supabase';
import { socket } from '../config/socket';
import { Patient, Doctor, Department, Visit, Invoice, Payment, PatientFormValues, VisitFormValues, PaymentFormValues } from '../types/reception';
import { getJsonItem, setJsonItem } from '../lib/storage';

// =========================================================================
// DEFAULT DEMO SEED DATA (Used for offline / fallback when Supabase has no data)
// =========================================================================

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 1, department_name: 'General Medicine' },
  { id: 2, department_name: 'ENT' },
  { id: 3, department_name: 'Dental' },
  { id: 4, department_name: 'Cardiology' },
];

const DEFAULT_DOCTORS: Doctor[] = [
  {
    id: 1,
    user_id: 'doc-1',
    department_id: 1,
    qualification: 'MD - General Medicine',
    consultation_fee: 350,
    profiles: { full_name: 'Dr. Phanindra Varma', email: null, phone: null },
    departments: { department_name: 'General Medicine' },
  },
  {
    id: 2,
    user_id: 'doc-2',
    department_id: 2,
    qualification: 'MS - ENT',
    consultation_fee: 400,
    profiles: { full_name: 'Dr. Ananya Rao', email: null, phone: null },
    departments: { department_name: 'ENT' },
  },
  {
    id: 3,
    user_id: 'doc-3',
    department_id: 3,
    qualification: 'BDS, MDS - Dental',
    consultation_fee: 300,
    profiles: { full_name: 'Dr. Rajesh Kumar', email: null, phone: null },
    departments: { department_name: 'Dental' },
  },
  {
    id: 4,
    user_id: 'doc-4',
    department_id: 4,
    qualification: 'DM - Cardiology',
    consultation_fee: 600,
    profiles: { full_name: 'Dr. Suresh Mehta', email: null, phone: null },
    departments: { department_name: 'Cardiology' },
  },
];

const DEFAULT_PATIENTS: Patient[] = [
  {
    id: 1,
    patient_code: 'PAT-2026-0001',
    first_name: 'Ramesh',
    last_name: 'Kumar',
    phone: '9876543210',
    gender: 'Male',
    age: 34,
    blood_group: 'O+',
    email: null,
    emergency_contact: null,
    occupation: null,
    allergies: null,
    medical_history: null,
    dob: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    patient_addresses: [
      {
        id: 1,
        patient_id: 1,
        address_line: '123 Main St',
        city: 'Hyderabad',
        district: null,
        state: 'Telangana',
        pincode: '500001',
        country: 'India',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 2,
    patient_code: 'PAT-2026-0002',
    first_name: 'Priya',
    last_name: 'Sharma',
    phone: '9876543211',
    gender: 'Female',
    age: 28,
    blood_group: 'B+',
    email: null,
    emergency_contact: null,
    occupation: null,
    allergies: null,
    medical_history: null,
    dob: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    patient_addresses: [
      {
        id: 2,
        patient_id: 2,
        address_line: '456 Park Ave',
        city: 'Hyderabad',
        district: null,
        state: 'Telangana',
        pincode: '500002',
        country: 'India',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: 3,
    patient_code: 'PAT-2026-0003',
    first_name: 'Vikram',
    last_name: 'Reddy',
    phone: '9876543212',
    gender: 'Male',
    age: 45,
    blood_group: 'A+',
    email: null,
    emergency_contact: null,
    occupation: null,
    allergies: null,
    medical_history: null,
    dob: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    patient_addresses: [
      {
        id: 3,
        patient_id: 3,
        address_line: '789 Road No 10',
        city: 'Hyderabad',
        district: null,
        state: 'Telangana',
        pincode: '500034',
        country: 'India',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
];

const DEFAULT_VISITS: any[] = [
  {
    id: 1,
    visit_number: 'VIS-001',
    patient_id: 1,
    doctor_id: 1,
    token_no: 1,
    chief_complaint: 'Fever and headache',
    status: 'Waiting',
    visit_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    visit_number: 'VIS-002',
    patient_id: 2,
    doctor_id: 2,
    token_no: 2,
    chief_complaint: 'Severe ear pain',
    status: 'Prescribed',
    visit_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    visit_number: 'VIS-003',
    patient_id: 3,
    doctor_id: 3,
    token_no: 3,
    chief_complaint: 'Tooth cavity consultation',
    status: 'Created',
    visit_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_INVOICES: Invoice[] = [
  {
    id: 1,
    invoice_number: 'INV-2026-0001',
    visit_id: 1,
    patient_id: 1,
    total_amount: 350,
    discount: 0,
    tax: 0,
    final_amount: 350,
    paid_amount: 350,
    status: 'Paid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    invoice_number: 'INV-2026-0002',
    visit_id: 2,
    patient_id: 2,
    total_amount: 400,
    discount: 0,
    tax: 0,
    final_amount: 400,
    paid_amount: 400,
    status: 'Paid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    invoice_number: 'INV-2026-0003',
    visit_id: 3,
    patient_id: 3,
    total_amount: 300,
    discount: 0,
    tax: 0,
    final_amount: 300,
    paid_amount: 0,
    status: 'Unpaid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_PAYMENTS: Payment[] = [
  {
    id: 1,
    invoice_id: 1,
    amount: 350,
    payment_mode: 'UPI',
    payment_status: 'Paid',
    transaction_reference: null,
    paid_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    invoice_id: 2,
    amount: 400,
    payment_mode: 'Cash',
    payment_status: 'Paid',
    transaction_reference: null,
    paid_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Helper functions for local storage
const getLocalPatients = () => getJsonItem<Patient[]>('medflowx_patients', DEFAULT_PATIENTS);
const setLocalPatients = (data: Patient[]) => setJsonItem('medflowx_patients', data);

const getLocalVisits = () => getJsonItem<any[]>('medflowx_visits', DEFAULT_VISITS);
const setLocalVisits = (data: any[]) => setJsonItem('medflowx_visits', data);

const getLocalPayments = () => getJsonItem<any[]>('medflowx_payments', DEFAULT_PAYMENTS);
const setLocalPayments = (data: any[]) => setJsonItem('medflowx_payments', data);

const getLocalInvoices = () => getJsonItem<Invoice[]>('medflowx_invoices', DEFAULT_INVOICES);
const setLocalInvoices = (data: Invoice[]) => setJsonItem('medflowx_invoices', data);

const getLocalDoctors = () => getJsonItem<Doctor[]>('medflowx_doctors', DEFAULT_DOCTORS);
const getLocalDepartments = () => getJsonItem<Department[]>('medflowx_departments', DEFAULT_DEPARTMENTS);

// =========================================================================
// SERVICES IMPLEMENTATION
// =========================================================================

/**
 * Fetch Reception Dashboard stats in a single database aggregation phase.
 * Falls back to local storage calculation when Supabase has no data or is unconfigured.
 */
export async function getDashboardStats() {
  if (isSupabaseConfigured) {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const startIso = startOfDay.toISOString();
      const endIso = endOfDay.toISOString();

      const [patientsCount, visitsCount, waitingCount, completedCount, paymentsData] = await Promise.all([
        supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startIso)
          .lte('created_at', endIso)
          .then((r: any) => r.count || 0),
        supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .gte('visit_date', startIso)
          .lte('visit_date', endIso)
          .then((r: any) => r.count || 0),
        supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .gte('visit_date', startIso)
          .lte('visit_date', endIso)
          .in('status', ['Created', 'Waiting'])
          .then((r: any) => r.count || 0),
        supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .gte('visit_date', startIso)
          .lte('visit_date', endIso)
          .in('status', ['Prescribed', 'Dispensed', 'Closed'])
          .then((r: any) => r.count || 0),
        supabase
          .from('payments')
          .select('amount')
          .gte('created_at', startIso)
          .lte('created_at', endIso)
          .eq('payment_status', 'Paid')
          .then((r: any) => r.data || []),
      ]);

      const revenue = (paymentsData || []).reduce((sum: number, item: any) => sum + Number(item.amount), 0);

      // If Supabase returned non-zero stats, use them
      if (patientsCount > 0 || visitsCount > 0 || waitingCount > 0 || completedCount > 0 || revenue > 0) {
        return {
          todayPatients: patientsCount,
          todayVisits: visitsCount,
          waitingPatients: waitingCount,
          completedVisits: completedCount,
          todayRevenue: revenue,
        };
      }
    } catch (err) {
      console.warn('Supabase getDashboardStats fallback to local data:', err);
    }
  }

  // Local Storage Fallback Calculation
  const patients = await getLocalPatients();
  const visits = await getLocalVisits();
  const payments = await getLocalPayments();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const start = startOfDay.getTime();
  const end = endOfDay.getTime();

  const todayPatientsCount = patients.filter((p) => {
    const t = new Date(p.created_at).getTime();
    return t >= start && t <= end;
  }).length;

  const todayVisits = visits.filter((v) => {
    const t = new Date(v.visit_date).getTime();
    return t >= start && t <= end;
  });

  const waitingCount = todayVisits.filter((v) => ['Created', 'Waiting', 'In Progress'].includes(v.status)).length;
  const completedCount = todayVisits.filter((v) => ['Prescribed', 'Dispensed', 'Closed'].includes(v.status)).length;

  const todayRevenue = payments
    .filter((p) => {
      const t = new Date(p.created_at).getTime();
      return t >= start && t <= end && p.payment_status === 'Paid';
    })
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return {
    todayPatients: todayPatientsCount || patients.length,
    todayVisits: todayVisits.length || visits.length,
    waitingPatients: waitingCount,
    completedVisits: completedCount,
    todayRevenue,
  };
}

/**
 * Advanced patient search supporting autocomplete filter.
 * Matches: Phone (Primary), Code, Name (Partial).
 */
export async function searchPatients(query: string) {
  if (isSupabaseConfigured) {
    try {
      if (!query || query.trim() === '') {
        const { data } = await supabase
          .from('patients')
          .select('*, patient_addresses(*)')
          .order('created_at', { ascending: false })
          .limit(10);
        if (data && data.length > 0) return data as Patient[];
      } else {
        const cleanQuery = query.trim();
        const { data } = await supabase
          .from('patients')
          .select('*, patient_addresses(*)')
          .or(
            `phone.ilike.%${cleanQuery}%,patient_code.ilike.%${cleanQuery}%,first_name.ilike.%${cleanQuery}%,last_name.ilike.%${cleanQuery}%`
          )
          .limit(20);
        if (data && data.length > 0) return data as Patient[];
      }
    } catch (err) {
      console.warn('Supabase searchPatients fallback to local:', err);
    }
  }

  // Local fallback
  const patients = await getLocalPatients();
  if (!query || query.trim() === '') {
    return patients.slice(0, 10);
  }
  const q = query.trim().toLowerCase();
  return patients.filter((p) =>
    p.phone.includes(q) ||
    p.patient_code.toLowerCase().includes(q) ||
    p.first_name.toLowerCase().includes(q) ||
    (p.last_name && p.last_name.toLowerCase().includes(q))
  ).slice(0, 20);
}

/**
 * Fetch patient by ID with address and history.
 */
export async function getPatientById(id: number) {
  if (isSupabaseConfigured) {
    try {
      const { data: patient } = await supabase
        .from('patients')
        .select('*, patient_addresses(*)')
        .eq('id', id)
        .single();

      if (patient) {
        const { data: visits } = await supabase
          .from('visits')
          .select('*, doctors(id, qualification, consultation_fee, profiles!user_id(full_name), departments(department_name))')
          .eq('patient_id', id)
          .order('visit_date', { ascending: false });

        return {
          patient: patient as Patient,
          visits: (visits || []) as any[],
        };
      }
    } catch (err) {
      console.warn('Supabase getPatientById fallback to local:', err);
    }
  }

  // Local fallback
  const patients = await getLocalPatients();
  const visits = await getLocalVisits();
  const patient = patients.find((p) => Number(p.id) === Number(id));
  const patientVisits = visits.filter((v) => Number(v.patient_id) === Number(id));

  return {
    patient: patient || DEFAULT_PATIENTS[0],
    visits: patientVisits,
  };
}

/**
 * Patient search by phone number to prevent duplicates.
 */
export async function checkPhoneUnique(phone: string, excludeId?: number) {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('patients').select('id').eq('phone', phone.trim());
      if (excludeId) query = query.neq('id', excludeId);
      const { data } = await query;
      if (data) return data.length === 0;
    } catch (err) {
      console.warn('Supabase checkPhoneUnique fallback to local:', err);
    }
  }

  const patients = await getLocalPatients();
  const cleanPhone = phone.trim();
  const match = patients.find((p) => p.phone === cleanPhone && (excludeId ? Number(p.id) !== Number(excludeId) : true));
  return !match;
}

/**
 * Register new patient and insert address.
 */
export async function registerPatient(patientData: PatientFormValues) {
  const isUnique = await checkPhoneUnique(patientData.phone);
  if (!isUnique) {
    throw new Error('A patient with this phone number already exists.');
  }

  // Local record creation first
  const patients = await getLocalPatients();
  const nextId = patients.length > 0 ? Math.max(...patients.map((p) => Number(p.id) || 0)) + 1 : 1;
  const timestamp = new Date().toISOString();

  const newPatient: Patient = {
    id: nextId,
    patient_code: `PAT-2026-${String(nextId).padStart(4, '0')}`,
    first_name: patientData.first_name,
    last_name: patientData.last_name || null,
    gender: patientData.gender,
    dob: patientData.dob || null,
    age: patientData.age || null,
    blood_group: patientData.blood_group || null,
    phone: patientData.phone,
    email: patientData.email || null,
    emergency_contact: patientData.emergency_contact || null,
    occupation: patientData.occupation || null,
    allergies: patientData.allergies || null,
    medical_history: patientData.medical_history || null,
    created_at: timestamp,
    updated_at: timestamp,
    patient_addresses: [
      {
        id: nextId,
        patient_id: nextId,
        address_line: patientData.address_line,
        city: patientData.city,
        district: patientData.district || null,
        state: patientData.state,
        country: patientData.country || 'India',
        pincode: patientData.pincode,
        created_at: timestamp,
        updated_at: timestamp,
      },
    ],
  };

  patients.unshift(newPatient);
  await setLocalPatients(patients);

  // Attempt Supabase insert if available
  if (isSupabaseConfigured) {
    try {
      const { data: sbPatient, error: sbPatientError } = await supabase
        .from('patients')
        .insert({
          first_name: patientData.first_name,
          last_name: patientData.last_name || null,
          gender: patientData.gender,
          dob: patientData.dob || null,
          age: patientData.age || null,
          blood_group: patientData.blood_group || null,
          phone: patientData.phone,
          email: patientData.email || null,
          emergency_contact: patientData.emergency_contact || null,
          occupation: patientData.occupation || null,
          allergies: patientData.allergies || null,
          medical_history: patientData.medical_history || null,
        })
        .select()
        .single();

      if (!sbPatientError && sbPatient) {
        await supabase.from('patient_addresses').insert({
          patient_id: sbPatient.id,
          address_line: patientData.address_line,
          city: patientData.city,
          district: patientData.district || null,
          state: patientData.state,
          country: patientData.country || 'India',
          pincode: patientData.pincode,
        });
      }
    } catch (err) {
      console.warn('Supabase registerPatient sync warning:', err);
    }
  }

  return {
    patient: newPatient,
    address: newPatient.patient_addresses![0],
  };
}

/**
 * Fetch departments list.
 */
export async function getDepartments() {
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('departments')
        .select('*')
        .order('department_name', { ascending: true });
      if (data && data.length > 0) return data as Department[];
    } catch (err) {
      console.warn('Supabase getDepartments fallback to local:', err);
    }
  }

  return await getLocalDepartments();
}

/**
 * Fetch doctors joined with department and user profile.
 */
export async function getDoctors() {
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
      console.warn('Supabase getDoctors fallback to local:', err);
    }
  }

  return await getLocalDoctors();
}

/**
 * Check if a patient has any previous visits in the system.
 */
export async function checkIsFirstVisit(patientId: number): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      const { count } = await supabase
        .from('visits')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', patientId);
      if (count !== null && count !== undefined) return count === 0;
    } catch (err) {
      console.warn('Supabase checkIsFirstVisit fallback to local:', err);
    }
  }

  const visits = await getLocalVisits();
  const patientVisits = visits.filter((v) => Number(v.patient_id) === Number(patientId));
  return patientVisits.length === 0;
}

/**
 * Create visit and associate a pending invoice.
 */
export async function createVisit(visitData: VisitFormValues) {
  const visits = await getLocalVisits();
  const invoices = await getLocalInvoices();

  const nextVisitId = visits.length > 0 ? Math.max(...visits.map((v) => Number(v.id) || 0)) + 1 : 1;
  const nextInvoiceId = invoices.length > 0 ? Math.max(...invoices.map((i) => Number(i.id) || 0)) + 1 : 1;
  const timestamp = new Date().toISOString();

  const doctorList = await getLocalDoctors();
  const doc = doctorList.find((d) => Number(d.id) === Number(visitData.doctor_id)) || doctorList[0];

  const patientList = await getLocalPatients();
  const pat = patientList.find((p) => Number(p.id) === Number(visitData.patient_id)) || patientList[0];

  const todayVisits = visits.filter(
    (v) => Number(v.doctor_id) === Number(visitData.doctor_id) && new Date(v.visit_date).toDateString() === new Date().toDateString()
  );
  const tokenNo = todayVisits.length + 1;

  const isFirst = await checkIsFirstVisit(visitData.patient_id);
  const fee = isFirst ? (visitData.consultation_fee || doc?.consultation_fee || 0) : 0;

  const newVisit: any = {
    id: nextVisitId,
    visit_number: `VIS-${String(nextVisitId).padStart(3, '0')}`,
    patient_id: visitData.patient_id,
    doctor_id: visitData.doctor_id,
    token_no: tokenNo,
    chief_complaint: visitData.chief_complaint,
    status: 'Created',
    visit_date: timestamp,
    created_at: timestamp,
    updated_at: timestamp,
    patients: pat,
    doctors: doc,
  };

  const newInvoice: Invoice = {
    id: nextInvoiceId,
    invoice_number: `INV-2026-${String(nextInvoiceId).padStart(4, '0')}`,
    visit_id: nextVisitId,
    patient_id: visitData.patient_id,
    total_amount: fee,
    discount: 0,
    tax: 0,
    final_amount: fee,
    paid_amount: 0,
    status: 'Unpaid',
    created_at: timestamp,
    updated_at: timestamp,
  };

  visits.unshift(newVisit);
  invoices.unshift(newInvoice);

  await setLocalVisits(visits);
  await setLocalInvoices(invoices);

  // Supabase sync
  if (isSupabaseConfigured) {
    try {
      const { data: sbVisit } = await supabase
        .from('visits')
        .insert({
          patient_id: visitData.patient_id,
          doctor_id: visitData.doctor_id,
          token_no: tokenNo,
          chief_complaint: visitData.chief_complaint,
          status: 'Created',
        })
        .select()
        .single();

      if (sbVisit) {
        await supabase.from('invoices').insert({
          visit_id: sbVisit.id,
          patient_id: visitData.patient_id,
          total_amount: fee,
          discount: 0,
          tax: 0,
          final_amount: fee,
          paid_amount: 0,
          status: 'Unpaid',
        });
      }
    } catch (err) {
      console.warn('Supabase createVisit sync warning:', err);
    }
  }

  // Socket notification
  try {
    if (!socket.connected) socket.connect();
    socket.emit('update-queue', { visitId: nextVisitId, status: 'Created' });
  } catch (err) {
    console.error('Socket emission failed:', err);
  }

  return {
    visit: newVisit as Visit,
    invoice: newInvoice,
  };
}

/**
 * Record payment for consultation fee, set invoice status to Paid, and update visit to Waiting.
 */
export async function collectPayment(paymentData: PaymentFormValues) {
  const invoices = await getLocalInvoices();
  const visits = await getLocalVisits();
  const payments = await getLocalPayments();

  let targetInvoice = invoices.find(
    (i) => Number(i.visit_id) === Number(paymentData.visit_id) || Number(i.id) === Number(paymentData.invoice_id)
  );

  const timestamp = new Date().toISOString();
  const nextPaymentId = payments.length > 0 ? Math.max(...payments.map((p) => Number(p.id) || 0)) + 1 : 1;

  if (!targetInvoice) {
    targetInvoice = {
      id: invoices.length + 1,
      invoice_number: `INV-2026-${String(invoices.length + 1).padStart(4, '0')}`,
      visit_id: paymentData.visit_id,
      patient_id: 1,
      total_amount: paymentData.amount,
      discount: 0,
      tax: 0,
      final_amount: paymentData.amount,
      paid_amount: paymentData.amount,
      status: 'Paid',
      created_at: timestamp,
      updated_at: timestamp,
    };
    invoices.unshift(targetInvoice);
  } else {
    targetInvoice.status = 'Paid';
    targetInvoice.paid_amount = paymentData.amount;
    targetInvoice.updated_at = timestamp;
  }

  const newPayment: Payment = {
    id: nextPaymentId,
    invoice_id: targetInvoice.id,
    amount: paymentData.amount,
    payment_mode: paymentData.payment_mode,
    payment_status: 'Paid',
    transaction_reference: paymentData.transaction_reference || null,
    paid_at: timestamp,
    created_at: timestamp,
    updated_at: timestamp,
  };

  const visitIdx = visits.findIndex((v) => Number(v.id) === Number(paymentData.visit_id));
  if (visitIdx !== -1) {
    visits[visitIdx].status = 'Waiting';
  }

  payments.unshift(newPayment);
  await setLocalInvoices(invoices);
  await setLocalVisits(visits);
  await setLocalPayments(payments);

  // Supabase sync
  if (isSupabaseConfigured) {
    try {
      await supabase.from('payments').insert({
        invoice_id: targetInvoice.id,
        amount: paymentData.amount,
        payment_mode: paymentData.payment_mode,
        payment_status: 'Paid',
        paid_at: timestamp,
      });

      await supabase.from('invoices').update({ status: 'Paid', paid_amount: paymentData.amount }).eq('id', targetInvoice.id);
      await supabase.from('visits').update({ status: 'Waiting' }).eq('id', paymentData.visit_id);
    } catch (err) {
      console.warn('Supabase collectPayment sync warning:', err);
    }
  }

  // Socket notification
  try {
    if (!socket.connected) socket.connect();
    socket.emit('update-queue', { visitId: paymentData.visit_id, status: 'Waiting' });
  } catch (err) {
    console.error('Socket emission failed:', err);
  }

  return newPayment;
}

/**
 * Get active queue visits for today.
 */
export async function getTodayQueue() {
  if (isSupabaseConfigured) {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { data } = await supabase
        .from('visits')
        .select(`
          id,
          visit_number,
          visit_date,
          token_no,
          chief_complaint,
          status,
          created_at,
          patients (
            id,
            patient_code,
            first_name,
            last_name,
            phone,
            gender,
            age
          ),
          doctors (
            id,
            profiles!user_id (
              full_name
            ),
            departments (
              department_name
            )
          )
        `)
        .gte('visit_date', startOfDay.toISOString())
        .lte('visit_date', endOfDay.toISOString())
        .order('token_no', { ascending: true });

      if (data && data.length > 0) return data as any[];
    } catch (err) {
      console.warn('Supabase getTodayQueue fallback to local:', err);
    }
  }

  // Local fallback
  const visits = await getLocalVisits();
  const patients = await getLocalPatients();
  const doctors = await getLocalDoctors();

  return visits.map((v) => {
    const pat = patients.find((p) => Number(p.id) === Number(v.patient_id)) || {
      id: v.patient_id,
      patient_code: 'PAT-000',
      first_name: 'Patient',
      last_name: '',
      phone: '0000000000',
      gender: 'Male',
      age: 30,
    };
    const doc = doctors.find((d) => Number(d.id) === Number(v.doctor_id)) || doctors[0];

    return {
      ...v,
      patients: pat,
      doctors: doc,
    };
  });
}

/**
 * Get list of all patients with filters & pagination.
 */
export async function getPatientsList(
  filters: {
    code?: string;
    name?: string;
    phone?: string;
    gender?: string;
  },
  page = 1,
  pageSize = 10
) {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('patients').select('*, patient_addresses(*)', { count: 'exact' });

      if (filters.code) query = query.ilike('patient_code', `%${filters.code.trim()}%`);
      if (filters.phone) query = query.ilike('phone', `%${filters.phone.trim()}%`);
      if (filters.gender && filters.gender !== 'All') query = query.eq('gender', filters.gender);
      if (filters.name) query = query.or(`first_name.ilike.%${filters.name.trim()}%,last_name.ilike.%${filters.name.trim()}%`);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count } = await query.order('created_at', { ascending: false }).range(from, to);

      if (data && data.length > 0) {
        return {
          patients: data as Patient[],
          total: count || data.length,
          page,
          pageSize,
        };
      }
    } catch (err) {
      console.warn('Supabase getPatientsList fallback to local:', err);
    }
  }

  // Local fallback
  let list = await getLocalPatients();

  if (filters.code) {
    const clean = filters.code.trim().toLowerCase();
    list = list.filter((p) => p.patient_code.toLowerCase().includes(clean));
  }
  if (filters.phone) {
    const clean = filters.phone.trim();
    list = list.filter((p) => p.phone.includes(clean));
  }
  if (filters.gender && filters.gender !== 'All') {
    list = list.filter((p) => p.gender === filters.gender);
  }
  if (filters.name) {
    const clean = filters.name.trim().toLowerCase();
    list = list.filter(
      (p) => p.first_name.toLowerCase().includes(clean) || (p.last_name && p.last_name.toLowerCase().includes(clean))
    );
  }

  const total = list.length;
  const start = (page - 1) * pageSize;
  const paginated = list.slice(start, start + pageSize);

  return {
    patients: paginated,
    total,
    page,
    pageSize,
  };
}

/**
 * Fetch unpaid invoices for Quick Billing list.
 */
export async function getPendingInvoices() {
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('invoices')
        .select('*, patients(*), visits(*, doctors(*, profiles!user_id(full_name), departments(*)))')
        .eq('status', 'Unpaid')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) return data as any[];
    } catch (err) {
      console.warn('Supabase getPendingInvoices fallback to local:', err);
    }
  }

  // Local fallback
  const invoices = await getLocalInvoices();
  const patients = await getLocalPatients();
  const visits = await getLocalVisits();
  const doctors = await getLocalDoctors();

  const unpaid = invoices.filter((i) => i.status === 'Unpaid');

  return unpaid.map((inv) => {
    const pat = patients.find((p) => Number(p.id) === Number(inv.patient_id)) || patients[0];
    const vis = visits.find((v) => Number(v.id) === Number(inv.visit_id)) || visits[0];
    const doc = doctors.find((d) => Number(d.id) === Number(vis?.doctor_id)) || doctors[0];

    return {
      ...inv,
      patients: pat,
      visits: {
        ...vis,
        doctors: doc,
      },
    };
  });
}

/**
 * Treatments & Procedures
 */
export async function createTreatment(data: {
  patient_id: number;
  diagnosis_name: string;
  diagnosis_type: string;
  treatment_amount: number;
  payment_mode: string;
}) {
  if (isSupabaseConfigured) {
    try {
      const { data: created } = await supabase
        .from('treatments')
        .insert({
          ...data,
          treatment_number: `TRT-${Date.now().toString().slice(-6)}`,
        })
        .select('*, patients(*)')
        .single();
      if (created) return created;
    } catch (err) {
      console.warn('Supabase createTreatment fallback:', err);
    }
  }

  const patients = await getLocalPatients();
  const pat = patients.find((p) => Number(p.id) === Number(data.patient_id)) || patients[0];

  return {
    id: Date.now(),
    treatment_number: `TRT-${Date.now().toString().slice(-6)}`,
    patient_id: data.patient_id,
    diagnosis_name: data.diagnosis_name,
    diagnosis_type: data.diagnosis_type,
    treatment_amount: data.treatment_amount,
    payment_mode: data.payment_mode,
    status: 'Paid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    patients: pat,
  };
}

export async function getTreatmentsList(searchQuery?: string) {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('treatments').select('*, patients(*)').order('created_at', { ascending: false });
      if (searchQuery) query = query.ilike('diagnosis_name', `%${searchQuery.trim()}%`);
      const { data } = await query;
      if (data && data.length > 0) return data as any[];
    } catch (err) {
      console.warn('Supabase getTreatmentsList fallback:', err);
    }
  }

  return [];
}

export async function updateTreatment(id: number, data: any) {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('treatments').update(data).eq('id', id);
    } catch (err) {
      console.warn('Supabase updateTreatment warning:', err);
    }
  }
}

export async function deleteTreatment(id: number) {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('treatments').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteTreatment warning:', err);
    }
  }
}
