'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { socket } from '@/lib/socket';

// Subviews
import DashboardView from '@/features/doctor/dashboard-view';
import WorkspaceView from '@/features/doctor/workspace-view';
import PatientsView from '@/features/doctor/patients-view';
import ProfileView from '@/features/doctor/profile-view';

// Icons
import {
  LayoutDashboard,
  Activity,
  Users,
  User,
  LogOut,
  Stethoscope,
  Menu,
  X
} from 'lucide-react';

interface Visit {
  id: string;
  visit_number: string;
  visit_date: string;
  token_no: number;
  chief_complaint: string;
  status: 'Created' | 'Waiting' | 'In Progress' | 'Prescribed' | 'Sent to Pharmacy' | 'Dispensed' | 'Closed' | 'Cancelled';
  patient_id: string;
  patients: {
    patient_code: string;
    first_name: string;
    last_name: string;
    gender: string;
    dob: string;
    age: number;
    phone: string;
    allergies: string;
    medical_history: string;
  };
}

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

type Tab = 'dashboard' | 'queue' | 'patients' | 'profile';

export default function DoctorPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  // Doctor states
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  // Real-time connection indicator
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Queue state shared with dashboard/workspace
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(true);
  const [queueTab, setQueueTab] = useState<'waiting' | 'completed'>('waiting');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedDoctorRef = useRef<Doctor | null>(null);

  // Keep ref updated to avoid stale closure inside socket event callback
  useEffect(() => {
    selectedDoctorRef.current = selectedDoctor;
  }, [selectedDoctor]);

  // Connect socket and fetch doctors on mount
  useEffect(() => {
    fetchDoctors();
    
    socket.connect();
    
    function onConnect() {
      setSocketConnected(true);
      socket.emit('join-room', 'hospital');
    }
    
    function onDisconnect() {
      setSocketConnected(false);
    }
    
    function onQueueUpdated() {
      console.log('Received queue-updated broadcast. Refreshing visits...');
      const currentDoc = selectedDoctorRef.current;
      if (currentDoc) {
        fetchVisits(currentDoc.id);
      }
    }
    
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('queue-updated', onQueueUpdated);
    
    if (socket.connected) {
      onConnect();
    }
    
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('queue-updated', onQueueUpdated);
      socket.disconnect();
    };
  }, []);

  // Fetch doctors list
  const fetchDoctors = async () => {
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
        setSelectedDoctor(formattedDoctors[0]);
      }
    } catch (error: any) {
      console.error('Error fetching doctors:', error.message);
    }
  };

  // Fetch visits for selected doctor
  const fetchVisits = async (doctorId: string) => {
    setLoadingVisits(true);
    try {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id,
          visit_number,
          visit_date,
          token_no,
          chief_complaint,
          status,
          patient_id,
          patients (
            patient_code,
            first_name,
            last_name,
            gender,
            dob,
            age,
            phone,
            allergies,
            medical_history
          )
        `)
        .eq('doctor_id', doctorId)
        .order('token_no', { ascending: true });

      if (error) throw error;
      setVisits((data || []) as unknown as Visit[]);
    } catch (error: any) {
      console.error('Error fetching visits:', error.message);
    } finally {
      setLoadingVisits(false);
    }
  };

  // Refresh queue when doctor is switched
  useEffect(() => {
    if (selectedDoctor) {
      fetchVisits(selectedDoctor.id);
      setSelectedVisit(null);
    }
  }, [selectedDoctor]);

  const handleLogout = () => {
    window.location.href = '/';
  };

  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'queue' as const, label: 'Queue Workspace', icon: Activity },
    { id: 'patients' as const, label: 'Patients EHR', icon: Users },
  ];

  return (
    <div className="doctor-theme font-body text-text-custom bg-bg-custom flex h-screen overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-zinc-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-150 flex flex-col justify-between shrink-0 shadow-sm transition-transform duration-300 md:static md:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col flex-1">
          {/* Logo Brand */}
          <div className="h-16 px-6 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary text-white shadow-inner">
                <Stethoscope className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-zinc-900 tracking-tight text-lg font-heading">
                Medflow<span className="text-primary">X</span>
              </span>
            </div>
            {/* Mobile close button */}
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 rounded-lg md:hidden cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 overflow-y-auto flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold shadow-sm border-l-2 border-primary pl-3.5'
                      : 'text-zinc-500 hover:text-primary hover:bg-zinc-50'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-primary' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-100 space-y-1 bg-zinc-50/50">
          <button
            onClick={() => {
              setActiveTab('profile');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary pl-3.5'
                : 'text-zinc-500 hover:text-primary hover:bg-zinc-150/50'
            }`}
          >
            <User className="h-4.5 w-4.5 text-zinc-400" />
            <span>Profile</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-red-650 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5 text-red-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-bg-custom">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-zinc-150 bg-white px-6 md:px-8 flex items-center justify-between shrink-0 shadow-sm z-30">
          
          {/* Mobile open menu toggle */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-500 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider font-heading">
              Doctor Portal
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-450 font-semibold uppercase tracking-wider font-heading">
            <div className={`h-2 w-2 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span>{socketConnected ? 'Clinical Terminal Active' : 'EHR Offline Mode'}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Active Dr:</span>
              <select
                value={selectedDoctor?.id || ''}
                onChange={(e) => {
                  const doc = doctors.find(d => d.id === e.target.value);
                  if (doc) setSelectedDoctor(doc);
                }}
                className="bg-white text-zinc-800 text-xs font-semibold py-1.5 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.profiles?.full_name} ({doc.qualification})
                  </option>
                ))}
              </select>
            </div>

            {selectedDoctor && (
              <div className="flex items-center gap-3 border-l border-zinc-150 pl-4">
                <div className="text-right hidden sm:block">
                  <span className="block text-sm font-semibold text-zinc-800">{selectedDoctor.profiles?.full_name}</span>
                  <span className="block text-[10px] text-zinc-450">{selectedDoctor.qualification}</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shadow-inner border border-primary/20">
                  {selectedDoctor.profiles?.full_name
                    ? selectedDoctor.profiles.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    : 'DR'
                  }
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Inner sub-view container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto font-body">
          {activeTab === 'dashboard' && (
            <DashboardView 
              selectedDoctor={selectedDoctor} 
              visits={visits} 
              onNavigateToQueue={() => setActiveTab('queue')}
            />
          )}
          
          {activeTab === 'queue' && (
            <WorkspaceView 
              selectedDoctor={selectedDoctor}
              visits={visits}
              loadingVisits={loadingVisits}
              queueTab={queueTab}
              setQueueTab={setQueueTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedVisit={selectedVisit}
              setSelectedVisit={setSelectedVisit}
              socketConnected={socketConnected}
              fetchVisits={fetchVisits}
            />
          )}

          {activeTab === 'patients' && (
            <PatientsView />
          )}

          {activeTab === 'profile' && (
            <ProfileView selectedDoctor={selectedDoctor} />
          )}
        </div>
      </main>
    </div>
  );
}
