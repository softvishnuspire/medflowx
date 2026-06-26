'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Clock, 
  Activity, 
  CheckCircle2, 
  IndianRupee, 
  Stethoscope, 
  AlertCircle,
  FileSpreadsheet
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

interface DashboardViewProps {
  selectedDoctor: Doctor | null;
  visits: Visit[];
  onNavigateToQueue: () => void;
}

export default function DashboardView({ selectedDoctor, visits, onNavigateToQueue }: DashboardViewProps) {
  // Calculations based on the doctor's queue
  const totalQueueToday = visits.length;
  
  const waitingPatients = visits.filter(v => v.status === 'Waiting').length;
  
  const activePatients = visits.filter(v => v.status === 'In Progress').length;
  
  const completedVisits = visits.filter(v => 
    ['Prescribed', 'Sent to Pharmacy', 'Dispensed', 'Closed'].includes(v.status)
  ).length;

  const estimatedFees = completedVisits * (selectedDoctor?.consultation_fee || 0);

  const coreStats = [
    { 
      label: 'Today\'s OPD Queue', 
      value: totalQueueToday, 
      icon: Users, 
      color: 'bg-violet-50 text-violet-600', 
      desc: 'All checked-in visits today' 
    },
    { 
      label: 'Waiting in Queue', 
      value: waitingPatients, 
      icon: Clock, 
      color: 'bg-amber-50 text-amber-600', 
      desc: 'Patients pending consultation' 
    },
    { 
      label: 'Active Consultations', 
      value: activePatients, 
      icon: Activity, 
      color: 'bg-emerald-50 text-emerald-600', 
      desc: 'Currently in the cabin' 
    },
    { 
      label: 'Completed Cases', 
      value: completedVisits, 
      icon: CheckCircle2, 
      color: 'bg-teal-50 text-teal-600', 
      desc: 'Diagnosed & prescribed' 
    },
    { 
      label: 'Consultation Fees', 
      value: `₹${estimatedFees}`, 
      icon: IndianRupee, 
      color: 'bg-blue-50 text-blue-600', 
      desc: 'Estimated earnings today' 
    }
  ];

  // Get last 5 visits for activity preview
  const recentVisits = [...visits]
    .filter(v => ['Prescribed', 'Sent to Pharmacy', 'Dispensed', 'Closed'].includes(v.status))
    .slice(-5)
    .reverse();

  return (
    <div className="space-y-6 animate-slide-in font-body text-zinc-700">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">
            Doctor Diagnostics Control
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Real-time patient queue metrics, live clinical activities, and outpatient EHR logging.
          </p>
        </div>
        <button
          onClick={onNavigateToQueue}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-white hover:bg-primary/95 text-xs font-semibold rounded-lg shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
        >
          Open Queue Workspace
        </button>
      </div>

      {/* Metrics Row */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 font-heading">Clinical Metrics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {coreStats.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={index} className="transition-all duration-200 hover:shadow-md hover:border-primary/30 border border-zinc-150/60 bg-white rounded-xl">
                <CardContent className="p-5 flex flex-col justify-between h-full min-h-[110px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-400">{item.label}</span>
                    <div className={`p-1.5 rounded-lg ${item.color}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-2xl font-bold text-zinc-850 tracking-tight font-heading">{item.value}</h3>
                    <p className="text-[10px] text-zinc-400 mt-1">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Grid: Recent activity & Guides */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Cases */}
        <Card className="md:col-span-2 border border-zinc-150/60 bg-white rounded-xl shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2 font-heading">
              <Activity className="h-4 w-4 text-primary animate-pulse" />
              Recently Consulted Today
            </h3>
            
            {recentVisits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-sm text-zinc-400">No patients prescribed yet today.</span>
                <p className="text-xs text-zinc-400 mt-1">Select a patient from the queue to start consulting.</p>
              </div>
            ) : (
              <div className="relative border-l border-zinc-150/70 ml-3 space-y-4">
                {recentVisits.map((v) => {
                  return (
                    <div key={v.id} className="relative pl-6 py-2 rounded-lg hover:bg-zinc-50/75 transition-colors duration-150 group">
                      {/* Timeline dot */}
                      <span className="absolute -left-[5.5px] top-[14px] h-2.5 w-2.5 rounded-full ring-4 ring-white bg-primary" />
                      
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-xs font-bold text-zinc-800 group-hover:text-primary transition-colors">
                            Token #{v.token_no} — {v.patients.first_name} {v.patients.last_name}
                          </h4>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Code: {v.patients.patient_code} • {v.patients.age} yrs • {v.patients.gender}
                          </p>
                          {v.chief_complaint && (
                            <p className="text-[11px] text-zinc-400 italic mt-1 bg-zinc-50 px-2 py-1 rounded inline-block">
                              Complaint: {v.chief_complaint}
                            </p>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold self-start uppercase tracking-wider bg-emerald-50 text-emerald-700">
                          {v.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Guides & System Status */}
        <div className="space-y-6">
          <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-3 mb-4 font-heading">
                EHR Consulting Guide
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3 hover:translate-x-0.5 transition-transform duration-200">
                  <span className="h-6 w-6 shrink-0 bg-primary/10 text-primary flex items-center justify-center rounded text-xs font-bold font-heading">1</span>
                  <div>
                    <h5 className="text-xs font-bold text-zinc-855">Start Consultation</h5>
                    <p className="text-[11px] text-zinc-450 mt-0.5">Select a patient in the Queue Workspace and click "Start Consultation" to set status to In Progress.</p>
                  </div>
                </div>
                <div className="flex gap-3 hover:translate-x-0.5 transition-transform duration-200">
                  <span className="h-6 w-6 shrink-0 bg-emerald-50 text-emerald-700 flex items-center justify-center rounded text-xs font-bold font-heading">2</span>
                  <div>
                    <h5 className="text-xs font-bold text-zinc-855">Record EHR Diagnostics</h5>
                    <p className="text-[11px] text-zinc-450 mt-0.5">Fill in symptoms, clinical findings, primary diagnosis, and advice notes.</p>
                  </div>
                </div>
                <div className="flex gap-3 hover:translate-x-0.5 transition-transform duration-200">
                  <span className="h-6 w-6 shrink-0 bg-amber-50 text-amber-700 flex items-center justify-center rounded text-xs font-bold font-heading">3</span>
                  <div>
                    <h5 className="text-xs font-bold text-zinc-855">Build Rx Prescription</h5>
                    <p className="text-[11px] text-zinc-450 mt-0.5">Search drugs, input dosage, duration, and click Add. Complete to print sheet and route to Pharmacy.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-indigo-100 bg-indigo-50/20 rounded-xl shadow-xs">
            <CardContent className="p-5 flex gap-3.5">
              <Stethoscope className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-primary font-heading">Clinical Accountability</h4>
                <p className="text-[11px] text-zinc-550 leading-normal mt-1">
                  Ensure all allergies and medical history logs are reviewed before prescribing. Completing a consultation with medicines routes the queue entry to the Pharmacy automatically.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
