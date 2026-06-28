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
      label: "Today's OPD Queue", 
      value: totalQueueToday, 
      icon: Users, 
      color: 'bg-cyan-50 text-primary border border-primary/20', 
      desc: 'Total check-ins logged today' 
    },
    { 
      label: 'Waiting in Queue', 
      value: waitingPatients, 
      icon: Clock, 
      color: 'bg-amber-50 text-amber-600 border border-amber-200', 
      desc: 'Pending consultation' 
    },
    { 
      label: 'Active Consultations', 
      value: activePatients, 
      icon: Activity, 
      color: 'bg-emerald-50 text-emerald-600 border border-emerald-200', 
      desc: 'Currently in examination' 
    },
    { 
      label: 'Completed Cases', 
      value: completedVisits, 
      icon: CheckCircle2, 
      color: 'bg-teal-50 text-teal-600 border border-teal-200', 
      desc: 'Diagnosed & prescribed' 
    },
    { 
      label: 'Consultation Fees', 
      value: `₹${estimatedFees}`, 
      icon: IndianRupee, 
      color: 'bg-primary/10 text-primary border border-primary/25', 
      desc: 'Estimated OPD earnings' 
    }
  ];

  // Get last 5 visits for activity preview
  const recentVisits = [...visits]
    .filter(v => ['Prescribed', 'Sent to Pharmacy', 'Dispensed', 'Closed'].includes(v.status))
    .slice(-5)
    .reverse();

  return (
    <div className="space-y-8 animate-slide-in font-body text-text-custom">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight font-heading">
            OPD Control Dashboard
          </h1>
          <p className="text-sm text-zinc-650 mt-1">
            Real-time OPD metrics, live queue activity streams, and digital EHR logging.
          </p>
        </div>
        <button
          onClick={onNavigateToQueue}
          className="inline-flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:outline-none"
        >
          <Activity className="h-4.5 w-4.5" />
          Open Queue Workspace
        </button>
      </div>

      {/* Metrics Row */}
      <section aria-labelledby="opd-metrics-heading">
        <h2 id="opd-metrics-heading" className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4 font-heading">
          Live Clinical Metrics
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {coreStats.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card 
                key={index} 
                className="transition-all duration-200 hover:shadow-lg hover:border-primary/45 border border-zinc-200 bg-white rounded-xl"
              >
                <CardContent className="p-6 flex flex-col justify-between h-full min-h-[120px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500">{item.label}</span>
                    <div className={`p-2 rounded-lg ${item.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-3xl font-black text-zinc-900 tracking-tight font-heading">{item.value}</h3>
                    <p className="text-[10px] text-zinc-550 mt-1.5 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Grid: Recent activity & Guides */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Cases */}
        <Card className="md:col-span-2 border border-zinc-200 bg-white rounded-xl shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-zinc-800 border-b border-zinc-150 pb-3.5 mb-5 flex items-center gap-2.5 font-heading">
              <Activity className="h-4.5 w-4.5 text-primary animate-pulse" />
              Recently Consulted Patients Today
            </h3>
            
            {recentVisits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-full mb-3 text-zinc-400">
                  <Users className="h-6 w-6" />
                </div>
                <span className="text-sm font-bold text-zinc-700">No consultations completed today</span>
                <p className="text-xs text-zinc-450 mt-1 max-w-xs">
                  Patients checked-in and prescribed will show up here as they are processed.
                </p>
              </div>
            ) : (
              <div className="relative border-l border-zinc-200 ml-4 space-y-5">
                {recentVisits.map((v) => {
                  return (
                    <div key={v.id} className="relative pl-6 py-2.5 rounded-lg hover:bg-primary/5 transition-colors duration-200 group cursor-default">
                      {/* Timeline dot */}
                      <span className="absolute -left-[5.5px] top-[16px] h-2.5 w-2.5 rounded-full ring-4 ring-white bg-primary" />
                      
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-zinc-850 group-hover:text-primary transition-colors font-heading">
                            Token #{v.token_no} — {v.patients.first_name} {v.patients.last_name}
                          </h4>
                          <p className="text-xs text-zinc-500 font-medium">
                            Code: <span className="font-mono">{v.patients.patient_code}</span> • {v.patients.age} Yrs • {v.patients.gender}
                          </p>
                          {v.chief_complaint && (
                            <p className="text-xs text-zinc-650 bg-zinc-100/80 px-2.5 py-1.5 rounded border border-zinc-200 inline-block">
                              <span className="font-bold text-zinc-500">Complaint:</span> {v.chief_complaint}
                            </p>
                          )}
                        </div>
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold self-start uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 font-heading">
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
          <Card className="border border-zinc-200 bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-sm font-bold text-zinc-800 border-b border-zinc-150 pb-3.5 mb-5 font-heading">
                OPD Clinical SOP
              </h3>
              <div className="space-y-5">
                <div className="flex gap-3.5 hover:translate-x-1 transition-transform duration-200">
                  <span className="h-7 w-7 shrink-0 bg-primary/10 text-primary flex items-center justify-center rounded-lg text-xs font-bold font-heading border border-primary/20">1</span>
                  <div>
                    <h5 className="text-xs font-bold text-zinc-850">Select Queue Patient</h5>
                    <p className="text-[11px] text-zinc-550 leading-relaxed mt-0.5">Pick any check-in entry in the workspace and click "Start Consultation" to set it to In Progress.</p>
                  </div>
                </div>
                <div className="flex gap-3.5 hover:translate-x-1 transition-transform duration-200">
                  <span className="h-7 w-7 shrink-0 bg-teal-50 text-teal-700 flex items-center justify-center rounded-lg text-xs font-bold font-heading border border-teal-200">2</span>
                  <div>
                    <h5 className="text-xs font-bold text-zinc-855">Record Diagnostics</h5>
                    <p className="text-[11px] text-zinc-550 leading-relaxed mt-0.5">Input presenting symptoms, clinical investigation notes, and document a primary diagnosis code.</p>
                  </div>
                </div>
                <div className="flex gap-3.5 hover:translate-x-1 transition-transform duration-200">
                  <span className="h-7 w-7 shrink-0 bg-emerald-50 text-emerald-700 flex items-center justify-center rounded-lg text-xs font-bold font-heading border border-emerald-200">3</span>
                  <div>
                    <h5 className="text-xs font-bold text-zinc-855">Build & Route Rx</h5>
                    <p className="text-[11px] text-zinc-550 leading-relaxed mt-0.5">Search pharmacy catalog, specify drug dosages/frequencies, complete to generate invoice and route stock.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-cyan-200 bg-cyan-50/20 rounded-xl shadow-xs">
            <CardContent className="p-5 flex gap-3.5">
              <Stethoscope className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-primary font-heading uppercase tracking-wide">Clinical Practice Alert</h4>
                <p className="text-[11px] text-zinc-650 leading-relaxed font-medium">
                  Verify allergy profiles and emergency contacts prior to finalizing the Rx chart. Complete consultations trigger electronic alerts at the pharmacy desk instantly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
