'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Subviews
import PatientsView from '@/features/doctor/patients-view';
import ProfileView from '@/features/doctor/profile-view';

// Icons
import {
  Users,
  User,
  LogOut,
  Stethoscope,
  Menu,
  X
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<Tab>('patients');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Doctor states
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Fetch doctors list on mount
  useEffect(() => {
    const saved = localStorage.getItem('medflowx_logged_in_user');
    if (!saved) {
      window.location.href = '/auth';
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      if (parsed.role !== 'Doctor') {
        window.location.href = '/auth';
        return;
      }
    } catch (e) {
      window.location.href = '/auth';
      return;
    }
    fetchDoctors();
  }, []);

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
        const saved = localStorage.getItem('medflowx_logged_in_user');
        let matchedDoc = null;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.role === 'Doctor') {
              matchedDoc = formattedDoctors.find(
                d => d.profiles?.email?.toLowerCase() === parsed.email?.toLowerCase()
              );
            }
          } catch (e) {
            console.error(e);
          }
        }
        setSelectedDoctor(matchedDoc || formattedDoctors[0]);
      }
    } catch (error: any) {
      console.error('Error fetching doctors:', error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('medflowx_logged_in_user');
    window.location.href = '/auth';
  };

  const menuItems = [
    { id: 'patients' as const, label: 'Patient EHR & History', icon: Users },
  ];

  return (
    <div className="doctor-theme font-body text-text-custom bg-bg-custom flex h-screen overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-zinc-900/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-66 bg-white border-r border-zinc-200 flex flex-col justify-between shrink-0 shadow-md transition-transform duration-250 md:static md:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col flex-1">
          {/* Logo Brand */}
          <div className="h-16 px-6 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary text-white shadow-sm">
                <Stethoscope className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-zinc-900 tracking-tight text-lg font-heading">
                Medflow<span className="text-primary">X</span>
              </span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 rounded-lg md:hidden cursor-pointer"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto flex-1 font-body">
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white shadow-md font-bold'
                      : 'text-zinc-600 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-200 space-y-1.5 bg-zinc-50/70">
          <button
            onClick={() => {
              setActiveTab('profile');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-primary text-white shadow-md font-bold'
                : 'text-zinc-600 hover:text-primary hover:bg-primary/5'
            }`}
          >
            <User className={`h-5 w-5 ${activeTab === 'profile' ? 'text-white' : 'text-zinc-400'}`} />
            <span>Profile</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50/80 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="h-5 w-5 text-rose-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-bg-custom">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-zinc-200 bg-white px-6 md:px-8 flex items-center justify-between shrink-0 shadow-sm z-30 font-heading">
          
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-500 cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
              Doctor Panel
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500 font-bold uppercase tracking-wider font-heading">
            <span>CLINICAL DOCTOR DESK</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-body">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Doctor:</span>
              <select
                value={selectedDoctor?.id || ''}
                onChange={(e) => {
                  const doc = doctors.find(d => d.id === e.target.value);
                  if (doc) setSelectedDoctor(doc);
                }}
                className="bg-white text-zinc-800 text-xs font-bold py-1.5 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer hover:border-zinc-350 transition-colors"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.profiles?.full_name} ({doc.qualification})
                  </option>
                ))}
              </select>
            </div>

            {selectedDoctor && (
              <div className="flex items-center gap-3 border-l border-zinc-200 pl-4 font-body">
                <div className="text-right hidden sm:block">
                  <span className="block text-sm font-bold text-zinc-800 leading-tight">{selectedDoctor.profiles?.full_name}</span>
                  <span className="block text-[10px] text-zinc-400 font-semibold font-heading uppercase">{selectedDoctor.qualification}</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm shadow-inner border border-primary/20">
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
