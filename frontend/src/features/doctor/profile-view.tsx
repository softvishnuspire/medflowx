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
      <div className="p-8 text-center text-zinc-400 font-body font-semibold">
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
    <div className="space-y-6 animate-slide-in text-text-custom font-body">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight font-heading">My Profile & Credentials</h1>
        <p className="text-sm text-zinc-650 mt-1">
          Review your clinical registrations, qualification certificates, and OPD consultation fee configurations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Avatar & Summary card */}
        <Card className="border border-zinc-200 bg-white rounded-xl shadow-sm text-center p-6 flex flex-col items-center justify-center hover:shadow-md transition-shadow">
          <div className="w-20 h-20 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-2xl shadow-inner border border-primary/20 mb-4.5 cursor-default hover:bg-primary hover:text-white transition-colors duration-200">
            {doctorInitials}
          </div>
          <h3 className="text-lg font-bold text-zinc-900 font-heading leading-tight">
            {selectedDoctor.profiles?.full_name}
          </h3>
          <p className="text-xs text-primary font-bold mt-1.5 uppercase tracking-wider font-mono">
            {selectedDoctor.qualification}
          </p>
          <div className="mt-4 flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-50 border border-cyan-200 rounded-full text-xs font-bold text-primary shadow-xs">
            <Heart className="h-4 w-4 text-primary animate-pulse" />
            General Medicine Dept
          </div>
        </Card>

        {/* Middle and Right: Detailed credentials and Settings */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-zinc-200 bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-sm font-bold text-zinc-805 border-b border-zinc-150 pb-3.5 mb-5 flex items-center gap-2.5 font-heading uppercase tracking-wide">
                <User className="h-5 w-5 text-zinc-400" />
                Clinician Credentials Registry
              </h3>

              <div className="grid gap-5 sm:grid-cols-2 text-xs font-semibold">
                <div className="space-y-1">
                  <span className="text-zinc-450 block uppercase tracking-wider font-heading text-[10px]">Full Practitioner Name</span>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 font-bold">
                    {selectedDoctor.profiles?.full_name}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-450 block uppercase tracking-wider font-heading text-[10px]">Email Address</span>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 flex items-center gap-2 font-bold font-mono">
                    <Mail className="h-4 w-4 text-zinc-400 shrink-0" />
                    {selectedDoctor.profiles?.email}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-455 block uppercase tracking-wider font-heading text-[10px]">Medical Qualifications</span>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 flex items-center gap-2 font-bold font-mono">
                    <Award className="h-4 w-4 text-zinc-400 shrink-0" />
                    {selectedDoctor.qualification}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-455 block uppercase tracking-wider font-heading text-[10px]">Consultation Fee (per Visit)</span>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-850 flex items-center gap-2 font-black font-mono">
                    <IndianRupee className="h-4 w-4 text-zinc-400 shrink-0" />
                    ₹{selectedDoctor.consultation_fee} INR
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200 bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-sm font-bold text-zinc-805 border-b border-zinc-150 pb-3.5 mb-5 flex items-center gap-2.5 font-heading uppercase tracking-wide">
                <Shield className="h-5 w-5 text-zinc-400" />
                Access Level Boundaries
              </h3>
              <p className="text-xs text-zinc-550 leading-relaxed font-semibold">
                As a registered Medical Doctor, you have read and write privileges for patient diagnoses and pharmaceutical prescriptions. You do not have permissions to modify clinic finances, update inventory drug balances, or register user account boundaries. Contact the MedflowX Administrator for credentials resets.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
