'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  Eye, 
  ClipboardList, 
  RefreshCw, 
  ChevronLeft, 
  Calendar, 
  AlertCircle,
  FileText,
  X,
  Image as ImageIcon,
  IndianRupee,
  User,
  Phone
} from 'lucide-react';

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
      
      // Try querying visits with prescriptions & diagnoses
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
    <div className="space-y-6 text-text-custom font-body">
      
      {/* Lightbox Modal for Enlarged Prescription View */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
            <img 
              src={previewImage} 
              alt="Prescription Photo" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {selectedPatient ? (
        /* ════════════════════ PATIENT DETAIL & VISITS VIEW ════════════════════ */
        <div className="space-y-6 animate-slide-in">
          {/* Header Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedPatient(null)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 hover:text-primary rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Patient Search
            </button>
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Patient History & Prescriptions
            </span>
          </div>

          {/* Patient Card */}
          <Card className="border border-zinc-200 bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-150 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-900 font-heading">
                      {selectedPatient.first_name} {selectedPatient.last_name || ''}
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium mt-1">
                      <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-zinc-400" /> {selectedPatient.phone}</span>
                      <span>•</span>
                      <span>{selectedPatient.age ? `${selectedPatient.age} Yrs` : '—'} / {selectedPatient.gender}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-primary/5 px-4 py-2 rounded-xl border border-primary/15 text-right">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block font-heading">Clinic Record ID</span>
                  <span className="text-sm font-mono font-bold text-primary">{selectedPatient.patient_code}</span>
                </div>
              </div>

              {/* Physical Prescription Guidance Note */}
              <div className="mt-5 p-4 rounded-xl bg-teal-50/60 border border-teal-200 flex items-start gap-3">
                <FileText className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                <div className="text-xs text-teal-900 leading-relaxed font-medium">
                  <strong className="font-bold text-teal-950 block mb-0.5">Physical Prescription Process:</strong>
                  Please write a physical paper prescription for the patient. The patient will present the physical prescription to the pharmacy counter where photos will be digitized.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visits & Prescriptions Timeline */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-heading flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Patient Visit Logs & Uploaded Prescriptions
            </h3>

            {loadingVisits ? (
              <div className="p-12 bg-white rounded-xl border border-zinc-200 flex flex-col items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-primary mb-2" />
                <span className="text-xs text-zinc-400 font-medium">Fetching visit history...</span>
              </div>
            ) : patientVisits.length === 0 ? (
              <div className="p-12 bg-white rounded-xl border border-zinc-200 text-center">
                <ClipboardList className="h-10 w-10 text-zinc-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-zinc-600">No previous visits recorded for this patient.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {patientVisits.map((visit) => {
                  let activeFront = visit.prescription_image_front || null;
                  let activeBack = visit.prescription_image_back || null;
                  let activeAmount = visit.prescription_amount || null;

                  // Inspect prescriptions array for JSON or formatted text payloads
                  if (visit.prescriptions && Array.isArray(visit.prescriptions)) {
                    for (const rx of visit.prescriptions) {
                      const adviceText = rx.advice || '';
                      if (!adviceText) continue;

                      // 1. Try parsing JSON
                      try {
                        const parsed = JSON.parse(adviceText);
                        if (parsed.front) activeFront = activeFront || parsed.front;
                        if (parsed.back) activeBack = activeBack || parsed.back;
                        if (parsed.amount) activeAmount = activeAmount || parsed.amount;
                      } catch (e) {
                        // 2. Fallback text parsing
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
                    <Card key={visit.id} className="border border-zinc-200 bg-white rounded-xl shadow-xs hover:shadow-md transition-shadow">
                      <CardContent className="p-5 space-y-4">
                        {/* Visit Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-150 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-zinc-900 font-heading">
                              Visit Date: {new Date(visit.visit_date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {visit.status}
                          </span>
                        </div>

                        {/* Symptoms / Chief Complaint */}
                        <div>
                          <strong className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                            Recorded Symptoms & Chief Complaint
                          </strong>
                          <p className="text-xs text-zinc-700 bg-zinc-50 p-3 rounded-lg border border-zinc-200 font-medium">
                            {visit.chief_complaint || visit.diagnoses?.[0]?.symptoms || 'No symptoms specified.'}
                          </p>
                        </div>

                        {/* Uploaded Physical Prescription Photos */}
                        <div>
                          <strong className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2 font-heading">
                            Uploaded Physical Prescription (Pharmacy Digitized)
                          </strong>
                          
                          {activeFront || activeBack ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                              {activeFront && (
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-zinc-500 block">Front Photo</span>
                                  <div 
                                    onClick={() => setPreviewImage(activeFront)}
                                    className="relative group aspect-3/4 bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200 cursor-pointer shadow-xs hover:border-primary transition-all"
                                  >
                                    <img src={activeFront} alt="Front Prescription" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                      <Eye className="h-4 w-4" /> View Full
                                    </div>
                                  </div>
                                </div>
                              )}

                              {activeBack && (
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-zinc-500 block">Back Photo (Optional)</span>
                                  <div 
                                    onClick={() => setPreviewImage(activeBack)}
                                    className="relative group aspect-3/4 bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200 cursor-pointer shadow-xs hover:border-primary transition-all"
                                  >
                                    <img src={activeBack} alt="Back Prescription" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                      <Eye className="h-4 w-4" /> View Full
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 text-center text-xs text-zinc-400">
                              No prescription photos uploaded yet for this visit.
                            </div>
                          )}
                        </div>

                        {/* Prescription Amount if logged */}
                        {activeAmount && (
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 pt-2 border-t border-zinc-100">
                            <IndianRupee className="h-4 w-4 text-primary" />
                            <span>Pharmacy Prescription Cost: <strong className="text-primary font-heading">₹{activeAmount}</strong></span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : (
        /* ════════════════════ PATIENT SEARCH DIRECTORY ════════════════════ */
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight font-heading">Doctor Clinical Panel</h1>
            <p className="text-sm text-zinc-500 mt-1">Search patients by name or phone number to view their visit history & uploaded physical prescriptions.</p>
          </div>

          {/* Search Input */}
          <Card className="border border-zinc-200 bg-white rounded-xl shadow-xs">
            <CardContent className="p-4 flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search patient by Name or Phone Number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium placeholder:text-zinc-400"
                />
              </div>
              <button
                onClick={loadPatients}
                className="p-2.5 border border-zinc-200 rounded-xl bg-white text-zinc-500 hover:text-primary hover:bg-zinc-50 transition-all cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className="h-4.5 w-4.5" />
              </button>
            </CardContent>
          </Card>

          {/* Patient Directory Table */}
          <Card className="border border-zinc-200 bg-white rounded-xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-16 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs text-zinc-400 font-medium">Searching patient records...</span>
              </div>
            ) : patients.length === 0 ? (
              <div className="p-16 text-center">
                <User className="h-10 w-10 text-zinc-300 mx-auto mb-2" />
                <h3 className="font-bold text-zinc-800 text-sm">No patients found</h3>
                <p className="text-xs text-zinc-400 mt-1">Try typing a patient's full name or phone number.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-50 border-b border-zinc-200 font-heading">
                    <TableRow>
                      <TableHead className="font-bold text-zinc-500 text-[11px] uppercase tracking-wider py-3.5">Name</TableHead>
                      <TableHead className="font-bold text-zinc-500 text-[11px] uppercase tracking-wider py-3.5">Phone Number</TableHead>
                      <TableHead className="font-bold text-zinc-500 text-[11px] uppercase tracking-wider py-3.5">Age / Gender</TableHead>
                      <TableHead className="font-bold text-zinc-500 text-[11px] uppercase tracking-wider py-3.5">Record ID</TableHead>
                      <TableHead className="font-bold text-zinc-500 text-[11px] uppercase tracking-wider py-3.5 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((patient) => (
                      <TableRow key={patient.id} className="hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => handleInspectPatient(patient)}>
                        <TableCell className="font-bold text-zinc-900 py-4">
                          {patient.first_name} {patient.last_name || ''}
                        </TableCell>
                        <TableCell className="font-bold text-zinc-700 py-4">
                          {patient.phone}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-zinc-500 py-4">
                          {patient.age ? `${patient.age} Yrs` : '—'} • {patient.gender}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-primary py-4">
                          {patient.patient_code}
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInspectPatient(patient);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-primary hover:text-white text-zinc-700 text-xs font-bold transition-all shadow-xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View History & Prescriptions
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
