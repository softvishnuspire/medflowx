'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { socket } from '@/lib/socket';
import {
  Activity,
  User,
  Search,
  FileText,
  CheckCircle,
  AlertCircle,
  Trash2,
  Plus,
  Printer,
  X,
  History,
  RotateCw,
  Send
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
  
  // Print flow states removed

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
      const visitStatusUpdate = 'Sent to Pharmacy';
      const { error: visitErr } = await supabase
        .from('visits')
        .update({ status: visitStatusUpdate })
        .eq('id', selectedVisit.id);

      if (visitErr) throw visitErr;

      // 5. Add status history
      await supabase.from('visit_status_history').insert({
        visit_id: selectedVisit.id,
        status: visitStatusUpdate,
        remarks: 'Consultation complete. Sent to pharmacy queue.',
        changed_by: selectedDoctor.user_id
      });

      setSuccessMsg('Consultation completed successfully and pushed to pharmacy!');
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
    <div className="flex flex-1 overflow-hidden h-full rounded-2xl bg-white shadow-md font-body">
      
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ LEFT PANEL: PATIENT QUEUE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <aside className="w-[280px] flex flex-col border-r border-zinc-200 shrink-0 bg-white">
        {/* Queue tab toggles */}
        <div className="flex border-b border-zinc-200 bg-zinc-50">
          <button
            onClick={() => setQueueTab('waiting')}
            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
              queueTab === 'waiting'
                ? 'border-primary text-primary bg-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            Queue
            {visits.filter(v => !['Prescribed', 'Sent to Pharmacy', 'Dispensed', 'Closed'].includes(v.status)).length > 0 && (
              <span className={`ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black ${queueTab === 'waiting' ? 'bg-primary text-white' : 'bg-zinc-200 text-zinc-600'}`}>
                {visits.filter(v => !['Prescribed', 'Sent to Pharmacy', 'Dispensed', 'Closed'].includes(v.status)).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setQueueTab('completed')}
            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
              queueTab === 'completed'
                ? 'border-primary text-primary bg-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            Done Today
          </button>
        </div>

        {/* Search */}
        <div className="p-2.5 border-b border-zinc-100">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search name, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-zinc-50 text-zinc-800 text-[11px] rounded-lg border border-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
        </div>

        {/* Patient list */}
        <div className="flex-1 overflow-y-auto">
          {loadingVisits ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <RotateCw className="h-5 w-5 animate-spin mb-2 text-primary" />
              <span className="text-[11px] font-medium">Loading queue...</span>
            </div>
          ) : filteredVisits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <User className="h-8 w-8 text-zinc-200 mb-2" />
              <p className="text-[11px] font-semibold text-zinc-500">No patients in queue</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Check-ins will appear here live.</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredVisits.map((visit) => {
                const isSelected = selectedVisit?.id === visit.id;
                const ptName = `${visit.patients?.first_name || ''} ${visit.patients?.last_name || ''}`;
                
                return (
                  <button
                    key={visit.id}
                    onClick={() => {
                      setSelectedVisit(visit);
                      setActiveTab('consult');
                    }}
                    className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-150 cursor-pointer relative group ${
                      isSelected
                        ? 'bg-primary text-white shadow-md'
                        : 'hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : visit.status === 'In Progress'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}>
                        {visit.token_no}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={`font-bold text-[13px] truncate leading-tight ${isSelected ? 'text-white' : 'text-zinc-800'}`}>
                          {ptName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-medium ${isSelected ? 'text-white/70' : 'text-zinc-400'}`}>
                            {visit.patients?.age}y â€¢ {visit.patients?.gender}
                          </span>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : visit.status === 'Waiting'
                              ? 'bg-amber-50 text-amber-600'
                              : visit.status === 'In Progress'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}>
                            {visit.status === 'In Progress' ? 'Active' : visit.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {visit.chief_complaint && !isSelected && (
                      <p className="mt-1.5 text-[10px] text-zinc-400 truncate pl-[42px]">
                        {visit.chief_complaint}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ RIGHT PANEL: WORKSPACE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {selectedVisit ? (
        <main className="flex-1 flex flex-col overflow-hidden bg-zinc-50/30">
          
          {/* â”€â”€ Patient Header Bar â”€â”€ */}
          <div className="px-6 py-4 bg-white border-b border-zinc-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <User className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-zinc-900 font-heading leading-none">
                    {selectedVisit.patients?.first_name} {selectedVisit.patients?.last_name}
                  </h2>
                  <span className="bg-zinc-100 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-500 border border-zinc-200 font-bold">
                    {selectedVisit.patients?.patient_code}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-1 font-medium">
                  <span>{selectedVisit.patients?.age} Yrs / {selectedVisit.patients?.gender}</span>
                  <span className="text-zinc-300">â€¢</span>
                  <span>{selectedVisit.patients?.phone}</span>
                  {selectedVisit.patients?.allergies && (
                    <>
                      <span className="text-zinc-300">â€¢</span>
                      <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">
                        âš  {selectedVisit.patients?.allergies}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {selectedVisit.status === 'Waiting' && (
                <button
                  onClick={handleHoldVisit}
                  disabled={saving}
                  className="bg-cta hover:bg-cta/90 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {saving ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
                  Start Consultation
                </button>
              )}
              {selectedVisit.status === 'In Progress' && (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold py-2 px-4 rounded-xl flex items-center gap-2 animate-pulse">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  Consultation Active
                </span>
              )}
            </div>
          </div>

          {/* â”€â”€ Tab Navigation â”€â”€ */}
          <div className="flex bg-white border-b border-zinc-200 px-6 shrink-0">
            <button
              onClick={() => setActiveTab('consult')}
              className={`py-3 px-4 text-[11px] uppercase tracking-wider font-bold border-b-2 transition-all cursor-pointer mr-1 ${
                activeTab === 'consult'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <FileText className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
              Consultation
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-4 text-[11px] uppercase tracking-wider font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <History className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
              History ({pastVisits.length})
            </button>
          </div>

          {/* â”€â”€ Workspace Content â”€â”€ */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'consult' ? (
              <div className="p-6 space-y-5 max-w-[1100px]">
                
                {/* Alerts */}
                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-center gap-2.5 font-medium">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center gap-2.5 font-medium">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                    {successMsg}
                  </div>
                )}

                {/* â”€â”€ Section 1: Patient Summary â”€â”€ */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-zinc-200 p-4">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Medical History</h4>
                    <p className="text-xs text-zinc-700 leading-relaxed font-medium">
                      {selectedVisit.patients?.medical_history || 'No declared medical history.'}
                    </p>
                  </div>
                  <div className="bg-primary/5 rounded-xl border border-primary/15 p-4">
                    <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Chief Complaint</h4>
                    <p className="text-xs text-zinc-800 leading-relaxed font-semibold">
                      {selectedVisit.chief_complaint || 'No complaint recorded.'}
                    </p>
                  </div>
                </div>

                {/* â”€â”€ Section 2: Clinical Chart â”€â”€ */}
                <div className="bg-white rounded-xl border border-zinc-200 p-5">
                  <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary rounded-full" />
                    Clinical Chart
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Symptoms & Findings</label>
                      <textarea
                        rows={3}
                        placeholder="Fever, cough, body ache, temperature 101Â°F..."
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        className="w-full p-3 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all resize-none placeholder:text-zinc-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Examination Notes</label>
                      <textarea
                        rows={3}
                        placeholder="Chest clear, throat congested, BP 120/80..."
                        value={clinicalFindings}
                        onChange={(e) => setClinicalFindings(e.target.value)}
                        className="w-full p-3 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all resize-none placeholder:text-zinc-400"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Diagnosis <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Acute Viral Bronchitis, Essential Hypertension"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full p-3 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all font-semibold placeholder:text-zinc-400 placeholder:font-normal"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Doctor Notes / Advice</label>
                    <textarea
                      rows={2}
                      placeholder="Rest for 3 days, drink fluids, avoid cold food..."
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                      className="w-full p-3 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all resize-none placeholder:text-zinc-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Follow-up Advice</label>
                      <input
                        type="text"
                        placeholder="Review after 5 days if fever persists"
                        value={followUpAdvice}
                        onChange={(e) => setFollowUpAdvice(e.target.value)}
                        className="w-full p-3 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-zinc-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Follow-up Date</label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full p-3 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* â”€â”€ Section 3: Prescription Builder â”€â”€ */}
                <div className="bg-white rounded-xl border border-zinc-200 p-5">
                  <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary rounded-full" />
                    Prescription (Rx)
                  </h3>

                  {/* Add medicine row */}
                  <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 mb-4 relative">
                    <div className="grid grid-cols-6 gap-3 items-end">
                      {/* Medicine search - takes 2 cols */}
                      <div className="col-span-2 relative">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Medicine</label>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                          <input
                            type="text"
                            placeholder="Search medicine..."
                            value={medSearchQuery}
                            onChange={(e) => {
                              setMedSearchQuery(e.target.value);
                              if (!e.target.value) setSelectedMedicine(null);
                            }}
                            className="w-full pl-8 pr-3 py-2 bg-white text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all font-medium"
                          />
                        </div>

                        {/* Autocomplete dropdown */}
                        {showSuggestions && suggestedMedicines.length > 0 && (
                          <div
                            ref={suggestionsRef}
                            className="absolute z-30 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-44 overflow-y-auto"
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
                                className="w-full text-left px-3 py-2 text-xs hover:bg-primary/5 transition-colors cursor-pointer border-b border-zinc-100 last:border-0"
                              >
                                <span className="font-bold text-zinc-800">{med.medicine_name}</span>
                                <span className="block text-[10px] text-zinc-400 mt-0.5">{med.generic_name} â€¢ {med.strength}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Dosage</label>
                        <input
                          type="text"
                          value={dosage}
                          onChange={(e) => setDosage(e.target.value)}
                          className="w-full py-2 px-2.5 bg-white text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary transition-all font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Frequency</label>
                        <select
                          value={frequency}
                          onChange={(e) => setFrequency(e.target.value)}
                          className="w-full py-2 px-2.5 bg-white text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary transition-all cursor-pointer font-medium"
                        >
                          <option value="Daily">Daily</option>
                          <option value="Twice a Day">BD (Twice)</option>
                          <option value="Thrice a Day">TDS (Thrice)</option>
                          <option value="Four Times a Day">QID (4x)</option>
                          <option value="Once Weekly">Weekly</option>
                          <option value="As Needed (PRN)">PRN</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Duration</label>
                        <input
                          type="text"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="w-full py-2 px-2.5 bg-white text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary transition-all font-medium"
                        />
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Qty</label>
                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="w-full py-2 px-2.5 bg-white text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary transition-all font-medium"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddPrescriptionItem}
                          disabled={!selectedMedicine}
                          className={`p-2 rounded-lg transition-all cursor-pointer shrink-0 ${
                            selectedMedicine
                              ? 'bg-primary hover:bg-primary/90 text-white shadow-sm'
                              : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                          }`}
                          title="Add to prescription"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Selected medicine indicator + instructions */}
                    {selectedMedicine && (
                      <div className="mt-3 flex items-center gap-3">
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/15">
                          Selected: {selectedMedicine.medicine_name} ({selectedMedicine.strength})
                        </span>
                        <input
                          type="text"
                          value={instructions}
                          onChange={(e) => setInstructions(e.target.value)}
                          placeholder="Instructions (e.g. Take after meals)"
                          className="flex-1 py-1.5 px-3 bg-white text-zinc-700 text-[11px] rounded-lg border border-zinc-200 focus:outline-none focus:border-primary transition-all"
                        />
                      </div>
                    )}
                  </div>

                  {/* Prescribed items list */}
                  {prescribedItems.length === 0 ? (
                    <div className="border border-dashed border-zinc-200 rounded-xl p-6 text-center text-zinc-400 text-xs bg-zinc-50/50">
                      No medicines added yet. Search a medicine above to start building the prescription.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{prescribedItems.length} Medicine{prescribedItems.length > 1 ? 's' : ''} Added</span>
                      </div>
                      {prescribedItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white border border-zinc-200 px-4 py-3 rounded-xl hover:border-zinc-300 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-[10px] font-bold text-zinc-400 w-5 text-center">{idx + 1}</span>
                            <div className="min-w-0">
                              <p className="font-bold text-zinc-800 text-xs truncate">{item.medicineName}</p>
                              <p className="text-[10px] text-zinc-500 mt-0.5">
                                {item.dosage} â€¢ {item.frequency} â€¢ {item.duration} â€¢ Qty: {item.quantity}
                                {item.instructions && <span className="text-primary ml-1 font-semibold">({item.instructions})</span>}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePrescriptionItem(idx)}
                            className="text-zinc-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            aria-label="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* â”€â”€ Section 4: Action Buttons â”€â”€ */}
                <div className="flex items-center justify-end gap-3 pt-2 pb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVisit(null);
                      resetConsultationForm();
                    }}
                    className="py-2.5 px-6 bg-white border border-zinc-200 text-zinc-600 font-bold text-xs rounded-xl hover:bg-zinc-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitConsultation}
                    disabled={saving || !diagnosis.trim()}
                    className={`py-2.5 px-8 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                      diagnosis.trim() && !saving
                        ? 'bg-cta hover:bg-cta/90 text-white'
                        : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                    }`}
                  >
                    {saving ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Push to Pharmacy
                  </button>
                </div>
              </div>
            ) : (
              /* â”€â”€ History Tab â”€â”€ */
              <div className="p-6 space-y-4 max-w-[900px]">
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-16 text-zinc-400">
                    <RotateCw className="h-5 w-5 animate-spin mr-2 text-primary" />
                    <span className="text-xs font-medium">Loading records...</span>
                  </div>
                ) : pastVisits.length === 0 ? (
                  <div className="border border-dashed border-zinc-200 rounded-xl p-16 text-center text-zinc-400 text-xs bg-white">
                    <History className="h-8 w-8 mx-auto mb-2 text-zinc-300" />
                    No previous visits found for this patient.
                  </div>
                ) : (
                  pastVisits.map((past) => (
                    <div key={past.id} className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3.5 hover:shadow-sm transition-shadow">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-bold text-sm">
                            {new Date(past.visit_date).toLocaleDateString(undefined, {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </span>
                          <span className="text-zinc-300">â€¢</span>
                          <span className="text-[10px] text-zinc-400 font-mono font-bold">{past.visit_number}</span>
                        </div>
                        <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
                          {past.status}
                        </span>
                      </div>

                      {/* Complaint */}
                      <p className="text-xs text-zinc-600 italic">"{past.chief_complaint}"</p>

                      {/* Diagnosis */}
                      {past.diagnoses && past.diagnoses.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-0.5">Diagnosis</span>
                            <p className="text-primary font-bold">{past.diagnoses[0].diagnosis}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-0.5">Symptoms</span>
                            <p className="text-zinc-600">{past.diagnoses[0].symptoms || 'â€”'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-0.5">Findings</span>
                            <p className="text-zinc-600">{past.diagnoses[0].clinical_findings || 'â€”'}</p>
                          </div>
                        </div>
                      )}

                      {/* Medicines */}
                      {past.prescriptions && past.prescriptions.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1.5">Prescribed Rx</span>
                          <div className="flex flex-wrap gap-2">
                            {past.prescriptions[0].prescription_items?.map((item) => (
                              <span
                                key={item.id}
                                className="bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg text-[11px] font-medium text-zinc-700"
                              >
                                <strong>{item.medicines?.medicine_name}</strong> {item.medicines?.strength} â€” {item.dosage} Ã— {item.duration}
                              </span>
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
        /* â”€â”€ Empty State (no patient selected) â”€â”€ */
        <main className="flex-1 flex items-center justify-center bg-zinc-50/30">
          <div className="text-center max-w-xs">
            <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-primary">
              <Activity className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-zinc-800 mb-1.5">Select a Patient</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Choose a patient from the queue on the left to begin their consultation, review records, and write prescriptions.
            </p>
          </div>
        </main>
      )}
    </div>
  );
}

