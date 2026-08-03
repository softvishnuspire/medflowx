import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import { Patient, DiagnosisType, TreatmentPaymentMode, Treatment } from '@/types/reception';
import { searchPatients, createTreatment } from '@/services/reception';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
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
  Layers,
  Receipt,
  RotateCcw,
  Check,
  Phone,
  IndianRupee,
  Coins,
  Smartphone
} from 'lucide-react-native';

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
    <View className="gap-4 max-w-2xl mx-auto">
      {/* Stepper Progress Bar */}
      <View className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex-row items-center justify-between">
        {/* Step 1 */}
        <TouchableOpacity 
          onPress={() => setStep(1)}
          className="flex-row items-center gap-2"
        >
          <View className={`w-7 h-7 rounded-xl items-center justify-center border ${
            step === 1 ? 'bg-cyan-600 border-cyan-700' : step > 1 ? 'bg-emerald-600 border-emerald-700' : 'bg-slate-100 border-slate-200'
          }`}>
            <Text className="text-white text-xs font-black">{step > 1 ? '✓' : '1'}</Text>
          </View>
          <Text className={`text-xs font-black ${step === 1 ? 'text-slate-900' : 'text-slate-500'}`}>
            Patient & Procedure
          </Text>
        </TouchableOpacity>

        <Text className="text-slate-300 font-bold">→</Text>

        {/* Step 2 */}
        <TouchableOpacity 
          onPress={() => validateStep1() && setStep(2)}
          disabled={!selectedPatient}
          className="flex-row items-center gap-2"
        >
          <View className={`w-7 h-7 rounded-xl items-center justify-center border ${
            step === 2 ? 'bg-cyan-600 border-cyan-700' : step > 2 ? 'bg-emerald-600 border-emerald-700' : 'bg-slate-100 border-slate-200'
          }`}>
            <Text className="text-white text-xs font-black">{step > 2 ? '✓' : '2'}</Text>
          </View>
          <Text className={`text-xs font-black ${step === 2 ? 'text-slate-900' : 'text-slate-500'}`}>
            Billing & Payment
          </Text>
        </TouchableOpacity>
      </View>

      {/* STEP 1: PATIENT & DIAGNOSIS */}
      {step === 1 && (
        <View className="gap-3.5">
          {/* Patient Selection Section */}
          <View className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs gap-3">
            <View className="flex-row items-center gap-2 border-b border-slate-150 pb-2.5">
              <Stethoscope className="h-4 w-4 text-cyan-600" />
              <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">
                1. Select Patient *
              </Text>
            </View>

            {selectedPatient ? (
              <View className="p-3.5 bg-cyan-50/80 border border-cyan-200 rounded-2xl flex-row items-center justify-between">
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="font-black text-slate-900 text-sm">
                      {selectedPatient.first_name} {selectedPatient.last_name || ''}
                    </Text>
                    <Text className="font-mono text-[10px] font-extrabold text-cyan-700 bg-white px-2 py-0.5 rounded border border-cyan-200">
                      {selectedPatient.patient_code}
                    </Text>
                  </View>
                  <Text className="text-xs text-slate-600 font-medium">
                    Phone: {selectedPatient.phone} • {selectedPatient.gender} • {selectedPatient.age ?? 'N/A'}y
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedPatient(null);
                    setErrors((prev) => ({ ...prev, patient: '' }));
                  }}
                  className="px-3 py-1.5 bg-white border border-cyan-200 rounded-xl active:bg-slate-100"
                >
                  <Text className="text-xs font-bold text-cyan-700">Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-2.5">
                <View className="relative">
                  <TextInput
                    placeholder="Search patient by Name, Phone, or Code (MED-...)"
                    value={patientSearchQuery}
                    onChangeText={(text) => {
                      setPatientSearchQuery(text);
                      setErrors((prev) => ({ ...prev, patient: '' }));
                    }}
                    className="h-11 pl-11 pr-4 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-900 font-medium"
                  />
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                </View>

                {errors.patient && (
                  <View className="flex-row items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    <Text className="text-rose-600 text-[10px] font-bold">{errors.patient}</Text>
                  </View>
                )}

                {/* Patient Search Results */}
                {isSearchingPatients ? (
                  <View className="p-3 items-center">
                    <ActivityIndicator size="small" color="#0891b2" />
                  </View>
                ) : patientOptions.length > 0 && (
                  <View className="gap-2 pt-1 border-t border-slate-150">
                    <Text className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Database Matches ({patientOptions.length})
                    </Text>

                    {patientOptions.slice(0, 5).map((pat) => (
                      <TouchableOpacity
                        key={pat.id}
                        onPress={() => {
                          setSelectedPatient(pat);
                          setErrors((prev) => ({ ...prev, patient: '' }));
                        }}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex-row items-center justify-between active:bg-cyan-50 active:border-cyan-200"
                      >
                        <View className="flex-1 mr-2">
                          <Text className="font-black text-slate-900 text-xs mb-0.5">
                            {pat.first_name} {pat.last_name || ''}
                          </Text>
                          <Text className="text-[11px] text-slate-500 font-medium">
                            Code: <Text className="font-mono text-slate-700 font-bold">{pat.patient_code}</Text> • Phone: {pat.phone}
                          </Text>
                        </View>
                        <View className="px-3 py-1.5 bg-cyan-600 rounded-lg">
                          <Text className="text-white text-xs font-bold">Select</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Treatment Name Field */}
          <View className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs gap-3">
            <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">
              2. Enter Procedure / Treatment Name *
            </Text>

            <TextInput
              placeholder="e.g. PRP Hair Therapy, Laser Hair Reduction..."
              value={diagnosisName}
              onChangeText={(text) => {
                setDiagnosisName(text);
                setErrors((prev) => ({ ...prev, diagnosisName: '' }));
              }}
              className={`h-11 px-3.5 border rounded-xl text-xs bg-slate-50 text-slate-900 font-medium ${
                errors.diagnosisName ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
              }`}
            />
            {errors.diagnosisName && (
              <View className="flex-row items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <Text className="text-rose-600 text-[10px] font-bold">{errors.diagnosisName}</Text>
              </View>
            )}

            {/* Quick Suggestions Pills */}
            <View className="gap-1.5 pt-1">
              <Text className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Quick Suggestions:</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {treatmentSuggestions.map((sug) => (
                  <TouchableOpacity
                    key={sug}
                    onPress={() => {
                      setDiagnosisName(sug);
                      setErrors((prev) => ({ ...prev, diagnosisName: '' }));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 active:bg-cyan-50 active:border-cyan-200"
                  >
                    <Text className="text-[11px] font-bold text-slate-700">{sug}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Diagnosis Category Radio Cards */}
          <View className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs gap-3">
            <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">
              3. Diagnosis Category *
            </Text>

            <View className="gap-2">
              {[
                { type: 'Hair Diagnosis' as DiagnosisType, label: 'Hair Diagnosis', desc: 'Hair loss, PRP, scalp care', icon: Scissors },
                { type: 'Skin Diagnosis' as DiagnosisType, label: 'Skin Diagnosis', desc: 'Acne, peels, laser, facial', icon: Sparkles },
                { type: 'Both Hair & Skin' as DiagnosisType, label: 'Both Hair & Skin', desc: 'Combined trichology & derm care', icon: Layers },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = diagnosisType === item.type;

                return (
                  <TouchableOpacity
                    key={item.type}
                    onPress={() => {
                      setDiagnosisType(item.type);
                      setErrors((prev) => ({ ...prev, diagnosisType: '' }));
                    }}
                    className={`p-3.5 rounded-2xl border flex-row items-center justify-between active:bg-cyan-50/50 ${
                      isSelected ? 'bg-cyan-50/80 border-cyan-600 shadow-xs' : 'bg-white border-slate-200'
                    }`}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className={`w-9 h-9 rounded-xl items-center justify-center border ${
                        isSelected ? 'bg-cyan-600 border-cyan-700' : 'bg-slate-100 border-slate-200'
                      }`}>
                        <Icon className={`h-4.5 w-4.5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                      </View>
                      <View>
                        <Text className={`text-xs font-black ${isSelected ? 'text-cyan-900' : 'text-slate-900'}`}>{item.label}</Text>
                        <Text className="text-[10px] text-slate-500 font-medium mt-0.5">{item.desc}</Text>
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

          {/* Action Bar */}
          <TouchableOpacity
            onPress={() => {
              if (validateStep1()) {
                setStep(2);
              }
            }}
            className="h-12 bg-cyan-600 rounded-2xl flex-row items-center justify-center gap-2 active:bg-cyan-700 shadow-xs mt-1"
          >
            <Text className="text-white font-black text-sm">Proceed to Billing & Payment</Text>
            <ArrowRight className="h-4 w-4 text-white" />
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 2: BILLING & PAYMENT */}
      {step === 2 && (
        <View className="gap-3.5">
          {/* Patient Summary Banner */}
          <View className="p-4 bg-cyan-50/80 border border-cyan-200 rounded-2xl flex-row items-center justify-between">
            <View className="flex-1 mr-2">
              <Text className="text-[10px] font-extrabold text-cyan-800 uppercase tracking-wider">Selected Patient & Treatment</Text>
              <Text className="font-black text-slate-900 text-sm mt-0.5">
                {selectedPatient?.first_name} {selectedPatient?.last_name || ''} ({selectedPatient?.patient_code})
              </Text>
              <Text className="text-xs text-slate-600 font-medium mt-0.5">
                Procedure: <Text className="font-bold text-slate-900">{diagnosisName}</Text> ({diagnosisType})
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setStep(1)}
              className="px-3.5 py-1.5 bg-white border border-cyan-200 rounded-xl active:bg-slate-100"
            >
              <Text className="text-xs font-bold text-cyan-700">Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Treatment Amount Input */}
          <View className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs gap-3">
            <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">
              1. Treatment Fee Amount (₹) *
            </Text>

            <View className="relative">
              <TextInput
                placeholder="e.g. 1500 or 3500"
                keyboardType="numeric"
                value={treatmentAmount}
                onChangeText={(text) => {
                  setTreatmentAmount(text);
                  setErrors((prev) => ({ ...prev, treatmentAmount: '' }));
                }}
                className={`h-12 pl-10 pr-4 border rounded-xl text-base font-black text-slate-900 bg-slate-50 ${
                  errors.treatmentAmount ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              <Text className="absolute left-3.5 top-3 text-slate-400 font-black text-base">₹</Text>
            </View>

            {errors.treatmentAmount && (
              <View className="flex-row items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <Text className="text-rose-600 text-[10px] font-bold">{errors.treatmentAmount}</Text>
              </View>
            )}

            {/* Quick Amount Pills */}
            <View className="gap-1.5 pt-1">
              <Text className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Quick Amount Select:</Text>
              <View className="flex-row flex-wrap gap-2">
                {[500, 1000, 1500, 2000, 3000, 5000, 7500].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    onPress={() => {
                      setTreatmentAmount(amt.toString());
                      setErrors((prev) => ({ ...prev, treatmentAmount: '' }));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 active:bg-cyan-50 active:border-cyan-200"
                  >
                    <Text className="text-xs font-extrabold text-slate-800">₹{amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Payment Method Selector */}
          <View className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs gap-3">
            <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">
              2. Payment Collection Method *
            </Text>

            <View className="gap-2">
              {[
                { mode: 'Cash' as TreatmentPaymentMode, label: 'Cash Payment', desc: 'Physical cash collected at desk', icon: Coins },
                { mode: 'UPI' as TreatmentPaymentMode, label: 'UPI / Scan QR', desc: 'Google Pay, PhonePe, Paytm', icon: Smartphone },
                { mode: 'Debit/Credit Card' as TreatmentPaymentMode, label: 'Card Swipe', desc: 'POS card terminal transaction', icon: CreditCard },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = paymentMode === item.mode;

                return (
                  <TouchableOpacity
                    key={item.mode}
                    onPress={() => {
                      setPaymentMode(item.mode);
                      setErrors((prev) => ({ ...prev, paymentMode: '' }));
                    }}
                    className={`p-3.5 rounded-2xl border flex-row items-center justify-between active:bg-cyan-50/50 ${
                      isSelected ? 'bg-cyan-50/80 border-cyan-600 shadow-xs' : 'bg-white border-slate-200'
                    }`}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className={`w-9 h-9 rounded-xl items-center justify-center border ${
                        isSelected ? 'bg-cyan-600 border-cyan-700' : 'bg-slate-100 border-slate-200'
                      }`}>
                        <Icon className={`h-4.5 w-4.5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                      </View>
                      <View>
                        <Text className={`text-xs font-black ${isSelected ? 'text-cyan-900' : 'text-slate-900'}`}>{item.label}</Text>
                        <Text className="text-[10px] text-slate-500 font-medium mt-0.5">{item.desc}</Text>
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

          {/* Action Buttons */}
          <View className="flex-row gap-2 mt-1">
            <TouchableOpacity
              onPress={() => setStep(1)}
              className="flex-1 h-12 bg-white border border-slate-200 rounded-2xl items-center justify-center active:bg-slate-100"
            >
              <Text className="text-slate-700 font-bold text-xs">Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleFinalSubmit}
              disabled={isSubmitting}
              className="flex-2 h-12 bg-emerald-600 rounded-2xl flex-row items-center justify-center gap-2 active:bg-emerald-700 shadow-xs"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-white" />
                  <Text className="text-white font-black text-sm">Save Record & Billing</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STEP 3: SUCCESS CONFIRMATION */}
      {step === 3 && completedTreatment && (
        <View className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs items-center gap-4 text-center">
          <View className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </View>

          <View className="items-center">
            <Text className="text-xs font-black text-emerald-600 uppercase tracking-widest">Transaction Successful</Text>
            <Text className="text-xl font-black text-slate-900 mt-0.5">Treatment Saved & Paid!</Text>
            <Text className="text-xs text-slate-500 mt-1 text-center font-medium">
              Receipt code <Text className="font-mono font-bold text-slate-800">#{completedTreatment.treatment_number}</Text> generated.
            </Text>
          </View>

          <View className="p-4 bg-slate-50 border border-slate-200 rounded-xl w-full gap-2">
            <View className="flex-row justify-between">
              <Text className="text-xs font-bold text-slate-500">Patient:</Text>
              <Text className="text-xs font-bold text-slate-900">{selectedPatient?.first_name} {selectedPatient?.last_name || ''}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs font-bold text-slate-500">Procedure Name:</Text>
              <Text className="text-xs font-bold text-slate-900">{completedTreatment.diagnosis_name}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs font-bold text-slate-500">Payment Mode:</Text>
              <Text className="text-xs font-bold text-slate-900">{completedTreatment.payment_mode}</Text>
            </View>
            <View className="flex-row justify-between pt-1 border-t border-slate-200">
              <Text className="text-xs font-bold text-slate-700">Total Collected:</Text>
              <Text className="text-base font-black text-emerald-600">₹{completedTreatment.treatment_amount}</Text>
            </View>
          </View>

          <View className="flex-row gap-2.5 w-full pt-1">
            <TouchableOpacity
              onPress={resetForm}
              className="flex-1 h-11 bg-white border border-slate-200 rounded-xl flex-row items-center justify-center gap-1.5 active:bg-slate-100"
            >
              <RotateCcw className="h-4 w-4 text-slate-700" />
              <Text className="text-xs font-bold text-slate-800">New Record</Text>
            </TouchableOpacity>

            {onNavigateToHistory && (
              <TouchableOpacity
                onPress={onNavigateToHistory}
                className="flex-1 h-11 bg-cyan-600 rounded-xl flex-row items-center justify-center gap-1.5 active:bg-cyan-700 shadow-xs"
              >
                <Receipt className="h-4 w-4 text-white" />
                <Text className="text-xs font-bold text-white">View History</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
