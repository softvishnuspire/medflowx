import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientSchema, PatientFormValues } from '../schemas';
import { checkPhoneUnique, registerPatient } from '@/services/reception';
import { useToast } from '@/components/ui/toast';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativePicker } from '@/components/ui/native-picker';
import {
  User, 
  Phone, 
  MapPin, 
  UserPlus
} from 'lucide-react-native';

interface RegistrationFormViewProps {
  onSuccess: (patientId: number) => void;
}

export default function RegistrationFormView({ onSuccess }: RegistrationFormViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      gender: undefined,
      dob: '',
      age: undefined,
      blood_group: '',
      phone: '',
      email: '',
      emergency_contact: '',
      occupation: '',
      address_line: '',
      city: '',
      district: '',
      state: '',
      country: 'India',
      pincode: '',
      allergies: '',
      medical_history: '',
    },
  });

  const dobValue = watch('dob');

  // Auto-calculate age from DOB text
  const handleDobChange = (text: string) => {
    setValue('dob', text);
    if (text && text.length === 10) {
      const birthDate = new Date(text);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      if (calculatedAge >= 0 && !isNaN(calculatedAge)) {
        setValue('age', calculatedAge);
      }
    }
  };

  const onSubmit = async (data: PatientFormValues) => {
    setIsSubmitting(true);
    setPhoneError(null);
    try {
      // 1. Verify unique phone number
      const isUnique = await checkPhoneUnique(data.phone);
      if (!isUnique) {
        setPhoneError('A patient with this phone number is already registered.');
        toast('Duplicate phone number detected', 'error');
        setIsSubmitting(false);
        return;
      }

      // 2. Perform DB Insertion
      const result = await registerPatient(data as any);
      
      toast(`Patient ${result.patient.first_name} registered successfully!`, 'success');
      onSuccess(result.patient.id);
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to register patient profile', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="gap-4 w-full">
      <View>
        <Text className="text-xl font-black text-slate-900">New Patient Intake</Text>
        <Text className="text-xs text-slate-500 font-medium mt-0.5">Demographics, contact info, and location details</Text>
      </View>

      <View className="gap-4">
        {/* Section 1: Demographics */}
        <View className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3.5">
          <View className="flex-row items-center gap-2">
            <View className="p-2 rounded-xl bg-cyan-50">
              <User className="h-4 w-4 text-cyan-600" />
            </View>
            <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Patient Demographics</Text>
          </View>

          <View className="gap-3">
            {/* Full Name */}
            <View>
              <Text className="text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Full Name *</Text>
              <Controller
                control={control}
                name="first_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="First and last name"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value || ''}
                    className={`h-11 px-3.5 border rounded-xl text-xs bg-slate-50/70 text-slate-900 font-medium ${
                      errors.first_name ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200/70'
                    }`}
                  />
                )}
              />
              {errors.first_name && (
                <Text className="text-rose-600 text-[10px] font-bold mt-0.5">{errors.first_name.message}</Text>
              )}
            </View>

            {/* Gender & Phone row */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Gender *</Text>
                <NativePicker
                  value={watch('gender') || ''}
                  onValueChange={(val: any) => setValue('gender', val, { shouldValidate: true })}
                  placeholder="Select Gender"
                  options={[
                    { label: 'Select Gender', value: '' },
                    { label: 'Male', value: 'Male' },
                    { label: 'Female', value: 'Female' },
                    { label: 'Other', value: 'Other' },
                  ]}
                  className={errors.gender ? 'border-rose-500' : 'border-slate-200/70'}
                />
                {errors.gender && (
                  <Text className="text-rose-600 text-[10px] font-bold mt-0.5">{errors.gender.message}</Text>
                )}
              </View>

              <View className="flex-1">
                <Text className="text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Contact Phone *</Text>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      placeholder="10-digit mobile"
                      keyboardType="phone-pad"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value || ''}
                      className={`h-11 px-3.5 border rounded-xl text-xs bg-slate-50/70 text-slate-900 font-medium ${
                        errors.phone || phoneError ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200/70'
                      }`}
                    />
                  )}
                />
                {errors.phone && (
                  <Text className="text-rose-600 text-[10px] font-bold mt-0.5">{errors.phone.message}</Text>
                )}
                {phoneError && (
                  <Text className="text-rose-600 text-[10px] font-bold mt-0.5">{phoneError}</Text>
                )}
              </View>
            </View>

            {/* DOB & Age Row */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">DOB (YYYY-MM-DD)</Text>
                <TextInput
                  placeholder="1995-08-15"
                  onChangeText={handleDobChange}
                  value={dobValue || ''}
                  className={`h-11 px-3.5 border rounded-xl text-xs bg-slate-50/70 text-slate-900 font-medium ${
                    errors.dob ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200/70'
                  }`}
                />
                {errors.dob && (
                  <Text className="text-rose-600 text-[10px] font-bold mt-0.5">{errors.dob.message}</Text>
                )}
              </View>

              <View className="w-28">
                <Text className="text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Age (Years)</Text>
                <Controller
                  control={control}
                  name="age"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      placeholder="Years"
                      keyboardType="numeric"
                      onBlur={onBlur}
                      onChangeText={(val) => onChange(val ? parseInt(val, 10) : undefined)}
                      value={value ? String(value) : ''}
                      className={`h-11 px-3.5 border rounded-xl text-xs bg-slate-50/70 text-slate-900 font-medium ${
                        errors.age ? 'border-rose-500' : 'border-slate-200/70'
                      }`}
                    />
                  )}
                />
                {errors.age && (
                  <Text className="text-rose-600 text-[10px] font-bold mt-0.5">{errors.age.message}</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Section 2: Address & Location */}
        <View className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3.5">
          <View className="flex-row items-center gap-2">
            <View className="p-2 rounded-xl bg-cyan-50">
              <MapPin className="h-4 w-4 text-cyan-600" />
            </View>
            <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Location & Address</Text>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Village / Town *</Text>
              <Controller
                control={control}
                name="city"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Enter city or town"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value || ''}
                    className={`h-11 px-3.5 border rounded-xl text-xs bg-slate-50/70 text-slate-900 font-medium ${
                      errors.city ? 'border-rose-500' : 'border-slate-200/70'
                    }`}
                  />
                )}
              />
              {errors.city && (
                <Text className="text-rose-600 text-[10px] font-bold mt-0.5">{errors.city.message}</Text>
              )}
            </View>

            <View className="flex-1">
              <Text className="text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">State *</Text>
              <Controller
                control={control}
                name="state"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Enter state"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value || ''}
                    className={`h-11 px-3.5 border rounded-xl text-xs bg-slate-50/70 text-slate-900 font-medium ${
                      errors.state ? 'border-rose-500' : 'border-slate-200/70'
                    }`}
                  />
                )}
              />
              {errors.state && (
                <Text className="text-rose-600 text-[10px] font-bold mt-0.5">{errors.state.message}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="h-12 bg-cyan-600 rounded-2xl flex-row items-center justify-center gap-2 active:bg-cyan-700 shadow-sm mt-1"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <UserPlus className="h-5 w-5 text-white" />
              <Text className="text-white font-black text-sm">Register New Patient</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
