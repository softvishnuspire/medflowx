'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Patient, Department, Doctor } from '@/types/reception';
import { 
  getDepartments, 
  getDoctors, 
  searchPatients, 
  createVisit 
} from '@/services/reception';
import { useToast } from '@/components/ui/toast';
import { useKeyboardNav } from '@/hooks/use-keyboard-nav';
import { 
  Search, 
  Check, 
  User, 
  Stethoscope, 
  UserCheck, 
  Activity, 
  Sparkles, 
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface VisitWizardViewProps {
  initialPatient?: Patient | null;
  onVisitCreated: (visitId: number, invoiceId: number, consultationFee: number, patientName: string, visitNumber: string) => void;
}

type WizardStep = 
  | 'search_patient'
  | 'confirm_patient'
  | 'select_department'
  | 'select_doctor'
  | 'visit_details';

export default function VisitWizardView({ initialPatient, onVisitCreated }: VisitWizardViewProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('search_patient');
  
  // Selection states
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Doctor | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  
  // Data lists
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  
  // Loader & Search inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
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
        toast('Failed to load metadata records', 'error');
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

  // Keyboard navigation hook for search dropdown
  const { activeIndex, handleKeyDown, resetIndex } = useKeyboardNav({
    itemCount: searchResults.length,
    onSelect: (idx) => {
      handlePatientSelect(searchResults[idx]);
    },
    onClose: () => setSearchResults([]),
  });

  const handlePatientSelect = (pat: Patient) => {
    setSelectedPatient(pat);
    setSearchResults([]);
    setSearchQuery('');
    resetIndex();
    setCurrentStep('confirm_patient');
  };

  const handleCreateVisitSubmit = async () => {
    if (!selectedPatient || !selectedDoc || !chiefComplaint) {
      toast('Please enter a chief complaint', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const { visit, invoice } = await createVisit({
        patient_id: selectedPatient.id,
        department_id: selectedDoc.department_id || 1,
        doctor_id: selectedDoc.id,
        chief_complaint: chiefComplaint,
        consultation_fee: selectedDoc.consultation_fee,
      });

      toast('Visit scheduled successfully! Proceeding to billing...', 'success');
      
      const patName = `${selectedPatient.first_name} ${selectedPatient.last_name || ''}`.trim();
      onVisitCreated(
        visit.id, 
        invoice.id, 
        selectedDoc.consultation_fee, 
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
    <div className="space-y-6 max-w-3xl mx-auto font-body text-zinc-700">
      {/* Visual Stepper tracker */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">Create Outpatient Visit</h1>
          <p className="text-sm text-zinc-500 mt-1">Guided wizard to schedule a patient consultation visit.</p>
        </div>

        {/* Wizard step count indicator */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
          <span className={`px-2 py-0.5 rounded-full ${currentStep === 'search_patient' ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-550'}`}>Search</span>
          <span className="text-zinc-300">→</span>
          <span className={`px-2 py-0.5 rounded-full ${currentStep === 'confirm_patient' ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-550'}`}>Confirm</span>
          <span className="text-zinc-300">→</span>
          <span className={`px-2 py-0.5 rounded-full ${currentStep === 'visit_details' ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-550'}`}>Details</span>
        </div>
      </div>

      {/* STEP 1: Search Patient */}
      {currentStep === 'search_patient' && (
        <Card className="border border-zinc-150/70 shadow-sm bg-white rounded-xl !overflow-visible">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 font-heading">
              <Search className="h-4.5 w-4.5 text-primary" />
              <span>Search & Select Patient</span>
            </div>

            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                autoFocus
                placeholder="Search patient by primary Phone, Patient Code, or Name..."
                value={searchQuery}
                onKeyDown={handleKeyDown}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  triggerSearch(e.target.value);
                }}
                className="w-full h-11 pl-10 pr-4 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-zinc-400"
              />
              <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-400" />

              {/* Autocomplete Dropdown List */}
              {searchResults.length > 0 && (
                <div className="absolute top-12 left-0 right-0 z-10 bg-white border border-zinc-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-zinc-100 overflow-hidden">
                  {searchResults.map((pat, idx) => (
                    <div
                      key={pat.id}
                      onClick={() => handlePatientSelect(pat)}
                      className={`p-3 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                        idx === activeIndex 
                          ? 'bg-primary/10 text-primary font-semibold' 
                          : 'hover:bg-primary/5 text-zinc-800 hover:text-primary'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{pat.first_name} {pat.last_name || ''}</div>
                        <div className="text-zinc-500 text-xs mt-0.5">{pat.phone} | {pat.gender} | {pat.age} years</div>
                      </div>
                      <span className="font-mono text-xs text-zinc-400 font-semibold">{pat.patient_code}</span>
                    </div>
                  ))}
                </div>
              )}

              {isSearching && (
                <div className="absolute right-3.5 top-3.5">
                  <svg className="animate-spin h-4.5 w-4.5 text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}
            </div>

            {searchQuery && !isSearching && searchResults.length === 0 && (
              <p className="text-xs text-zinc-400 italic">No matching patients. Type phone or full name to check details.</p>
            )}

            {/* Recent Patients Quick Select */}
            {!searchQuery && recentPatients.length > 0 && (
              <div className="pt-4 border-t border-zinc-100">
                <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
                  Or Quick Select Recent Patient
                </span>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {recentPatients.map((pat) => (
                    <button
                      key={pat.id}
                      type="button"
                      onClick={() => handlePatientSelect(pat)}
                      className="p-3 border border-zinc-200 rounded-xl text-left hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-between cursor-pointer group bg-zinc-50/20"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-zinc-800 text-xs block group-hover:text-primary transition-colors">
                          {pat.first_name} {pat.last_name || ''}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-semibold block mt-0.5">
                          {pat.phone} • {pat.gender} • {pat.age}y
                        </span>
                      </div>
                      <span className="font-mono text-[9px] font-bold text-zinc-400 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">
                        {pat.patient_code}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Confirm Patient */}
      {currentStep === 'confirm_patient' && selectedPatient && (
        <Card className="border border-zinc-150/70 shadow-sm bg-white rounded-xl">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 text-sm font-semibold text-zinc-800 font-heading">
              <UserCheck className="h-4.5 w-4.5 text-primary" />
              <span>Confirm Patient Details</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-sm text-zinc-700 bg-primary/5 p-4 rounded-xl border border-primary/10">
              <div>
                <span className="text-xs text-zinc-450 font-semibold block font-heading">Patient Name</span>
                <span className="font-bold text-zinc-900">{selectedPatient.first_name} {selectedPatient.last_name || ''}</span>
              </div>
              <div>
                <span className="text-xs text-zinc-450 font-semibold block font-heading">Patient Code</span>
                <span className="font-mono font-bold text-zinc-750">{selectedPatient.patient_code}</span>
              </div>
              <div>
                <span className="text-xs text-zinc-450 font-semibold block font-heading">Phone Number</span>
                <span className="text-zinc-800 font-medium">{selectedPatient.phone}</span>
              </div>
              <div>
                <span className="text-xs text-zinc-450 font-semibold block font-heading">Age & Gender</span>
                <span className="text-zinc-850 font-medium">{selectedPatient.age || 'N/A'} yrs | {selectedPatient.gender}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs text-zinc-450 font-semibold block font-heading">Known Allergies</span>
                <span className="text-red-650 font-bold text-xs bg-white border border-red-100 px-2 py-0.5 rounded inline-block mt-1">
                  {selectedPatient.allergies || 'None reported.'}
                </span>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep('search_patient')}
                className="h-9 px-4 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                Back to Search
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep('visit_details')}
                className="h-9 px-4 bg-cta hover:opacity-90 text-white rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Confirm & Proceed
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: Visit Details */}
      {currentStep === 'visit_details' && selectedPatient && selectedDoc && (
        <Card className="border border-zinc-150/70 shadow-sm bg-white rounded-xl">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 text-sm font-semibold text-zinc-800 font-heading">
              <Sparkles className="h-4.5 w-4.5 text-primary" />
              <span>Enter Chief Complaint & Visit Details</span>
            </div>

            <div className="grid gap-6 md:grid-cols-3 text-sm text-zinc-700">
              {/* Left pane: summary card */}
              <div className="md:col-span-1 bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3">
                <span className="font-bold text-xs text-zinc-500 uppercase tracking-wider block font-heading">OPD Summary</span>
                <div>
                  <span className="text-xs text-zinc-400 font-semibold block font-heading">Patient</span>
                  <span className="font-bold text-zinc-800">{selectedPatient.first_name} {selectedPatient.last_name || ''}</span>
                </div>
                <div>
                  <span className="text-xs text-zinc-400 font-semibold block font-heading">Doctor</span>
                  <span className="font-semibold text-zinc-800">{selectedDoc.profiles?.full_name}</span>
                </div>
                <div>
                  <span className="text-xs text-zinc-400 font-semibold block font-heading">Consultation Fee</span>
                  <span className="font-bold text-cta text-lg">₹{selectedDoc.consultation_fee}</span>
                </div>
              </div>

              {/* Right pane: Form Fields */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 font-heading">
                    Chief Complaint *
                  </label>
                  <textarea
                    placeholder="Enter patient symptoms or reason for visit (e.g. Fever since 3 days, headaches)"
                    rows={4}
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    className="w-full p-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none placeholder-zinc-400 cursor-text"
                  />
                  <span className="text-zinc-400 text-[10px] mt-1 block">Describe symptoms in short sentences for the doctor's review.</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep('confirm_patient')}
                disabled={isSubmitting}
                className="h-9 px-4 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={handleCreateVisitSubmit}
                disabled={isSubmitting || !chiefComplaint.trim()}
                className="h-9 px-4 bg-cta hover:opacity-90 text-white rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Scheduling...
                  </>
                ) : (
                  <>
                    Schedule Visit & Pay
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
