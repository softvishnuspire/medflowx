import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getAuthUser, removeAuthUser } from '@/lib/storage';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// Subviews
import PatientsView from '@/features/doctor/patients-view';
import ProfileView from '@/features/doctor/profile-view';

// Icons & React Native Components
import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable, Platform } from 'react-native';
import {
  Users,
  User,
  LogOut,
  Stethoscope,
  Menu,
  X,
  ChevronRight,
  ChevronDown
} from 'lucide-react-native';

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

type Tab = 'patients' | 'profile';

export default function DoctorPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('patients');
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);

  // Doctor states
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);

  // Fetch doctors list on mount
  useEffect(() => {
    (async () => {
      const saved = await getAuthUser();
      if (!saved) {
        router.replace('/(auth)');
        return;
      }
      if (saved.role?.toLowerCase() !== 'doctor') {
        router.replace('/(auth)');
        return;
      }
      fetchDoctors(saved.email);
    })();
  }, []);

  const fetchDoctors = async (loggedInEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          id,
          user_id,
          qualification,
          consultation_fee,
          profiles:profiles!user_id (
            full_name,
            email
          )
        `);
      if (error) throw error;
      
      const formattedDoctors = (data || []) as unknown as Doctor[];
      setDoctors(formattedDoctors);
      if (formattedDoctors.length > 0) {
        let matchedDoc = null;
        if (loggedInEmail) {
          matchedDoc = formattedDoctors.find(
            d => d.profiles?.email?.toLowerCase() === loggedInEmail.toLowerCase()
          );
        }
        setSelectedDoctor(matchedDoc || formattedDoctors[0]);
      }
    } catch (error: any) {
      console.error('Error fetching doctors:', error.message);
    }
  };

  const handleLogout = async () => {
    await removeAuthUser();
    router.replace('/(auth)');
  };

  const menuItems = [
    { id: 'patients' as const, label: 'Patient Workspace & EHR', desc: 'OPD Queue, Prescriptions & Vitals', icon: Users },
  ];

  const activeItem = menuItems.find(m => m.id === activeTab);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      {/* Top Header Bar */}
      <View className="h-14 bg-white border-b border-slate-150/50 px-4 flex-row items-center justify-between shadow-2xs z-20">
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-2">
            <View className="p-1.5 rounded-xl bg-cyan-600 shadow-2xs">
              <Stethoscope className="h-4 w-4 text-white" />
            </View>
            <View>
              <Text className="font-black text-slate-900 tracking-tight text-sm">
                Medflow<Text className="text-cyan-600">X</Text>
              </Text>
              <Text className="text-[10px] text-cyan-700 font-extrabold uppercase tracking-wider">
                Doctor Desk
              </Text>
            </View>
          </View>
        </View>

        {/* Doctor Selector Dropdown & Profile Badge */}
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => setIsDoctorDropdownOpen(!isDoctorDropdownOpen)}
            className="flex-row items-center gap-1.5 bg-slate-100/60 px-3 py-1.5 rounded-full active:bg-slate-200"
          >
            <Text className="text-xs font-black text-slate-800 line-clamp-1">
              {selectedDoctor?.profiles?.full_name || 'Select Doctor'}
            </Text>
            <ChevronDown size={14} color="#0891b2" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            className="p-1.5 bg-rose-50 border border-rose-100 rounded-full active:bg-rose-100"
          >
            <LogOut size={16} color="#e11d48" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Doctor Dropdown Overlay */}
      {isDoctorDropdownOpen && (
        <View className="absolute top-14 right-4 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 min-w-[220px]">
          {doctors.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              onPress={() => {
                setSelectedDoctor(doc);
                setIsDoctorDropdownOpen(false);
              }}
              className={`px-3 py-2.5 rounded-xl mb-1 ${
                selectedDoctor?.id === doc.id ? 'bg-cyan-50' : 'active:bg-slate-50'
              }`}
            >
              <Text className={`text-xs font-bold ${selectedDoctor?.id === doc.id ? 'text-cyan-800' : 'text-slate-800'}`}>
                {doc.profiles?.full_name}
              </Text>
              <Text className="text-[10px] text-slate-400 font-medium">{doc.qualification || 'Specialist Doctor'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main Content Area (Full Width Scrollable) */}
      <ScrollView 
        className="flex-1 bg-slate-50"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'patients' && (
          <PatientsView />
        )}

        {activeTab === 'profile' && (
          <ProfileView selectedDoctor={selectedDoctor} />
        )}
      </ScrollView>

      {/* Bottom Tab Navigation */}
      <View 
        className="h-[60px] flex-row bg-white border-t border-slate-100" 
        style={{ paddingBottom: Platform.OS === 'ios' ? 8 : 0 }}
      >
        <TouchableOpacity onPress={() => setActiveTab('patients')} className="flex-1 justify-center items-center gap-1">
          <Users size={20} color={activeTab === 'patients' ? '#0d9488' : '#94a3b8'} />
          <Text className={`text-[10px] ${activeTab === 'patients' ? 'font-bold text-teal-600' : 'font-semibold text-slate-400'}`}>Workspace</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setActiveTab('profile')} className="flex-1 justify-center items-center gap-1">
          <User size={20} color={activeTab === 'profile' ? '#0d9488' : '#94a3b8'} />
          <Text className={`text-[10px] ${activeTab === 'profile' ? 'font-bold text-teal-600' : 'font-semibold text-slate-400'}`}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
