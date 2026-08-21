import React, { useEffect, useState, useRef } from 'react';
import { Patient, Doctor, DiagnosisType } from '@/types/reception';
import { 
  getDoctors, 
  searchPatients, 
  createVisit,
  checkIsFirstVisit
} from '@/services/reception';
import { useToast } from '@/components/ui/toast';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { 
  Search, 
  UserCheck, 
  Sparkles, 
  ArrowRight,
  ArrowLeft,
  Scissors,
  Layers,
  CalendarDays,
  User,
  Stethoscope
} from 'lucide-react-native';

interface VisitWizardViewProps {
  initialPatient?: Patient | null;
  onVisitCreated: (visitId: number, invoiceId: number, consultationFee: number, patientName: string, visitNumber: string) => void;
}

type WizardStep = 
  | 'search_patient'
  | 'confirm_patient'
  | 'visit_details';

export default function VisitWizardView({ initialPatient, onVisitCreated }: VisitWizardViewProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('search_patient');
  
  // Selection states
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Doctor | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosisType, setDiagnosisType] = useState<DiagnosisType>('Hair Diagnosis');
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  
  // Data lists
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  
  // Loader & Search inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  // Load doctors & recent patients metadata
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setIsLoadingMetadata(true);
        const [docsData, recentPatsData] = await Promise.all([
          getDoctors(),
          searchPatients('')
        ]);
        setDoctors(docsData);
        setRecentPatients(recentPatsData);
        if (docsData.length > 0) {
          setSelectedDoc(docsData[0]);
        }
      } catch (err: any) {
        console.error(err);
        toast('Failed to load doctor records', 'error');
      } finally {
        setIsLoadingMetadata(false);
      }
    };
    loadMetadata();
  }, []);

  // Handle passed-in patient
  useEffect(() => {
    if (initialPatient) {
      setSelectedPatient(initialPatient);
      setCurrentStep('visit_details');
    }
  }, [initialPatient]);

  // Check if selected patient is a first-time visitor
  useEffect(() => {
    if (!selectedPatient) {
      setIsFirstVisit(true);
      return;
    }

    const checkPatientVisitsStatus = async () => {
      try {
        const isFirst = await checkIsFirstVisit(selectedPatient.id);
        setIsFirstVisit(isFirst);
      } catch (err) {
        console.error('Failed to check patient visits status:', err);
        setIsFirstVisit(true);
      }
    };

    checkPatientVisitsStatus();
  }, [selectedPatient]);

  // Global search trigger
  const triggerSearch = async (val: string) => {
    if (!val || val.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchPatients(val);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePatientSelect = (pat: Patient) => {
    setSelectedPatient(pat);
    setSearchResults([]);
    setSearchQuery('');
    setCurrentStep('confirm_patient');
  };

  const handleCreateVisitSubmit = async () => {
    if (!selectedPatient || !selectedDoc || !chiefComplaint.trim()) {
      toast('Please enter a chief complaint', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullComplaint = `[${diagnosisType}] ${chiefComplaint.trim()}`;
      const { visit, invoice } = await createVisit({
        patient_id: selectedPatient.id,
        doctor_id: selectedDoc.id,
        chief_complaint: fullComplaint,
        consultation_fee: isFirstVisit ? selectedDoc.consultation_fee : 0,
      });

      toast('Visit scheduled successfully!', 'success');
      
      const patName = `${selectedPatient.first_name} ${selectedPatient.last_name || ''}`.trim();
      const fee = isFirstVisit ? selectedDoc.consultation_fee : 0;
      onVisitCreated(
        visit.id, 
        invoice?.id || 0, 
        fee, 
        patName, 
        visit.visit_number
      );
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to schedule clinical visit', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="gap-4 w-full">
      {/* Title */}
      <View>
        <Text className="text-xl font-black text-slate-900">Clinical OPD Visit Scheduler</Text>
        <Text className="text-xs text-slate-500 font-medium mt-0.5">Select patient, practitioner, and consultation details</Text>
      </View>

      {/* Wizard Step Progress Tracker */}
      <View className="p-3.5 bg-white rounded-3xl border border-slate-100 shadow-sm flex-row items-center justify-between">
        {/* Step 1 */}
        <TouchableOpacity 
          onPress={() => setCurrentStep('search_patient')}
          className="flex-row items-center gap-2"
        >
          <View className={`w-7 h-7 rounded-xl items-center justify-center border ${
            currentStep === 'search_patient' 
              ? 'bg-cyan-600 border-cyan-700' 
              : selectedPatient ? 'bg-emerald-600 border-emerald-700' : 'bg-slate-100 border-slate-200'
          }`}>
            <Text className="text-white text-xs font-black">1</Text>
          </View>
          <Text className={`text-xs font-black ${currentStep === 'search_patient' ? 'text-slate-900' : 'text-slate-500'}`}>
            Patient Lookup
          </Text>
        </TouchableOpacity>

        <Text className="text-slate-300 font-bold">→</Text>

        {/* Step 2 */}
        <TouchableOpacity 
          onPress={() => selectedPatient && setCurrentStep('visit_details')}
          disabled={!selectedPatient}
          className="flex-row items-center gap-2"
        >
          <View className={`w-7 h-7 rounded-xl items-center justify-center border ${
            currentStep === 'visit_details' 
              ? 'bg-cyan-600 border-cyan-700' 
              : 'bg-slate-100 border-slate-200'
          }`}>
            <Text className={`text-xs font-black ${currentStep === 'visit_details' ? 'text-white' : 'text-slate-500'}`}>2</Text>
          </View>
          <Text className={`text-xs font-black ${currentStep === 'visit_details' ? 'text-slate-900' : 'text-slate-500'}`}>
            Doctor & Fee
          </Text>
        </TouchableOpacity>
      </View>

      {/* STEP 1: Search Patient */}
      {currentStep === 'search_patient' && (
        <View className="gap-3.5">
          <View className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3">
            <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Search Patient Record</Text>

            
            <View className="relative">
              <TextInput
                placeholder="Search phone number, code, or patient name..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  triggerSearch(text);
                }}
                className="h-11 pl-11 pr-10 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-900 font-medium"
              />
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              {isSearching && (
                <View className="absolute right-3.5 top-3.5">
                  <ActivityIndicator size="small" color="#0891b2" />
                </View>
              )}
            </View>

            {/* Search Results Dropdown Cards */}
            {searchResults.length > 0 && (
              <View className="gap-2 pt-1 border-t border-slate-150 mt-1">
                <Text className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Search Results ({searchResults.length})</Text>
                {searchResults.map((pat) => (
                  <TouchableOpacity
                    key={pat.id}
                    onPress={() => handlePatientSelect(pat)}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex-row items-center justify-between active:bg-cyan-50 active:border-cyan-200"
                  >
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center gap-2">
                        <Text className="font-black text-slate-900 text-xs">{pat.first_name} {pat.last_name || ''}</Text>
                        <Text className="text-[10px] font-mono font-extrabold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100">
                          {pat.patient_code}
                        </Text>
                      </View>
                      <Text className="text-[11px] text-slate-500 font-medium mt-0.5">Phone: {pat.phone} • {pat.gender}</Text>
                    </View>
                    <View className="px-3 py-1.5 bg-cyan-600 rounded-lg">
                      <Text className="text-white text-xs font-bold">Select</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Quick Select Recent Patients */}
          {recentPatients.length > 0 && searchResults.length === 0 && (
            <View className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs gap-3">
              <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Recently Registered Patients</Text>
              
              <View className="gap-2">
                {recentPatients.slice(0, 5).map((pat) => (
                  <TouchableOpacity
                    key={pat.id}
                    onPress={() => handlePatientSelect(pat)}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex-row items-center justify-between active:bg-cyan-50 active:border-cyan-200"
                  >
                    <View>
                      <Text className="font-bold text-slate-900 text-xs">{pat.first_name} {pat.last_name || ''}</Text>
                      <Text className="text-[10px] text-slate-500 font-medium mt-0.5">Phone: {pat.phone} • [{pat.patient_code}]</Text>
                    </View>
                    <View className="px-3 py-1 bg-slate-200 rounded-lg">
                      <Text className="text-slate-800 text-xs font-bold">Choose</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

        </View>
      )}

      {/* STEP 2: Visit Details & Doctor Selection */}
      {currentStep === 'visit_details' && selectedPatient && (
        <View className="gap-3.5">
          {/* Selected Patient Banner */}
          <View className="p-4 bg-cyan-50/80 border border-cyan-200 rounded-2xl flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-cyan-600 items-center justify-center border border-cyan-700 shadow-xs">
                <User className="h-5 w-5 text-white" />
              </View>
              <View>
                <Text className="font-black text-slate-900 text-sm">
                  {selectedPatient.first_name} {selectedPatient.last_name || ''}
                </Text>
                <Text className="text-xs text-slate-600 font-medium mt-0.5">
                  Phone: {selectedPatient.phone} • [{selectedPatient.patient_code}]
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setCurrentStep('search_patient')}
              className="px-3.5 py-1.5 bg-white border border-cyan-200 rounded-xl active:bg-slate-100"
            >
              <Text className="text-xs font-bold text-cyan-700">Change</Text>
            </TouchableOpacity>
          </View>

          {/* First Visit Consultation Fee Warning Card */}
          <View className={`p-3.5 rounded-2xl border flex-row items-center justify-between ${
            isFirstVisit 
              ? 'bg-amber-50/90 border-amber-200' 
              : 'bg-emerald-50/90 border-emerald-200'
          }`}>
            <View className="flex-1 mr-2">
              <Text className={`text-xs font-black ${isFirstVisit ? 'text-amber-900' : 'text-emerald-900'}`}>
                {isFirstVisit ? 'First-Time Patient Consultation' : 'Repeat Visit Patient'}
              </Text>
              <Text className={`text-[11px] font-medium mt-0.5 ${isFirstVisit ? 'text-amber-800' : 'text-emerald-800'}`}>
                {isFirstVisit 
                  ? 'Standard consultation fee of ₹500 will be billed.' 
                  : 'Free consultation fee (₹0) for return patient visit.'}
              </Text>
            </View>

            <View className={`px-3 py-1 rounded-xl font-black ${isFirstVisit ? 'bg-amber-600' : 'bg-emerald-600'}`}>
              <Text className="text-white font-black text-xs">
                {isFirstVisit ? 'Fee: ₹500' : 'Fee: ₹0'}
              </Text>
            </View>
          </View>

          {/* Select Practitioner */}
          <View className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs gap-3">
            <View className="flex-row items-center gap-2 border-b border-slate-150 pb-2.5">
              <Stethoscope className="h-4 w-4 text-cyan-600" />
              <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Select Practitioner *</Text>
            </View>

            <View className="gap-2">
              {doctors.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                const docName = doc.profiles?.full_name || 'Practitioner';
                const deptName = doc.departments?.department_name || 'General OPD';

                return (
                  <TouchableOpacity
                    key={doc.id}
                    onPress={() => setSelectedDoc(doc)}
                    className={`p-3.5 rounded-2xl border flex-row items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-cyan-50/80 border-cyan-600 shadow-xs'
                        : 'bg-white border-slate-200 active:bg-slate-50'
                    }`}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className={`w-9 h-9 rounded-xl items-center justify-center border ${
                        isSelected ? 'bg-cyan-600 border-cyan-700' : 'bg-slate-100 border-slate-200'
                      }`}>
                        <Stethoscope className={`h-4.5 w-4.5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                      </View>
                      <View>
                        <Text className={`text-xs font-black ${isSelected ? 'text-cyan-900' : 'text-slate-900'}`}>
                          {docName}
                        </Text>
                      </View>
                    </View>

                    <View className={`w-5 h-5 rounded-full border items-center justify-center ${
                      isSelected ? 'border-cyan-600 bg-cyan-600' : 'border-slate-300'
                    }`}>
                      {isSelected && <View className="w-2 h-2 rounded-full bg-white" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Diagnosis Type Selection */}
          <View className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs gap-3">
            <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Diagnosis Category</Text>

            <View className="flex-row gap-2">
              {[
                { type: 'Hair Diagnosis' as const, label: 'Hair', icon: Scissors },
                { type: 'Skin Diagnosis' as const, label: 'Skin', icon: Sparkles },
                { type: 'Both Hair & Skin' as const, label: 'Both', icon: Sparkles },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = diagnosisType === item.type;


                return (
                  <TouchableOpacity
                    key={item.type}
                    onPress={() => setDiagnosisType(item.type)}
                    className={`flex-1 p-3 rounded-2xl border items-center justify-center gap-1.5 ${
                      isSelected 
                        ? 'bg-cyan-600 border-cyan-700 text-white shadow-xs' 
                        : 'bg-white border-slate-200 active:bg-slate-50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                    <Text className={`text-xs font-extrabold ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Chief Complaint Input */}
          <View className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs gap-2">
            <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Chief Clinical Complaints</Text>
            <TextInput
              placeholder="e.g. Hair fall, scalp itchiness, skin rash for 2 weeks..."
              value={chiefComplaint}
              onChangeText={setChiefComplaint}
              multiline
              numberOfLines={3}
              className="p-3 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-900 font-medium min-h-[70px]"
            />
          </View>

          {/* Confirm & Create Visit Submit Button */}
          <TouchableOpacity
            onPress={handleCreateVisitSubmit}
            disabled={isSubmitting}
            className="h-12 bg-cyan-600 rounded-2xl flex-row items-center justify-center gap-2 active:bg-cyan-700 shadow-xs mt-1"
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <CalendarDays className="h-5 w-5 text-white" />
                <Text className="text-white font-black text-sm">Schedule Clinical Visit</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}


