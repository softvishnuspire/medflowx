import React, { useEffect, useState } from 'react';
import { getReportData, formatDateToDDMMYYYY } from '@/services/admin';
import { ClinicReportData } from '@/types/admin';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import {
  Calendar, 
  RefreshCw, 
  TrendingUp,
  BarChart3,
  Users,
  CreditCard,
  Sparkles,
  IndianRupee,
  Layers
} from 'lucide-react-native';

export default function ReportsView() {
  const [reportData, setReportData] = useState<ClinicReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Date Range (default: last 30 days) formatted as DD-MM-YYYY
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateToDDMMYYYY(d);
  });
  const [endDate, setEndDate] = useState(() => {
    return formatDateToDDMMYYYY(new Date());
  });

  const [activeReportTab, setActiveReportTab] = useState<'treatments' | 'revenue' | 'patients' | 'doctors' | 'payments'>('treatments');

  const loadReport = async () => {
    try {
      setIsLoading(true);
      const data = await getReportData({ start: startDate, end: endDate });
      setReportData(data);
    } catch (err: any) {
      console.error('Error loading report:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [startDate, endDate]);

  const renderNavTab = (id: typeof activeReportTab, label: string, icon: any) => {
    const Icon = icon;
    const isActive = activeReportTab === id;
    return (
      <TouchableOpacity
        onPress={() => setActiveReportTab(id)}
        className={`flex-1 p-3 rounded-2xl border items-center justify-center gap-1 ${
          isActive ? 'bg-cyan-600 border-cyan-600 shadow-2xs' : 'bg-white border-slate-200/70 active:bg-slate-50'
        }`}
      >
        <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-cyan-600'}`} />
        <Text className={`text-xs font-black ${isActive ? 'text-white' : 'text-slate-800'}`}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View className="gap-5 w-full">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-2">
          <Text className="text-xl font-black text-slate-900">Analytics & Financial Reports</Text>
          <Text className="text-xs text-slate-500 font-medium mt-0.5">Procedure revenue (Hair, Face & Skin), daily fees & practitioner breakdown</Text>
        </View>
      </View>

      {/* Date Range Selector Card */}
      <View className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3">
        <View className="flex-row items-center justify-between border-b border-slate-100 pb-2.5">
          <View className="flex-row items-center gap-1.5">
            <Calendar className="h-4 w-4 text-slate-600" />
            <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Date Range Filter</Text>
          </View>
          <TouchableOpacity
            onPress={loadReport}
            className="flex-row items-center gap-1.5 px-3 py-1.5 bg-cyan-600 rounded-xl active:bg-cyan-700 shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-white" />
            <Text className="text-xs font-black text-white">Refresh</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <Text className="text-[10px] font-bold text-slate-400 uppercase mb-1">Start Date</Text>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="DD-MM-YYYY"
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200/70 rounded-2xl text-xs font-bold text-slate-800"
              placeholderTextColor="#94a3b8"
            />
          </View>
          <Text className="text-xs font-bold text-slate-400 self-end mb-3">to</Text>
          <View className="flex-1">
            <Text className="text-[10px] font-bold text-slate-400 uppercase mb-1">End Date</Text>
            <TextInput
              value={endDate}
              onChangeText={setEndDate}
              placeholder="DD-MM-YYYY"
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200/70 rounded-2xl text-xs font-bold text-slate-800"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>
      </View>

      {/* Navigation Buttons Row - Explicit 2-Row Stack without flex-wrap */}
      <View className="gap-2">
        <View className="flex-row gap-2">
          {renderNavTab('treatments', 'Hair & Face', Sparkles)}
          {renderNavTab('revenue', 'Daily Fees', TrendingUp)}
          {renderNavTab('patients', 'Patients', Users)}
        </View>
        <View className="flex-row gap-2">
          {renderNavTab('doctors', 'Doctors', BarChart3)}
          {renderNavTab('payments', 'Payments', CreditCard)}
        </View>
      </View>

      {/* Main Analysis Card */}
      {isLoading ? (
        <View className="p-8 bg-white rounded-3xl border border-slate-100 items-center justify-center">
          <ActivityIndicator size="small" color="#0891b2" />
          <Text className="text-xs text-slate-400 font-bold mt-2">Compiling clinic financial metrics...</Text>
        </View>
      ) : !reportData ? (
        <View className="p-8 bg-white rounded-3xl border border-slate-100 items-center justify-center">
          <Text className="text-xs text-slate-400 font-medium">No records match the selected date range.</Text>
        </View>
      ) : (
        <View className="gap-3">
          {/* HAIR & FACE PROCEDURE CATEGORY ANALYSIS */}
          {activeReportTab === 'treatments' && reportData.treatmentCategory && (
            <View className="gap-3">
              {/* Summary Highlights */}
              <View className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3">
                <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
                  <View className="flex-row items-center gap-2">
                    <Sparkles className="h-5 w-5 text-cyan-600" />
                    <Text className="text-sm font-black text-slate-900">Procedure Revenue Breakdown</Text>
                  </View>
                  <View className="px-2.5 py-0.5 bg-cyan-50 rounded-full border border-cyan-100">
                    <Text className="text-[10px] font-extrabold text-cyan-800">
                      {reportData.treatmentCategory.totalTreatmentCount} Procedures
                    </Text>
                  </View>
                </View>

                {/* 3 Categories Cards */}
                <View className="gap-2.5">
                  {/* Hair Income */}
                  <View className="p-3.5 bg-cyan-50/70 rounded-2xl border border-cyan-100 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2.5">
                      <View className="w-3 h-3 rounded-full bg-cyan-600" />
                      <View>
                        <Text className="text-xs font-black text-cyan-950">Hair Procedures Income</Text>
                        <Text className="text-[10px] font-medium text-cyan-800">
                          {reportData.treatmentCategory.hairCount} procedure sessions
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm font-black text-cyan-900">
                      ₹{reportData.treatmentCategory.hairRevenue}
                    </Text>
                  </View>

                  {/* Face / Skin Income */}
                  <View className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2.5">
                      <View className="w-3 h-3 rounded-full bg-indigo-600" />
                      <View>
                        <Text className="text-xs font-black text-indigo-950">Face & Skin Procedures Income</Text>
                        <Text className="text-[10px] font-medium text-indigo-800">
                          {reportData.treatmentCategory.skinCount} procedure sessions
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm font-black text-indigo-900">
                      ₹{reportData.treatmentCategory.skinRevenue}
                    </Text>
                  </View>

                  {/* Both Hair & Face Income */}
                  <View className="p-3.5 bg-teal-50/70 rounded-2xl border border-teal-100 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2.5">
                      <View className="w-3 h-3 rounded-full bg-teal-600" />
                      <View>
                        <Text className="text-xs font-black text-teal-950">Both Hair & Face Combo</Text>
                        <Text className="text-[10px] font-medium text-teal-800">
                          {reportData.treatmentCategory.bothCount} procedure sessions
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm font-black text-teal-900">
                      ₹{reportData.treatmentCategory.bothRevenue}
                    </Text>
                  </View>
                </View>

                {/* Total Combined Income Banner */}
                <View className="p-3.5 bg-slate-900 rounded-2xl flex-row items-center justify-between mt-1">
                  <View className="flex-row items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-emerald-400" />
                    <Text className="text-xs font-black text-white uppercase tracking-wider">Total Procedures Income</Text>
                  </View>
                  <Text className="text-base font-black text-emerald-400">
                    ₹{reportData.treatmentCategory.totalTreatmentRevenue}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* DAILY REVENUE */}
          {activeReportTab === 'revenue' && (
            <View className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3">
              <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Daily Collected Revenue</Text>
              {reportData.dailyRevenue.length === 0 ? (
                <Text className="text-xs text-slate-400 font-medium italic">No revenue recorded in range.</Text>
              ) : (
                reportData.dailyRevenue.map((r, i) => (
                  <View key={i} className="p-3 bg-slate-50/70 rounded-2xl flex-row items-center justify-between">
                    <Text className="text-xs font-bold text-slate-900">{r.date}</Text>
                    <Text className="text-xs font-black text-emerald-700">₹{r.amount} ({r.count} txs)</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* PATIENT ENROLLMENTS */}
          {activeReportTab === 'patients' && (
            <View className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3">
              <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Patient Registrations Log</Text>
              {reportData.patientCount.length === 0 ? (
                <Text className="text-xs text-slate-400 font-medium italic">No patient registrations in range.</Text>
              ) : (
                reportData.patientCount.map((p, i) => (
                  <View key={i} className="p-3 bg-slate-50/70 rounded-2xl flex-row items-center justify-between">
                    <Text className="text-xs font-bold text-slate-900">{p.date}</Text>
                    <Text className="text-xs font-black text-cyan-800">{p.count} new patients</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* DOCTOR PERFORMANCES */}
          {activeReportTab === 'doctors' && (
            <View className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3">
              <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Practitioner Consultations</Text>
              {reportData.doctorVisits.length === 0 ? (
                <Text className="text-xs text-slate-400 font-medium italic">No doctor consults recorded.</Text>
              ) : (
                reportData.doctorVisits.map((d, i) => (
                  <View key={i} className="p-3 bg-slate-50/70 rounded-2xl flex-row items-center justify-between">
                    <View>
                      <Text className="text-xs font-black text-slate-900">{d.doctorName}</Text>
                      <Text className="text-[10px] text-slate-500 font-medium">{d.departmentName}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs font-black text-emerald-700">₹{d.revenue}</Text>
                      <Text className="text-[10px] text-slate-500 font-bold">{d.visitCount} visits</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* PAYMENTS SUMMARY */}
          {activeReportTab === 'payments' && (
            <View className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3">
              <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Payment Channel Metrics</Text>
              {reportData.paymentSummary.length === 0 ? (
                <Text className="text-xs text-slate-400 font-medium italic">No payment modes recorded.</Text>
              ) : (
                reportData.paymentSummary.map((m, i) => (
                  <View key={i} className="p-3 bg-slate-50/70 rounded-2xl flex-row items-center justify-between">
                    <Text className="text-xs font-bold text-slate-900">{m.method}</Text>
                    <Text className="text-xs font-black text-emerald-700">₹{m.amount} ({m.count} txs)</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
