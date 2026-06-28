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
import { Search, Eye, ClipboardList, RefreshCw, ChevronLeft, Calendar, AlertCircle } from 'lucide-react';

interface Patient {
  id: string;
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

export default function PatientsView() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Detail state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [pastVisits, setPastVisits] = useState<PastVisit[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      let query = supabase.from('patients').select('*');
      if (search.trim()) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,patient_code.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setPatients(data || []);
    } catch (err: any) {
      console.error('Error fetching patients:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatientVisits = async (patientId: string) => {
    try {
      setLoadingHistory(true);
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
        .order('visit_date', { ascending: false });

      if (error) throw error;
      setPastVisits((data || []) as unknown as PastVisit[]);
    } catch (err: any) {
      console.error('Error fetching patient history:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!selectedPatient) {
        loadPatients();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedPatient]);

  const handleInspectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    loadPatientVisits(patient.id);
  };

  if (selectedPatient) {
    return (
      <div className="space-y-6 animate-slide-in text-text-custom font-body">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedPatient(null)}
            className="inline-flex items-center gap-2 px-4.5 py-2.5 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-650 hover:text-primary rounded-lg text-xs font-bold shadow-sm cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
            Back to Directory
          </button>
          <div className="text-xs font-mono text-zinc-400 font-bold uppercase tracking-wider font-heading">
            EHR Detail Inspector
          </div>
        </div>

        {/* Patient Profile card */}
        <Card className="border border-zinc-200 bg-white rounded-xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4.5 border-b border-zinc-150">
              <div>
                <span className="text-xs font-mono text-primary font-bold bg-primary/10 px-2.5 py-1 rounded border border-primary/20">
                  {selectedPatient.patient_code}
                </span>
                <h2 className="text-2xl font-bold text-zinc-900 mt-3 font-heading">
                  {selectedPatient.first_name} {selectedPatient.last_name || ''}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2.5 text-xs font-bold">
                <span className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700">
                  {selectedPatient.age} Yrs Old
                </span>
                <span className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700">
                  Gender: {selectedPatient.gender}
                </span>
                {selectedPatient.blood_group && (
                  <span className="px-3 py-1.5 bg-rose-50 border border-rose-150 rounded-lg text-rose-700">
                    Blood Group: {selectedPatient.blood_group}
                  </span>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-5 text-xs leading-relaxed">
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider font-heading">Contact Details</h4>
                <p className="text-zinc-700 font-semibold"><strong>Phone:</strong> {selectedPatient.phone}</p>
                <p className="text-zinc-500 font-medium"><strong>Enrolled Since:</strong> {new Date(selectedPatient.created_at).toLocaleDateString()}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider font-heading">Declared Medical Conditions</h4>
                <p className="text-zinc-700 bg-zinc-50/50 p-3 rounded-lg border border-zinc-200 font-medium leading-relaxed">
                  {selectedPatient.medical_history || 'No declared medical conditions.'}
                </p>
                {selectedPatient.allergies && (
                  <div className="flex gap-2 items-start text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-150 shadow-xs font-bold">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <span><strong>Allergies:</strong> {selectedPatient.allergies}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clinical History logs */}
        <section aria-labelledby="history-heading">
          <h3 id="history-heading" className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4 font-heading">
            EHR Clinical History Logs
          </h3>
          
          {loadingHistory ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-4 bg-white border border-zinc-200 rounded-xl">
              <div className="w-8 h-8 rounded-full border-4 border-zinc-200 border-t-primary animate-spin" />
              <span className="text-sm font-semibold text-zinc-450">Fetching historical charts...</span>
            </div>
          ) : pastVisits.length === 0 ? (
            <div className="p-20 text-center bg-white border border-zinc-200 rounded-xl shadow-xs">
              <ClipboardList className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
              <h4 className="font-bold text-zinc-800 text-sm font-heading uppercase tracking-wide">No clinical logs</h4>
              <p className="text-zinc-500 text-xs mt-1 font-medium">This patient has not completed any OPD consultations yet.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {pastVisits.map((visit) => (
                <Card key={visit.id} className="border border-zinc-200 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5 space-y-4">
                    {/* Log Header */}
                    <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-primary font-bold text-sm flex items-center gap-1.5 font-heading">
                          <Calendar className="h-4.5 w-4.5 text-zinc-400" />
                          {new Date(visit.visit_date).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="text-zinc-300">•</span>
                        <span className="text-xs text-zinc-450 font-mono font-bold">{visit.visit_number}</span>
                      </div>
                      <span className="bg-zinc-50 text-zinc-650 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-zinc-200">
                        {visit.status}
                      </span>
                    </div>

                    {/* Complaint */}
                    <div className="text-xs font-semibold">
                      <strong className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider block mb-1.5 font-heading">Chief Complaint</strong>
                      <p className="text-zinc-700 italic bg-zinc-50/50 p-2.5 rounded-lg border border-zinc-100 font-medium">"{visit.chief_complaint}"</p>
                    </div>

                    {/* Diagnoses */}
                    {visit.diagnoses && visit.diagnoses.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-cyan-50/20 p-3.5 rounded-lg border border-cyan-100 font-semibold">
                        <div>
                          <strong className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider font-heading">Diagnosis</strong>
                          <p className="text-xs text-primary font-bold mt-1.5 leading-normal">{visit.diagnoses[0].diagnosis}</p>
                        </div>
                        <div>
                          <strong className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider font-heading">Symptoms</strong>
                          <p className="text-xs text-zinc-650 mt-1.5 leading-relaxed">{visit.diagnoses[0].symptoms || '—'}</p>
                        </div>
                        <div>
                          <strong className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider font-heading">Clinical Findings</strong>
                          <p className="text-xs text-zinc-650 mt-1.5 leading-relaxed">{visit.diagnoses[0].clinical_findings || '—'}</p>
                        </div>
                      </div>
                    )}

                    {/* Rx Medicines */}
                    {visit.prescriptions && visit.prescriptions.length > 0 && (
                      <div className="space-y-2">
                        <strong className="text-[10px] font-bold text-zinc-455 uppercase tracking-wider block font-heading">Prescribed Medicines (Rx)</strong>
                        <div className="grid md:grid-cols-2 gap-3">
                          {visit.prescriptions[0].prescription_items?.map((item) => (
                            <div
                              key={item.id}
                              className="bg-white border border-zinc-200 p-3.5 rounded-lg text-xs flex justify-between gap-3 shadow-xs hover:border-zinc-250 transition-colors font-semibold"
                            >
                              <div>
                                <div className="font-bold text-zinc-805">
                                  {item.medicines?.medicine_name} ({item.medicines?.strength})
                                </div>
                                <div className="text-[10px] text-zinc-500 font-semibold mt-1">
                                  {item.dosage} • {item.frequency} • {item.duration}
                                </div>
                                {item.instructions && (
                                  <div className="text-[9px] text-primary mt-1.5 font-bold italic">
                                    * {item.instructions}
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-zinc-450 self-center bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">
                                Qty: {item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in text-text-custom font-body">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight font-heading">Patient EHR Directory</h1>
        <p className="text-sm text-zinc-650 mt-1">Clinical records lookup, diagnostics inspection, and history trackers.</p>
      </div>

      {/* Filter Bar */}
      <Card className="border border-zinc-200 bg-white rounded-xl shadow-xs">
        <CardContent className="p-4 flex gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by Code, Phone or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-zinc-400 font-semibold"
            />
          </div>

          <button
            onClick={loadPatients}
            className="p-2.5 border border-zinc-200 rounded-lg bg-white text-zinc-550 hover:text-primary hover:border-primary/40 hover:bg-zinc-50 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            title="Refresh database"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="border border-zinc-200 bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 rounded-full border-4 border-zinc-200 border-t-primary animate-spin" />
            <span className="text-sm font-semibold text-zinc-450">Loading database entries...</span>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-20 text-center">
            <ClipboardList className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
            <h3 className="font-bold text-zinc-800 text-sm font-heading uppercase tracking-wide">No patient profiles found</h3>
            <p className="text-zinc-500 text-xs mt-1 font-medium font-semibold">Make sure the query matches clinic codes or contact details.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50/70 border-b border-zinc-200 font-heading">
                <TableRow>
                  <TableHead className="font-bold text-zinc-500 text-[11px] uppercase tracking-wider py-3.5">Code</TableHead>
                  <TableHead className="font-bold text-zinc-500 text-[11px] uppercase tracking-wider py-3.5">Name</TableHead>
                  <TableHead className="font-bold text-zinc-500 text-[11px] uppercase tracking-wider py-3.5">Age / Gender</TableHead>
                  <TableHead className="font-bold text-zinc-500 text-[11px] uppercase tracking-wider py-3.5">Phone Number</TableHead>
                  <TableHead className="font-bold text-zinc-500 text-[11px] uppercase tracking-wider py-3.5">Blood</TableHead>
                  <TableHead className="font-bold text-zinc-500 text-[11px] uppercase tracking-wider py-3.5">Enrollment Date</TableHead>
                  <TableHead className="font-bold text-zinc-500 text-[11px] uppercase tracking-wider py-3.5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((pat) => (
                  <TableRow key={pat.id} className="hover:bg-primary/5 transition-colors duration-150">
                    <TableCell className="font-bold text-zinc-900 font-mono text-xs py-4">
                      {pat.patient_code}
                    </TableCell>
                    <TableCell className="font-bold text-zinc-800 py-4">
                      {pat.first_name} {pat.last_name || ''}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-zinc-650 py-4">
                      {pat.age ? `${pat.age} Yrs` : '—'} • {pat.gender}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-zinc-600 py-4">
                      {pat.phone}
                    </TableCell>
                    <TableCell className="py-4">
                      {pat.blood_group ? (
                        <span className="px-2.5 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-bold border border-red-150">
                          {pat.blood_group}
                        </span>
                      ) : (
                        <span className="text-zinc-300 font-bold">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-zinc-450 py-4">
                      {new Date(pat.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <button
                        onClick={() => handleInspectPatient(pat)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-primary hover:text-white hover:border-primary text-zinc-700 font-bold text-xs transition-all cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        title="Inspect clinical history"
                      >
                        <Eye className="h-4 w-4 shrink-0" />
                        <span>Inspect EHR</span>
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
  );
}
