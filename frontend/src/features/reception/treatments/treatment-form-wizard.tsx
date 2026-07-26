'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Patient, DiagnosisType, TreatmentPaymentMode, Treatment } from '@/types/reception';
import { searchPatients, createTreatment } from '@/services/reception';
import {
  UserCheck,
  Stethoscope,
  CreditCard,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Search,
  AlertCircle,
  Scissors,
  Sparkle,
  Layers,
  Receipt,
  RotateCcw,
  Check
} from 'lucide-react';

interface TreatmentFormWizardProps {
  onSuccess?: (treatment: Treatment) => void;
  onNavigateToHistory?: () => void;
}

export default function TreatmentFormWizard({ onSuccess, onNavigateToHistory }: TreatmentFormWizardProps) {
  const { toast } = useToast();

  // Step state (1: Patient & Diagnosis, 2: Billing & Payment, 3: Completed Success)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Patient Search & Selection state
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientOptions, setPatientOptions] = useState<Patient[]>([]);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Form Fields
  const [diagnosisName, setDiagnosisName] = useState('');
  const [diagnosisType, setDiagnosisType] = useState<DiagnosisType>('Hair Diagnosis');
  const [treatmentAmount, setTreatmentAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<TreatmentPaymentMode>('UPI');

  // Validation Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedTreatment, setCompletedTreatment] = useState<Treatment | null>(null);

  // Popular treatment suggestions
  const treatmentSuggestions = [
    'PRP Hair Therapy',
    'Laser Hair Reduction',
    'Chemical Peel Treatment',
    'Microneedling Therapy',
    'HydraFacial',
    'Scalp Detox Treatment',
    'Skin Brightening Laser',
    'Acne Scar Treatment',
  ];

  // Fetch patients on search query change or initial load
  useEffect(() => {
    const fetchPatients = async () => {
      setIsSearchingPatients(true);
      try {
        const results = await searchPatients(patientSearchQuery);
        setPatientOptions(results);
      } catch (err) {
        console.error('Error searching patients:', err);
      } finally {
        setIsSearchingPatients(false);
      }
    };

    const timer = setTimeout(fetchPatients, 250);
    return () => clearTimeout(timer);
  }, [patientSearchQuery]);

  // Step 1 Validation
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedPatient) {
      newErrors.patient = 'Please select a patient from the database';
    }
    if (!diagnosisName || diagnosisName.trim() === '') {
      newErrors.diagnosisName = 'Treatment Name is mandatory';
    }
    if (!diagnosisType) {
      newErrors.diagnosisType = 'Please select a diagnosis type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 2 Validation & Final Submission
  const handleFinalSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!selectedPatient) {
      newErrors.patient = 'Please select a patient';
    }
    if (!diagnosisName || diagnosisName.trim() === '') {
      newErrors.diagnosisName = 'Treatment Name is required';
    }
    if (!diagnosisType) {
      newErrors.diagnosisType = 'Diagnosis Type is required';
    }

    const numAmount = parseFloat(treatmentAmount);
    if (!treatmentAmount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.treatmentAmount = 'Treatment Amount must be a valid positive number greater than 0';
    }

    if (!paymentMode) {
      newErrors.paymentMode = 'Please select a mode of payment';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createTreatment({
        patient_id: selectedPatient!.id,
        diagnosis_name: diagnosisName.trim(),
        diagnosis_type: diagnosisType,
        treatment_amount: numAmount,
        payment_mode: paymentMode,
      });

      setCompletedTreatment(created);
      setStep(3);
      toast('Treatment record & payment details saved successfully!', 'success');
      if (onSuccess) {
        onSuccess(created);
      }
    } catch (err: any) {
      console.error('Error saving treatment:', err);
      toast(err.message || 'Failed to save treatment record', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to start a new record
  const resetForm = () => {
    setSelectedPatient(null);
    setPatientSearchQuery('');
    setDiagnosisName('');
    setDiagnosisType('Hair Diagnosis');
    setTreatmentAmount('');
    setPaymentMode('UPI');
    setErrors({});
    setCompletedTreatment(null);
    setStep(1);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-body">
      {/* Wizard Step Progress Bar */}
      <div className="bg-white border border-zinc-150 rounded-xl p-4 md:p-6 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Step 1 Indicator */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step === 1
                  ? 'bg-primary text-white shadow-md ring-4 ring-primary/20'
                  : step > 1
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-100 text-zinc-400'
              }`}
            >
              {step > 1 ? <Check className="w-5 h-5" /> : '1'}
            </div>
            <div className="hidden sm:block">
              <div className={`text-sm font-bold ${step === 1 ? 'text-zinc-900' : 'text-zinc-500'}`}>
                Step 1: Patient & Diagnosis
              </div>
              <div className="text-xs text-zinc-400">Select Patient & Type</div>
            </div>
          </div>

          {/* Connector */}
          <div className={`flex-1 h-1 mx-4 rounded-full transition-all ${step >= 2 ? 'bg-primary' : 'bg-zinc-200'}`} />

          {/* Step 2 Indicator */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step === 2
                  ? 'bg-primary text-white shadow-md ring-4 ring-primary/20'
                  : step > 2
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-100 text-zinc-400'
              }`}
            >
              {step > 2 ? <Check className="w-5 h-5" /> : '2'}
            </div>
            <div className="hidden sm:block">
              <div className={`text-sm font-bold ${step === 2 ? 'text-zinc-900' : 'text-zinc-500'}`}>
                Step 2: Billing & Payment
              </div>
              <div className="text-xs text-zinc-400">Amount & Mode</div>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: PATIENT & DIAGNOSIS */}
      {step === 1 && (
        <Card className="bg-white border border-zinc-150 shadow-sm rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-white shadow-sm">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900 font-heading">Step 1: Select Patient & Diagnosis Details</h2>
                <p className="text-xs text-zinc-500">Pick an existing patient and record diagnosis specifics</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              Mandatory Step
            </span>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* 1. Patient Selection Field */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 font-heading">
                1. Select Patient <span className="text-red-500">*</span>
              </label>

              {selectedPatient ? (
                /* Selected Patient Card */
                <div className="p-4 border-2 border-primary/40 bg-primary/5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm shadow-inner uppercase">
                      {selectedPatient.first_name[0]}
                      {selectedPatient.last_name ? selectedPatient.last_name[0] : ''}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900 text-base">
                          {selectedPatient.first_name} {selectedPatient.last_name || ''}
                        </span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-primary/30 text-primary font-bold">
                          {selectedPatient.patient_code}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-600 mt-0.5 flex items-center gap-3">
                        <span>📱 {selectedPatient.phone}</span>
                        <span>•</span>
                        <span>Gender: {selectedPatient.gender}</span>
                        <span>•</span>
                        <span>Age: {selectedPatient.age ?? 'N/A'} yrs</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setErrors((prev) => ({ ...prev, patient: '' }));
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg border border-primary/20 transition-all cursor-pointer"
                  >
                    Change Patient
                  </button>
                </div>
              ) : (
                /* Patient Search Autocomplete Input */
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search patient by Name, Phone Number, or Patient Code (e.g. MED-2026-000001)..."
                      value={patientSearchQuery}
                      onChange={(e) => {
                        setPatientSearchQuery(e.target.value);
                        setErrors((prev) => ({ ...prev, patient: '' }));
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50/50 border border-zinc-250 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-zinc-800"
                    />
                  </div>

                  {errors.patient && (
                    <div className="text-xs text-red-500 font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.patient}
                    </div>
                  )}

                  {/* Patient Options Dropdown / Cards */}
                  <div className="max-h-56 overflow-y-auto border border-zinc-150 rounded-xl divide-y divide-zinc-100 bg-white shadow-xs">
                    {isSearchingPatients ? (
                      <div className="p-4 text-center text-xs text-zinc-400">Searching database patients...</div>
                    ) : patientOptions.length === 0 ? (
                      <div className="p-4 text-center text-xs text-zinc-400">
                        No matching patients found in database. Try searching another name or phone number.
                      </div>
                    ) : (
                      patientOptions.map((pat) => (
                        <button
                          key={pat.id}
                          type="button"
                          onClick={() => {
                            setSelectedPatient(pat);
                            setErrors((prev) => ({ ...prev, patient: '' }));
                          }}
                          className="w-full p-3 text-left hover:bg-primary/5 transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-100 group-hover:bg-primary/20 text-zinc-600 group-hover:text-primary font-bold flex items-center justify-center text-xs">
                              {pat.first_name[0]}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-zinc-800 group-hover:text-primary">
                                {pat.first_name} {pat.last_name || ''}
                              </div>
                              <div className="text-xs text-zinc-400">
                                Code: <span className="font-mono text-zinc-600">{pat.patient_code}</span> | Phone: {pat.phone}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            Select →
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Treatment Name Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 font-heading">
                2. Enter Treatment Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. PRP Hair Therapy, Laser Skin Resurfacing, Chemical Peel, Microneedling..."
                value={diagnosisName}
                onChange={(e) => {
                  setDiagnosisName(e.target.value);
                  setErrors((prev) => ({ ...prev, diagnosisName: '' }));
                }}
                className={`w-full px-4 py-2.5 bg-white border ${
                  errors.diagnosisName ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-250'
                } rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary transition-all text-zinc-800`}
              />
              {errors.diagnosisName && (
                <div className="text-xs text-red-500 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.diagnosisName}
                </div>
              )}

              {/* Quick Suggestion Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[11px] text-zinc-400 py-1 mr-1 font-medium">Quick Select:</span>
                {treatmentSuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      setDiagnosisName(sug);
                      setErrors((prev) => ({ ...prev, diagnosisName: '' }));
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-primary/10 text-zinc-650 hover:text-primary transition-colors border border-zinc-200 cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Diagnosis Type Radio Buttons */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 font-heading">
                3. Select Diagnosis Type <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    type: 'Hair Diagnosis' as DiagnosisType,
                    label: 'Hair Diagnosis',
                    description: 'Hair loss, scalp issues, PRP, transplant',
                    icon: Scissors,
                    color: 'text-amber-600 bg-amber-50 border-amber-200',
                  },
                  {
                    type: 'Skin Diagnosis' as DiagnosisType,
                    label: 'Skin Diagnosis',
                    description: 'Acne, pigmentation, eczema, laser',
                    icon: Sparkles,
                    color: 'text-sky-600 bg-sky-50 border-sky-200',
                  },
                  {
                    type: 'Both Hair & Skin' as DiagnosisType,
                    label: 'Both Hair & Skin',
                    description: 'Combined dermatological & trichology care',
                    icon: Layers,
                    color: 'text-purple-600 bg-purple-50 border-purple-200',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = diagnosisType === item.type;
                  return (
                    <label
                      key={item.type}
                      onClick={() => {
                        setDiagnosisType(item.type);
                        setErrors((prev) => ({ ...prev, diagnosisType: '' }));
                      }}
                      className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="diagnosis_type"
                            checked={isSelected}
                            onChange={() => {}}
                            className="h-4 w-4 text-primary accent-primary focus:ring-primary"
                          />
                          <span className="font-bold text-sm text-zinc-900">{item.label}</span>
                        </div>
                        <div className={`p-1.5 rounded-md ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 mt-2 pl-6">{item.description}</p>
                    </label>
                  );
                })}
              </div>

              {errors.diagnosisType && (
                <div className="text-xs text-red-500 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.diagnosisType}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-zinc-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) {
                    setStep(2);
                  }
                }}
                className="px-6 py-2.5 bg-primary hover:opacity-90 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 text-sm cursor-pointer"
              >
                Proceed to Step 2: Billing & Payment
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: BILLING & PAYMENT */}
      {step === 2 && (
        <Card className="bg-white border border-zinc-150 shadow-sm rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary text-white shadow-sm">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900 font-heading">Step 2: Enter Billing & Payment Mode</h2>
                <p className="text-xs text-zinc-500">Record treatment charge and payment method collected from patient</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Final Step
            </span>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Step 1 Summary Banner */}
            <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-zinc-400 uppercase font-bold tracking-wider font-heading">Selected Patient</div>
                  <div className="font-bold text-zinc-900 text-sm">
                    {selectedPatient?.first_name} {selectedPatient?.last_name || ''} ({selectedPatient?.patient_code})
                  </div>
                  <div className="text-xs text-zinc-600 mt-0.5">
                    Treatment Name: <span className="font-bold text-zinc-800">{diagnosisName}</span> ({diagnosisType})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 self-start sm:self-center cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Edit Patient / Treatment
              </button>
            </div>

            {/* 1. Treatment Amount Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 font-heading">
                1. Treatment Amount (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-zinc-500 font-bold text-base">₹</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="e.g. 1500 or 3500.00"
                  value={treatmentAmount}
                  onChange={(e) => {
                    setTreatmentAmount(e.target.value);
                    setErrors((prev) => ({ ...prev, treatmentAmount: '' }));
                  }}
                  className={`w-full pl-9 pr-4 py-2.5 bg-white border ${
                    errors.treatmentAmount ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-250'
                  } rounded-xl text-base font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
                />
              </div>

              {errors.treatmentAmount && (
                <div className="text-xs text-red-500 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.treatmentAmount}
                </div>
              )}

              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-[11px] text-zinc-400 py-1 mr-1 font-medium">Quick Amount:</span>
                {[500, 1000, 1500, 2000, 3000, 5000, 7500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setTreatmentAmount(amt.toString());
                      setErrors((prev) => ({ ...prev, treatmentAmount: '' }));
                    }}
                    className="text-xs px-3 py-1 rounded-lg bg-zinc-100 hover:bg-primary/10 text-zinc-700 hover:text-primary font-semibold transition-colors border border-zinc-200 cursor-pointer"
                  >
                    ₹{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Mode of Payment Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 font-heading">
                2. Mode of Payment <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    mode: 'Cash' as TreatmentPaymentMode,
                    label: 'Cash Payment',
                    description: 'Physical cash received at desk',
                    icon: '💵',
                  },
                  {
                    mode: 'UPI' as TreatmentPaymentMode,
                    label: 'UPI Transfer',
                    description: 'Google Pay, PhonePe, Paytm, QR',
                    icon: '📱',
                  },
                  {
                    mode: 'Debit/Credit Card' as TreatmentPaymentMode,
                    label: 'Debit/Credit Card',
                    description: 'POS terminal swipe / tap',
                    icon: '💳',
                  },
                ].map((item) => {
                  const isSelected = paymentMode === item.mode;
                  return (
                    <label
                      key={item.mode}
                      onClick={() => {
                        setPaymentMode(item.mode);
                        setErrors((prev) => ({ ...prev, paymentMode: '' }));
                      }}
                      className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="payment_mode"
                            checked={isSelected}
                            onChange={() => {}}
                            className="h-4 w-4 text-primary accent-primary focus:ring-primary"
                          />
                          <span className="font-bold text-sm text-zinc-900">{item.label}</span>
                        </div>
                        <span className="text-lg">{item.icon}</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-2 pl-6">{item.description}</p>
                    </label>
                  );
                })}
              </div>

              {errors.paymentMode && (
                <div className="text-xs text-red-500 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.paymentMode}
                </div>
              )}
            </div>

            {/* Total Billing Preview Box */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-heading">
                  Total Charge To Collect
                </span>
                <div className="text-xs text-emerald-700 mt-0.5">
                  Payment Mode: <span className="font-bold">{paymentMode}</span>
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-700 font-heading">
                ₹{treatmentAmount && !isNaN(parseFloat(treatmentAmount)) ? parseFloat(treatmentAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
              </div>
            </div>

            {/* Buttons Bar */}
            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 border border-zinc-250 hover:bg-zinc-50 text-zinc-700 font-semibold rounded-xl transition-colors text-sm cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Step 1
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>Saving Record...</>
                ) : (
                  <>
                    <CheckCircle2 className="w-4.5 h-4.5" /> Save Treatment & Record Payment
                  </>
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: SUCCESS CONFIRMATION */}
      {step === 3 && completedTreatment && (
        <Card className="bg-white border border-emerald-200 shadow-md rounded-xl overflow-hidden text-center p-8">
          <CardContent className="space-y-6 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 font-heading">
                Success
              </span>
              <h2 className="text-2xl font-black text-zinc-900 mt-1 font-heading">Treatment Record Saved!</h2>
              <p className="text-xs text-zinc-500 mt-1">
                Treatment details and billing transaction have been persisted in database.
              </p>
            </div>

            {/* Saved Receipt Summary */}
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-left text-sm space-y-2">
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span className="text-zinc-500 font-medium">Treatment ID:</span>
                <span className="font-mono font-bold text-zinc-800">{completedTreatment.treatment_number}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span className="text-zinc-500 font-medium">Patient Name:</span>
                <span className="font-bold text-zinc-900">
                  {completedTreatment.patients?.first_name || selectedPatient?.first_name}{' '}
                  {completedTreatment.patients?.last_name || selectedPatient?.last_name || ''}
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span className="text-zinc-500 font-medium">Treatment Name:</span>
                <span className="font-semibold text-zinc-800">
                  {completedTreatment.diagnosis_name} ({completedTreatment.diagnosis_type})
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-200 pb-2">
                <span className="text-zinc-500 font-medium">Mode of Payment:</span>
                <span className="font-bold text-zinc-800">{completedTreatment.payment_mode}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-zinc-700 font-bold">Total Amount Paid:</span>
                <span className="font-black text-emerald-700 text-lg">
                  ₹{Number(completedTreatment.treatment_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="w-full sm:w-auto px-5 py-2.5 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Add Another Treatment
              </button>

              {onNavigateToHistory && (
                <button
                  type="button"
                  onClick={onNavigateToHistory}
                  className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:opacity-90 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Receipt className="w-4 h-4" /> View Treatment History
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
