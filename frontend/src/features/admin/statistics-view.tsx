'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { getClinicStatisticsData } from '@/services/admin';
import { ClinicStatisticsData } from '@/types/admin';
import { useToast } from '@/components/ui/toast';
import { 
  Calendar, 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Pill, 
  Scissors, 
  Sparkles, 
  Activity, 
  Stethoscope, 
  CreditCard,
  Building2,
  Globe,
  PieChart,
  BarChart3
} from 'lucide-react';

export default function StatisticsView() {
  const [statsData, setStatsData] = useState<ClinicStatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Date Range (default: last 30 days)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  
  // View mode: 'range' or 'allTime'
  const [isAllTime, setIsAllTime] = useState(false);

  const { toast } = useToast();

  const loadStatistics = async () => {
    try {
      setIsLoading(true);
      const data = await getClinicStatisticsData({
        start: startDate,
        end: endDate,
        isAllTime
      });
      setStatsData(data);
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to fetch statistics data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [startDate, endDate, isAllTime]);

  // Date Preset Helpers
  const applyPreset = (preset: 'today' | 'week' | 'month' | 'all') => {
    if (preset === 'all') {
      setIsAllTime(true);
      return;
    }
    
    setIsAllTime(false);
    const end = new Date();
    const start = new Date();

    if (preset === 'today') {
      // today
    } else if (preset === 'week') {
      start.setDate(end.getDate() - 7);
    } else if (preset === 'month') {
      start.setDate(end.getDate() - 30);
    }

    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };

  // Safe percentage helper
  const calcPct = (part: number, total: number) => {
    if (!total || total === 0) return 0;
    return Math.round((part / total) * 100);
  };

  return (
    <div className="space-y-6 animate-slide-in text-zinc-700 font-body">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">
                Clinic Statistics & Analytics
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Comprehensive overview of clinic revenue, department earnings, pharmacy sales, and patient volume.
              </p>
            </div>
          </div>
        </div>

        {/* Date Filter Bar */}
        <Card className="border border-zinc-200/80 bg-white rounded-xl shadow-xs shrink-0">
          <CardContent className="p-2.5 flex flex-wrap items-center gap-2">
            
            {/* Quick Presets */}
            <div className="flex items-center gap-1 bg-zinc-100/70 p-1 rounded-lg">
              <button
                onClick={() => applyPreset('today')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  !isAllTime && startDate === endDate
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => applyPreset('week')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  !isAllTime && startDate !== endDate
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => applyPreset('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  isAllTime
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Globe className="h-3 w-3 inline mr-1" />
                Full Data (All Time)
              </button>
            </div>

            {/* Date Inputs */}
            {!isAllTime && (
              <div className="flex items-center gap-1.5 text-xs bg-zinc-50 px-2.5 py-1 rounded-lg border border-zinc-200">
                <Calendar className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-0 bg-transparent focus:outline-none text-zinc-700 font-semibold p-0 w-[100px] cursor-pointer"
                />
                <span className="text-zinc-300 font-bold">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-0 bg-transparent focus:outline-none text-zinc-700 font-semibold p-0 w-[100px] cursor-pointer"
                />
              </div>
            )}

            {/* Refresh */}
            <button
              onClick={loadStatistics}
              disabled={isLoading}
              className="p-1.5 border border-zinc-200 hover:bg-zinc-100 rounded-lg text-zinc-600 hover:text-primary transition-colors cursor-pointer"
              title="Refresh Statistics"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Total Revenue */}
        <Card className="border border-emerald-200/60 bg-gradient-to-br from-emerald-50/50 to-white rounded-xl shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 font-heading">Total Revenue</span>
              <div className="p-2 rounded-lg bg-emerald-500 text-white shadow-xs">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-emerald-950 font-heading">
                ₹{isLoading ? '...' : (statsData?.totalRevenue || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" /> Collected Payments
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Hair Revenue */}
        <Card className="border border-purple-200/60 bg-gradient-to-br from-purple-50/50 to-white rounded-xl shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 font-heading">Revenue from Hair</span>
              <div className="p-2 rounded-lg bg-purple-600 text-white shadow-xs">
                <Scissors className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-purple-950 font-heading">
                ₹{isLoading ? '...' : (statsData?.hairRevenue || 0).toLocaleString()}
              </div>
              <div className="w-full bg-purple-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-purple-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${calcPct(statsData?.hairRevenue || 0, statsData?.totalRevenue || 0)}%` }}
                />
              </div>
              <span className="text-[10px] text-purple-600 font-medium block mt-1">
                {calcPct(statsData?.hairRevenue || 0, statsData?.totalRevenue || 0)}% of total revenue
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Skin Revenue */}
        <Card className="border border-pink-200/60 bg-gradient-to-br from-pink-50/50 to-white rounded-xl shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-pink-700 font-heading">Revenue from Skin</span>
              <div className="p-2 rounded-lg bg-pink-500 text-white shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-pink-950 font-heading">
                ₹{isLoading ? '...' : (statsData?.skinRevenue || 0).toLocaleString()}
              </div>
              <div className="w-full bg-pink-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-pink-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${calcPct(statsData?.skinRevenue || 0, statsData?.totalRevenue || 0)}%` }}
                />
              </div>
              <span className="text-[10px] text-pink-600 font-medium block mt-1">
                {calcPct(statsData?.skinRevenue || 0, statsData?.totalRevenue || 0)}% of total revenue
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Pharmacy Revenue */}
        <Card className="border border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-white rounded-xl shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 font-heading">Pharmacy Sales</span>
              <div className="p-2 rounded-lg bg-amber-500 text-white shadow-xs">
                <Pill className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-amber-950 font-heading">
                ₹{isLoading ? '...' : (statsData?.pharmacyRevenue || 0).toLocaleString()}
              </div>
              <div className="w-full bg-amber-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${calcPct(statsData?.pharmacyRevenue || 0, statsData?.totalRevenue || 0)}%` }}
                />
              </div>
              <span className="text-[10px] text-amber-600 font-medium block mt-1">
                {calcPct(statsData?.pharmacyRevenue || 0, statsData?.totalRevenue || 0)}% of total revenue
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Treatment Revenue */}
        <Card className="border border-cyan-200/60 bg-gradient-to-br from-cyan-50/50 to-white rounded-xl shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-700 font-heading">Treatments & Consults</span>
              <div className="p-2 rounded-lg bg-cyan-600 text-white shadow-xs">
                <Stethoscope className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-cyan-950 font-heading">
                ₹{isLoading ? '...' : (statsData?.treatmentRevenue || 0).toLocaleString()}
              </div>
              <div className="w-full bg-cyan-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-cyan-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${calcPct(statsData?.treatmentRevenue || 0, statsData?.totalRevenue || 0)}%` }}
                />
              </div>
              <span className="text-[10px] text-cyan-600 font-medium block mt-1">
                {calcPct(statsData?.treatmentRevenue || 0, statsData?.totalRevenue || 0)}% of total revenue
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Patients */}
        <Card className="border border-blue-200/60 bg-gradient-to-br from-blue-50/50 to-white rounded-xl shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 font-heading">Total Patients</span>
              <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-blue-950 font-heading">
                {isLoading ? '...' : (statsData?.totalPatients || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-blue-600 font-semibold block mt-1">
                {statsData?.totalVisits || 0} Total Outpatient Visits
              </span>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Visual Revenue Share & Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Department Revenue Breakdown */}
        <Card className="border border-zinc-200/80 bg-white rounded-xl shadow-sm lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-zinc-900 font-heading">
                  Department & Category Revenue Streams
                </h3>
              </div>
              <span className="text-xs font-semibold text-zinc-400">
                {isAllTime ? 'All Time' : `${startDate} to ${endDate}`}
              </span>
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-7 h-7 rounded-full border-3 border-zinc-200 border-t-primary animate-spin" />
                <span className="text-xs text-zinc-400">Calculating revenue distribution...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual Progress Meters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <div className="p-4 rounded-xl bg-purple-50/40 border border-purple-100">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-900 font-heading">
                      <span>Hair Department</span>
                      <span>₹{(statsData?.hairRevenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-purple-200/60 h-2.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-purple-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${calcPct(statsData?.hairRevenue || 0, statsData?.totalRevenue || 0)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-purple-600 font-medium block mt-1.5">
                      Hair care, hair transplant consultations & scalp procedures
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-pink-50/40 border border-pink-100">
                    <div className="flex items-center justify-between text-xs font-bold text-pink-900 font-heading">
                      <span>Skin Department</span>
                      <span>₹{(statsData?.skinRevenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-pink-200/60 h-2.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-pink-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${calcPct(statsData?.skinRevenue || 0, statsData?.totalRevenue || 0)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-pink-600 font-medium block mt-1.5">
                      Dermatology, facial aesthetics & laser therapy
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-100">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-900 font-heading">
                      <span>Pharmacy Unit</span>
                      <span>₹{(statsData?.pharmacyRevenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-amber-200/60 h-2.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${calcPct(statsData?.pharmacyRevenue || 0, statsData?.totalRevenue || 0)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-amber-600 font-medium block mt-1.5">
                      Prescription medicine sales & inventory dispensing
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-cyan-50/40 border border-cyan-100">
                    <div className="flex items-center justify-between text-xs font-bold text-cyan-900 font-heading">
                      <span>General Treatments</span>
                      <span>₹{(statsData?.treatmentRevenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-cyan-200/60 h-2.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-cyan-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${calcPct(statsData?.treatmentRevenue || 0, statsData?.totalRevenue || 0)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-cyan-600 font-medium block mt-1.5">
                      General OP consultations, diagnostics & clinical checkups
                    </span>
                  </div>

                </div>

                {/* Detailed Department Breakdown Table */}
                <div className="mt-6 border border-zinc-150 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-zinc-50">
                      <TableRow>
                        <TableHead>Department Name</TableHead>
                        <TableHead>Completed Visits</TableHead>
                        <TableHead className="text-right">Revenue Generated</TableHead>
                        <TableHead className="text-right">Revenue Share</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!statsData?.departmentRevenues || statsData.departmentRevenues.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 italic text-xs text-zinc-400">
                            No department specific data recorded for this period.
                          </TableCell>
                        </TableRow>
                      ) : (
                        statsData.departmentRevenues.map((dept, idx) => (
                          <TableRow key={idx} className="hover:bg-zinc-50/60 transition-colors">
                            <TableCell className="font-semibold text-zinc-900">{dept.departmentName}</TableCell>
                            <TableCell className="font-mono text-xs font-bold text-zinc-600">{dept.visitCount} visits</TableCell>
                            <TableCell className="text-right font-bold text-emerald-650">₹{dept.revenue.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-semibold text-xs text-zinc-500">
                              {calcPct(dept.revenue, statsData.totalRevenue)}%
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Channels & Doctor Stats */}
        <div className="space-y-6">
          
          {/* Payment Channels */}
          <Card className="border border-zinc-200/80 bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4.5 w-4.5 text-primary" />
                  <h3 className="text-sm font-bold text-zinc-900 font-heading">
                    Payment Mode Breakdown
                  </h3>
                </div>
              </div>

              {isLoading ? (
                <div className="h-32 bg-zinc-50 rounded-lg animate-pulse" />
              ) : (!statsData?.paymentSummary || statsData.paymentSummary.length === 0) ? (
                <div className="text-xs text-zinc-400 italic py-6 text-center">No payment transactions recorded.</div>
              ) : (
                <div className="space-y-3">
                  {statsData.paymentSummary.map((pm, idx) => (
                    <div key={idx} className="p-3 bg-zinc-50 rounded-lg border border-zinc-150/60 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-zinc-900 block font-heading">{pm.method}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">{pm.count} receipts</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-650 block">₹{pm.amount.toLocaleString()}</span>
                        <span className="text-[10px] text-zinc-400 font-semibold">{calcPct(pm.amount, statsData.totalRevenue)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Doctor Performance Summary */}
          <Card className="border border-zinc-200/80 bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4.5 w-4.5 text-primary" />
                  <h3 className="text-sm font-bold text-zinc-900 font-heading">
                    Practitioner Stats
                  </h3>
                </div>
              </div>

              {isLoading ? (
                <div className="h-36 bg-zinc-50 rounded-lg animate-pulse" />
              ) : (!statsData?.doctorVisits || statsData.doctorVisits.length === 0) ? (
                <div className="text-xs text-zinc-400 italic py-6 text-center">No doctor consultation records.</div>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {statsData.doctorVisits.map((doc, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-zinc-100 hover:bg-zinc-50 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-zinc-800 block">{doc.doctorName}</span>
                        <span className="text-[10px] text-zinc-400">{doc.departmentName}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-650 block">₹{doc.revenue.toLocaleString()}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{doc.visitCount} visits</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
