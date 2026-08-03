import React, { useEffect, useState } from 'react';
import { getPatientsList } from '@/services/admin';
import { Patient } from '@/types/reception';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Search, Eye, Users, RefreshCw, Phone, Calendar, Droplet } from 'lucide-react-native';

interface PatientsViewProps {
  onViewProfile: (patientId: number) => void;
}

export default function PatientsView({ onViewProfile }: PatientsViewProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const data = await getPatientsList(search);
      setPatients(data);
    } catch (err: any) {
      console.error('Error loading patients:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <View className="gap-5 w-full">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-2">
          <Text className="text-xl font-black text-slate-900">Patient Directory</Text>
          <Text className="text-xs text-slate-500 font-medium mt-0.5">Read-only listing of all patients enrolled in the clinic database</Text>
        </View>
      </View>

      {/* Filter Bar */}
      <View className="p-3.5 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3">
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-slate-50 border border-slate-200/70 rounded-2xl px-3 h-11">
            <Search className="h-4 w-4 text-slate-400 mr-2" />
            <TextInput
              placeholder="Search by Code, Phone or Name..."
              value={search}
              onChangeText={setSearch}
              className="flex-1 text-xs font-bold text-slate-800"
              placeholderTextColor="#94a3b8"
            />
          </View>
          <TouchableOpacity
            onPress={loadPatients}
            className="h-11 px-4 bg-slate-100/80 border border-slate-200/70 rounded-2xl flex-row items-center justify-center gap-1.5 active:bg-slate-200"
          >
            <RefreshCw className="h-4 w-4 text-slate-700" />
            <Text className="text-xs font-black text-slate-700">Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Patient Cards List */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Enrolled Patient Records</Text>
          <Text className="text-xs font-bold text-cyan-600">{patients.length} total</Text>
        </View>

        {isLoading ? (
          <View className="p-10 bg-white rounded-3xl border border-slate-100 items-center justify-center">
            <ActivityIndicator size="small" color="#0891b2" />
            <Text className="text-xs font-bold text-slate-400 mt-2">Loading patient directory...</Text>
          </View>
        ) : patients.length === 0 ? (
          <View className="p-12 bg-white rounded-3xl border border-slate-100 items-center justify-center text-center">
            <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mb-3">
              <Users className="h-6 w-6 text-slate-400" />
            </View>
            <Text className="text-sm font-black text-slate-800">No Patient Profiles Found</Text>
            <Text className="text-xs text-slate-400 font-medium mt-1 text-center">Make sure the query matches clinic codes, phone numbers, or names.</Text>
          </View>
        ) : (
          <View className="gap-3">
            {patients.map((pat) => (
              <View 
                key={pat.id} 
                className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3"
              >
                {/* Top Row: Name & Code */}
                <View className="flex-row items-center justify-between border-b border-slate-100 pb-2.5">
                  <View className="flex-1 mr-2">
                    <Text className="text-base font-black text-slate-900 line-clamp-1">
                      {pat.first_name} {pat.last_name || ''}
                    </Text>
                    <View className="flex-row items-center gap-1.5 mt-0.5">
                      <Text className="text-xs font-mono font-bold text-cyan-600">{pat.patient_code}</Text>
                      <Text className="text-xs text-slate-300">•</Text>
                      <Text className="text-xs font-medium text-slate-500">{pat.gender} • {pat.age ? `${pat.age} yrs` : '—'}</Text>
                    </View>
                  </View>

                  {pat.blood_group ? (
                    <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-100">
                      <Droplet className="h-3 w-3 text-rose-600 fill-rose-600" />
                      <Text className="text-xs font-black text-rose-700">{pat.blood_group}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Details Row: Phone & Dates */}
                <View className="flex-row flex-wrap items-center justify-between gap-2">
                  <View className="flex-row items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <Text className="text-xs font-bold text-slate-700">{pat.phone}</Text>
                  </View>

                  <View className="flex-row items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <Text className="text-xs text-slate-500 font-medium">
                      Enrolled: {new Date(pat.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Action Button */}
                <View className="border-t border-slate-100 pt-2.5 flex-row justify-end">
                  <TouchableOpacity
                    onPress={() => onViewProfile(pat.id)}
                    className="flex-row items-center gap-1.5 px-4 py-2 bg-slate-100/80 hover:bg-slate-200 rounded-xl active:bg-slate-200"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-700" />
                    <Text className="text-xs font-extrabold text-slate-800">View Full Profile</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
