'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getDashboardStats } from '@/services/reception';
import { StatsSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { 
  Users, 
  CalendarDays, 
  Clock, 
  CheckCircle2, 
  IndianRupee, 
  TrendingUp 
} from 'lucide-react';

interface DashboardStats {
  todayPatients: number;
  todayVisits: number;
  waitingPatients: number;
  completedVisits: number;
  todayRevenue: number;
}

export default function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to load dashboard metrics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Reception Dashboard</h1>
        <StatsSkeleton />
      </div>
    );
  }

  const statItems = [
    {
      label: "Today's Patients",
      value: stats?.todayPatients || 0,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      trend: '+4% from yesterday',
    },
    {
      label: "Today's Visits",
      value: stats?.todayVisits || 0,
      icon: CalendarDays,
      color: 'bg-emerald-50 text-emerald-600',
      trend: '+12% from yesterday',
    },
    {
      label: 'Waiting Patients',
      value: stats?.waitingPatients || 0,
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
      trend: '-2% from last hour',
    },
    {
      label: 'Completed Visits',
      value: stats?.completedVisits || 0,
      icon: CheckCircle2,
      color: 'bg-violet-50 text-violet-600',
      trend: '+8% since 12 PM',
    },
    {
      label: "Today's Revenue",
      value: `₹${stats?.todayRevenue || 0}`,
      icon: IndianRupee,
      color: 'bg-rose-50 text-rose-600',
      trend: '+15% from average',
    },
  ];

  return (
    <div className="space-y-6 font-body text-zinc-705">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">Reception Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Overview of today's registration, visits, and payments activity.</p>
        </div>
        <button
          onClick={loadStats}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-50 hover:text-primary hover:border-primary/30 text-zinc-700 rounded-lg text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
        >
          Refresh Data
        </button>
      </div>

      {/* Grid of stats cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card key={index} className="transition-all duration-200 border border-zinc-150/70 hover:shadow-md hover:border-primary/45 bg-white rounded-xl cursor-pointer hover:-translate-y-0.5">
              <CardContent className="p-5 flex flex-col gap-4 justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 block font-heading">{item.label}</span>
                  <div className={`p-2 rounded-lg ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">{item.value}</h3>
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-zinc-450">
                    <TrendingUp className="h-3.5 w-3.5 text-cta" />
                    <span>{item.trend}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Links / Guide */}
      <div className="grid gap-6 md:grid-cols-3">
        <div 
          onClick={() => {}} 
          className="p-6 rounded-xl border border-zinc-150/60 bg-white shadow-sm hover:shadow-md hover:border-primary/25 flex flex-col justify-between h-48 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 group"
        >
          <div>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 inline-block group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5" />
            </div>
            <h4 className="font-semibold text-zinc-900 text-base mt-3 font-heading group-hover:text-primary transition-colors">Register New Patient</h4>
            <p className="text-zinc-500 text-xs mt-1 leading-relaxed">Enroll new patient profiles with personal info, addresses, and medical history notes.</p>
          </div>
          <span className="text-xs font-semibold text-cta group-hover:translate-x-0.5 transition-transform duration-250 block">Step 1 of Clinic Workflow →</span>
        </div>

        <div 
          onClick={() => {}} 
          className="p-6 rounded-xl border border-zinc-150/60 bg-white shadow-sm hover:shadow-md hover:border-primary/25 flex flex-col justify-between h-48 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 group"
        >
          <div>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 inline-block group-hover:scale-105 transition-transform">
              <CalendarDays className="h-5 w-5" />
            </div>
            <h4 className="font-semibold text-zinc-900 text-base mt-3 font-heading group-hover:text-primary transition-colors">Create Clinical Visit</h4>
            <p className="text-zinc-500 text-xs mt-1 leading-relaxed">Search patient phone or code, assign doctor and department, generate queues.</p>
          </div>
          <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform duration-250 block">Step 2 of Clinic Workflow →</span>
        </div>

        <div 
          onClick={() => {}} 
          className="p-6 rounded-xl border border-zinc-150/60 bg-white shadow-sm hover:shadow-md hover:border-primary/25 flex flex-col justify-between h-48 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 group"
        >
          <div>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600 inline-block group-hover:scale-105 transition-transform">
              <IndianRupee className="h-5 w-5" />
            </div>
            <h4 className="font-semibold text-zinc-900 text-base mt-3 font-heading group-hover:text-primary transition-colors">Consultation Billing</h4>
            <p className="text-zinc-500 text-xs mt-1 leading-relaxed">Collect consultation payments (Cash/UPI/Card) and direct patients to doctor's cabin.</p>
          </div>
          <span className="text-xs font-semibold text-rose-605 group-hover:translate-x-0.5 transition-transform duration-250 block">Step 3 of Clinic Workflow →</span>
        </div>
      </div>
    </div>
  );
}
