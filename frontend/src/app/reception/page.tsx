'use client';

import React, { useState, useEffect } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Patient } from '@/types/reception';
import { socket } from '@/lib/socket';

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

// Icons
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
} from 'lucide-react';

type Tab =
  | 'dashboard'
  | 'patients'
  | 'registration'
  | 'visit'
  | 'queue'
  | 'payments'
  | 'search'
  | 'profile';

export default function ReceptionPage() {
  const [currentUser, setCurrentUser] = useState({ name: 'Receptionist Desk', email: 'Desk Terminal #01', avatarCode: 'RD' });

  useEffect(() => {
    socket.connect();
    
    const saved = localStorage.getItem('medflowx_logged_in_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'Reception') {
          setCurrentUser({
            name: parsed.name || 'Sarah Connor',
            email: parsed.email || 'Desk Terminal #01',
            avatarCode: parsed.avatarCode || 'SC'
          });
        }
      } catch (e) {
        console.error(e);
      }
    }

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

  // Nav Items
  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients' as const, label: 'Patients', icon: Users },
    { id: 'registration' as const, label: 'New Registration', icon: UserPlus },
    { id: 'visit' as const, label: 'Create Visit', icon: CalendarPlus },
    { id: 'queue' as const, label: "Today's Queue", icon: Clock },
    { id: 'payments' as const, label: 'Payments', icon: CreditCard },
    { id: 'search' as const, label: 'Search', icon: Search },
  ];

  return (
    <div className="reception-theme font-body text-text-custom bg-bg-custom flex h-screen overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-zinc-150 flex flex-col justify-between shrink-0 shadow-sm">
        <div className="flex flex-col flex-1">
          {/* Logo Brand */}
          <div className="h-16 px-6 border-b border-zinc-100 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary text-white shadow-inner">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-zinc-900 tracking-tight text-lg font-heading">Medflow<span className="text-primary">X</span></span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 overflow-y-auto flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || 
                (item.id === 'patients' && activeTab === 'profile') ||
                (item.id === 'payments' && activeTab === 'payments' && invoiceForPayment);

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    // Reset selection states when clicking direct tabs
                    if (item.id === 'visit') setPatientForVisit(null);
                    if (item.id === 'payments') setInvoiceForPayment(null);
                    setActiveTab(item.id);
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
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary pl-3.5'
                : 'text-zinc-500 hover:text-primary hover:bg-zinc-100'
            }`}
          >
            <User className="h-4.5 w-4.5 text-zinc-400" />
            <span>Profile</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-red-650 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5 text-red-450" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-bg-custom">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-zinc-150 bg-white px-8 flex items-center justify-between shrink-0 shadow-sm">
          <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider font-heading">
            Reception Desk Portal
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="block text-sm font-semibold text-zinc-800">{currentUser.name}</span>
              <span className="block text-[10px] text-zinc-400">{currentUser.email}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shadow-inner border border-primary/20 uppercase">
              {currentUser.avatarCode}
            </div>
          </div>
        </header>

        {/* Inner sub-view container */}
        <div className="flex-1 overflow-y-auto p-8 max-w-6xl w-full mx-auto">
          {activeTab === 'dashboard' && <DashboardView />}
          
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
            <div className="text-center py-16 bg-white border border-zinc-100 rounded-xl shadow-sm">
              <span className="text-zinc-500 text-sm">Please select a patient from the database to view their profile.</span>
            </div>
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
          
          {activeTab === 'search' && (
            <GlobalSearchView
              onViewProfile={handleViewPatientProfile}
              onCreateVisit={handleCreateVisitForPatient}
            />
          )}
        </div>
      </main>
    </div>
  );
}
