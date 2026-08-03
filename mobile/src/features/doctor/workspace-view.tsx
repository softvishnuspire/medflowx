import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
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
  Send,
  Clock,
  ChevronRight,
  Calendar
} from 'lucide-react-native';
import { NativePicker } from '../../components/ui/native-picker';

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
  const [activeTab, setActiveTab] = useState<'consult' | 'history'>('consult');
  const [pastVisits, setPastVisits] = useState<PastVisit[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [symptoms, setSymptoms] = useState('');
  const [clinicalFindings, setClinicalFindings] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [followUpAdvice, setFollowUpAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  
  const [prescribedItems, setPrescribedItems] = useState<PrescriptionItemInput[]>([]);
  const [medSearchQuery, setMedSearchQuery] = useState('');
  const [suggestedMedicines, setSuggestedMedicines] = useState<Medicine[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  
  const [dosage, setDosage] = useState('1-0-1');
  const [frequency, setFrequency] = useState('Daily');
  const [duration, setDuration] = useState('5 Days');
  const [quantity, setQuantity] = useState(10);
  const [instructions, setInstructions] = useState('Take after meals');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (selectedVisit) {
      fetchPatientHistory(selectedVisit.patient_id, selectedVisit.id);
      setSymptoms(selectedVisit.chief_complaint || '');
    }
  }, [selectedVisit]);

  useEffect(() => {
    if (medSearchQuery.trim().length > 1) {
      searchMedicines(medSearchQuery);
    } else {
      setSuggestedMedicines([]);
    }
  }, [medSearchQuery]);

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

  const handleAddPrescriptionItem = () => {
    if (!selectedMedicine) {
      setErrorMsg('Please select a medicine from suggestions.');
      return;
    }
    
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

  const handleRemovePrescriptionItem = (index: number) => {
    setPrescribedItems(prescribedItems.filter((_, i) => i !== index));
  };

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

      const visitStatusUpdate = 'Sent to Pharmacy';
      const { error: visitErr } = await supabase
        .from('visits')
        .update({ status: visitStatusUpdate })
        .eq('id', selectedVisit.id);

      if (visitErr) throw visitErr;

      await supabase.from('visit_status_history').insert({
        visit_id: selectedVisit.id,
        status: visitStatusUpdate,
        remarks: 'Consultation complete. Sent to pharmacy queue.',
        changed_by: selectedDoctor.user_id
      });

      setSuccessMsg('Consultation completed successfully and pushed to pharmacy!');

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
    <View className="flex flex-1 overflow-hidden h-full rounded-2xl bg-white shadow-md font-body">
      {/* ——————————— LEFT PANEL: PATIENT QUEUE ——————————— */}
      <View className="w-[280px] flex flex-col border-r border-zinc-200 shrink-0 bg-white">
        <View className="flex border-b border-zinc-200 bg-zinc-50">
          <TouchableOpacity
            onPress={() => setQueueTab('waiting')}
            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
              queueTab === 'waiting'
                ? 'border-primary text-primary bg-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <Text>Queue</Text>
            {visits.filter(v => !['Prescribed', 'Sent to Pharmacy', 'Dispensed', 'Closed'].includes(v.status)).length > 0 && (
              <Text className={`ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black ${queueTab === 'waiting' ? 'bg-primary text-white' : 'bg-zinc-200 text-zinc-600'}`}>
                {visits.filter(v => !['Prescribed', 'Sent to Pharmacy', 'Dispensed', 'Closed'].includes(v.status)).length}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setQueueTab('completed')}
            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
              queueTab === 'completed'
                ? 'border-primary text-primary bg-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <Text>Done Today</Text>
          </TouchableOpacity>
        </View>

        <View className="p-2.5 border-b border-zinc-100">
          <View className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <TextInput
              placeholder="Search name, ID..."
              value={searchQuery}
              onChangeText={(text) => setSearchQuery(text)}
              className="w-full pl-8 pr-3 py-2 bg-zinc-50 text-zinc-800 text-[11px] rounded-lg border border-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </View>
        </View>

        <View className="flex-1 overflow-y-auto">
          {loadingVisits ? (
            <View className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <RotateCw className="h-5 w-5 animate-spin mb-2 text-primary" />
              <Text className="text-[11px] font-medium">Loading queue...</Text>
            </View>
          ) : filteredVisits.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-20 text-center px-6">
              <User className="h-8 w-8 text-zinc-200 mb-2" />
              <Text className="text-[11px] font-semibold text-zinc-500">No patients in queue</Text>
              <Text className="text-[10px] text-zinc-400 mt-0.5">Check-ins will appear here live.</Text>
            </View>
          ) : (
            <View className="p-2 space-y-1">
              {filteredVisits.map((visit) => {
                const isSelected = selectedVisit?.id === visit.id;
                const ptName = `${visit.patients?.first_name || ''} ${visit.patients?.last_name || ''}`;
                
                return (
                  <TouchableOpacity
                    key={visit.id}
                    onPress={() => {
                      setSelectedVisit(visit);
                      setActiveTab('consult');
                    }}
                    className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-150 cursor-pointer relative group ${
                      isSelected
                        ? 'bg-primary text-white shadow-md'
                        : 'hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <View className="flex items-center gap-2.5">
                      <View className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : visit.status === 'In Progress'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}>
                        <Text>{visit.token_no}</Text>
                      </View>

                      <View className="min-w-0 flex-1">
                        <Text className={`font-bold text-[13px] truncate leading-tight ${isSelected ? 'text-white' : 'text-zinc-800'}`}>
                          {ptName}
                        </Text>
                        <View className="flex items-center gap-1.5 mt-0.5">
                          <Text className={`text-[10px] font-medium ${isSelected ? 'text-white/70' : 'text-zinc-400'}`}>
                            {visit.patients?.age}y • {visit.patients?.gender}
                          </Text>
                          <Text className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : visit.status === 'Waiting'
                              ? 'bg-amber-50 text-amber-600'
                              : visit.status === 'In Progress'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}>
                            {visit.status === 'In Progress' ? 'Active' : visit.status}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {visit.chief_complaint && !isSelected && (
                      <Text className="mt-1.5 text-[10px] text-zinc-400 truncate pl-[42px]">
                        {visit.chief_complaint}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* ——————————— RIGHT PANEL: WORKSPACE ——————————— */}
      {selectedVisit ? (
        <View className="flex-1 flex flex-col overflow-hidden bg-zinc-50/30">
          {/* Header Bar */}
          <View className="px-6 py-4 bg-white border-b border-zinc-200 flex items-center justify-between shrink-0">
            <View className="flex items-center gap-4">
              <View className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <User className="h-5 w-5" />
              </View>
              <View>
                <View className="flex items-center gap-2.5">
                  <Text className="text-lg font-bold text-zinc-900 font-heading leading-none">
                    {selectedVisit.patients?.first_name} {selectedVisit.patients?.last_name}
                  </Text>
                  <Text className="bg-zinc-100 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-500 border border-zinc-200 font-bold">
                    {selectedVisit.patients?.patient_code}
                  </Text>
                </View>
                <View className="flex items-center gap-2 text-[11px] text-zinc-500 mt-1 font-medium">
                  <Text>{selectedVisit.patients?.age} Yrs / {selectedVisit.patients?.gender}</Text>
                  <Text className="text-zinc-300">•</Text>
                  <Text>{selectedVisit.patients?.phone}</Text>
                  {selectedVisit.patients?.allergies && (
                    <>
                      <Text className="text-zinc-300">•</Text>
                      <Text className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">
                        ⚠ {selectedVisit.patients?.allergies}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            <View className="flex items-center gap-2.5">
              {selectedVisit.status === 'Waiting' && (
                <TouchableOpacity
                  onPress={handleHoldVisit}
                  disabled={saving}
                  className="bg-cta hover:bg-cta/90 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {saving ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
                  <Text className="text-white font-bold">Start Consultation</Text>
                </TouchableOpacity>
              )}
              {selectedVisit.status === 'In Progress' && (
                <View className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold py-2 px-4 rounded-xl flex items-center gap-2 animate-pulse">
                  <View className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <Text className="text-emerald-700 font-bold">Consultation Active</Text>
                </View>
              )}
            </View>
          </View>

          {/* Tab Navigation */}
          <View className="flex bg-white border-b border-zinc-200 px-6 shrink-0">
            <TouchableOpacity
              onPress={() => setActiveTab('consult')}
              className={`py-3 px-4 text-[11px] uppercase tracking-wider font-bold border-b-2 transition-all cursor-pointer mr-1 ${
                activeTab === 'consult'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <FileText className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
              <Text>Consultation</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('history')}
              className={`py-3 px-4 text-[11px] uppercase tracking-wider font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <History className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
              <Text>History ({pastVisits.length})</Text>
            </TouchableOpacity>
          </View>

          {/* Workspace Content */}
          <View className="flex-1 overflow-y-auto">
            {activeTab === 'consult' ? (
              <View className="p-6 space-y-5 max-w-[1100px]">
                {errorMsg && (
                  <View className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-center gap-2.5 font-medium">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    <Text>{errorMsg}</Text>
                  </View>
                )}
                {successMsg && (
                  <View className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center gap-2.5 font-medium">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                    <Text>{successMsg}</Text>
                  </View>
                )}

                {/* Section 1: Clinical Notes */}
                <View className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <View className="flex items-center gap-2 pb-3 border-b border-zinc-100">
                    <View className="h-2 w-2 rounded-full bg-primary" />
                    <Text className="text-xs font-bold text-zinc-800 uppercase tracking-wider">1. Clinical Notes & Findings</Text>
                  </View>

                  <View className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-3.5 flex items-start gap-3">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <View>
                      <Text className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Chief Complaint (From Reception)</Text>
                      <Text className="text-xs font-semibold text-zinc-800 mt-0.5">{selectedVisit.chief_complaint || 'No complaint recorded at check-in'}</Text>
                    </View>
                  </View>

                  <View className="grid grid-cols-2 gap-4">
                    <View>
                      <Text className="block text-xs font-bold text-zinc-700 mb-1.5">Symptoms & History</Text>
                      <TextInput
                        multiline
                        numberOfLines={3}
                        value={symptoms}
                        onChangeText={(text) => setSymptoms(text)}
                        placeholder="Detail patient symptoms, duration, severity..."
                        className="w-full p-3 bg-zinc-50/50 text-zinc-800 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:border-primary focus:bg-white transition-all h-20 text-top"
                        textAlignVertical="top"
                      />
                    </View>
                    <View>
                      <Text className="block text-xs font-bold text-zinc-700 mb-1.5">Clinical Findings & Examination</Text>
                      <TextInput
                        multiline
                        numberOfLines={3}
                        value={clinicalFindings}
                        onChangeText={(text) => setClinicalFindings(text)}
                        placeholder="BP, Pulse, Temp, physical exam observations..."
                        className="w-full p-3 bg-zinc-50/50 text-zinc-800 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:border-primary focus:bg-white transition-all h-20 text-top"
                        textAlignVertical="top"
                      />
                    </View>
                  </View>

                  <View>
                    <Text className="block text-xs font-bold text-zinc-700 mb-1.5">Provisional / Confirmed Diagnosis *</Text>
                    <TextInput
                      value={diagnosis}
                      onChangeText={(text) => setDiagnosis(text)}
                      placeholder="e.g. Acute Upper Respiratory Tract Infection (J06.9)"
                      className="w-full py-2.5 px-3.5 bg-zinc-50/50 text-zinc-800 text-xs font-bold rounded-xl border border-zinc-200 focus:outline-none focus:border-primary focus:bg-white transition-all placeholder:font-normal"
                    />
                  </View>
                </View>

                {/* Section 2: Advice & Follow-up */}
                <View className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <View className="flex items-center gap-2 pb-3 border-b border-zinc-100">
                    <View className="h-2 w-2 rounded-full bg-cta" />
                    <Text className="text-xs font-bold text-zinc-800 uppercase tracking-wider">2. Doctor's Advice & Follow-up</Text>
                  </View>

                  <View>
                    <Text className="block text-xs font-bold text-zinc-700 mb-1.5">General Advice & Lifestyle Instructions</Text>
                    <TextInput
                      multiline
                      numberOfLines={2}
                      value={doctorNotes}
                      onChangeText={(text) => setDoctorNotes(text)}
                      placeholder="e.g. Drink plenty of warm fluids, rest for 3 days, avoid oily food..."
                      className="w-full p-3 bg-zinc-50/50 text-zinc-800 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:border-primary focus:bg-white transition-all h-16 text-top"
                      textAlignVertical="top"
                    />
                  </View>

                  <View className="grid grid-cols-2 gap-4">
                    <View>
                      <Text className="block text-xs font-bold text-zinc-700 mb-1.5">Follow-up Instructions</Text>
                      <TextInput
                        value={followUpAdvice}
                        onChangeText={(text) => setFollowUpAdvice(text)}
                        placeholder="e.g. Review after 5 days with CBC report"
                        className="w-full py-2 px-3 bg-zinc-50/50 text-zinc-800 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:border-primary focus:bg-white transition-all"
                      />
                    </View>
                    <View>
                      <Text className="block text-xs font-bold text-zinc-700 mb-1.5">Follow-up Date</Text>
                      <TextInput
                        value={followUpDate}
                        onChangeText={(text) => setFollowUpDate(text)}
                        placeholder="YYYY-MM-DD"
                        className="w-full py-2 px-3 bg-zinc-50/50 text-zinc-800 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:border-primary focus:bg-white transition-all font-medium"
                      />
                    </View>
                  </View>
                </View>

                {/* Section 3: E-Prescription */}
                <View className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <View className="flex items-center gap-2 pb-3 border-b border-zinc-100">
                    <View className="h-2 w-2 rounded-full bg-emerald-500" />
                    <Text className="text-xs font-bold text-zinc-800 uppercase tracking-wider">3. E-Prescription (Rx)</Text>
                  </View>

                  <View className="relative">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                    <TextInput
                      placeholder="Search medicine by Brand or Generic name (e.g. Dolo, Amoxicillin)..."
                      value={medSearchQuery}
                      onChangeText={(text) => {
                        setMedSearchQuery(text);
                        if (text.trim().length > 1) {
                          searchMedicines(text);
                        } else {
                          setSuggestedMedicines([]);
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 text-zinc-800 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:border-primary focus:bg-white transition-all font-medium"
                    />

                    {showSuggestions && suggestedMedicines.length > 0 && (
                      <View className="absolute top-12 left-0 right-0 z-20 bg-white border border-zinc-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-zinc-100">
                        {suggestedMedicines.map((med) => (
                          <TouchableOpacity
                            key={med.id}
                            onPress={() => {
                              setSelectedMedicine(med);
                              setShowSuggestions(false);
                            }}
                            className="p-3 hover:bg-primary/5 cursor-pointer flex items-center justify-between"
                          >
                            <View>
                              <Text className="font-bold text-xs text-zinc-800">{med.medicine_name}</Text>
                              <Text className="text-[10px] text-zinc-500">{med.generic_name || 'Generic'} • {med.manufacturer}</Text>
                            </View>
                            <Text className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{med.strength}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  <View className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 mb-4 relative">
                    <View className="grid grid-cols-5 gap-3 items-end">
                      <View className="col-span-1">
                        <Text className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Medicine</Text>
                        <View className="py-2 px-3 bg-zinc-100 rounded-lg border border-zinc-200 truncate">
                          {selectedMedicine ? (
                            <Text className="text-xs font-bold text-zinc-800 truncate">{selectedMedicine.medicine_name}</Text>
                          ) : (
                            <Text className="text-xs text-zinc-400 italic">Select above</Text>
                          )}
                        </View>
                      </View>
                      <View>
                        <Text className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Dosage</Text>
                        <TextInput
                          value={dosage}
                          onChangeText={(text) => setDosage(text)}
                          className="w-full py-2 px-2.5 bg-white text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary transition-all font-medium"
                        />
                      </View>
                      <View>
                        <Text className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Frequency</Text>
                        <NativePicker
                          value={frequency}
                          onValueChange={(val: any) => setFrequency(val)}
                          placeholder="Daily"
                          options={[
                            { label: 'Daily', value: 'Daily' },
                            { label: 'BD (Twice)', value: 'Twice a Day' },
                            { label: 'TDS (Thrice)', value: 'Thrice a Day' },
                            { label: 'QID (4x)', value: 'Four Times a Day' },
                            { label: 'Weekly', value: 'Once Weekly' },
                            { label: 'PRN', value: 'As Needed (PRN)' },
                          ]}
                        />
                      </View>
                      <View>
                        <Text className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Duration</Text>
                        <TextInput
                          value={duration}
                          onChangeText={(text) => setDuration(text)}
                          className="w-full py-2 px-2.5 bg-white text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary transition-all font-medium"
                        />
                      </View>
                      <View className="flex gap-2 items-end">
                        <View className="flex-1">
                          <Text className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Qty</Text>
                          <TextInput
                            value={String(quantity)}
                            onChangeText={(text) => setQuantity(Number(text) || 1)}
                            className="w-full py-2 px-2.5 bg-white text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary transition-all font-medium"
                          />
                        </View>
                        <TouchableOpacity
                          onPress={handleAddPrescriptionItem}
                          disabled={!selectedMedicine}
                          className={`p-2 rounded-lg transition-all cursor-pointer shrink-0 ${selectedMedicine ? 'bg-primary hover:bg-primary/90 text-white shadow-sm' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}
                        >
                          <Plus className="h-4 w-4" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {selectedMedicine && (
                      <View className="mt-3 flex items-center gap-3">
                        <Text className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/15">Selected: {selectedMedicine.medicine_name} ({selectedMedicine.strength})</Text>
                        <TextInput
                          value={instructions}
                          onChangeText={(text) => setInstructions(text)}
                          placeholder="Instructions (e.g. Take after meals)"
                          className="flex-1 py-1.5 px-3 bg-white text-zinc-700 text-[11px] rounded-lg border border-zinc-200 focus:outline-none focus:border-primary transition-all"
                        />
                      </View>
                    )}
                  </View>

                  {prescribedItems.length === 0 ? (
                    <View className="border border-dashed border-zinc-200 rounded-xl p-6 text-center text-zinc-400 text-xs bg-zinc-50/50">
                      <Text>No medicines added yet. Search a medicine above to start building the prescription.</Text>
                    </View>
                  ) : (
                    <View className="space-y-2">
                      <View className="flex items-center justify-between mb-1">
                        <Text className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{prescribedItems.length} Medicine{prescribedItems.length > 1 ? 's' : ''} Added</Text>
                      </View>
                      {prescribedItems.map((item, idx) => (
                        <View key={idx} className="flex items-center justify-between bg-white border border-zinc-200 px-4 py-3 rounded-xl hover:border-zinc-300 transition-colors">
                          <View className="flex items-center gap-3 min-w-0">
                            <Text className="text-[10px] font-bold text-zinc-400 w-5 text-center">{idx + 1}</Text>
                            <View className="min-w-0">
                              <Text className="font-bold text-zinc-800 text-xs truncate">{item.medicineName}</Text>
                              <Text className="text-[10px] text-zinc-500 mt-0.5">
                                {item.dosage} • {item.frequency} • {item.duration} • Qty: {item.quantity}
                                {item.instructions && <Text className="text-primary ml-1 font-semibold">({item.instructions})</Text>}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity onPress={() => handleRemovePrescriptionItem(idx)} className="text-zinc-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer">
                            <Trash2 className="h-3.5 w-3.5" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Section 4: Action Buttons */}
                <View className="flex items-center justify-end gap-3 pt-2 pb-4">
                  <TouchableOpacity onPress={() => { setSelectedVisit(null); resetConsultationForm(); }} className="py-2.5 px-6 bg-white border border-zinc-200 text-zinc-600 font-bold text-xs rounded-xl hover:bg-zinc-50 transition-all cursor-pointer">
                    <Text className="font-bold text-zinc-600">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSubmitConsultation} disabled={saving || !diagnosis.trim()} className={`py-2.5 px-8 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm ${diagnosis.trim() && !saving ? 'bg-cta hover:bg-cta/90 text-white' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}>
                    {saving ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    <Text className={diagnosis.trim() && !saving ? 'text-white font-bold' : 'text-zinc-400 font-bold'}>Push to Pharmacy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* History Tab */
              <View className="p-6 space-y-4 max-w-[900px]">
                {loadingHistory ? (
                  <View className="flex items-center justify-center py-16 text-zinc-400">
                    <RotateCw className="h-5 w-5 animate-spin mr-2 text-primary" />
                    <Text className="text-xs font-medium">Loading records...</Text>
                  </View>
                ) : pastVisits.length === 0 ? (
                  <View className="border border-dashed border-zinc-200 rounded-xl p-16 text-center text-zinc-400 text-xs bg-white">
                    <History className="h-8 w-8 mx-auto mb-2 text-zinc-300" />
                    <Text>No previous visits found for this patient.</Text>
                  </View>
                ) : (
                  pastVisits.map((past) => (
                    <View key={past.id} className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3.5 hover:shadow-sm transition-shadow">
                      <View className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                        <View className="flex items-center gap-2">
                          <Text className="text-primary font-bold text-sm">{new Date(past.visit_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</Text>
                          <Text className="text-zinc-300">•</Text>
                          <Text className="text-[10px] text-zinc-400 font-mono font-bold">{past.visit_number}</Text>
                        </View>
                        <Text className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">{past.status}</Text>
                      </View>
                      <Text className="text-xs text-zinc-600 italic">"{past.chief_complaint}"</Text>
                      {past.diagnoses && past.diagnoses.length > 0 && (
                        <View className="grid grid-cols-3 gap-3 text-xs">
                          <View>
                            <Text className="text-[10px] font-bold text-zinc-400 uppercase block mb-0.5">Diagnosis</Text>
                            <Text className="text-primary font-bold">{past.diagnoses[0].diagnosis}</Text>
                          </View>
                          <View>
                            <Text className="text-[10px] font-bold text-zinc-400 uppercase block mb-0.5">Symptoms</Text>
                            <Text className="text-zinc-600">{past.diagnoses[0].symptoms || '—'}</Text>
                          </View>
                          <View>
                            <Text className="text-[10px] font-bold text-zinc-400 uppercase block mb-0.5">Findings</Text>
                            <Text className="text-zinc-600">{past.diagnoses[0].clinical_findings || '—'}</Text>
                          </View>
                        </View>
                      )}
                      {past.prescriptions && past.prescriptions.length > 0 && (
                        <View>
                          <Text className="text-[10px] font-bold text-zinc-400 uppercase block mb-1.5">Prescribed Rx</Text>
                          <View className="flex flex-wrap gap-2">
                            {past.prescriptions[0].prescription_items?.map((item) => (
                              <Text key={item.id} className="bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg text-[11px] font-medium text-zinc-700">
                                <Text className="font-bold">{item.medicines?.medicine_name}</Text> {item.medicines?.strength} — {item.dosage} × {item.duration}
                              </Text>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        </View>
      ) : (
        <View className="flex-1 flex items-center justify-center bg-zinc-50/30">
          <View className="text-center max-w-xs">
            <View className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-primary">
              <Activity className="h-7 w-7" />
            </View>
            <Text className="text-sm font-bold text-zinc-800 mb-1.5">Select a Patient</Text>
            <Text className="text-xs text-zinc-400 leading-relaxed">Choose a patient from the queue on the left to begin their consultation, review records, and write prescriptions.</Text>
          </View>
        </View>
      )}
    </View>
  );
}
