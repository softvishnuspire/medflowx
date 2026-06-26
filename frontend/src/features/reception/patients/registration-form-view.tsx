'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientSchema, PatientFormValues } from '../schemas';
import { checkPhoneUnique, registerPatient } from '@/services/reception';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  UserPlus, 
  AlertCircle 
} from 'lucide-react';

interface RegistrationFormViewProps {
  onSuccess: (patientId: number) => void;
}

export default function RegistrationFormView({ onSuccess }: RegistrationFormViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    register,
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

  // Auto-calculate age from DOB if selected
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = e.target.value;
    setValue('dob', dob);
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      if (calculatedAge >= 0) {
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
      const result = await registerPatient(data);
      
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
    <div className="space-y-6 max-w-4xl mx-auto font-body text-zinc-705">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">New Patient Registration</h1>
        <p className="text-sm text-zinc-500 mt-1">Create a new patient file. Ensure all required fields are filled.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Personal Info */}
        <Card className="shadow-xs border border-zinc-150/70 hover:border-primary/25 transition-all bg-white rounded-xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 text-sm font-bold text-zinc-800 font-heading">
              <User className="h-4.5 w-4.5 text-primary" />
              <span>Personal Information</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {/* First Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">First Name *</label>
                <input
                  type="text"
                  placeholder="Enter first name"
                  {...register('first_name')}
                  className={`w-full h-10 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                    errors.first_name ? 'border-red-350 focus:border-red-500 focus:ring-red-500/25' : 'border-zinc-200'
                  }`}
                />
                {errors.first_name && (
                  <p className="text-red-550 text-xs mt-1 font-semibold">{errors.first_name.message}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">Last Name</label>
                <input
                  type="text"
                  placeholder="Enter last name"
                  {...register('last_name')}
                  className="w-full h-10 px-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">Gender *</label>
                <select
                  {...register('gender')}
                  className={`w-full h-10 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer ${
                    errors.gender ? 'border-red-355 focus:border-red-550 focus:ring-red-500/25' : 'border-zinc-200'
                  }`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && (
                  <p className="text-red-555 text-xs mt-1 font-semibold">{errors.gender.message}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">Date of Birth</label>
                <input
                  type="date"
                  onChange={handleDobChange}
                  value={dobValue || ''}
                  className="w-full h-10 px-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">Age</label>
                <input
                  type="number"
                  placeholder="Years"
                  {...register('age', { valueAsNumber: true })}
                  className={`w-full h-10 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                    errors.age ? 'border-red-355 focus:border-red-550 focus:ring-red-500/25' : 'border-zinc-200'
                  }`}
                />
                {errors.age && (
                  <p className="text-red-555 text-xs mt-1 font-semibold">{errors.age.message}</p>
                )}
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">Blood Group</label>
                <select
                  {...register('blood_group')}
                  className="w-full h-10 px-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Contact Info */}
        <Card className="shadow-xs border border-zinc-150/70 hover:border-primary/25 transition-all bg-white rounded-xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 text-sm font-bold text-zinc-800 font-heading">
              <Phone className="h-4.5 w-4.5 text-primary" />
              <span>Contact Information</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">Phone Number *</label>
                <input
                  type="text"
                  placeholder="Enter 10-digit mobile number"
                  {...register('phone')}
                  className={`w-full h-10 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                    errors.phone || phoneError ? 'border-red-355 focus:border-red-550 focus:ring-red-500/25' : 'border-zinc-200'
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-555 text-xs mt-1 font-semibold">{errors.phone.message}</p>
                )}
                {phoneError && (
                  <p className="text-red-555 text-xs mt-1 flex items-center gap-1 font-semibold">
                    <AlertCircle className="h-3 w-3" />
                    <span>{phoneError}</span>
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  {...register('email')}
                  className={`w-full h-10 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                    errors.email ? 'border-red-355 focus:border-red-550 focus:ring-red-500/25' : 'border-zinc-200'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-555 text-xs mt-1 font-semibold">{errors.email.message}</p>
                )}
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">Emergency Contact (Phone)</label>
                <input
                  type="text"
                  placeholder="Emergency contact phone"
                  {...register('emergency_contact')}
                  className="w-full h-10 px-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* Occupation */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">Occupation</label>
                <input
                  type="text"
                  placeholder="e.g. Teacher, Engineer"
                  {...register('occupation')}
                  className="w-full h-10 px-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Address Details */}
        <Card className="shadow-xs border border-zinc-150/70 hover:border-primary/25 transition-all bg-white rounded-xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 text-sm font-bold text-zinc-800 font-heading">
              <MapPin className="h-4.5 w-4.5 text-primary" />
              <span>Address Details</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {/* Address Line */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">Street Address *</label>
                <input
                  type="text"
                  placeholder="House/Apartment no, street, locality"
                  {...register('address_line')}
                  className={`w-full h-10 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                    errors.address_line ? 'border-red-355 focus:border-red-550 focus:ring-red-500/25' : 'border-zinc-200'
                  }`}
                />
                {errors.address_line && (
                  <p className="text-red-555 text-xs mt-1 font-semibold">{errors.address_line.message}</p>
                )}
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">Pincode *</label>
                <input
                  type="text"
                  placeholder="6-digit pincode"
                  {...register('pincode')}
                  className={`w-full h-10 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                    errors.pincode ? 'border-red-355 focus:border-red-550 focus:ring-red-500/25' : 'border-zinc-200'
                  }`}
                />
                {errors.pincode && (
                  <p className="text-red-555 text-xs mt-1 font-semibold">{errors.pincode.message}</p>
                )}
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">City *</label>
                <input
                  type="text"
                  placeholder="City"
                  {...register('city')}
                  className={`w-full h-10 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                    errors.city ? 'border-red-355 focus:border-red-550 focus:ring-red-500/25' : 'border-zinc-200'
                  }`}
                />
                {errors.city && (
                  <p className="text-red-555 text-xs mt-1 font-semibold">{errors.city.message}</p>
                )}
              </div>

              {/* District */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">District</label>
                <input
                  type="text"
                  placeholder="District"
                  {...register('district')}
                  className="w-full h-10 px-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">State *</label>
                <input
                  type="text"
                  placeholder="State"
                  {...register('state')}
                  className={`w-full h-10 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                    errors.state ? 'border-red-355 focus:border-red-550 focus:ring-red-500/25' : 'border-zinc-200'
                  }`}
                />
                {errors.state && (
                  <p className="text-red-555 text-xs mt-1 font-semibold">{errors.state.message}</p>
                )}
              </div>

              {/* Country */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">Country</label>
                <input
                  type="text"
                  {...register('country')}
                  className="w-full h-10 px-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Medical Info */}
        <Card className="shadow-xs border border-zinc-150/70 hover:border-primary/25 transition-all bg-white rounded-xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 text-sm font-bold text-zinc-800 font-heading">
              <FileText className="h-4.5 w-4.5 text-primary" />
              <span>Medical Information</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Allergies */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">Known Allergies</label>
                <textarea
                  placeholder="Detail any food/drug allergies..."
                  rows={3}
                  {...register('allergies')}
                  className="w-full p-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none placeholder-zinc-400"
                />
              </div>

              {/* Medical History */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">Medical History</label>
                <textarea
                  placeholder="Detail relevant medical history (e.g. diabetes, hypertension)..."
                  rows={3}
                  {...register('medical_history')}
                  className="w-full p-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none placeholder-zinc-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Action Footer */}
        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="px-8 bg-cta hover:bg-cta/95 text-white font-bold cursor-pointer rounded-lg shadow-sm transition-all duration-200"
          >
            <UserPlus className="h-4.5 w-4.5 mr-2" />
            Register Patient
          </Button>
        </div>
      </form>
    </div>
  );
}
