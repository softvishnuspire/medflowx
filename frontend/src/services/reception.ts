import { supabase } from '@/lib/supabaseClient';
import { socket } from '@/lib/socket';
import { PatientFormValues, VisitFormValues, PaymentFormValues } from '@/features/reception/schemas';
import { Patient, Doctor, Department, Visit, Invoice, Payment } from '@/types/reception';

/**
 * Fetch Reception Dashboard stats in a single database aggregation phase.
 */
export async function getDashboardStats() {
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
      .then((r: any) => r.data || [])
  ]);

  const revenue = paymentsData.reduce((sum: number, item: any) => sum + Number(item.amount), 0);

  return {
    todayPatients: patientsCount,
    todayVisits: visitsCount,
    waitingPatients: waitingCount,
    completedVisits: completedCount,
    todayRevenue: revenue,
  };
}

/**
 * Advanced patient search supporting autocomplete filter.
 * Matches: Phone (Primary), Code, Name (Partial).
 */
export async function searchPatients(query: string) {
  if (!query || query.trim() === '') {
    const { data } = await supabase
      .from('patients')
      .select('*, patient_addresses(*)')
      .order('created_at', { ascending: false })
      .limit(10);
    return (data || []) as Patient[];
  }

  const cleanQuery = query.trim();
  const { data, error } = await supabase
    .from('patients')
    .select('*, patient_addresses(*)')
    .or(
      `phone.ilike.%${cleanQuery}%,patient_code.ilike.%${cleanQuery}%,first_name.ilike.%${cleanQuery}%,last_name.ilike.%${cleanQuery}%`
    )
    .limit(20);

  if (error) throw error;
  return (data || []) as Patient[];
}

/**
 * Fetch patient by ID with address and history.
 */
export async function getPatientById(id: number) {
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('*, patient_addresses(*)')
    .eq('id', id)
    .single();

  if (patientError) throw patientError;

  const { data: visits, error: visitsError } = await supabase
    .from('visits')
    .select('*, doctors(id, qualification, consultation_fee, profiles!user_id(full_name)), departments(department_name)')
    .eq('patient_id', id)
    .order('visit_date', { ascending: false });

  if (visitsError) throw visitsError;

  return {
    patient: patient as Patient,
    visits: (visits || []) as any[],
  };
}

/**
 * Patient search by phone number to prevent duplicates.
 */
export async function checkPhoneUnique(phone: string, excludeId?: number) {
  let query = supabase
    .from('patients')
    .select('id')
    .eq('phone', phone.trim());

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data } = await query;
  return !data || data.length === 0;
}

/**
 * Register new patient and insert address.
 */
export async function registerPatient(patientData: PatientFormValues) {
  const isUnique = await checkPhoneUnique(patientData.phone);
  if (!isUnique) {
    throw new Error('A patient with this phone number already exists.');
  }

  const { data: patient, error: patientError } = await supabase
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

  if (patientError) throw patientError;

  const { data: address, error: addressError } = await supabase
    .from('patient_addresses')
    .insert({
      patient_id: patient.id,
      address_line: patientData.address_line,
      city: patientData.city,
      district: patientData.district || null,
      state: patientData.state,
      country: patientData.country || 'India',
      pincode: patientData.pincode,
    })
    .select()
    .single();

  if (addressError) {
    await supabase.from('patients').delete().eq('id', patient.id);
    throw addressError;
  }

  return {
    patient: patient as Patient,
    address,
  };
}

/**
 * Fetch departments list.
 */
export async function getDepartments() {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('department_name', { ascending: true });

  if (error) throw error;
  return data as Department[];
}

/**
 * Fetch doctors joined with department and user profile.
 */
export async function getDoctors() {
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

/**
 * Create visit and associate a pending invoice.
 */
export async function createVisit(visitData: VisitFormValues) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const { count, error: countError } = await supabase
    .from('visits')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', visitData.doctor_id)
    .gte('visit_date', startOfDay.toISOString())
    .lte('visit_date', endOfDay.toISOString());

  if (countError) throw countError;
  const tokenNo = (count || 0) + 1;

  const { data: visit, error: visitError } = await supabase
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

  if (visitError) throw visitError;

  const fee = visitData.consultation_fee || 0;
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      visit_id: visit.id,
      patient_id: visitData.patient_id,
      total_amount: fee,
      discount: 0,
      tax: 0,
      final_amount: fee,
      paid_amount: 0,
      status: 'Unpaid',
    })
    .select()
    .single();

  if (invoiceError) {
    await supabase.from('visits').delete().eq('id', visit.id);
    throw invoiceError;
  }

  const { data: finalVisit } = await supabase
    .from('visits')
    .select('*, patients(*), doctors(*, profiles!user_id(full_name)), departments(*)')
    .eq('id', visit.id)
    .single();

  // Socket update emission
  try {
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('update-queue', { visitId: visit.id, status: 'Created' });
  } catch (err) {
    console.error('Socket emission failed:', err);
  }

  return {
    visit: finalVisit as Visit,
    invoice: invoice as Invoice,
  };
}

/**
 * Record payment for consultation fee, set invoice status to Paid, and update visit to Waiting.
 */
export async function collectPayment(paymentData: PaymentFormValues) {
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      invoice_id: paymentData.invoice_id,
      amount: paymentData.amount,
      payment_mode: paymentData.payment_mode,
      payment_status: 'Paid',
      paid_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (paymentError) throw paymentError;

  const { error: invoiceError } = await supabase
    .from('invoices')
    .update({
      status: 'Paid',
      paid_amount: paymentData.amount,
    })
    .eq('id', paymentData.invoice_id);

  if (invoiceError) throw invoiceError;

  const { error: visitError } = await supabase
    .from('visits')
    .update({
      status: 'Waiting',
    })
    .eq('id', paymentData.visit_id);

  if (visitError) throw visitError;

  // Socket update emission
  try {
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('update-queue', { visitId: paymentData.visit_id, status: 'Waiting' });
  } catch (err) {
    console.error('Socket emission failed:', err);
  }

  return payment as Payment;
}

/**
 * Get active queue visits for today.
 */
export async function getTodayQueue() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
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

  if (error) throw error;
  return data as any[];
}

/**
 * Get list of all patients with filters & pagination.
 */
export async function getPatientsList(filters: {
  code?: string;
  name?: string;
  phone?: string;
  gender?: string;
}, page = 1, pageSize = 10) {
  let query = supabase
    .from('patients')
    .select('*, patient_addresses(*)', { count: 'exact' });

  if (filters.code) {
    query = query.ilike('patient_code', `%${filters.code.trim()}%`);
  }
  if (filters.phone) {
    query = query.ilike('phone', `%${filters.phone.trim()}%`);
  }
  if (filters.gender && filters.gender !== 'All') {
    query = query.eq('gender', filters.gender);
  }
  if (filters.name) {
    query = query.or(`first_name.ilike.%${filters.name.trim()}%,last_name.ilike.%${filters.name.trim()}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    patients: (data || []) as Patient[],
    total: count || 0,
    page,
    pageSize,
  };
}

/**
 * Fetch unpaid invoices for Quick Billing list.
 */
export async function getPendingInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, patients(*), visits(*, doctors(*, profiles!user_id(full_name)), departments(*))')
    .eq('status', 'Unpaid')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as any[];
}
