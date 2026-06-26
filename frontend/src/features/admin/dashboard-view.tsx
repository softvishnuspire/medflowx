'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getAdminDashboardStats, getRecentActivities } from '@/services/admin';
import { AdminDashboardStats, RecentActivityItem } from '@/types/admin';
import { StatsSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { 
  Users, 
  CalendarDays, 
  Clock, 
  CheckCircle2, 
  IndianRupee, 
  TrendingUp, 
  Stethoscope, 
  ShieldAlert, 
  Activity,
  CreditCard,
  UserCheck
} from 'lucide-react';

export default function DashboardView() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statsData, actData] = await Promise.all([
        getAdminDashboardStats(),
        getRecentActivities()
      ]);
      setStats(statsData);
      setActivities(actData);
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to load dashboard metrics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-zinc-200 rounded w-1/4"></div>
          <div className="h-6 bg-zinc-200 rounded w-20"></div>
        </div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-28 bg-zinc-150 rounded-xl"></div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-96 bg-zinc-150 rounded-xl"></div>
          <div className="h-96 bg-zinc-150 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const coreStats = [
    { label: 'Total Patients', value: stats?.totalPatients || 0, icon: Users, color: 'bg-indigo-50 text-indigo-600', desc: 'All enrolled patient records' },
    { label: "Today's Patients", value: stats?.todayPatients || 0, icon: UserCheck, color: 'bg-blue-50 text-blue-600', desc: 'Registrations today' },
    { label: "Today's Visits", value: stats?.todayVisits || 0, icon: CalendarDays, color: 'bg-emerald-50 text-emerald-600', desc: 'OP Consultations today' },
    { label: 'Waiting Visits', value: stats?.waitingVisits || 0, icon: Clock, color: 'bg-amber-50 text-amber-600', desc: 'Patients in active queue' },
    { label: 'Completed Visits', value: stats?.completedVisits || 0, icon: CheckCircle2, color: 'bg-teal-50 text-teal-600', desc: 'Prescribed or dispensed' }
  ];

  const financialStats = [
    { label: "Today's Revenue", value: `₹${stats?.todayRevenue || 0}`, icon: IndianRupee, color: 'bg-rose-50 text-rose-600', desc: 'Collected fees today' },
    { label: 'Monthly Revenue', value: `₹${stats?.monthlyRevenue || 0}`, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600', desc: 'Collected fees this month' },
    { label: 'Total Doctors', value: stats?.totalDoctors || 0, icon: Stethoscope, color: 'bg-violet-50 text-violet-600', desc: 'Active clinical doctors' },
    { label: 'Total Receptionists', value: stats?.totalReceptionists || 0, icon: Users, color: 'bg-cyan-50 text-cyan-600', desc: 'Desk reception users' },
    { label: 'Total Pharmacy Users', value: stats?.totalPharmacyUsers || 0, icon: Activity, color: 'bg-purple-50 text-purple-600', desc: 'Pharmacists on duty' }
  ];

  return (
    <div className="space-y-6 animate-slide-in font-body">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">Admin Operations Control</h1>
          <p className="text-sm text-zinc-500 mt-1">Real-time clinical diagnostics, staff allocations, and billing summaries.</p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-50 hover:text-primary hover:border-primary/30 text-zinc-700 rounded-lg text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
        >
          Refresh Control
        </button>
      </div>

      {/* Grid - First Row (Clinical & Queue Metrics) */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 font-heading">Clinical Metrics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {coreStats.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={index} className="transition-all duration-200 hover:shadow-md hover:border-primary/30 border border-zinc-150/60 bg-white rounded-xl cursor-pointer hover:-translate-y-0.5">
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

      {/* Grid - Second Row (Financials & Staff Allocations) */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 font-heading">Finance & Staff Resources</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {financialStats.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={index} className="transition-all duration-200 hover:shadow-md hover:border-primary/30 border border-zinc-150/60 bg-white rounded-xl cursor-pointer hover:-translate-y-0.5">
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

      {/* Recent Activities Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Activities Timeline */}
        <Card className="md:col-span-2 border border-zinc-150/60 bg-white rounded-xl shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2 font-heading">
              <Activity className="h-4 w-4 text-primary animate-pulse" />
              Live Clinic Activity Feed
            </h3>
            
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-sm text-zinc-400">No recent activities found in the clinic log.</span>
              </div>
            ) : (
              <div className="relative border-l border-zinc-150/70 ml-3 space-y-4">
                {activities.map((act) => {
                  let badgeColor = 'bg-zinc-100 text-zinc-650';
                  let dotColor = 'bg-zinc-400';
                  
                  if (act.type === 'payment') {
                    badgeColor = act.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-750';
                    dotColor = 'bg-rose-500';
                  } else if (act.type === 'registration') {
                    badgeColor = 'bg-blue-50 text-blue-700';
                    dotColor = 'bg-blue-500';
                  } else if (act.type === 'visit') {
                    badgeColor = 'bg-emerald-50 text-emerald-700';
                    dotColor = 'bg-emerald-500';
                  }

                  return (
                    <div key={act.id} className="relative pl-6 py-2 rounded-lg hover:bg-zinc-50/75 transition-colors duration-150 group">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[5.5px] top-[14px] h-2.5 w-2.5 rounded-full ring-4 ring-white transition-transform group-hover:scale-110 ${dotColor}`} />
                      
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-xs font-bold text-zinc-800 group-hover:text-primary transition-colors">{act.title}</h4>
                          <p className="text-xs text-zinc-500 mt-0.5">{act.description}</p>
                          <span className="text-[10px] text-zinc-400 block mt-1">
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold self-start uppercase tracking-wider ${badgeColor}`}>
                          {act.type}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Audits & System status info */}
        <div className="space-y-6">
          <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-3 mb-4 font-heading">
                Clinic Operations Guide
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3 hover:translate-x-0.5 transition-transform duration-200">
                  <span className="h-6 w-6 shrink-0 bg-primary/10 text-primary flex items-center justify-center rounded text-xs font-bold">1</span>
                  <div>
                    <h5 className="text-xs font-bold text-zinc-855">User Management</h5>
                    <p className="text-[11px] text-zinc-450 mt-0.5">Admin handles onboarding and toggles activation for Doctors, Receptionists, and Pharmacy Staff.</p>
                  </div>
                </div>
                <div className="flex gap-3 hover:translate-x-0.5 transition-transform duration-200">
                  <span className="h-6 w-6 shrink-0 bg-emerald-50 text-emerald-700 flex items-center justify-center rounded text-xs font-bold">2</span>
                  <div>
                    <h5 className="text-xs font-bold text-zinc-855">Audit & Log Check</h5>
                    <p className="text-[11px] text-zinc-450 mt-0.5">Track modifications, status changes, and user creations inside the live clinic tables.</p>
                  </div>
                </div>
                <div className="flex gap-3 hover:translate-x-0.5 transition-transform duration-200">
                  <span className="h-6 w-6 shrink-0 bg-amber-50 text-amber-700 flex items-center justify-center rounded text-xs font-bold">3</span>
                  <div>
                    <h5 className="text-xs font-bold text-zinc-855">Generate Reports</h5>
                    <p className="text-[11px] text-zinc-450 mt-0.5">Produce PDF, Excel, and CSV files matching revenues, patient enrollments, and doctor consultation visits.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-amber-100 bg-amber-50/20 rounded-xl shadow-xs">
            <CardContent className="p-5 flex gap-3.5">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-800 font-heading">Permission Boundaries</h4>
                <p className="text-[11px] text-amber-750 leading-normal mt-1">
                  As an administrator, you cannot diagnose patients, prescribe medicines, register patients directly, or process active bill collections. Use other module portals for clinical workflows.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
