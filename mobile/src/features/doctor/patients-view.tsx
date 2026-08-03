import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { TableSkeleton } from '@/components/ui/skeleton';
import { View, Text, TouchableOpacity, TextInput, Image, Modal } from 'react-native';
import { 
  Search, 
  Eye, 
  ClipboardList, 
  RefreshCw, 
  ChevronLeft, 
  Calendar, 
  FileText,
  X,
  IndianRupee,
  User,
  Phone,
  CheckCircle2
} from 'lucide-react-native';

interface Patient {
  id: string | number;
  patient_code: string;
  first_name: string;
  last_name: string;
  gender: string;
  dob: string;
  age: number;
  phone: string;
  allergies: string;
  medical_history: string;
  blood_group?: string;
  created_at: string;
}

interface Visit {
  id: string | number;
  visit_date: string;
  visit_number: string;
  chief_complaint: string;
  status: string;
  prescription_image_front?: string | null;
  prescription_image_back?: string | null;
  prescription_amount?: number | null;
  diagnoses?: Array<{
    symptoms: string;
    clinical_findings: string;
    diagnosis: string;
    doctor_notes: string;
  }>;
  prescriptions?: Array<{
    advice: string;
  }>;
}

export default function PatientsView() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Selected Patient Detail state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientVisits, setPatientVisits] = useState<Visit[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);

  // Lightbox Modal state for full-screen image preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      let query = supabase.from('patients').select('*');
      if (search.trim()) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      const { data, error } = await query.order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      setPatients(data || []);
    } catch (err: any) {
      console.error('Error fetching patients:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatientVisits = async (patientId: string | number) => {
    try {
      setLoadingVisits(true);
      
      let { data, error } = await supabase
        .from('visits')
        .select(`
          *,
          diagnoses (
            symptoms,
            clinical_findings,
            diagnosis,
            doctor_notes
          ),
          prescriptions (
            id,
            advice,
            created_at
          )
        `)
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false });

      if (error) {
        console.warn('Fallback querying basic visits:', error.message);
        const res = await supabase
          .from('visits')
          .select('*, prescriptions(id, advice)')
          .eq('patient_id', patientId)
          .order('visit_date', { ascending: false });
        data = res.data;
      }

      setPatientVisits((data || []) as unknown as Visit[]);
    } catch (err: any) {
      console.error('Error fetching patient visits:', err.message);
    } finally {
      setLoadingVisits(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleInspectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    loadPatientVisits(patient.id);
  };

  return (
    <View className="gap-4 w-full">
      {/* Lightbox Modal for Prescription Images */}
      <Modal
        visible={!!previewImage}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPreviewImage(null)}
      >
        <View className="flex-1 bg-slate-950/80 items-center justify-center p-4">
          <View className="w-full max-w-lg items-center gap-3">
            <TouchableOpacity
              onPress={() => setPreviewImage(null)}
              className="self-end p-2 bg-slate-800 rounded-full"
            >
              <X className="h-5 w-5 text-white" />
            </TouchableOpacity>
            {previewImage && (
              <Image 
                source={{ uri: previewImage }} 
                className="w-full h-96 rounded-2xl"
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>

      {selectedPatient ? (
        /* PATIENT DETAIL & VISITS VIEW */
        <View className="gap-4 w-full">
          {/* Header Bar */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => setSelectedPatient(null)}
              className="flex-row items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/70 rounded-xl active:bg-slate-100 shadow-2xs"
            >
              <ChevronLeft className="h-4 w-4 text-slate-700" />
              <Text className="text-xs font-bold text-slate-800">Back to Patient Directory</Text>
            </TouchableOpacity>
          </View>

          {/* Patient Profile Card */}
          <View className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1 mr-2">
                <View className="w-12 h-12 rounded-2xl bg-cyan-50 items-center justify-center">
                  <User className="h-6 w-6 text-cyan-600" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-black text-slate-900">
                    {selectedPatient.first_name} {selectedPatient.last_name || ''}
                  </Text>
                  <Text className="text-xs text-slate-500 font-medium mt-0.5">
                    Phone: {selectedPatient.phone} • {selectedPatient.age ? `${selectedPatient.age}y` : '—'} • {selectedPatient.gender}
                  </Text>
                </View>
              </View>

              <View className="bg-cyan-50 px-3 py-1.5 rounded-xl border border-cyan-100 items-end">
                <Text className="text-[9px] font-extrabold text-cyan-700 uppercase">RECORD CODE</Text>
                <Text className="text-xs font-mono font-black text-cyan-900">{selectedPatient.patient_code}</Text>
              </View>
            </View>

            {/* Medical Note */}
            <View className="p-3 bg-cyan-50/60 rounded-2xl flex-row items-start gap-2.5">
              <FileText className="h-4 w-4 text-cyan-700 mt-0.5" />
              <View className="flex-1">
                <Text className="text-xs font-black text-cyan-900">Physical Prescription Protocol</Text>
                <Text className="text-[11px] text-cyan-800 font-medium mt-0.5">
                  Write the physical prescription for the patient. The pharmacy team digitizes uploaded prescription photos upon dispensing.
                </Text>
              </View>
            </View>
          </View>

          {/* Visits Timeline */}
          <View className="gap-3">
            <Text className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Patient Visit Logs & Digitized Prescriptions
            </Text>

            {loadingVisits ? (
              <View className="p-6 bg-white rounded-3xl border border-slate-100">
                <TableSkeleton cols={4} rows={4} />
              </View>
            ) : patientVisits.length === 0 ? (
              <View className="items-center justify-center py-12 px-4 bg-white rounded-3xl border border-slate-100">
                <ClipboardList className="h-10 w-10 text-cyan-600 mb-2" />
                <Text className="font-black text-slate-900 text-base">No Visit Records</Text>
                <Text className="text-slate-500 text-xs text-center mt-1 font-medium">No clinical visits logged yet for this patient.</Text>
              </View>
            ) : (
              <View className="gap-3">
                {patientVisits.map((visit) => {
                  let activeFront = visit.prescription_image_front || null;
                  let activeBack = visit.prescription_image_back || null;
                  let activeAmount = visit.prescription_amount || null;

                  if (visit.prescriptions && Array.isArray(visit.prescriptions)) {
                    for (const rx of visit.prescriptions) {
                      const adviceText = rx.advice || '';
                      if (!adviceText) continue;

                      try {
                        const parsed = JSON.parse(adviceText);
                        if (parsed.front) activeFront = activeFront || parsed.front;
                        if (parsed.back) activeBack = activeBack || parsed.back;
                        if (parsed.amount) activeAmount = activeAmount || parsed.amount;
                      } catch (e) {
                        if (adviceText.includes('Front:')) {
                          const matchF = adviceText.match(/Front:\s*([^\s|]+)/);
                          if (matchF) activeFront = activeFront || matchF[1];
                          const matchB = adviceText.match(/Back:\s*([^\s|]+)/);
                          if (matchB) activeBack = activeBack || matchB[1];
                          const matchA = adviceText.match(/Amount:\s*₹?(\d+)/);
                          if (matchA) activeAmount = activeAmount || Number(matchA[1]);
                        }
                      }
                    }
                  }

                  return (
                    <View key={visit.id} className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3">
                      <View className="flex-row items-center justify-between border-b border-slate-100 pb-2.5">
                        <Text className="text-xs font-black text-slate-900">
                          Visit Date: {new Date(visit.visit_date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                        </Text>
                        <View className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                          <Text className="text-[10px] font-extrabold text-emerald-800">{visit.status}</Text>
                        </View>
                      </View>

                      <View>
                        <Text className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Chief Complaint</Text>
                        <Text className="text-xs font-bold text-slate-800 bg-slate-50 p-3 rounded-2xl">
                          {visit.chief_complaint || 'No complaint specified.'}
                        </Text>
                      </View>

                      {/* Photos section */}
                      <View>
                        <Text className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Digitized Prescription Photos</Text>

                        {activeFront || activeBack ? (
                          <View className="flex-row gap-3">
                            {activeFront && (
                              <TouchableOpacity 
                                onPress={() => setPreviewImage(activeFront)}
                                className="w-24 h-24 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200"
                              >
                                <Image source={{ uri: activeFront }} className="w-full h-full" resizeMode="cover" />
                              </TouchableOpacity>
                            )}

                            {activeBack && (
                              <TouchableOpacity 
                                onPress={() => setPreviewImage(activeBack)}
                                className="w-24 h-24 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200"
                              >
                                <Image source={{ uri: activeBack }} className="w-full h-full" resizeMode="cover" />
                              </TouchableOpacity>
                            )}
                          </View>
                        ) : (
                          <View className="p-3 bg-slate-50 rounded-2xl">
                            <Text className="text-xs text-slate-400 font-medium">No prescription images uploaded yet.</Text>
                          </View>
                        )}
                      </View>

                      {activeAmount && (
                        <View className="flex-row items-center gap-1.5 pt-2 border-t border-slate-100">
                          <IndianRupee className="h-4 w-4 text-cyan-600" />
                          <Text className="text-xs font-bold text-slate-800">
                            Pharmacy Prescription Cost: <Text className="text-cyan-700 font-black">₹{activeAmount}</Text>
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      ) : (
        /* PATIENT SEARCH DIRECTORY */
        <View className="gap-4 w-full">
          <View>
            <Text className="text-xl font-black text-slate-900">Doctor Clinical Directory</Text>
            <Text className="text-xs text-slate-500 font-medium mt-0.5">Search patient EHR, past consultations & Rx history</Text>
          </View>

          {/* Search Box */}
          <View className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm flex-row items-center justify-between">
            <View className="relative flex-1 mr-2">
              <TextInput
                placeholder="Search patient name or phone number..."
                value={search}
                onChangeText={setSearch}
                className="h-11 pl-10 pr-3 border border-slate-200/70 rounded-xl text-xs bg-slate-50/70 text-slate-900 font-medium"
              />
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </View>
            <TouchableOpacity
              onPress={loadPatients}
              className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl active:bg-slate-100"
            >
              <RefreshCw className="h-4 w-4 text-slate-700" />
            </TouchableOpacity>
          </View>

          {/* Patient Cards */}
          {isLoading ? (
            <View className="p-4 bg-white rounded-3xl border border-slate-100">
              <TableSkeleton cols={4} rows={4} />
            </View>
          ) : patients.length === 0 ? (
            <View className="items-center justify-center py-12 px-4 bg-white rounded-3xl border border-slate-100">
              <User className="h-10 w-10 text-cyan-600 mb-2" />
              <Text className="font-black text-slate-900 text-base">No Matching Patients</Text>
              <Text className="text-slate-500 text-xs text-center mt-1 font-medium">Try searching another name or mobile number.</Text>
            </View>
          ) : (
            <View className="gap-3">
              {patients.map((p) => (
                <View 
                  key={p.id}
                  className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="font-black text-slate-900 text-sm">
                        {p.first_name} {p.last_name || ''}
                      </Text>
                      <Text className="text-[10px] font-mono font-extrabold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100">
                        {p.patient_code}
                      </Text>
                    </View>

                    <Text className="text-xs text-slate-500 font-medium">
                      Phone: {p.phone} • {p.age ? `${p.age}y` : '—'} • {p.gender}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleInspectPatient(p)}
                    className="flex-row items-center gap-1 px-3 py-2 bg-cyan-600 rounded-xl active:bg-cyan-700 shadow-2xs"
                  >
                    <Eye className="h-3.5 w-3.5 text-white" />
                    <Text className="text-xs font-bold text-white">View EHR</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
