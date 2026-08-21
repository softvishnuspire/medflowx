import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, Mail, Shield, Award, IndianRupee, Heart } from 'lucide-react-native';
import { View, Text } from 'react-native';

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
      <View className="p-8 text-center text-zinc-400 font-body font-semibold">
        No doctor profile loaded. Select a doctor in the header dropdown.
      </View>
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
    <View className="space-y-6 animate-slide-in text-text-custom font-body">
      {/* Header */}
      <View>
        <Text className="text-3xl font-extrabold text-zinc-900 tracking-tight font-heading">My Profile & Credentials</Text>
        <Text className="text-sm text-zinc-650 mt-1">
          Review your clinical registrations, qualification certificates, and OPD consultation fee configurations.
        </Text>
      </View>

      <View className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Avatar & Summary card */}
        <Card className="border border-zinc-200 bg-white rounded-xl shadow-sm text-center p-6 flex flex-col items-center justify-center hover:shadow-md transition-shadow">
          <View className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shadow-inner border border-primary/20 mb-4.5">
            <Text className="text-primary font-black text-2xl">
              {doctorInitials}
            </Text>
          </View>
          <Text className="text-lg font-bold text-zinc-900 font-heading leading-tight">
            {selectedDoctor.profiles?.full_name}
          </Text>
          <Text className="text-xs text-primary font-bold mt-1.5 uppercase tracking-wider font-mono">
            {selectedDoctor.qualification}
          </Text>
          <View className="mt-4 flex-row items-center gap-1.5 px-3.5 py-1.5 bg-cyan-50 border border-cyan-200 rounded-full shadow-xs">
            <Heart className="h-4 w-4 text-primary animate-pulse" />
            <Text className="text-xs font-bold text-primary">Hair Care & Trichology Dept</Text>
          </View>
        </Card>

        {/* Middle and Right: Detailed credentials and Settings */}
        <View className="md:col-span-2 space-y-6">
          <Card className="border border-zinc-200 bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
              <Text className="text-sm font-bold text-zinc-805 border-b border-zinc-150 pb-3.5 mb-5 flex items-center gap-2.5 font-heading uppercase tracking-wide">
                <User className="h-5 w-5 text-zinc-400" />
                Clinician Credentials Registry
              </Text>

              <View className="grid gap-5 sm:grid-cols-2 text-xs font-semibold">
                <View className="space-y-1">
                  <Text className="text-zinc-450 block uppercase tracking-wider font-heading text-[10px]">Full Practitioner Name</Text>
                  <View className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <Text className="text-zinc-800 font-bold">{selectedDoctor.profiles?.full_name}</Text>
                  </View>
                </View>

                <View className="space-y-1">
                  <Text className="text-zinc-450 block uppercase tracking-wider font-heading text-[10px]">Email Address</Text>
                  <View className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex-row items-center gap-2">
                    <Mail className="h-4 w-4 text-zinc-400 shrink-0" />
                    <Text className="text-zinc-800 font-bold font-mono">{selectedDoctor.profiles?.email}</Text>
                  </View>
                </View>

                <View className="space-y-1">
                  <Text className="text-zinc-455 block uppercase tracking-wider font-heading text-[10px]">Medical Qualifications</Text>
                  <View className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex-row items-center gap-2">
                    <Award className="h-4 w-4 text-zinc-400 shrink-0" />
                    <Text className="text-zinc-800 font-bold font-mono">{selectedDoctor.qualification}</Text>
                  </View>
                </View>

                <View className="space-y-1">
                  <Text className="text-zinc-455 block uppercase tracking-wider font-heading text-[10px]">Consultation Fee (per Visit)</Text>
                  <View className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex-row items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-zinc-400 shrink-0" />
                    <Text className="text-zinc-800 font-black font-mono">₹{selectedDoctor.consultation_fee} INR</Text>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200 bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
              <Text className="text-sm font-bold text-zinc-805 border-b border-zinc-150 pb-3.5 mb-5 flex items-center gap-2.5 font-heading uppercase tracking-wide">
                <Shield className="h-5 w-5 text-zinc-400" />
                Access Level Boundaries
              </Text>
              <Text className="text-xs text-zinc-550 leading-relaxed font-semibold">
                As a registered Medical Doctor, you have read and write privileges for patient diagnoses and pharmaceutical prescriptions. You do not have permissions to modify clinic finances, update inventory drug balances, or register user account boundaries. Contact the MedflowX Administrator for credentials resets.
              </Text>
            </CardContent>
          </Card>
        </View>
      </View>
    </View>
  );
}
