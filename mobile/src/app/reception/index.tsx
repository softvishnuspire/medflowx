import React, { useState, useEffect } from 'react';
import { Patient } from '@/types/reception';
import { socket } from '@/lib/socket';
import { getAuthUser, removeAuthUser } from '@/lib/storage';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// Subviews
import DashboardView from '@/features/reception/dashboard/dashboard-view';
import PatientListView from '@/features/reception/patients/patient-list-view';
import RegistrationFormView from '@/features/reception/patients/registration-form-view';
import PatientProfileView from '@/features/reception/patients/patient-profile-view';
import VisitWizardView from '@/features/reception/visits/visit-wizard-view';
import BillingInvoicesList from '@/features/reception/payments/billing-invoices-list';
import PaymentCollectionView from '@/features/reception/payments/payment-collection-view';
import QueueView from '@/features/reception/queue/queue-view';
import GlobalSearchView from '@/features/reception/search/global-search-view';
import TreatmentsView from '@/features/reception/treatments/treatments-view';

// React Native Components & Icons
import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable, Platform } from 'react-native';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarPlus,
  Clock,
  CreditCard,
  Search,
  User,
  LogOut,
  Stethoscope,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Building2,
  Home
} from 'lucide-react-native';

type Tab =
  | 'dashboard'
  | 'patients'
  | 'registration'
  | 'visit'
  | 'queue'
  | 'payments'
  | 'treatments'
  | 'search'
  | 'profile';

