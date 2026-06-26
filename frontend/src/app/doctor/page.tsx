'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { socket } from '../../lib/socket';
import {
  Activity,
  User,
  Clock,
  Search,
  FileText,
  CheckCircle,
  AlertCircle,
  Trash2,
  Plus,
  Printer,
  X,
  ChevronRight,
  History,
  FileSpreadsheet,
  Database,
  RotateCw
} from 'lucide-react';

interface Medicine {
  id: string;
  medicine_name: string;
  generic_name: string;
  strength: string;
  manufacturer: string;
}

interface PrescriptionItemInput {
  medicineId: string;
  medicineName: string;
  genericName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
}

interface Visit {
  id: string;
  visit_number: string;
  visit_date: string;
  token_no: number;
  chief_complaint: string;
  status: 'Created' | 'Waiting' | 'In Progress' | 'Prescribed' | 'Sent to Pharmacy' | 'Dispensed' | 'Closed' | 'Cancelled';
  patient_id: string;
  patients: {
    patient_code: string;
    first_name: string;
    last_name: string;
    gender: string;
    dob: string;
    age: number;
    phone: string;
    allergies: string;
    medical_history: string;
  };
}

interface Doctor {
  id: string;
  user_id: string;
  qualification: string;
  consultation_fee: number;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface PastVisit {
  id: string;
  visit_date: string;
  visit_number: string;
  chief_complaint: string;
  status: string;
  diagnoses: Array<{
    symptoms: string;
    clinical_findings: string;
    diagnosis: string;
    doctor_notes: string;
    follow_up_advice: string;
  }>;
  prescriptions: Array<{
    advice: string;
    follow_up_date: string;
    prescription_items: Array<{
      id: string;
      dosage: string;
      frequency: string;
      duration: string;
      quantity: number;
      instructions: string;
      medicines: {
        medicine_name: string;
        strength: string;
      };
    }>;
  }>;
}

export default function DoctorPage() {
  // Doctor states
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  // Real-time Queue Connection
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Visits Queue states
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(true);
  const [queueTab, setQueueTab] = useState<'waiting' | 'completed'>('waiting');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active Consultation states
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [activeTab, setActiveTab] = useState<'consult' | 'history'>('consult');
  
  // Patient History states
  const [pastVisits, setPastVisits] = useState<PastVisit[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Form Inputs
  const [symptoms, setSymptoms] = useState('');
  const [clinicalFindings, setClinicalFindings] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [followUpAdvice, setFollowUpAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  
  // Prescription Builder states
  const [prescribedItems, setPrescribedItems] = useState<PrescriptionItemInput[]>([]);
  const [medSearchQuery, setMedSearchQuery] = useState('');
  const [suggestedMedicines, setSuggestedMedicines] = useState<Medicine[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  
  // Individual Prescription Item fields
  const [dosage, setDosage] = useState('1-0-1');
  const [frequency, setFrequency] = useState('Daily');
  const [duration, setDuration] = useState('5 Days');
  const [quantity, setQuantity] = useState(10);
  const [instructions, setInstructions] = useState('Take after meals');
  
  // PDF / Print Prescription states
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printedPrescriptionData, setPrintedPrescriptionData] = useState<{
    visit: Visit;
    doctor: Doctor;
    diagnosis: {
      symptoms: string;
      clinical_findings: string;
      diagnosis: string;
      doctor_notes: string;
      follow_up_advice: string;
    };
    prescriptionItems: PrescriptionItemInput[];
    followUpDate: string;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Initialize Socket.io and fetch Doctors
  useEffect(() => {
    fetchDoctors();
    
    // Connect socket
    socket.connect();
    
    function onConnect() {
      setSocketConnected(true);
      socket.emit('join-room', 'hospital');
    }
    
    function onDisconnect() {
      setSocketConnected(false);
    }
    
    function onQueueUpdated() {
      console.log('Received queue-updated broadcast. Refreshing visits...');
      if (selectedDoctor) {
        fetchVisits(selectedDoctor.id);
      }
    }
    
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('queue-updated', onQueueUpdated);
    
    if (socket.connected) {
      onConnect();
    }
    
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('queue-updated', onQueueUpdated);
      socket.disconnect();
    };
  }, []);

  // Refresh visits when selected doctor changes
  useEffect(() => {
    if (selectedDoctor) {
      fetchVisits(selectedDoctor.id);
      setSelectedVisit(null);
      resetConsultationForm();
    }
  }, [selectedDoctor]);

  // Fetch patient history when selected visit/patient changes
  useEffect(() => {
    if (selectedVisit) {
      fetchPatientHistory(selectedVisit.patient_id, selectedVisit.id);
      // Prepopulate symptoms from visit chief complaint
      setSymptoms(selectedVisit.chief_complaint || '');
    }
  }, [selectedVisit]);

  // Handle clicking outside medicine autocomplete suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search medicines when query changes
  useEffect(() => {
    if (medSearchQuery.trim().length > 1) {
      searchMedicines(medSearchQuery);
    } else {
      setSuggestedMedicines([]);
    }
  }, [medSearchQuery]);

  // Fetch doctors list
  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          id,
          user_id,
          qualification,
          consultation_fee,
          profiles:profiles!user_id (
            full_name,
            email
          )
        `);
      if (error) throw error;
      
      const formattedDoctors = (data || []) as unknown as Doctor[];
      setDoctors(formattedDoctors);
      if (formattedDoctors.length > 0) {
        setSelectedDoctor(formattedDoctors[0]);
      }
    } catch (error: any) {
      console.error('Error fetching doctors:', error.message);
    }
  };

  // Fetch visits for the selected doctor
  const fetchVisits = async (doctorId: string) => {
    setLoadingVisits(true);
    try {
      // Query visits that are created today or active
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id,
          visit_number,
          visit_date,
          token_no,
          chief_complaint,
          status,
          patient_id,
          patients (
            patient_code,
            first_name,
            last_name,
            gender,
            dob,
            age,
            phone,
            allergies,
            medical_history
          )
        `)
        .eq('doctor_id', doctorId)
        .order('token_no', { ascending: true });

      if (error) throw error;
      
      const formattedVisits = (data || []) as unknown as Visit[];
      setVisits(formattedVisits);
    } catch (error: any) {
      console.error('Error fetching visits:', error.message);
    } finally {
      setLoadingVisits(false);
    }
  };

