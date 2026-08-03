import React, { useEffect, useState } from 'react';
import { getAdminDashboardStats, getRecentActivities } from '@/services/admin';
import { AdminDashboardStats, RecentActivityItem } from '@/types/admin';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
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
  UserCheck,
  RefreshCw,
  Sparkles,
  CalendarCheck,
  CreditCard
} from 'lucide-react-native';

interface DashboardViewProps {
  onNavigateTab?: (tab: 'users' | 'patients' | 'visits' | 'payments' | 'reports') => void;
}

export default function DashboardView({ onNavigateTab }: DashboardViewProps) {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      console.error('Error loading dashboard stats:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <View className="p-8 items-center justify-center bg-white rounded-3xl border border-slate-100">
        <ActivityIndicator size="small" color="#0891b2" />
        <Text className="text-xs font-bold text-slate-400 mt-2">Loading Admin Dashboard...</Text>
      </View>
    );
  }

  const renderStatCard = (item: { label: string; value: string | number; icon: any; bg: string; text: string; desc: string }) => {
    const Icon = item.icon;
    return (
      <View className="flex-1 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm justify-between gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-bold text-slate-500">{item.label}</Text>
          <View className={`p-2 rounded-xl ${item.bg}`}>
            <Icon className={`h-4 w-4 ${item.text}`} />
          </View>
        </View>
        <View>
          <Text className="text-xl font-black text-slate-900">{item.value}</Text>
          <Text className="text-[10px] text-slate-400 font-medium mt-0.5">{item.desc}</Text>
        </View>
      </View>
    );
  };

  return (
    <View className="gap-5 w-full">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-2">
          <Text className="text-xl font-black text-slate-900">Admin Operations Control</Text>
          <Text className="text-xs text-slate-500 font-medium mt-0.5">Real-time clinical metrics, queue status & revenue logs</Text>
        </View>
        <TouchableOpacity
          onPress={loadData}
          className="p-2.5 bg-slate-100/70 border border-slate-200/70 rounded-xl active:bg-slate-200"
        >
          <RefreshCw className="h-4 w-4 text-slate-700" />
        </TouchableOpacity>
      </View>

      {/* Clinical & Queue Metrics - Explicit 2x2 Grid */}
      <View className="gap-2.5">
        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Clinical Queue Metrics</Text>
        <View className="gap-3">
          <View className="flex-row gap-3">
            {renderStatCard({ label: 'Total Patients', value: stats?.totalPatients || 0, icon: Users, bg: 'bg-indigo-50', text: 'text-indigo-700', desc: 'Enrolled patients' })}
            {renderStatCard({ label: "Today's Intake", value: stats?.todayPatients || 0, icon: UserCheck, bg: 'bg-blue-50', text: 'text-blue-700', desc: 'Registered today' })}
          </View>
          <View className="flex-row gap-3">
            {renderStatCard({ label: "Today's Visits", value: stats?.todayVisits || 0, icon: CalendarDays, bg: 'bg-emerald-50', text: 'text-emerald-700', desc: 'OP consultations' })}
            {renderStatCard({ label: 'Waiting Queue', value: stats?.waitingVisits || 0, icon: Clock, bg: 'bg-amber-50', text: 'text-amber-700', desc: 'Patients waiting' })}
          </View>
        </View>
      </View>

      {/* Finance & Staff Resources - Explicit 2x2 Grid */}
      <View className="gap-2.5">
        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Finance & Staff Resources</Text>
        <View className="gap-3">
          <View className="flex-row gap-3">
            {renderStatCard({ label: "Today's Revenue", value: `₹${stats?.todayRevenue || 0}`, icon: IndianRupee, bg: 'bg-rose-50', text: 'text-rose-700', desc: 'Collected fees today' })}
            {renderStatCard({ label: 'Monthly Revenue', value: `₹${stats?.monthlyRevenue || 0}`, icon: TrendingUp, bg: 'bg-emerald-50', text: 'text-emerald-700', desc: 'Fees this month' })}
          </View>
          <View className="flex-row gap-3">
            {renderStatCard({ label: 'Active Doctors', value: stats?.totalDoctors || 0, icon: Stethoscope, bg: 'bg-violet-50', text: 'text-violet-700', desc: 'Clinical practitioners' })}
            {renderStatCard({ label: 'Reception Staff', value: stats?.totalReceptionists || 0, icon: Users, bg: 'bg-cyan-50', text: 'text-cyan-700', desc: 'Frontdesk receptionists' })}
          </View>
        </View>
      </View>

      {/* Quick Services */}
      <View className="mt-2 gap-3">
        <View className="mb-1">
          <Text className="text-lg font-black text-slate-900 tracking-tight">Quick Services</Text>
          <Text className="text-xs text-slate-500 font-medium mt-0.5">Access terminal workflows</Text>
        </View>

        {/* Visits Logs */}
        <TouchableOpacity 
          onPress={() => onNavigateTab?.('visits')}
          className="bg-white border border-slate-200 rounded-2xl p-4 flex-row items-center shadow-sm active:bg-slate-50"
        >
          <View className="w-12 h-12 rounded-xl items-center justify-center mr-4 bg-[#0891b2]">
            <CalendarCheck size={24} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-bold text-slate-800">OPD Visit Logs</Text>
            <Text className="text-xs text-slate-500 font-medium mt-0.5">All clinical appointments</Text>
          </View>
        </TouchableOpacity>

        {/* Payments */}
        <TouchableOpacity 
          onPress={() => onNavigateTab?.('payments')}
          className="bg-white border border-slate-200 rounded-2xl p-4 flex-row items-center shadow-sm active:bg-slate-50"
        >
          <View className="w-12 h-12 rounded-xl items-center justify-center mr-4 bg-[#16a34a]">
            <CreditCard size={24} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-bold text-slate-800">Revenue & Payments</Text>
            <Text className="text-xs text-slate-500 font-medium mt-0.5">Financial invoices & billing</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Live Activity Feed */}
      <View className="mt-2 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3">
        <View className="flex-row items-center gap-2 border-b border-slate-100 pb-2.5">
          <Activity className="h-4 w-4 text-cyan-600" />
          <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Live Clinic Activity Log</Text>
        </View>

        {activities.length === 0 ? (
          <Text className="text-xs text-slate-400 font-medium italic">No recent activities logged in clinic feed.</Text>
        ) : (
          <View className="gap-2.5">
            {activities.map((act) => (
              <View key={act.id} className="p-3 bg-slate-50/70 rounded-2xl flex-row items-center justify-between">
                <View className="flex-1 mr-2">
                  <Text className="text-xs font-black text-slate-900">{act.description}</Text>
                  <Text className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {new Date(act.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </Text>
                </View>
                <View className="px-2 py-1 bg-white rounded-xl border border-slate-200/70">
                  <Text className="text-[10px] font-bold text-slate-600 uppercase">{act.type}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