export default function ReceptionPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState({ name: 'Sarah Connor', email: 'Desk Terminal #01', avatarCode: 'SC' });
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);

  useEffect(() => {
    socket.connect();

    (async () => {
      const saved = await getAuthUser();
      if (!saved) {
        router.replace('/(auth)');
        return;
      }
      if (saved.role?.toLowerCase() !== 'reception' && saved.role?.toLowerCase() !== 'receptionist') {
        router.replace('/(auth)');
        return;
      }
      setCurrentUser({
        name: saved.name || 'Sarah Connor',
        email: saved.email || 'Desk Terminal #01',
        avatarCode: saved.avatarCode || 'SC'
      });
    })();

    return () => {
      socket.disconnect();
    };
  }, []);

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  // Drill-down states
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [patientForVisit, setPatientForVisit] = useState<Patient | null>(null);
  const [invoiceForPayment, setInvoiceForPayment] = useState<{
    visitId: number;
    invoiceId: number;
    amount: number;
    patientName: string;
    visitNumber: string;
  } | null>(null);

  // Nav actions
  const handleViewPatientProfile = (patientId: number) => {
    setSelectedPatientId(patientId);
    setActiveTab('profile');
  };

  const handleCreateVisitForPatient = (pat: Patient) => {
    setPatientForVisit(pat);
    setActiveTab('visit');
  };

  const handleVisitScheduled = (
    visitId: number,
    invoiceId: number,
    fee: number,
    patName: string,
    visitNum: string
  ) => {
    setInvoiceForPayment({
      visitId,
      invoiceId,
      amount: fee,
      patientName: patName,
      visitNumber: visitNum,
    });
    setActiveTab('payments');
  };

  // Nav Items for Side Menu
  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard Overview', desc: 'Daily stats & quick actions', icon: LayoutDashboard },
    { id: 'patients' as const, label: 'Patients Directory', desc: 'Lookup patient records', icon: Users },
    { id: 'registration' as const, label: 'New Registration', desc: 'Intake new patient', icon: UserPlus },
    { id: 'visit' as const, label: 'Schedule OPD Visit', desc: 'Doctor & queue assignment', icon: CalendarPlus },
    { id: 'queue' as const, label: "Today's Live Queue", desc: 'Token queue status', icon: Clock },
    { id: 'payments' as const, label: 'Payments & Billing', desc: 'Collect consultation fees', icon: CreditCard },
    { id: 'treatments' as const, label: 'Treatments & Procedures', desc: 'Record procedure charges', icon: Sparkles },
    { id: 'search' as const, label: 'Universal Search', desc: 'Search phone, code, name', icon: Search },
  ];

  const handleLogout = async () => {
    await removeAuthUser();
    router.replace('/(auth)');
  };

  const activeItem = menuItems.find(m => m.id === activeTab);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      {/* Pro-Max Top Bar Header */}
      <View className="h-14 bg-white border-b border-slate-150/50 px-4 flex-row items-center justify-between shadow-2xs z-20">
        <View className="flex-row items-center gap-3">
          {/* Logo & Section Title */}
          <View className="flex-row items-center gap-2">
            <View className="p-1.5 rounded-xl bg-cyan-600 shadow-2xs">
              <Stethoscope className="h-4 w-4 text-white" />
            </View>
            <View>
              <Text className="font-black text-slate-900 tracking-tight text-sm">
                Medflow<Text className="text-cyan-600">X</Text>
              </Text>
              <Text className="text-[10px] text-cyan-700 font-extrabold uppercase tracking-wider">
                {activeItem?.label || 'Reception'}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          {/* Receptionist User Profile Badge */}
          <TouchableOpacity
            onPress={() => setActiveTab('profile')}
            className="flex-row items-center gap-2 bg-slate-100/60 pl-3 pr-1.5 py-1 rounded-full active:bg-slate-200"
          >
            <View className="items-end">
              <Text className="text-xs font-black text-slate-800 line-clamp-1">{currentUser.name}</Text>
              <Text className="text-[9px] text-cyan-600 font-bold uppercase tracking-wider">Reception Desk</Text>
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

      {/* Main Active Subview Container (Full Width) */}
      <ScrollView 
        className="flex-1 bg-slate-50"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'dashboard' && (
          <DashboardView onNavigateTab={(tab: Tab) => setActiveTab(tab)} />
        )}
        
        {activeTab === 'patients' && (
          <PatientListView
            onViewProfile={handleViewPatientProfile}
            onCreateVisit={handleCreateVisitForPatient}
          />
        )}
        
        {activeTab === 'registration' && (
          <RegistrationFormView
            onSuccess={handleViewPatientProfile}
          />
        )}
        
        {activeTab === 'profile' && selectedPatientId && (
          <PatientProfileView
            patientId={selectedPatientId}
            onBack={() => setActiveTab('patients')}
            onCreateVisit={handleCreateVisitForPatient}
          />
        )}

        {activeTab === 'profile' && !selectedPatientId && (
          <View className="items-center justify-center py-16 bg-white border border-slate-100 rounded-3xl shadow-sm px-5">
            <View className="w-16 h-16 rounded-2xl bg-cyan-50 items-center justify-center mb-3">
              <User className="h-8 w-8 text-cyan-600" />
            </View>
            <Text className="text-slate-900 font-black text-lg text-center">Reception Desk Terminal</Text>
            <Text className="text-slate-500 text-xs text-center mt-1 font-medium">Logged in as {currentUser.name} ({currentUser.email})</Text>

            <View className="mt-4 p-4 bg-slate-50 rounded-2xl w-full gap-2.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-slate-500">Terminal ID:</Text>
                <Text className="text-xs font-mono font-bold text-slate-800">RECEPTION-TERM-01</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-slate-500">Role Authority:</Text>
                <Text className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-lg border border-cyan-100">Receptionist</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleLogout}
              className="mt-6 w-full flex-row items-center justify-center gap-2 bg-rose-50 border border-rose-100 py-3 rounded-2xl active:bg-rose-100"
            >
              <LogOut className="h-4 w-4 text-rose-600" />
              <Text className="text-rose-600 font-bold text-sm">Logout Reception Desk Account</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {activeTab === 'visit' && (
          <VisitWizardView
            initialPatient={patientForVisit}
            onVisitCreated={handleVisitScheduled}
          />
        )}
        
        {activeTab === 'payments' && !invoiceForPayment && (
          <BillingInvoicesList
            onSelectInvoice={(inv) => {
              setInvoiceForPayment(inv);
            }}
          />
        )}
        
        {activeTab === 'payments' && invoiceForPayment && (
          <PaymentCollectionView
            visitId={invoiceForPayment.visitId}
            invoiceId={invoiceForPayment.invoiceId}
            amount={invoiceForPayment.amount}
            patientName={invoiceForPayment.patientName}
            visitNumber={invoiceForPayment.visitNumber}
            onSuccess={() => {
              setInvoiceForPayment(null);
              setActiveTab('queue');
            }}
          />
        )}
        
        {activeTab === 'queue' && <QueueView />}
        
        {activeTab === 'treatments' && <TreatmentsView />}
        
        {activeTab === 'search' && (
          <GlobalSearchView
            onViewProfile={handleViewPatientProfile}
            onCreateVisit={handleCreateVisitForPatient}
          />
        )}
      </ScrollView>

      {/* Bottom Tab Navigation */}
      <View 
        className="h-[60px] flex-row bg-white border-t border-slate-100" 
        style={{ paddingBottom: Platform.OS === 'ios' ? 8 : 0 }}
      >
        <TouchableOpacity onPress={() => setActiveTab('dashboard')} className="flex-1 justify-center items-center gap-1">
          <Home size={20} color={activeTab === 'dashboard' ? '#0d9488' : '#94a3b8'} />
          <Text className={`text-[10px] ${activeTab === 'dashboard' ? 'font-bold text-teal-600' : 'font-semibold text-slate-400'}`}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setActiveTab('patients')} className="flex-1 justify-center items-center gap-1">
          <Users size={20} color={(activeTab === 'patients' || activeTab === 'profile') ? '#0d9488' : '#94a3b8'} />
          <Text className={`text-[10px] ${(activeTab === 'patients' || activeTab === 'profile') ? 'font-bold text-teal-600' : 'font-semibold text-slate-400'}`}>Patients</Text>
        </TouchableOpacity>

        {/* Center FAB for Register */}
        <View className="relative w-[72px] items-center">
          <TouchableOpacity 
            onPress={() => setActiveTab('registration')} 
            className="absolute -top-7 w-14 h-14 rounded-full bg-[#dca54c] border-4 border-slate-50 items-center justify-center shadow-lg active:bg-[#c9903b]"
            style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 }}
          >
            <UserPlus size={26} color="#ffffff" />
          </TouchableOpacity>
          <Text className={`text-[10px] mt-[34px] ${activeTab === 'registration' ? 'font-bold text-[#dca54c]' : 'font-semibold text-slate-400'}`}>Register</Text>
        </View>

        <TouchableOpacity onPress={() => setActiveTab('queue')} className="flex-1 justify-center items-center gap-1">
          <Clock size={20} color={activeTab === 'queue' ? '#0d9488' : '#94a3b8'} />
          <Text className={`text-[10px] ${activeTab === 'queue' ? 'font-bold text-teal-600' : 'font-semibold text-slate-400'}`}>Queue</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTab('payments')} className="flex-1 justify-center items-center gap-1">
          <CreditCard size={20} color={activeTab === 'payments' ? '#0d9488' : '#94a3b8'} />
          <Text className={`text-[10px] ${activeTab === 'payments' ? 'font-bold text-teal-600' : 'font-semibold text-slate-400'}`}>Payments</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}



