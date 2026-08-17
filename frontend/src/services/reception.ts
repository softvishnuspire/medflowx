import { supabase } from '@/lib/supabaseClient';
import { socket } from '@/lib/socket';
import { PatientFormValues, VisitFormValues, PaymentFormValues, TreatmentFormValues } from '@/features/reception/schemas';
import { Patient, Doctor, Department, Visit, Invoice, Payment, Treatment } from '@/types/reception';

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
 * Helper to upload prescription image (JPG/PNG) to Supabase Storage or convert to base64 fallback.
 */
export async function uploadPrescriptionPhoto(file: File): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error } = await supabase.storage
      .from('prescriptions')
      .upload(fileName, file);

    if (!error) {
      const { data: publicUrlData } = supabase.storage
        .from('prescriptions')
        .getPublicUrl(fileName);
      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    } else {
      console.warn('Storage upload error details:', error.message);
    }
  } catch (err) {
    console.warn('Supabase storage upload fallback to Base64:', err);
  }

  // Fallback to Base64 Data URL if storage bucket is unavailable
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Submit physical prescription images and cost for a visit.
 */
export async function submitPhysicalPrescription(params: {
  visitId: number | string;
  frontImage: File;
  backImage?: File | null;
  amount: number;
  paymentMode?: 'Cash' | 'Card' | 'UPI';
  patientId?: number | string;
}) {
  const paymentMode = params.paymentMode || 'Cash';
  const frontUrl = await uploadPrescriptionPhoto(params.frontImage);
  let backUrl: string | null = null;
  if (params.backImage) {
    backUrl = await uploadPrescriptionPhoto(params.backImage);
  }

  const rxPayload = JSON.stringify({
    type: 'PHYSICAL_PRESCRIPTION',
    front: frontUrl,
    back: backUrl,
    amount: params.amount,
    payment_mode: paymentMode,
  });

  // Always insert into prescriptions table for 100% database compatibility
  const { error: rxInsertErr } = await supabase.from('prescriptions').insert({
    visit_id: params.visitId,
    advice: rxPayload,
  });

  if (rxInsertErr) {
    console.warn('Could not insert into prescriptions table:', rxInsertErr.message);
  }

  // Attempt updating visits table directly if columns exist
  try {
    await supabase
      .from('visits')
      .update({
        prescription_image_front: frontUrl,
        prescription_image_back: backUrl,
        prescription_amount: params.amount,
        status: 'Prescribed',
      })
      .eq('id', params.visitId);
  } catch (e: any) {
    console.warn('Direct visits column update skipped:', e.message);
  }

  // Always update visit status to Prescribed
  const { data: updatedVisit } = await supabase
    .from('visits')
    .update({ status: 'Prescribed' })
    .eq('id', params.visitId)
    .select('*, patients(*)')
    .single();

  const patientId = params.patientId || updatedVisit?.patient_id;

  // 1. Find or create invoice for this visit
  let targetInvoiceId: number | string | null = null;
  try {
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('visit_id', params.visitId)
      .maybeSingle();

    if (existingInvoice?.id) {
      targetInvoiceId = existingInvoice.id;
      await supabase
        .from('invoices')
        .update({
          total_amount: params.amount,
          final_amount: params.amount,
          paid_amount: params.amount,
          status: 'Paid',
        })
        .eq('id', existingInvoice.id);
    } else if (patientId) {
      const { data: newInvoice } = await supabase
        .from('invoices')
        .insert({
          visit_id: params.visitId,
          patient_id: patientId,
          total_amount: params.amount,
          discount: 0,
          tax: 0,
          final_amount: params.amount,
          paid_amount: params.amount,
          status: 'Paid',
        })
        .select()
        .single();
      if (newInvoice?.id) targetInvoiceId = newInvoice.id;
    }
  } catch (invErr) {
    console.warn('Invoice creation/update failed:', invErr);
  }

  // 2. Insert Payment Record into payments table so Admin Panel reflects revenue & payment mode summary
  let paymentRecord: any = null;
  if (targetInvoiceId) {
    try {
      const { data: payData } = await supabase
        .from('payments')
        .insert({
          invoice_id: targetInvoiceId,
          amount: params.amount,
          payment_mode: paymentMode,
          payment_status: 'Paid',
          paid_at: new Date().toISOString(),
        })
        .select()
        .single();
      paymentRecord = payData;
    } catch (payErr) {
      console.warn('Payment insert failed:', payErr);
    }
  }

  // 3. Record entry in pharmacy_sales table so Admin Statistics reflects pharmacy category breakdown
  try {
    await supabase.from('pharmacy_sales').insert({
      visit_id: params.visitId,
      patient_id: patientId || null,
      total_amount: params.amount,
      discount: 0,
      final_amount: params.amount,
      payment_mode: paymentMode,
      status: 'Completed',
      created_at: new Date().toISOString(),
    });
  } catch (pharmErr) {
    console.warn('Pharmacy sales insert skipped/failed:', pharmErr);
  }

  // 4. Update LocalStorage fallback for offline / mock mode compatibility
  if (typeof window !== 'undefined') {
    try {
      const localPayments = JSON.parse(localStorage.getItem('medflowx_payments') || '[]');
      const newPayment = {
        id: paymentRecord?.id || Date.now(),
        invoice_id: targetInvoiceId || Date.now(),
        amount: params.amount,
        payment_mode: paymentMode,
        payment_status: 'Paid',
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('medflowx_payments', JSON.stringify([newPayment, ...localPayments]));

      const localPharmacySales = JSON.parse(localStorage.getItem('medflowx_pharmacy_sales') || '[]');
      const newSale = {
        id: Date.now(),
        visit_id: params.visitId,
        total_amount: params.amount,
        final_amount: params.amount,
        payment_mode: paymentMode,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('medflowx_pharmacy_sales', JSON.stringify([newSale, ...localPharmacySales]));
    } catch (lsErr) {
      console.error('LocalStorage update error:', lsErr);
    }
  }

  // Socket notification for queue sync
  try {
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('update-queue', { visitId: params.visitId, status: 'Prescribed' });
  } catch (err) {
    console.error('Socket emission failed:', err);
  }

  return updatedVisit;
}

/**
 * Advanced patient search supporting autocomplete filter.
 * Matches: Phone (Primary), Name (Partial).
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
      `phone.ilike.%${cleanQuery}%,first_name.ilike.%${cleanQuery}%,last_name.ilike.%${cleanQuery}%,patient_code.ilike.%${cleanQuery}%`
    )
    .limit(20);

  if (error) throw error;
  return (data || []) as Patient[];
}

/**
 * Fetch patient by ID with full visit history and prescription images.
 */
export async function getPatientById(id: number | string) {
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('*, patient_addresses(*)')
    .eq('id', id)
    .single();

  if (patientError) throw patientError;

  const { data: visits, error: visitsError } = await supabase
    .from('visits')
    .select('*, doctors(id, qualification, consultation_fee, profiles!user_id(full_name), departments(department_name)), prescriptions(*)')
    .eq('patient_id', id)
    .order('visit_date', { ascending: false });

  if (visitsError) throw visitsError;

  return {
    patient: patient as Patient,
    visits: (visits || []) as any[],
  };
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

  const isFirst = await checkIsFirstVisit(visitData.patient_id);
  const fee = isFirst ? (visitData.consultation_fee || 0) : 0;
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

  const { data: finalVisit, error: finalVisitError } = await supabase
    .from('visits')
    .select('*, patients(*), doctors(*, profiles!user_id(full_name), departments(*))')
    .eq('id', visit.id)
    .single();

  if (finalVisitError) throw finalVisitError;

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
      address_line: patientData.address_line || patientData.city || 'N/A',
      city: patientData.city,
      district: patientData.district || null,
      state: patientData.state,
      country: patientData.country || 'India',
      pincode: patientData.pincode || '000000',
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
 * Check if a patient has any previous visits in the system.
 */
export async function checkIsFirstVisit(patientId: number): Promise<boolean> {
  const { count, error } = await supabase
    .from('visits')
    .select('id', { count: 'exact', head: true })
    .eq('patient_id', patientId);

  if (error) throw error;
  return (count || 0) === 0;
}

/**
 * Record payment for consultation fee, set invoice status to Paid, and update visit to Waiting.
 */
export async function collectPayment(paymentData: PaymentFormValues) {
  let targetInvoiceId = paymentData.invoice_id;

  // Safeguard: Ensure invoice_id is valid and exists in invoices table
  if (!targetInvoiceId || targetInvoiceId === 0) {
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('visit_id', paymentData.visit_id)
      .maybeSingle();

    if (existingInvoice?.id) {
      targetInvoiceId = existingInvoice.id;
    } else {
      const { data: newInvoice, error: invCreateErr } = await supabase
        .from('invoices')
        .insert({
          visit_id: paymentData.visit_id,
          patient_id: 1,
          total_amount: paymentData.amount,
          discount: 0,
          tax: 0,
          final_amount: paymentData.amount,
          paid_amount: 0,
          status: 'Unpaid',
        })
        .select()
        .single();

      if (invCreateErr) throw invCreateErr;
      targetInvoiceId = newInvoice.id;
    }
  }

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      invoice_id: targetInvoiceId,
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
    .eq('id', targetInvoiceId);

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
    .select('*, patients(*), visits(*, doctors(*, profiles!user_id(full_name), departments(*)))')
    .eq('status', 'Unpaid')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as any[];
}

/**
 * Local storage key for offline/fallback treatment records
 */
const TREATMENTS_STORAGE_KEY = 'medflowx_treatments_records';

function getLocalTreatments(): Treatment[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TREATMENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse local treatments:', e);
    return [];
  }
}

function saveLocalTreatment(record: Treatment) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalTreatments();
    const updated = [record, ...existing.filter(t => t.id !== record.id)];
    localStorage.setItem(TREATMENTS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save local treatment record:', e);
  }
}

/**
 * Record a new treatment and billing transaction for a patient.
 */
export async function createTreatment(treatmentData: TreatmentFormValues, createdBy?: string): Promise<Treatment> {
  const trtNum = `TRT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10000 + Math.random() * 90000)}`;

  let insertedData: Treatment | null = null;

  try {
    const { data, error } = await supabase
      .from('treatments')
      .insert({
        treatment_number: trtNum,
        patient_id: treatmentData.patient_id,
        diagnosis_name: treatmentData.diagnosis_name,
        diagnosis_type: treatmentData.diagnosis_type,
        treatment_amount: treatmentData.treatment_amount,
        payment_mode: treatmentData.payment_mode,
        status: 'Paid',
        created_by: createdBy || null,
      })
      .select('*, patients(*)')
      .single();

    if (!error && data) {
      insertedData = data as Treatment;
    }
  } catch (err) {
    console.warn('Supabase insert failed or table not found, using robust fallback storage:', err);
  }

  // Fallback if Supabase table is not migrated or returns error
  if (!insertedData) {
    // Fetch patient details if available
    let patientDetails: Patient | undefined = undefined;
    try {
      const { data: p } = await supabase.from('patients').select('*').eq('id', treatmentData.patient_id).single();
      if (p) patientDetails = p as Patient;
    } catch (e) {
      console.warn('Could not fetch patient details for treatment fallback:', e);
    }

    insertedData = {
      id: Date.now(),
      treatment_number: trtNum,
      patient_id: treatmentData.patient_id,
      diagnosis_name: treatmentData.diagnosis_name,
      diagnosis_type: treatmentData.diagnosis_type,
      treatment_amount: Number(treatmentData.treatment_amount),
      payment_mode: treatmentData.payment_mode,
      status: 'Paid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: createdBy || 'Reception Desk',
      patients: patientDetails,
    };
  }

  saveLocalTreatment(insertedData);
  return insertedData;
}

/**
 * Retrieve all treatment records with optional search filter.
 */
export async function getTreatmentsList(searchQuery?: string): Promise<Treatment[]> {
  let dbTreatments: Treatment[] = [];

  try {
    let query = supabase
      .from('treatments')
      .select('*, patients(*)');

    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data) {
      dbTreatments = data as Treatment[];
    }
  } catch (err) {
    console.warn('Supabase fetch for treatments failed or table not found:', err);
  }

  const localTreatments = getLocalTreatments();
  
  // Merge remote and local records avoiding duplicates by ID or treatment_number
  const map = new Map<string, Treatment>();
  [...dbTreatments, ...localTreatments].forEach(item => {
    const key = item.treatment_number || String(item.id);
    if (!map.has(key)) {
      map.set(key, item);
    }
  });

  let combined = Array.from(map.values()).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (searchQuery && searchQuery.trim() !== '') {
    const q = searchQuery.trim().toLowerCase();
    combined = combined.filter(t => {
      const pName = t.patients ? `${t.patients.first_name} ${t.patients.last_name || ''}`.toLowerCase() : '';
      const pCode = t.patients ? t.patients.patient_code.toLowerCase() : '';
      const diag = t.diagnosis_name.toLowerCase();
      const num = t.treatment_number.toLowerCase();
      return pName.includes(q) || pCode.includes(q) || diag.includes(q) || num.includes(q);
    });
  }

  return combined;
}