  // Fetch patient medical history (past visits)
  const fetchPatientHistory = async (patientId: string, currentVisitId: string) => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id,
          visit_date,
          visit_number,
          chief_complaint,
          status,
          diagnoses (
            symptoms,
            clinical_findings,
            diagnosis,
            doctor_notes,
            follow_up_advice
          ),
          prescriptions (
            advice,
            follow_up_date,
            prescription_items (
              id,
              dosage,
              frequency,
              duration,
              quantity,
              instructions,
              medicines (
                medicine_name,
                strength
              )
            )
          )
        `)
        .eq('patient_id', patientId)
        .neq('id', currentVisitId) // Exclude current active visit
        .order('visit_date', { ascending: false });

      if (error) throw error;
      setPastVisits((data || []) as unknown as PastVisit[]);
    } catch (error: any) {
      console.error('Error fetching patient history:', error.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Search medicines autocomplete
  const searchMedicines = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('id, medicine_name, generic_name, strength, manufacturer')
        .or(`medicine_name.ilike.%${query}%,generic_name.ilike.%${query}%`)
        .limit(8);

      if (error) throw error;
      setSuggestedMedicines(data || []);
      setShowSuggestions(true);
    } catch (error: any) {
      console.error('Error searching medicines:', error.message);
    }
  };

  // Add prescription item to builder
  const handleAddPrescriptionItem = () => {
    if (!selectedMedicine) {
      setErrorMsg('Please select a medicine from suggestions.');
      return;
    }
    
    // Check if medicine already added
    if (prescribedItems.some(item => item.medicineId === selectedMedicine.id)) {
      setErrorMsg('This medicine is already added to the prescription.');
      return;
    }

    const newItem: PrescriptionItemInput = {
      medicineId: selectedMedicine.id,
      medicineName: selectedMedicine.medicine_name,
      genericName: selectedMedicine.generic_name || '',
      dosage,
      frequency,
      duration,
      quantity,
      instructions
    };

    setPrescribedItems([...prescribedItems, newItem]);
    
    // Reset individual selection inputs
    setSelectedMedicine(null);
    setMedSearchQuery('');
    setErrorMsg('');
  };

  // Remove prescription item
  const handleRemovePrescriptionItem = (index: number) => {
    setPrescribedItems(prescribedItems.filter((_, i) => i !== index));
  };

  // Put Visit in "In Progress" Status (Hold)
  const handleHoldVisit = async () => {
    if (!selectedVisit) return;
    
    try {
      setSaving(true);
      setErrorMsg('');
      
      const { error: visitErr } = await supabase
        .from('visits')
        .update({ status: 'In Progress' })
        .eq('id', selectedVisit.id);

      if (visitErr) throw visitErr;

      // Add status history record
      await supabase.from('visit_status_history').insert({
        visit_id: selectedVisit.id,
        status: 'In Progress',
        remarks: 'Doctor started consultation (status: In Progress)',
        changed_by: selectedDoctor?.user_id
      });

      setSuccessMsg('Visit status set to In Progress.');
      
      // Notify socket
      socket.emit('update-queue', { visitId: selectedVisit.id, status: 'In Progress' });
      
      // Refresh local queue
      if (selectedDoctor) {
        fetchVisits(selectedDoctor.id);
      }
      
      // Update selected visit state status
      setSelectedVisit({
        ...selectedVisit,
        status: 'In Progress'
      });
    } catch (error: any) {
      setErrorMsg(`Error putting visit on hold: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Submit Consultation & Save to Supabase (creates Diagnosis, Prescription, PrescriptionItems, updates Visit to Sent to Pharmacy)
  const handleSubmitConsultation = async () => {
    if (!selectedVisit || !selectedDoctor) return;
    if (!diagnosis.trim()) {
      setErrorMsg('Diagnosis is a required field.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');
      setSuccessMsg('');

      // 1. Insert Diagnosis
      const { error: diagErr } = await supabase.from('diagnoses').insert({
        visit_id: selectedVisit.id,
        symptoms,
        clinical_findings: clinicalFindings,
        diagnosis,
        doctor_notes: doctorNotes,
        follow_up_advice: followUpAdvice,
        created_by: selectedDoctor.user_id
      });

      if (diagErr) throw diagErr;

      // 2. Insert Prescription (if there are items or advice)
      let prescriptionId: string | null = null;
      if (prescribedItems.length > 0 || followUpAdvice || followUpDate) {
        const { data: presData, error: presErr } = await supabase
          .from('prescriptions')
          .insert({
            visit_id: selectedVisit.id,
            doctor_id: selectedDoctor.id,
            advice: followUpAdvice,
            follow_up_date: followUpDate ? followUpDate : null,
            created_by: selectedDoctor.user_id
          })
          .select()
          .single();

        if (presErr) throw presErr;
        prescriptionId = presData.id;

        // 3. Insert Prescription Items
        if (prescribedItems.length > 0 && prescriptionId) {
          const itemsToInsert = prescribedItems.map(item => ({
            prescription_id: prescriptionId,
            medicine_id: item.medicineId,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            quantity: item.quantity,
            instructions: item.instructions,
            created_by: selectedDoctor.user_id
          }));

          const { error: itemsErr } = await supabase.from('prescription_items').insert(itemsToInsert);
          if (itemsErr) throw itemsErr;
        }
      }

      // 4. Update Visit Status to 'Sent to Pharmacy' (or 'Prescribed')
      const visitStatusUpdate = prescribedItems.length > 0 ? 'Sent to Pharmacy' : 'Closed';
      const { error: visitErr } = await supabase
        .from('visits')
        .update({ status: visitStatusUpdate })
        .eq('id', selectedVisit.id);

      if (visitErr) throw visitErr;

      // 5. Add status history
      await supabase.from('visit_status_history').insert({
        visit_id: selectedVisit.id,
        status: visitStatusUpdate,
        remarks: `Consultation complete. ${prescribedItems.length > 0 ? 'Sent to pharmacy for medicine collection.' : 'Visit closed.'}`,
        changed_by: selectedDoctor.user_id
      });

      // 6. Set Printable Prescription Data and Open Print modal
      setPrintedPrescriptionData({
        visit: selectedVisit,
        doctor: selectedDoctor,
        diagnosis: {
          symptoms,
          clinical_findings: clinicalFindings,
          diagnosis,
          doctor_notes: doctorNotes,
          follow_up_advice: followUpAdvice
        },
        prescriptionItems: prescribedItems,
        followUpDate: followUpDate
      });
      setShowPrintModal(true);

      setSuccessMsg('Consultation completed successfully!');
      
      // 7. Notify other clients of queue update
      socket.emit('update-queue', { visitId: selectedVisit.id, status: visitStatusUpdate });

      // Clean up and refresh
      resetConsultationForm();
      setSelectedVisit(null);
      fetchVisits(selectedDoctor.id);
    } catch (error: any) {
      setErrorMsg(`Database error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const resetConsultationForm = () => {
    setSymptoms('');
    setClinicalFindings('');
    setDiagnosis('');
    setDoctorNotes('');
    setFollowUpAdvice('');
    setFollowUpDate('');
    setPrescribedItems([]);
    setMedSearchQuery('');
    setSelectedMedicine(null);
    setErrorMsg('');
  };

  // Filtered visits for current queue view
  const filteredVisits = visits.filter(visit => {
    // Tab filter
    const isCompleted = ['Prescribed', 'Sent to Pharmacy', 'Dispensed', 'Closed'].includes(visit.status);
    if (queueTab === 'waiting' && isCompleted) return false;
    if (queueTab === 'completed' && !isCompleted) return false;

    // Search filter
    if (searchQuery.trim()) {
      const name = `${visit.patients?.first_name || ''} ${visit.patients?.last_name || ''}`.toLowerCase();
      const code = (visit.patients?.patient_code || '').toLowerCase();
      const num = (visit.visit_number || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      return name.includes(query) || code.includes(query) || num.includes(query);
    }
    return true;
  });

  return (
    <div className="flex flex-1 flex-col bg-slate-900 text-slate-100 font-sans min-h-screen">
      {/* Header bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center">
            <Activity className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              MedflowX <span className="text-indigo-400 font-normal">Doctor Panel</span>
            </h1>
            <p className="text-xs text-slate-400">Integrated Medical EHR & Queue Management</p>
          </div>
        </div>

        {/* Status indicator and Doctor select */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <div className={`h-2.5 w-2.5 rounded-full ${socketConnected ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
            <span className="text-slate-300 font-medium">{socketConnected ? 'Live Connection Active' : 'Offline Mode'}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Dr:</span>
            <select
              value={selectedDoctor?.id || ''}
              onChange={(e) => {
                const doc = doctors.find(d => d.id === e.target.value);
                if (doc) setSelectedDoctor(doc);
              }}
              className="bg-slate-900 text-slate-100 text-sm font-semibold py-1.5 px-3 rounded-lg border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.profiles?.full_name} ({doc.qualification})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Primary Panels Dashboard */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* PANEL 1: PATIENT QUEUE (Left Column) */}
        <aside className="w-80 flex flex-col bg-slate-950/70 border-r border-slate-800 shrink-0">
          {/* Tab selector */}
          <div className="grid grid-cols-2 border-b border-slate-800 p-2 gap-1.5 bg-slate-950/40">
            <button
              onClick={() => setQueueTab('waiting')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                queueTab === 'waiting'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Waiting Queue
              {visits.filter(v => !['Prescribed', 'Sent to Pharmacy', 'Dispensed', 'Closed'].includes(v.status)).length > 0 && (
                <span className={`inline-flex items-center justify-center px-2 py-0.5 ml-1 rounded-full text-[10px] font-bold ${queueTab === 'waiting' ? 'bg-indigo-900 text-indigo-100' : 'bg-slate-800 text-slate-300'}`}>
                  {visits.filter(v => !['Prescribed', 'Sent to Pharmacy', 'Dispensed', 'Closed'].includes(v.status)).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setQueueTab('completed')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                queueTab === 'completed'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Consulted Today
            </button>
          </div>

          {/* Search visits */}
          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search patient, ID, token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 text-slate-100 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Visits Queue List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loadingVisits ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <RotateCw className="h-6 w-6 animate-spin mb-2" />
                <span className="text-xs">Loading live queue...</span>
              </div>
            ) : filteredVisits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-center px-4">
                <User className="h-10 w-10 text-slate-700 mb-2" />
                <p className="text-xs font-medium">No patients found</p>
                <p className="text-[10px] text-slate-600 mt-1">Visits checked in at reception will appear here in real-time.</p>
              </div>
            ) : (
              filteredVisits.map((visit) => {
                const isSelected = selectedVisit?.id === visit.id;
                const ptName = `${visit.patients?.first_name || ''} ${visit.patients?.last_name || ''}`;
                
                return (
                  <button
                    key={visit.id}
                    onClick={() => {
                      setSelectedVisit(visit);
                      setActiveTab('consult');
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'bg-indigo-650/20 border-indigo-500/80 shadow-lg shadow-indigo-950/50'
                        : 'bg-slate-900/60 border-slate-850 hover:bg-slate-800/40 hover:border-slate-700/60'
                    }`}
                  >
                    {/* Selected border glow */}
                    {isSelected && (
                      <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-indigo-500" />
                    )}

                    <div className="flex items-start justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {visit.visit_number}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        visit.status === 'Waiting'
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800/30'
                          : visit.status === 'In Progress'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/30 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {visit.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Large circular Token badge */}
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black shadow-inner shrink-0 ${
                        isSelected 
                          ? 'bg-indigo-600 text-white' 
                          : visit.status === 'In Progress'
                          ? 'bg-emerald-650 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {visit.token_no}
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-slate-100 text-sm truncate leading-tight group-hover:text-indigo-300 transition-colors">
                          {ptName}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {visit.patients?.age} yrs • {visit.patients?.gender}
                        </p>
                      </div>
                    </div>

                    {visit.chief_complaint && (
                      <div className="mt-2 text-xs text-slate-500 bg-slate-950/30 p-2 rounded-lg border border-slate-800/40 truncate">
                        <span className="font-medium text-slate-400">Complaint:</span> {visit.chief_complaint}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* MAIN PANEL CONTENT (Columns 2 & 3 combined into tabs or panels) */}
        {selectedVisit ? (
          <main className="flex flex-1 flex-col bg-slate-900 overflow-hidden">
            {/* Patient Header information */}
            <div className="p-5 bg-slate-950/40 border-b border-slate-850 flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-slate-800 p-3 rounded-full border border-slate-700">
                  <User className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white leading-tight">
                      {selectedVisit.patients?.first_name} {selectedVisit.patients?.last_name}
                    </h2>
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-xs font-mono text-slate-400 border border-slate-750">
                      {selectedVisit.patients?.patient_code}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span><strong>Age/Gen:</strong> {selectedVisit.patients?.age} / {selectedVisit.patients?.gender}</span>
                    <span className="text-slate-600">•</span>
                    <span><strong>Phone:</strong> {selectedVisit.patients?.phone}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-rose-400"><strong>Allergies:</strong> {selectedVisit.patients?.allergies || 'None'}</span>
                  </div>
                </div>
              </div>

              {/* Vitals Summary/Hold trigger */}
              <div className="flex items-center gap-3">
                {selectedVisit.status === 'Waiting' && (
                  <button
                    onClick={handleHoldVisit}
                    disabled={saving}
                    className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold py-2 px-4 rounded-xl hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"
                  >
                    {saving ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
                    Start Consultation
                  </button>
                )}
                
                {selectedVisit.status === 'In Progress' && (
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/40 text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-2 animate-pulse">
                    <Clock className="h-3.5 w-3.5" />
                    Consultation In Progress
                  </span>
                )}
              </div>
            </div>

            {/* Middle panel navigation (tabs) */}
            <div className="flex border-b border-slate-850 bg-slate-950/10 shrink-0">
              <button
                onClick={() => setActiveTab('consult')}
                className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'consult'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="h-4 w-4" />
                Active Consultation
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'history'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="h-4 w-4" />
                Visit History ({pastVisits.length})
              </button>
            </div>

            {/* Workspace Area split in two halves if activeTab is consult */}
            <div className="flex-1 overflow-hidden flex">
              
              {activeTab === 'consult' ? (
                <>
                  {/* Left Column: Diagnosis details */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 border-r border-slate-850">
                    
                    {/* Messages alert */}
                    {errorMsg && (
                      <div className="bg-rose-950/50 border border-rose-800 text-rose-200 p-4 rounded-xl text-xs flex items-center gap-3 shadow-inner">
                        <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
                        <div>{errorMsg}</div>
                      </div>
                    )}
                    {successMsg && (
                      <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-200 p-4 rounded-xl text-xs flex items-center gap-3 shadow-inner">
                        <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
                        <div>{successMsg}</div>
                      </div>
                    )}

                    {/* Vitals & History quick summary */}
                    <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-850 grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Known Medical Conditions</h4>
                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/40">
                          {selectedVisit.patients?.medical_history || 'No declared history.'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Chief Complaint</h4>
                        <p className="text-xs text-indigo-300 font-medium leading-relaxed bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-900/10">
                          {selectedVisit.chief_complaint || 'No complaint details.'}
                        </p>
                      </div>
                    </div>

                    {/* Form Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-white border-l-2 border-indigo-500 pl-2">Clinical Details</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Symptoms & Clinical Findings</label>
                          <textarea
                            rows={3}
                            placeholder="Enter symptoms, temperature, BP, general findings..."
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            className="w-full p-3 bg-slate-950/50 text-slate-100 text-xs rounded-xl border border-slate-850 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Clinical Examination Notes</label>
                          <textarea
                            rows={3}
                            placeholder="Clinical findings, chest sounds, throat congestion notes..."
                            value={clinicalFindings}
                            onChange={(e) => setClinicalFindings(e.target.value)}
                            className="w-full p-3 bg-slate-950/50 text-slate-100 text-xs rounded-xl border border-slate-850 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                          Diagnosis <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Primary diagnosis (e.g. Acute Viral Bronchitis, Essential Hypertension)"
                          value={diagnosis}
                          onChange={(e) => setDiagnosis(e.target.value)}
                          className="w-full p-3 bg-slate-950/50 text-slate-100 text-xs rounded-xl border border-slate-850 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">General Advice / Doctor Notes</label>
                        <textarea
                          rows={2}
                          placeholder="Lifestyle changes, dietary instructions, test suggestions..."
                          value={doctorNotes}
                          onChange={(e) => setDoctorNotes(e.target.value)}
                          className="w-full p-3 bg-slate-950/50 text-slate-100 text-xs rounded-xl border border-slate-850 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Follow-up Advice</label>
                          <input
                            type="text"
                            placeholder="e.g. Review after 5 days or if fever persists"
                            value={followUpAdvice}
                            onChange={(e) => setFollowUpAdvice(e.target.value)}
                            className="w-full p-3 bg-slate-950/50 text-slate-100 text-xs rounded-xl border border-slate-850 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Follow-up Date</label>
                          <input
                            type="date"
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                            className="w-full p-3 bg-slate-950/50 text-slate-100 text-xs rounded-xl border border-slate-850 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Prescription Builder */}
                  <div className="w-[450px] overflow-y-auto p-6 bg-slate-950/20 shrink-0 flex flex-col justify-between">
                    <div className="space-y-6">
                      <h3 className="text-sm font-bold text-white border-l-2 border-indigo-500 pl-2">Rx - Prescription Builder</h3>

                      {/* Add medicine autocomplete block */}
                      <div className="space-y-3 p-4 bg-slate-900/50 rounded-xl border border-slate-855 relative">
                        <div className="relative">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Search & Select Medicine</label>
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                            <input
                              type="text"
                              placeholder="Type medicine (e.g. Paracetamol)..."
                              value={medSearchQuery}
                              onChange={(e) => {
                                setMedSearchQuery(e.target.value);
                                if (!e.target.value) {
                                  setSelectedMedicine(null);
                                }
                              }}
                              className="w-full pl-9 pr-3 py-2 bg-slate-950 text-slate-100 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          {/* Autocomplete suggestion drop panel */}
                          {showSuggestions && suggestedMedicines.length > 0 && (
                            <div
                              ref={suggestionsRef}
                              className="absolute z-30 left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-lg shadow-xl max-h-48 overflow-y-auto"
                            >
                              {suggestedMedicines.map((med) => (
                                <button
                                  key={med.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedMedicine(med);
                                    setMedSearchQuery(med.medicine_name);
                                    setShowSuggestions(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-850/80 border-b border-slate-850/40 flex flex-col"
                                >
                                  <span className="font-semibold text-slate-200">{med.medicine_name}</span>
                                  <span className="text-[10px] text-slate-500">{med.generic_name} ({med.strength}) • {med.manufacturer}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Selected Medicine Info banner */}
                        {selectedMedicine && (
                          <div className="bg-indigo-950/40 p-2.5 rounded-lg border border-indigo-850/20 text-xs flex justify-between items-center">
                            <div>
                              <p className="font-bold text-indigo-300">{selectedMedicine.medicine_name}</p>
                              <p className="text-[10px] text-slate-400">{selectedMedicine.generic_name}</p>
                            </div>
                            <span className="bg-indigo-900 text-indigo-200 text-[9px] font-bold px-2 py-0.5 rounded">
                              {selectedMedicine.strength}
                            </span>
                          </div>
                        )}

                        {/* Prescribe parameters fields */}
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Dosage</label>
                            <input
                              type="text"
                              value={dosage}
                              onChange={(e) => setDosage(e.target.value)}
                              placeholder="e.g. 1-0-1 or 5ml"
                              className="w-full p-2 bg-slate-950 text-slate-100 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Frequency</label>
                            <select
                              value={frequency}
                              onChange={(e) => setFrequency(e.target.value)}
                              className="w-full p-2 bg-slate-950 text-slate-100 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                            >
                              <option value="Daily">Daily</option>
                              <option value="Twice a Day">Twice a Day</option>
                              <option value="Thrice a Day">Thrice a Day</option>
                              <option value="Four Times a Day">Four Times a Day</option>
                              <option value="Once Weekly">Once Weekly</option>
                              <option value="As Needed (PRN)">As Needed (PRN)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Duration</label>
                            <input
                              type="text"
                              value={duration}
                              onChange={(e) => setDuration(e.target.value)}
                              placeholder="e.g. 5 Days, 1 Month"
                              className="w-full p-2 bg-slate-950 text-slate-100 text-xs rounded-lg border border-slate-800 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Total Quantity</label>
                            <input
                              type="number"
                              value={quantity}
                              onChange={(e) => setQuantity(Number(e.target.value))}
                              className="w-full p-2 bg-slate-950 text-slate-100 text-xs rounded-lg border border-slate-800 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Instructions</label>
                          <input
                            type="text"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="e.g. Take after meals, with warm water"
                            className="w-full p-2 bg-slate-950 text-slate-100 text-xs rounded-lg border border-slate-800 focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleAddPrescriptionItem}
                          disabled={!selectedMedicine}
                          className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 mt-2 ${
                            selectedMedicine
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow shadow-indigo-600/20'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Plus className="h-4 w-4" /> Add to Prescription
                        </button>
                      </div>

                      {/* List of currently prescribed items */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          Prescribed Medicines
                          <span className="text-[10px] text-indigo-400">{prescribedItems.length} added</span>
                        </span>
                        
                        {prescribedItems.length === 0 ? (
                          <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center text-slate-550 text-xs">
                            No medicines added yet. Use the search bar above to create prescription items.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {prescribedItems.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex items-start justify-between gap-3 shadow-sm hover:border-slate-800 transition-all"
                              >
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-200 text-xs truncate">
                                    {idx + 1}. {item.medicineName}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {item.dosage} • {item.frequency} • {item.duration} (Qty: {item.quantity})
                                  </p>
                                  {item.instructions && (
                                    <p className="text-[9px] text-indigo-400 bg-indigo-950/20 px-2 py-0.5 rounded border border-indigo-900/10 mt-1 inline-block">
                                      {item.instructions}
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePrescriptionItem(idx)}
                                  className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-950/30 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions banner */}
                    <div className="pt-4 border-t border-slate-850 space-y-3 mt-6">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVisit(null);
                            resetConsultationForm();
                          }}
                          className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitConsultation}
                          disabled={saving || !diagnosis.trim()}
                          className={`flex-2 py-3 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg ${
                            diagnosis.trim() && !saving
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-850'
                          }`}
                        >
                          {saving ? <RotateCw className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                          Complete & Print
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Visit History List */
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-12 text-slate-500">
                      <RotateCw className="h-6 w-6 animate-spin mr-2" />
                      <span className="text-xs">Loading patient records...</span>
                    </div>
                  ) : pastVisits.length === 0 ? (
                    <div className="border border-dashed border-slate-800 rounded-xl p-16 text-center text-slate-500 text-xs">
                      <History className="h-8 w-8 mx-auto mb-2 text-slate-700" />
                      No previous visits found in EHR records for this patient.
                    </div>
                  ) : (
                    pastVisits.map((past) => (
                      <div
                        key={past.id}
                        className="bg-slate-950/30 border border-slate-850 rounded-xl p-5 space-y-4 shadow-sm hover:border-slate-800 transition-all"
                      >
                        <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-indigo-400 font-bold text-sm">
                              {new Date(past.visit_date).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-xs text-slate-400 font-mono">{past.visit_number}</span>
                          </div>
                          <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                            {past.status}
                          </span>
                        </div>

                        {/* Chief complaint */}
                        <div className="text-xs">
                          <strong className="text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Chief Complaint</strong>
                          <p className="text-slate-200 italic">"{past.chief_complaint}"</p>
                        </div>

                        {/* Diagnoses */}
                        {past.diagnoses && past.diagnoses.length > 0 && (
                          <div className="grid grid-cols-3 gap-4 bg-slate-900/60 p-3 rounded-lg border border-slate-850/40">
                            <div>
                              <strong className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Diagnosis</strong>
                              <p className="text-xs text-indigo-300 font-semibold mt-1">{past.diagnoses[0].diagnosis}</p>
                            </div>
                            <div>
                              <strong className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Symptoms</strong>
                              <p className="text-xs text-slate-300 mt-1 truncate">{past.diagnoses[0].symptoms || 'N/A'}</p>
                            </div>
                            <div>
                              <strong className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinical Findings</strong>
                              <p className="text-xs text-slate-300 mt-1 truncate">{past.diagnoses[0].clinical_findings || 'N/A'}</p>
                            </div>
                          </div>
                        )}

                        {/* Prescribed Medicines */}
                        {past.prescriptions && past.prescriptions.length > 0 && (
                          <div className="space-y-1.5">
                            <strong className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prescribed Rx</strong>
                            <div className="grid grid-cols-2 gap-2">
                              {past.prescriptions[0].prescription_items?.map((item) => (
                                <div
                                  key={item.id}
                                  className="bg-slate-900/40 border border-slate-850 p-2 rounded-lg text-xs"
                                >
                                  <div className="font-semibold text-slate-200">
                                    {item.medicines?.medicine_name} ({item.medicines?.strength})
                                  </div>
                                  <div className="text-[10px] text-slate-450 mt-0.5">
                                    {item.dosage} • {item.frequency} • {item.duration}
                                  </div>
                                  {item.instructions && (
                                    <div className="text-[9px] text-indigo-400 italic mt-0.5">
                                      * {item.instructions}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </main>
        ) : (
          <main className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-slate-900 bg-radial-at-c from-slate-900 to-slate-950">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col items-center max-w-sm">
              <div className="bg-indigo-650/20 p-4 rounded-full border border-indigo-500/25 mb-4 animate-bounce">
                <Activity className="h-10 w-10 text-indigo-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">EHR Consulting Workspace</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Please select a patient from the waiting queue on the left to start their examination, view history records, and create an Rx prescription.
              </p>
              <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-lg border border-slate-800 text-[10px]">
                <Clock className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
                <span className="text-slate-400">Waiting for live check-in queue...</span>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* RENDER MODAL: Printable prescription sheet */}
      {showPrintModal && printedPrescriptionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm print:relative print:inset-auto print:bg-white print:p-0">
          <div className="bg-white text-slate-800 w-[700px] max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col print:shadow-none print:border-none print:w-full print:max-h-full print:rounded-none">
            
            {/* Header with Print/Close buttons (hidden on print) */}
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-200 px-6 py-4 print:hidden">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Printer className="h-5 w-5 text-indigo-600" /> Prescription Sheet Generated
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 shadow"
                >
                  <Printer className="h-4 w-4" /> Print Receipt
                </button>
                <button
                  onClick={() => {
                    setShowPrintModal(false);
                    setPrintedPrescriptionData(null);
                  }}
                  className="text-slate-550 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Document body (printed) */}
            <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible">
              <div className="font-serif border-4 border-double border-slate-300 p-6 rounded-lg min-h-[550px] flex flex-col justify-between print:border-none print:p-0">
                
                {/* Pad Header: Hospital Details */}
                <div>
                  <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900 font-sans tracking-wide">MEDFLOWX CLINIC</h2>
                      <p className="text-[10px] text-slate-500 font-sans mt-0.5">123 Health Care Avenue, Gachibowli, Hyderabad</p>
                      <p className="text-[10px] text-slate-500 font-sans">Contact: +91 40 9876543 | email: info@medflowx.com</p>
                    </div>
                    <div className="text-right">
                      <h3 className="font-bold text-slate-800 text-md">{printedPrescriptionData.doctor.profiles?.full_name}</h3>
                      <p className="text-[10px] font-medium text-slate-650 font-sans">{printedPrescriptionData.doctor.qualification}</p>
                      <p className="text-[10px] text-indigo-700 font-semibold font-sans">Department of General Medicine</p>
                    </div>
                  </div>

                  {/* Patient information table summary */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 border-b border-slate-200 px-4 py-3 text-xs font-sans mt-4 print:bg-slate-100/50">
                    <div className="space-y-1">
                      <p><strong>Patient Name:</strong> {printedPrescriptionData.visit.patients?.first_name} {printedPrescriptionData.visit.patients?.last_name}</p>
                      <p><strong>Age / Gender:</strong> {printedPrescriptionData.visit.patients?.age} Yrs / {printedPrescriptionData.visit.patients?.gender}</p>
                      <p><strong>Patient Code:</strong> {printedPrescriptionData.visit.patients?.patient_code}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p><strong>Date:</strong> {new Date(printedPrescriptionData.visit.visit_date).toLocaleDateString()}</p>
                      <p><strong>Visit Code:</strong> {printedPrescriptionData.visit.visit_number}</p>
                      <p className="text-rose-700 font-medium"><strong>Allergies:</strong> {printedPrescriptionData.visit.patients?.allergies || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="mt-5 space-y-2 font-sans text-xs">
                    <p><strong>Chief Complaint:</strong> {printedPrescriptionData.visit.chief_complaint || 'None'}</p>
                    <p><strong>Clinical Findings:</strong> {printedPrescriptionData.diagnosis.clinical_findings || 'N/A'}</p>
                    <p className="text-md text-slate-900 border-b border-slate-200 pb-1.5">
                      <strong>Diagnosis:</strong> <span className="font-bold">{printedPrescriptionData.diagnosis.diagnosis}</span>
                    </p>
                  </div>

                  {/* Rx Symbol & Items */}
                  <div className="mt-6 font-sans">
                    <div className="text-xl font-bold font-serif mb-2 italic">Rx</div>
                    
                    {printedPrescriptionData.prescriptionItems.length === 0 ? (
                      <p className="text-xs text-slate-550 italic p-4 bg-slate-50 rounded">No specific medicines prescribed. Follow general advice.</p>
                    ) : (
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b-2 border-slate-300 text-slate-600 uppercase text-[9px] tracking-wider">
                            <th className="py-2 w-8">#</th>
                            <th className="py-2">Medicine Details</th>
                            <th className="py-2 w-28">Dosage</th>
                            <th className="py-2 w-28">Frequency</th>
                            <th className="py-2 w-20">Duration</th>
                            <th className="py-2 w-14 text-center">Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {printedPrescriptionData.prescriptionItems.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50/50">
                              <td className="py-2.5 font-semibold text-slate-500">{idx + 1}</td>
                              <td className="py-2.5">
                                <span className="font-bold text-slate-800">{item.medicineName}</span>
                                {item.instructions && (
                                  <span className="block text-[10px] text-indigo-700 italic mt-0.5">* {item.instructions}</span>
                                )}
                              </td>
                              <td className="py-2.5 text-slate-700 font-mono">{item.dosage}</td>
                              <td className="py-2.5 text-slate-700">{item.frequency}</td>
                              <td className="py-2.5 text-slate-700">{item.duration}</td>
                              <td className="py-2.5 text-slate-700 text-center font-bold">{item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* General Advice */}
                  {printedPrescriptionData.diagnosis.doctor_notes && (
                    <div className="mt-6 font-sans text-xs bg-slate-50/80 p-3 rounded-lg border border-slate-200/60">
                      <strong>General Advice & Instructions:</strong>
                      <p className="text-slate-700 leading-relaxed mt-1">{printedPrescriptionData.diagnosis.doctor_notes}</p>
                    </div>
                  )}
                </div>

                {/* Pad Footer: Doctor Signature & Clinic Footer */}
                <div className="mt-12 font-sans pt-6 border-t border-slate-200">
                  <div className="flex justify-between items-end">
                    <div>
                      {printedPrescriptionData.followUpDate && (
                        <p className="text-xs text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 inline-block">
                          <strong>Next Follow-up Visit:</strong> {new Date(printedPrescriptionData.followUpDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-center w-48 border-t border-slate-300 pt-2">
                      <p className="text-xs font-bold text-slate-800">{printedPrescriptionData.doctor.profiles?.full_name}</p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Registered Practitioner</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* Global CSS overrides for clean browser print layouts */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
            background: transparent !important;
            color: #000 !important;
          }
          .print\\:relative, .print\\:relative * {
            visibility: visible;
          }
          .print\\:relative {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            padding: 0;
            margin: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
}
