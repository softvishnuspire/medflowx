'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, Mail, Shield, Award, IndianRupee, Heart } from 'lucide-react';

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

interface ProfileViewProps {
  selectedDoctor: Doctor | null;
}

export default function ProfileView({ selectedDoctor }: ProfileViewProps) {
  if (!selectedDoctor) {
    return (
      <div className="p-8 text-center text-zinc-400">
        No doctor profile loaded. Select a doctor in the header dropdown.
      </div>
    );
  }

  const doctorInitials = selectedDoctor.profiles?.full_name
    ? selectedDoctor.profiles.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'DR';

  return (
    <div className="space-y-6 animate-slide-in text-zinc-700 font-body">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">My Profile & Credentials</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Review your clinical registrations, qualification certificates, and outpatient pricing rules.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Avatar & Summary card */}
        <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-sm text-center p-6 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-2xl shadow-inner border border-primary/20 mb-4">
            {doctorInitials}
          </div>
          <h3 className="text-lg font-bold text-zinc-850 font-heading">
            {selectedDoctor.profiles?.full_name}
          </h3>
          <p className="text-xs text-primary font-bold mt-1 uppercase tracking-wider">
            {selectedDoctor.qualification}
          </p>
          <div className="mt-4 flex items-center gap-1.5 px-3 py-1 bg-zinc-50 border border-zinc-200 rounded-full text-[11px] font-semibold text-zinc-500">
            <Heart className="h-3.5 w-3.5 text-primary" />
            General Medicine Department
          </div>
        </Card>

        {/* Middle and Right: Detailed credentials and Settings */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2 font-heading">
                <User className="h-4.5 w-4.5 text-zinc-400" />
                Clinician Registration details
              </h3>

              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div>
                  <span className="text-zinc-400 block font-medium mb-1">Full Clinical Name</span>
                  <div className="p-2.5 bg-zinc-50 border border-zinc-150 rounded-lg font-semibold text-zinc-800">
                    {selectedDoctor.profiles?.full_name}
                  </div>
                </div>

                <div>
                  <span className="text-zinc-400 block font-medium mb-1">Email Address</span>
                  <div className="p-2.5 bg-zinc-50 border border-zinc-150 rounded-lg font-semibold text-zinc-800 flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-zinc-400" />
                    {selectedDoctor.profiles?.email}
                  </div>
                </div>

                <div>
                  <span className="text-zinc-400 block font-medium mb-1">Medical Qualifications</span>
                  <div className="p-2.5 bg-zinc-50 border border-zinc-150 rounded-lg font-semibold text-zinc-800 flex items-center gap-2">
                    <Award className="h-3.5 w-3.5 text-zinc-400" />
                    {selectedDoctor.qualification}
                  </div>
                </div>

                <div>
                  <span className="text-zinc-400 block font-medium mb-1">Consultation Pricing (per Visit)</span>
                  <div className="p-2.5 bg-zinc-50 border border-zinc-150 rounded-lg font-bold text-zinc-800 flex items-center gap-2">
                    <IndianRupee className="h-3.5 w-3.5 text-zinc-400" />
                    ₹{selectedDoctor.consultation_fee} INR
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2 font-heading">
                <Shield className="h-4.5 w-4.5 text-zinc-400" />
                Access Level Boundaries
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                As a registered Medical Doctor, you have read and write privileges for patient diagnoses and pharmaceutical prescriptions. You do not have permissions to modify clinic finances, update inventory drug balances, or register user account boundaries. Contact the MedflowX Administrator for credentials resets.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
