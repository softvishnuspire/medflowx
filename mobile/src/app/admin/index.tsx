'use client';

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// Subviews
import DashboardView from '@/features/admin/dashboard-view';
import UsersView from '@/features/admin/users-view';
import PatientsView from '@/features/admin/patients-view';
import PatientDetailView from '@/features/admin/patient-detail-view';
import VisitsView from '@/features/admin/visits-view';
import PaymentsView from '@/features/admin/payments-view';
import ReportsView from '@/features/admin/reports-view';
import ProfileView from '@/features/admin/profile-view';

// Icons
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  BarChart3,
  User,
  LogOut,
  Stethoscope,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react-native';

type Tab =
  | 'dashboard'
  | 'users'
  | 'patients'
  | 'visits'
  | 'payments'
  | 'reports'
  | 'profile';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: 'Hospital Administrator', email: '', avatarCode: 'AD' });

  useEffect(() => {
    (async () => {
      const saved = await getAuthUser();
      if (!saved) {
        router.replace('/(auth)');
        return;
      }
      if (saved.role?.toLowerCase() !== 'admin' && saved.role?.toLowerCase() !== 'administrator') {
        router.replace('/(auth)');
        return;
      }
      setCurrentUser({
        name: saved.name || 'Hospital Administrator',
        email: saved.email || '',
        avatarCode: saved.avatarCode || 'AD'
      });
    })();
  }, []);

  const handleViewPatientProfile = (patientId: number) => {
    setSelectedPatientId(patientId);
    setActiveTab('patients');
  };

  const handleLogout = async () => {
    await removeAuthUser();
    router.replace('/(auth)');
  };

  const menuItems = [
    { id: 'dashboard' as const, label: 'Admin Dashboard', desc: 'Overall metrics & clinic stats', icon: LayoutDashboard },
    { id: 'users' as const, label: 'Staff & Role Manager', desc: 'Manage doctors & reception staff', icon: Users },
    { id: 'patients' as const, label: 'Patients Directory', desc: 'EHR & intake database', icon: Users },
    { id: 'visits' as const, label: 'OPD Visit Logs', desc: 'All clinical appointments', icon: CalendarCheck },
    { id: 'payments' as const, label: 'Revenue & Payments', desc: 'Financial invoices & billing', icon: CreditCard },
    { id: 'reports' as const, label: 'Analytics Reports', desc: 'Clinic statistics & exports', icon: BarChart3 },
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
                {activeItem?.label || 'Admin Portal'}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          {/* User Profile Badge */}
          <TouchableOpacity
            onPress={() => setActiveTab('profile')}
            className="flex-row items-center gap-2 bg-slate-100/60 pl-3 pr-1.5 py-1 rounded-full active:bg-slate-200"
          >
            <View className="items-end">
              <Text className="text-xs font-black text-slate-800 line-clamp-1">{currentUser.name}</Text>
              <Text className="text-[9px] text-cyan-600 font-bold uppercase tracking-wider">Super Administrator</Text>
            </View>
            <View className="w-7 h-7 rounded-full bg-cyan-600 items-center justify-center">
              <Text className="text-white text-xs font-black">{currentUser.avatarCode}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            className="p-1.5 bg-rose-50 border border-rose-100 rounded-full active:bg-rose-100"
          >
            <LogOut size={16} color="#e11d48" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area (Full Width Scrollable) */}
      <ScrollView 
        className="flex-1 bg-slate-50"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'dashboard' && <DashboardView onNavigateTab={(t: Tab) => setActiveTab(t)} />}
        
        {activeTab === 'users' && <UsersView />}
        
        {activeTab === 'patients' && !selectedPatientId && (
          <PatientsView onViewProfile={handleViewPatientProfile} />
        )}

        {activeTab === 'patients' && selectedPatientId && (
          <PatientDetailView 
            patientId={selectedPatientId} 
            onBack={() => setSelectedPatientId(null)} 
          />
        )}
        
        {activeTab === 'visits' && <VisitsView />}
        
        {activeTab === 'payments' && <PaymentsView />}

        {activeTab === 'reports' && <ReportsView />}

        {activeTab === 'profile' && <ProfileView />}
      </ScrollView>

      {/* Bottom Tab Navigation */}
      <View 
        className="h-[60px] flex-row bg-white border-t border-slate-100" 
        style={{ paddingBottom: Platform.OS === 'ios' ? 8 : 0 }}
      >
        <TouchableOpacity onPress={() => setActiveTab('dashboard')} className="flex-1 justify-center items-center gap-1">
          <LayoutDashboard size={20} color={activeTab === 'dashboard' ? '#0d9488' : '#94a3b8'} />
          <Text className={`text-[10px] ${activeTab === 'dashboard' ? 'font-bold text-teal-600' : 'font-semibold text-slate-400'}`}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setActiveTab('users')} className="flex-1 justify-center items-center gap-1">
          <Users size={20} color={activeTab === 'users' ? '#0d9488' : '#94a3b8'} />
          <Text className={`text-[10px] ${activeTab === 'users' ? 'font-bold text-teal-600' : 'font-semibold text-slate-400'}`}>Staff</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTab('patients')} className="flex-1 justify-center items-center gap-1">
          <Users size={20} color={(activeTab === 'patients' || activeTab === 'profile') ? '#0d9488' : '#94a3b8'} />
          <Text className={`text-[10px] ${(activeTab === 'patients' || activeTab === 'profile') ? 'font-bold text-teal-600' : 'font-semibold text-slate-400'}`}>Patients</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTab('reports')} className="flex-1 justify-center items-center gap-1">
          <BarChart3 size={20} color={activeTab === 'reports' ? '#0d9488' : '#94a3b8'} />
          <Text className={`text-[10px] ${activeTab === 'reports' ? 'font-bold text-teal-600' : 'font-semibold text-slate-400'}`}>Reports</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
