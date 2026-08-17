import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '@/services/reception';
import { StatsSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { View, Text, TouchableOpacity } from 'react-native';
import { 
  Users, 
  CalendarDays, 
  Clock, 
  CheckCircle2, 
  IndianRupee, 
  TrendingUp,
  RefreshCw,
  ArrowRight,
  UserPlus,
  Calendar,
  Sparkles,
  Search
} from 'lucide-react-native';

interface DashboardStats {
  todayPatients: number;
  todayVisits: number;
  waitingPatients: number;
  completedVisits: number;
  todayRevenue: number;
}

interface DashboardViewProps {
  onNavigateTab?: (tab: 'registration' | 'visit' | 'payments' | 'queue' | 'treatments' | 'search' | 'patients' | 'dashboard') => void;
}

export default function DashboardView({ onNavigateTab }: DashboardViewProps) {
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
      <View className="gap-4 w-full">
        <Text className="text-xl font-black text-slate-900">Reception Dashboard</Text>
        <StatsSkeleton />
      </View>
    );
  }

  return (
    <View className="gap-4 w-full">
      {/* Title & Refresh Header */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-black text-slate-900 tracking-tight">Reception Overview</Text>
          <Text className="text-xs text-slate-500 font-medium mt-0.5">Live clinic activity & intake stats</Text>
        </View>

        <TouchableOpacity
          onPress={loadStats}
          className="flex-row items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-100 rounded-xl active:bg-slate-100 shadow-2xs"
        >
          <RefreshCw className="h-3.5 w-3.5 text-cyan-600" />
          <Text className="text-xs font-bold text-slate-700">Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Row 1: Today's Patients & Today's Visits */}
      <View className="flex-row gap-3">
        <View className="flex-1 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm justify-between">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-bold text-slate-500">Today's Patients</Text>
            <View className="p-2 rounded-xl bg-cyan-50">
              <Users className="h-4.5 w-4.5 text-cyan-600" />
            </View>
          </View>
          <View>
            <Text className="text-2xl font-black text-slate-900 tracking-tight">{stats?.todayPatients || 0}</Text>
            <View className="flex-row items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-cyan-600" />
              <Text className="text-[10px] text-cyan-700 font-bold">+4% vs yesterday</Text>
            </View>
          </View>
        </View>

        <View className="flex-1 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm justify-between">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-bold text-slate-500">Today's Visits</Text>
            <View className="p-2 rounded-xl bg-emerald-50">
              <CalendarDays className="h-4.5 w-4.5 text-emerald-600" />
            </View>
          </View>
          <View>
            <Text className="text-2xl font-black text-slate-900 tracking-tight">{stats?.todayVisits || 0}</Text>
            <View className="flex-row items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-emerald-600" />
              <Text className="text-[10px] text-emerald-700 font-bold">+12% vs yesterday</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Row 2: Waiting Patients & Completed Visits */}
      <View className="flex-row gap-3">
        <View className="flex-1 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm justify-between">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-bold text-slate-500">Waiting Queue</Text>
            <View className="p-2 rounded-xl bg-amber-50">
              <Clock className="h-4.5 w-4.5 text-amber-600" />
            </View>
          </View>
          <View>
            <Text className="text-2xl font-black text-slate-900 tracking-tight">{stats?.waitingPatients || 0}</Text>
            <Text className="text-[10px] text-amber-700 font-bold mt-1">In live OPD queue</Text>
          </View>
        </View>

        <View className="flex-1 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm justify-between">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-bold text-slate-500">Completed Visits</Text>
            <View className="p-2 rounded-xl bg-violet-50">
              <CheckCircle2 className="h-4.5 w-4.5 text-violet-600" />
            </View>
          </View>
          <View>
            <Text className="text-2xl font-black text-slate-900 tracking-tight">{stats?.completedVisits || 0}</Text>
            <Text className="text-[10px] text-violet-700 font-bold mt-1">Consultations done</Text>
          </View>
        </View>
      </View>

      {/* Row 3: Revenue Card */}
      <View className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex-row items-center justify-between">
        <View>
          <Text className="text-xs font-bold text-slate-500">Today's Collections Total</Text>
          <Text className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">₹{stats?.todayRevenue || 0}</Text>
          <Text className="text-[10px] text-slate-400 font-medium">Consultation fees collected today</Text>
        </View>
        <View className="p-3 rounded-2xl bg-rose-50">
          <IndianRupee className="h-6 w-6 text-rose-600" />
        </View>
      </View>

      {/* Quick Services */}
      <View className="mt-4 gap-3">
        <View className="mb-1">
          <Text className="text-lg font-black text-slate-900 tracking-tight">Quick Services</Text>
          <Text className="text-xs text-slate-500 font-medium mt-0.5">Access terminal workflows</Text>
        </View>
        


        {/* Visit Wizard */}
        <TouchableOpacity 
          onPress={() => onNavigateTab?.('visit')}
          className="bg-white border border-slate-200 rounded-2xl p-4 flex-row items-center shadow-sm active:bg-slate-50"
        >
          <View className="w-12 h-12 rounded-xl items-center justify-center mr-4 bg-[#0891b2]">
            <Calendar size={24} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-bold text-slate-800">Visit Wizard</Text>
            <Text className="text-xs text-slate-500 font-medium mt-0.5">Schedule consultation</Text>
          </View>
        </TouchableOpacity>

        {/* Treatments */}
        <TouchableOpacity 
          onPress={() => onNavigateTab?.('treatments')}
          className="bg-white border border-slate-200 rounded-2xl p-4 flex-row items-center shadow-sm active:bg-slate-50"
        >
          <View className="w-12 h-12 rounded-xl items-center justify-center mr-4 bg-[#8b5cf6]">
            <Sparkles size={24} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-bold text-slate-800">Treatments & Procedures</Text>
            <Text className="text-xs text-slate-500 font-medium mt-0.5">Record procedure charges</Text>
          </View>
        </TouchableOpacity>

        {/* Search Database */}
        <TouchableOpacity 
          onPress={() => onNavigateTab?.('search')}
          className="bg-white border border-slate-200 rounded-2xl p-4 flex-row items-center shadow-sm active:bg-slate-50"
        >
          <View className="w-12 h-12 rounded-xl items-center justify-center mr-4 bg-[#6366f1]">
            <Search size={24} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-bold text-slate-800">Search Database</Text>
            <Text className="text-xs text-slate-500 font-medium mt-0.5">Find patient records</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