function updateLocalTreatment(id: number, updatedFields: Partial<Treatment>) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalTreatments();
    const updated = existing.map((item) => {
      if (item.id === id) {
        return { ...item, ...updatedFields, updated_at: new Date().toISOString() };
      }
      return item;
    });
    localStorage.setItem(TREATMENTS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update local treatment:', e);
  }
}

function deleteLocalTreatment(id: number) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalTreatments();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(TREATMENTS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete local treatment:', e);
  }
}

/**
 * Update an existing treatment record.
 */
export async function updateTreatment(id: number, updateData: Partial<TreatmentFormValues>): Promise<void> {
  try {
    const { error } = await supabase
      .from('treatments')
      .update({
        diagnosis_name: updateData.diagnosis_name,
        diagnosis_type: updateData.diagnosis_type,
        treatment_amount: updateData.treatment_amount,
        payment_mode: updateData.payment_mode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.warn('Supabase update failed or table not present:', error);
    }
  } catch (err) {
    console.warn('Supabase update exception:', err);
  }

  updateLocalTreatment(id, updateData as Partial<Treatment>);
}

/**
 * Delete a treatment record.
 */
export async function deleteTreatment(id: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('treatments')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase delete failed or table not present:', error);
    }
  } catch (err) {
    console.warn('Supabase delete exception:', err);
  }

  deleteLocalTreatment(id);
}


