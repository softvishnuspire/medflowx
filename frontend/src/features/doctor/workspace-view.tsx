'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { socket } from '@/lib/socket';
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
  History,
  RotateCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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

interface WorkspaceViewProps {
  selectedDoctor: Doctor | null;
  visits: Visit[];
  loadingVisits: boolean;
  queueTab: 'waiting' | 'completed';
  setQueueTab: (tab: 'waiting' | 'completed') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedVisit: Visit | null;
  setSelectedVisit: (visit: Visit | null) => void;
  socketConnected: boolean;
  fetchVisits: (doctorId: string) => Promise<void>;
}

export default function WorkspaceView({
  selectedDoctor,
  visits,
  loadingVisits,
  queueTab,
  setQueueTab,
  searchQuery,
  setSearchQuery,
  selectedVisit,
  setSelectedVisit,
  socketConnected,
  fetchVisits
}: WorkspaceViewProps) {
  // Active Consultation states
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
        .neq('id', currentVisitId)
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

      await supabase.from('visit_status_history').insert({
        visit_id: selectedVisit.id,
        status: 'In Progress',
        remarks: 'Doctor started consultation (status: In Progress)',
        changed_by: selectedDoctor?.user_id
      });

      setSuccessMsg('Visit status set to In Progress.');
      socket.emit('update-queue', { visitId: selectedVisit.id, status: 'In Progress' });
      
      if (selectedDoctor) {
        fetchVisits(selectedDoctor.id);
      }
      
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

  // Submit Consultation & Save to Supabase
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

      // 2. Insert Prescription
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

      // 4. Update Visit Status
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

      // 6. Set Printable Prescription Data
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
      socket.emit('update-queue', { visitId: selectedVisit.id, status: visitStatusUpdate });

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

  const filteredVisits = visits.filter(visit => {
    const isCompleted = ['Prescribed', 'Sent to Pharmacy', 'Dispensed', 'Closed'].includes(visit.status);
    if (queueTab === 'waiting' && isCompleted) return false;
    if (queueTab === 'completed' && !isCompleted) return false;

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
    <div className="flex flex-1 overflow-hidden h-full border border-zinc-150/60 rounded-2xl bg-white shadow-sm font-body">
      
      {/* PANEL 1: PATIENT QUEUE (Left Column) */}
      <aside className="w-80 flex flex-col border-r border-zinc-150 shrink-0 bg-zinc-50/30">
        {/* Tab selector */}
        <div className="grid grid-cols-2 border-b border-zinc-150 p-2 gap-1.5 bg-zinc-50/50">
          <button
            onClick={() => setQueueTab('waiting')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              queueTab === 'waiting'
                ? 'bg-primary text-white shadow-sm'
                : 'text-zinc-500 hover:text-primary hover:bg-zinc-100'
            }`}
          >
            Waiting Queue
            {visits.filter(v => !['Prescribed', 'Sent to Pharmacy', 'Dispensed', 'Closed'].includes(v.status)).length > 0 && (
              <span className={`inline-flex items-center justify-center px-2 py-0.5 ml-1 rounded-full text-[10px] font-bold ${queueTab === 'waiting' ? 'bg-primary-dark/20 text-white' : 'bg-zinc-200 text-zinc-600'}`}>
                {visits.filter(v => !['Prescribed', 'Sent to Pharmacy', 'Dispensed', 'Closed'].includes(v.status)).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setQueueTab('completed')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              queueTab === 'completed'
                ? 'bg-primary text-white shadow-sm'
                : 'text-zinc-500 hover:text-primary hover:bg-zinc-100'
            }`}
          >
            Consulted Today
          </button>
        </div>

        {/* Search visits */}
        <div className="p-3 border-b border-zinc-150 bg-white">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search patient, ID, token..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Visits Queue List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loadingVisits ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
              <RotateCw className="h-6 w-6 animate-spin mb-2 text-primary" />
              <span className="text-xs">Loading live queue...</span>
            </div>
          ) : filteredVisits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400 text-center px-4">
              <User className="h-10 w-10 text-zinc-300 mb-2" />
              <p className="text-xs font-medium text-zinc-650">No patients found</p>
              <p className="text-[10px] text-zinc-400 mt-1">Visits checked in at reception will appear here in real-time.</p>
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
                      ? 'bg-primary/5 border-primary shadow-sm'
                      : 'bg-white border-zinc-150 hover:bg-zinc-50 hover:border-zinc-300'
                  }`}
                >
                  {/* Selected border glow */}
                  {isSelected && (
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-primary" />
                  )}

                  <div className="flex items-start justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {visit.visit_number}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      visit.status === 'Waiting'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : visit.status === 'In Progress'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {visit.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black shadow-inner shrink-0 ${
                      isSelected 
                        ? 'bg-primary text-white' 
                        : visit.status === 'In Progress'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-100 text-zinc-700'
                    }`}>
                      {visit.token_no}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-800 text-sm truncate leading-tight group-hover:text-primary transition-colors">
                        {ptName}
                      </p>
                      <p className="text-xs text-zinc-450 mt-0.5">
                        {visit.patients?.age} yrs • {visit.patients?.gender}
                      </p>
                    </div>
                  </div>

                  {visit.chief_complaint && (
                    <div className="mt-2 text-xs text-zinc-500 bg-zinc-50/50 p-2 rounded-lg border border-zinc-100 truncate">
                      <span className="font-medium text-zinc-400">Complaint:</span> {visit.chief_complaint}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* MAIN CONSULTATION WORKSPACE AREA */}
      {selectedVisit ? (
        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Patient Header information */}
          <div className="p-5 bg-zinc-50/50 border-b border-zinc-150 flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-4">
              <div className="bg-zinc-100 p-2.5 rounded-full border border-zinc-200 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-zinc-850 leading-tight">
                    {selectedVisit.patients?.first_name} {selectedVisit.patients?.last_name}
                  </h2>
                  <span className="bg-zinc-100 px-2 py-0.5 rounded text-xs font-mono text-zinc-500 border border-zinc-200">
                    {selectedVisit.patients?.patient_code}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                  <span><strong>Age/Gen:</strong> {selectedVisit.patients?.age} / {selectedVisit.patients?.gender}</span>
                  <span className="text-zinc-300">•</span>
                  <span><strong>Phone:</strong> {selectedVisit.patients?.phone}</span>
                  <span className="text-zinc-300">•</span>
                  <span className="text-rose-600"><strong>Allergies:</strong> {selectedVisit.patients?.allergies || 'None'}</span>
                </div>
              </div>
            </div>

            {/* Hold & Status actions */}
            <div className="flex items-center gap-3">
              {selectedVisit.status === 'Waiting' && (
                <button
                  onClick={handleHoldVisit}
                  disabled={saving}
                  className="bg-primary/10 text-primary border border-primary/20 text-xs font-bold py-2 px-4 rounded-xl hover:bg-primary hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {saving ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
                  Start Consultation
                </button>
              )}
              
              {selectedVisit.status === 'In Progress' && (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-2 animate-pulse">
                  <Clock className="h-3.5 w-3.5" />
                  Consultation In Progress
                </span>
              )}
            </div>
          </div>

          {/* Navigation tabs inside workspace */}
          <div className="flex border-b border-zinc-150 bg-zinc-50/20 shrink-0">
            <button
              onClick={() => setActiveTab('consult')}
              className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'consult'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-zinc-500 hover:text-primary'
              }`}
            >
              <FileText className="h-4 w-4" />
              Active Consultation
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'history'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-zinc-500 hover:text-primary'
              }`}
            >
              <History className="h-4 w-4" />
              Visit History ({pastVisits.length})
            </button>
          </div>

          {/* Workspace Area: splits into Consult Form or History logs */}
          <div className="flex-1 overflow-hidden flex">
            
            {activeTab === 'consult' ? (
              <>
                {/* Left Column: Diagnosis details */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 border-r border-zinc-150">
                  
                  {errorMsg && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-3 shadow-sm">
                      <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
                      <div>{errorMsg}</div>
                    </div>
                  )}
                  {successMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-3 shadow-sm">
                      <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
                      <div>{successMsg}</div>
                    </div>
                  )}

                  {/* Medical History & Complaint summary */}
                  <div className="bg-zinc-50/50 p-4 rounded-xl border border-zinc-150 grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Known Medical Conditions</h4>
                      <p className="text-xs text-zinc-700 leading-relaxed bg-white p-2.5 rounded-lg border border-zinc-150">
                        {selectedVisit.patients?.medical_history || 'No declared history.'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Chief Complaint</h4>
                      <p className="text-xs text-primary font-semibold leading-relaxed bg-primary/5 p-2.5 rounded-lg border border-primary/10">
                        {selectedVisit.chief_complaint || 'No complaint details.'}
                      </p>
                    </div>
                  </div>

                  {/* Form section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-zinc-800 border-l-2 border-primary pl-2 font-heading">Clinical Details</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Symptoms & Clinical Findings</label>
                        <textarea
                          rows={3}
                          placeholder="Enter symptoms, temperature, BP, general findings..."
                          value={symptoms}
                          onChange={(e) => setSymptoms(e.target.value)}
                          className="w-full p-3 bg-white text-zinc-800 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Clinical Examination Notes</label>
                        <textarea
                          rows={3}
                          placeholder="Clinical findings, chest sounds, throat congestion notes..."
                          value={clinicalFindings}
                          onChange={(e) => setClinicalFindings(e.target.value)}
                          className="w-full p-3 bg-white text-zinc-800 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5 flex items-center gap-1">
                        Diagnosis <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Primary diagnosis (e.g. Acute Viral Bronchitis, Essential Hypertension)"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        className="w-full p-3 bg-white text-zinc-800 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">General Advice / Doctor Notes</label>
                      <textarea
                        rows={2}
                        placeholder="Lifestyle changes, dietary instructions, test suggestions..."
                        value={doctorNotes}
                        onChange={(e) => setDoctorNotes(e.target.value)}
                        className="w-full p-3 bg-white text-zinc-800 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Follow-up Advice</label>
                        <input
                          type="text"
                          placeholder="e.g. Review after 5 days or if fever persists"
                          value={followUpAdvice}
                          onChange={(e) => setFollowUpAdvice(e.target.value)}
                          className="w-full p-3 bg-white text-zinc-800 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1.5">Follow-up Date</label>
                        <input
                          type="date"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          className="w-full p-3 bg-white text-zinc-800 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Prescription Builder */}
                <div className="w-[450px] overflow-y-auto p-6 bg-zinc-50/30 shrink-0 flex flex-col justify-between">
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-zinc-800 border-l-2 border-primary pl-2 font-heading">Rx - Prescription Builder</h3>

                    {/* Add medicine autocomplete */}
                    <div className="space-y-3 p-4 bg-white rounded-xl border border-zinc-200 relative shadow-xs">
                      <div className="relative">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Search & Select Medicine</label>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
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
                            className="w-full pl-9 pr-3 py-2 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary"
                          />
                        </div>

                        {/* Autocomplete suggestions */}
                        {showSuggestions && suggestedMedicines.length > 0 && (
                          <div
                            ref={suggestionsRef}
                            className="absolute z-30 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
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
                                className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 border-b border-zinc-100 flex flex-col"
                              >
                                <span className="font-semibold text-zinc-800">{med.medicine_name}</span>
                                <span className="text-[10px] text-zinc-450">{med.generic_name} ({med.strength}) • {med.manufacturer}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Selected Drug Banner */}
                      {selectedMedicine && (
                        <div className="bg-primary/5 p-2.5 rounded-lg border border-primary/10 text-xs flex justify-between items-center">
                          <div>
                            <p className="font-bold text-primary">{selectedMedicine.medicine_name}</p>
                            <p className="text-[10px] text-zinc-450">{selectedMedicine.generic_name}</p>
                          </div>
                          <span className="bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-xs">
                            {selectedMedicine.strength}
                          </span>
                        </div>
                      )}

                      {/* Input fields */}
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-0.5">Dosage</label>
                          <input
                            type="text"
                            value={dosage}
                            onChange={(e) => setDosage(e.target.value)}
                            placeholder="e.g. 1-0-1 or 5ml"
                            className="w-full p-2 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-0.5">Frequency</label>
                          <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            className="w-full p-2 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary"
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
                          <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-0.5">Duration</label>
                          <input
                            type="text"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            placeholder="e.g. 5 Days, 1 Month"
                            className="w-full p-2 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-0.5">Total Quantity</label>
                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="w-full p-2 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-0.5">Instructions</label>
                        <input
                          type="text"
                          value={instructions}
                          onChange={(e) => setInstructions(e.target.value)}
                          placeholder="e.g. Take after meals, with warm water"
                          className="w-full p-2 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAddPrescriptionItem}
                        disabled={!selectedMedicine}
                        className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer shadow-xs ${
                          selectedMedicine
                            ? 'bg-primary hover:bg-primary/95 text-white'
                            : 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
                        }`}
                      >
                        <Plus className="h-4 w-4" /> Add to Prescription
                      </button>
                    </div>

                    {/* Prescribed List */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                        Prescribed Medicines
                        <span className="text-[10px] text-primary">{prescribedItems.length} added</span>
                      </span>
                      
                      {prescribedItems.length === 0 ? (
                        <div className="border border-dashed border-zinc-250 rounded-xl p-6 text-center text-zinc-400 text-xs bg-white shadow-inner">
                          No medicines added yet. Use the drug lookup above to add items.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {prescribedItems.map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-white border border-zinc-150 p-3 rounded-xl flex items-start justify-between gap-3 shadow-xs hover:border-zinc-250 transition-all"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-zinc-800 text-xs truncate">
                                  {idx + 1}. {item.medicineName}
                                </p>
                                <p className="text-[10px] text-zinc-450 mt-0.5">
                                  {item.dosage} • {item.frequency} • {item.duration} (Qty: {item.quantity})
                                </p>
                                {item.instructions && (
                                  <p className="text-[9px] text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10 mt-1 inline-block">
                                    {item.instructions}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePrescriptionItem(idx)}
                                className="text-zinc-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit actions */}
                  <div className="pt-4 border-t border-zinc-150 space-y-3 mt-6">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVisit(null);
                          resetConsultationForm();
                        }}
                        className="flex-1 py-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-600 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitConsultation}
                        disabled={saving || !diagnosis.trim()}
                        className={`flex-2 py-3 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                          diagnosis.trim() && !saving
                            ? 'bg-primary hover:bg-primary/95 text-white'
                            : 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
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
                  <div className="flex items-center justify-center py-12 text-zinc-400">
                    <RotateCw className="h-6 w-6 animate-spin mr-2 text-primary" />
                    <span className="text-xs">Loading patient records...</span>
                  </div>
                ) : pastVisits.length === 0 ? (
                  <div className="border border-dashed border-zinc-250 rounded-xl p-16 text-center text-zinc-400 text-xs bg-zinc-50/30">
                    <History className="h-8 w-8 mx-auto mb-2 text-zinc-300" />
                    No previous visits found in EHR records for this patient.
                  </div>
                ) : (
                  pastVisits.map((past) => (
                    <div
                      key={past.id}
                      className="bg-white border border-zinc-150 rounded-xl p-5 space-y-4 shadow-xs hover:border-zinc-250 transition-all"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-150 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-primary font-bold text-sm">
                            {new Date(past.visit_date).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="text-zinc-300">•</span>
                          <span className="text-xs text-zinc-400 font-mono">{past.visit_number}</span>
                        </div>
                        <span className="bg-zinc-100 text-zinc-650 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                          {past.status}
                        </span>
                      </div>

                      <div className="text-xs">
                        <strong className="text-zinc-400 uppercase tracking-wider text-[10px] block mb-1">Chief Complaint</strong>
                        <p className="text-zinc-700 italic">"{past.chief_complaint}"</p>
                      </div>

                      {past.diagnoses && past.diagnoses.length > 0 && (
                        <div className="grid grid-cols-3 gap-4 bg-zinc-50/50 p-3 rounded-lg border border-zinc-150">
                          <div>
                            <strong className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Diagnosis</strong>
                            <p className="text-xs text-primary font-semibold mt-1">{past.diagnoses[0].diagnosis}</p>
                          </div>
                          <div>
                            <strong className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Symptoms</strong>
                            <p className="text-xs text-zinc-650 mt-1 truncate">{past.diagnoses[0].symptoms || 'N/A'}</p>
                          </div>
                          <div>
                            <strong className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Clinical Findings</strong>
                            <p className="text-xs text-zinc-650 mt-1 truncate">{past.diagnoses[0].clinical_findings || 'N/A'}</p>
                          </div>
                        </div>
                      )}

                      {past.prescriptions && past.prescriptions.length > 0 && (
                        <div className="space-y-1.5">
                          <strong className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Prescribed Rx</strong>
                          <div className="grid grid-cols-2 gap-2">
                            {past.prescriptions[0].prescription_items?.map((item) => (
                              <div
                                key={item.id}
                                className="bg-zinc-50/20 border border-zinc-150 p-2 rounded-lg text-xs"
                              >
                                <div className="font-semibold text-zinc-800">
                                  {item.medicines?.medicine_name} ({item.medicines?.strength})
                                </div>
                                <div className="text-[10px] text-zinc-450 mt-0.5">
                                  {item.dosage} • {item.frequency} • {item.duration}
                                </div>
                                {item.instructions && (
                                  <div className="text-[9px] text-primary italic mt-0.5">
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
        <main className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-8 text-center bg-zinc-50/30">
          <div className="bg-white border border-zinc-150 p-6 rounded-3xl shadow-md flex flex-col items-center max-w-sm">
            <div className="bg-primary/10 p-4 rounded-full border border-primary/20 mb-4 animate-bounce text-primary">
              <Activity className="h-10 w-10" />
            </div>
            <h3 className="text-base font-bold text-zinc-800 mb-1.5 font-heading">EHR Consulting Workspace</h3>
            <p className="text-xs text-zinc-500 leading-relaxed mb-4">
              Select a patient from the waiting queue on the left to start their examination, view historical reports, and build their Rx prescription.
            </p>
            <div className="flex items-center gap-2 bg-zinc-50 px-3.5 py-1.5 rounded-lg border border-zinc-200 text-[10px]">
              <Clock className="h-3.5 w-3.5 text-primary animate-spin" />
              <span className="text-zinc-500 font-semibold">Waiting for live check-in queue...</span>
            </div>
          </div>
        </main>
      )}

      {/* RENDER MODAL: Printable prescription sheet */}
      {showPrintModal && printedPrescriptionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs print:relative print:inset-auto print:bg-white print:p-0">
          <div className="bg-white text-zinc-800 w-[700px] max-h-[90vh] rounded-2xl shadow-xl border border-zinc-200 overflow-hidden flex flex-col print:shadow-none print:border-none print:w-full print:max-h-full print:rounded-none">
            
            {/* Header with Print/Close (hidden on print) */}
            <div className="flex items-center justify-between bg-zinc-50 border-b border-zinc-200 px-6 py-4 print:hidden">
              <h3 className="font-bold text-zinc-800 flex items-center gap-2 font-heading">
                <Printer className="h-5 w-5 text-primary" /> Prescription Sheet Generated
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-primary hover:bg-primary/95 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Printer className="h-4 w-4" /> Print Sheet
                </button>
                <button
                  onClick={() => {
                    setShowPrintModal(false);
                    setPrintedPrescriptionData(null);
                  }}
                  className="text-zinc-500 hover:text-zinc-800 p-2 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Document body (printed) */}
            <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible">
              <div className="font-serif border-4 border-double border-zinc-300 p-6 rounded-lg min-h-[550px] flex flex-col justify-between print:border-none print:p-0">
                
                {/* Pad Header: Hospital Details */}
                <div>
                  <div className="flex items-start justify-between border-b-2 border-zinc-800 pb-4">
                    <div>
                      <h2 className="text-2xl font-extrabold text-zinc-900 font-sans tracking-wide">MEDFLOWX CLINIC</h2>
                      <p className="text-[10px] text-zinc-500 font-sans mt-0.5">123 Health Care Avenue, Gachibowli, Hyderabad</p>
                      <p className="text-[10px] text-zinc-500 font-sans">Contact: +91 40 9876543 | email: info@medflowx.com</p>
                    </div>
                    <div className="text-right">
                      <h3 className="font-bold text-zinc-800 text-md">{printedPrescriptionData.doctor.profiles?.full_name}</h3>
                      <p className="text-[10px] font-medium text-zinc-500 font-sans">{printedPrescriptionData.doctor.qualification}</p>
                      <p className="text-[10px] text-primary font-semibold font-sans">Department of General Medicine</p>
                    </div>
                  </div>

                  {/* Patient information summary */}
                  <div className="grid grid-cols-2 gap-4 bg-zinc-50 border-b border-zinc-200 px-4 py-3 text-xs font-sans mt-4 print:bg-zinc-50">
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
                    <p className="text-md text-zinc-900 border-b border-zinc-200 pb-1.5">
                      <strong>Diagnosis:</strong> <span className="font-bold">{printedPrescriptionData.diagnosis.diagnosis}</span>
                    </p>
                  </div>

                  {/* Rx Symbol & Items */}
                  <div className="mt-6 font-sans">
                    <div className="text-xl font-bold font-serif mb-2 italic">Rx</div>
                    
                    {printedPrescriptionData.prescriptionItems.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic p-4 bg-zinc-50 rounded">No specific medicines prescribed. Follow general advice.</p>
                    ) : (
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b-2 border-zinc-300 text-zinc-500 uppercase text-[9px] tracking-wider">
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
                            <tr key={idx} className="border-b border-zinc-200 hover:bg-zinc-50/50">
                              <td className="py-2.5 font-semibold text-zinc-400">{idx + 1}</td>
                              <td className="py-2.5">
                                <span className="font-bold text-zinc-800">{item.medicineName}</span>
                                {item.instructions && (
                                  <span className="block text-[10px] text-primary italic mt-0.5">* {item.instructions}</span>
                                )}
                              </td>
                              <td className="py-2.5 text-zinc-650 font-mono">{item.dosage}</td>
                              <td className="py-2.5 text-zinc-650">{item.frequency}</td>
                              <td className="py-2.5 text-zinc-650">{item.duration}</td>
                              <td className="py-2.5 text-zinc-650 text-center font-bold">{item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* General Advice */}
                  {printedPrescriptionData.diagnosis.doctor_notes && (
                    <div className="mt-6 font-sans text-xs bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                      <strong>General Advice & Instructions:</strong>
                      <p className="text-zinc-650 leading-relaxed mt-1">{printedPrescriptionData.diagnosis.doctor_notes}</p>
                    </div>
                  )}
                </div>

                {/* Pad Footer: Signature */}
                <div className="mt-12 font-sans pt-6 border-t border-zinc-200">
                  <div className="flex justify-between items-end">
                    <div>
                      {printedPrescriptionData.followUpDate && (
                        <p className="text-xs text-zinc-700 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200 inline-block">
                          <strong>Next Follow-up Visit:</strong> {new Date(printedPrescriptionData.followUpDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-center w-48 border-t border-zinc-300 pt-2">
                      <p className="text-xs font-bold text-zinc-800">{printedPrescriptionData.doctor.profiles?.full_name}</p>
                      <p className="text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">Registered Practitioner</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* Global CSS overrides for clean print layouts */}
      <style>{`
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
