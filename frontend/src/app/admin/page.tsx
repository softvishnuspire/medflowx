'use client';

import React, { useState, useEffect } from 'react';

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
} from 'lucide-react';

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
    const saved = localStorage.getItem('medflowx_logged_in_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'Admin') {
          setCurrentUser({
            name: parsed.name || 'Hospital Administrator',
            email: parsed.email || '',
            avatarCode: parsed.avatarCode || 'AD'
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Drilldown helper
  const handleViewPatientProfile = (patientId: number) => {
    setSelectedPatientId(patientId);
    setActiveTab('patients');
  };

  const handleLogout = () => {
    // Routes back to root login page
    window.location.href = '/';
  };

  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'patients' as const, label: 'Patients', icon: Users },
    { id: 'visits' as const, label: 'Visits', icon: CalendarCheck },
    { id: 'payments' as const, label: 'Payments', icon: CreditCard },
    { id: 'reports' as const, label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="admin-theme font-body text-text-custom bg-bg-custom flex h-screen overflow-hidden">
      
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
              className="p-1.5 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 rounded-lg md:hidden"
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
                    // Reset patient drilldown if navigating directly to tabs
                    if (item.id === 'patients') setSelectedPatientId(null);
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
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
              className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-500"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider font-heading">
              Admin Portal
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400 font-semibold uppercase tracking-wider font-heading">
            <ShieldCheck className="h-4.5 w-4.5 text-primary animate-pulse" />
            <span>Admin Console Terminal</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="block text-sm font-semibold text-zinc-800">{currentUser.name}</span>
              <span className="block text-[10px] text-zinc-400">{currentUser.email || 'MedflowX Superuser'}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shadow-inner border border-primary/20 uppercase">
              {currentUser.avatarCode}
            </div>
          </div>
        </header>

        {/* Inner sub-view container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto font-body">
          {activeTab === 'dashboard' && <DashboardView />}
          
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
        </div>
      </main>
    </div>
  );
}
