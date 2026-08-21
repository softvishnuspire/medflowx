import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { getPaymentsList, getDoctors } from '@/services/admin';
import { Doctor } from '@/types/reception';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { NativePicker } from '@/components/ui/native-picker';
import {
  Calendar, 
  CreditCard, 
  Eye, 
  IndianRupee, 
  RefreshCw, 
  TrendingUp,
  Receipt,
  FileCheck2,
  AlertCircle,
  FilterX
} from 'lucide-react-native';

interface PaymentsStats {
  todayRevenue: number;
  monthlyRevenue: number;
  totalRevenue: number;
  pendingPayments: number;
}

export default function PaymentsView() {
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<PaymentsStats | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');

  // Drilldown
  const [selectedPaymentForView, setSelectedPaymentForView] = useState<any | null>(null);

  const { toast } = useToast();

  const loadDoctors = async () => {
    try {
      const docs = await getDoctors();
      setDoctors(docs);
    } catch (err: any) {
      console.error('Error loading doctors:', err.message);
    }
  };

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      const res = await getPaymentsList({
        date: selectedDate,
        paymentMode: selectedMethod,
        paymentStatus: selectedStatus,
        doctorId: selectedDoctor
      });
      setPayments(res.payments);
      setStats(res.stats);
    } catch (err: any) {
      console.error('Error loading payments:', err.message);
      toast(err.message || 'Failed to query clinic payment ledgers', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    loadPayments();
  }, [selectedDate, selectedMethod, selectedStatus, selectedDoctor]);

  const renderSummaryCard = (label: string, value: string | number, icon: any, bg: string, text: string, desc: string) => {
    const Icon = icon;
    return (
      <View className="flex-1 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm justify-between gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-bold text-slate-500">{label}</Text>
          <View className={`p-2 rounded-xl ${bg}`}>
            <Icon className={`h-4 w-4 ${text}`} />
          </View>
        </View>
        <View>
          <Text className="text-xl font-black text-slate-900">{value}</Text>
          <Text className="text-[10px] text-slate-400 font-medium mt-0.5">{desc}</Text>
        </View>
      </View>
    );
  };

  return (
    <View className="gap-5 w-full">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-2">
          <Text className="text-xl font-black text-slate-900">Payments & Revenue Audit</Text>
          <Text className="text-xs text-slate-500 font-medium mt-0.5">Audit consultation collections, payment registers & pending balances</Text>
        </View>
      </View>

      {/* Summary Cards - Explicit 2x2 Grid without flex-wrap */}
      <View className="gap-3">
        <View className="flex-row gap-3">
          {renderSummaryCard("Today's Revenue", `₹${stats?.todayRevenue || 0}`, IndianRupee, 'bg-emerald-50', 'text-emerald-700', 'Receipts today')}
          {renderSummaryCard("Monthly Revenue", `₹${stats?.monthlyRevenue || 0}`, TrendingUp, 'bg-blue-50', 'text-blue-700', 'This month')}
        </View>
        <View className="flex-row gap-3">
          {renderSummaryCard("Total Revenue", `₹${stats?.totalRevenue || 0}`, FileCheck2, 'bg-indigo-50', 'text-indigo-700', 'Accumulated total')}
          {renderSummaryCard("Pending Collections", `₹${stats?.pendingPayments || 0}`, AlertCircle, 'bg-amber-50', 'text-amber-700', 'Awaiting payment')}
        </View>
      </View>

      {/* Filter Card - Explicit Rows without flex-wrap */}
      <View className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3">
        <View className="flex-row items-center justify-between border-b border-slate-100 pb-2.5">
          <View className="flex-row items-center gap-1.5">
            <CreditCard className="h-4 w-4 text-slate-600" />
            <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Audit Filters</Text>
          </View>
          <View className="flex-row items-center gap-2">
            {(selectedDate || selectedMethod || selectedStatus || selectedDoctor) ? (
              <TouchableOpacity
                onPress={() => {
                  setSelectedDate('');
                  setSelectedMethod('');
                  setSelectedStatus('');
                  setSelectedDoctor('');
                }}
                className="flex-row items-center gap-1 px-2.5 py-1 bg-rose-50 rounded-xl border border-rose-100"
              >
                <FilterX className="h-3 w-3 text-rose-600" />
                <Text className="text-[10px] font-black text-rose-600">Clear</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={loadPayments}
              className="flex-row items-center gap-1.5 px-3 py-1.5 bg-slate-100/80 rounded-xl active:bg-slate-200"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-700" />
              <Text className="text-xs font-black text-slate-700">Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Explicit Row 1: Date & Payment Mode */}
        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <Text className="text-[10px] font-bold text-slate-400 uppercase mb-1">Date (DD-MM-YYYY)</Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-200/70 rounded-2xl px-3 h-10">
              <Calendar className="h-3.5 w-3.5 text-slate-400 mr-2" />
              <TextInput
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="DD-MM-YYYY"
                className="flex-1 text-xs font-bold text-slate-800"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View className="flex-1">
            <Text className="text-[10px] font-bold text-slate-400 uppercase mb-1">Payment Mode</Text>
            <NativePicker
              value={selectedMethod}
              onValueChange={setSelectedMethod}
              placeholder="All methods"
              options={[
                { label: 'All methods', value: '' },
                { label: 'Cash', value: 'Cash' },
                { label: 'UPI', value: 'UPI' },
                { label: 'Card', value: 'Card' },
              ]}
            />
          </View>
        </View>

        {/* Explicit Row 2: Status & Doctor */}
        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <Text className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</Text>
            <NativePicker
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              placeholder="All Statuses"
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Paid', value: 'Paid' },
                { label: 'Pending', value: 'Pending' },
                { label: 'Refunded', value: 'Refund' },
              ]}
            />
          </View>

          <View className="flex-1">
            <Text className="text-[10px] font-bold text-slate-400 uppercase mb-1">Doctor</Text>
            <NativePicker
              value={selectedDoctor}
              onValueChange={setSelectedDoctor}
              placeholder="All Doctors"
              options={[
                { label: 'All Doctors', value: '' },
                ...doctors.map(d => ({ label: d.profiles?.full_name || 'Doctor', value: d.id }))
              ]}
            />
          </View>
        </View>
      </View>

      {/* Ledger List Cards */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Payment Receipts Ledger</Text>
          <Text className="text-xs font-bold text-cyan-600">{payments.length} receipts</Text>
        </View>

        {isLoading ? (
          <View className="p-10 bg-white rounded-3xl border border-slate-100 items-center justify-center">
            <ActivityIndicator size="small" color="#0891b2" />
            <Text className="text-xs font-bold text-slate-400 mt-2">Loading payment ledger...</Text>
          </View>
        ) : payments.length === 0 ? (
          <View className="p-12 bg-white rounded-3xl border border-slate-100 items-center justify-center text-center">
            <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mb-3">
              <Receipt className="h-6 w-6 text-slate-400" />
            </View>
            <Text className="text-sm font-black text-slate-800">No Payment Records Located</Text>
            <Text className="text-xs text-slate-400 font-medium mt-1 text-center">Try updating search parameters or verify receipt filters.</Text>
          </View>
        ) : (
          <View className="gap-3">
            {payments.map((pay) => {
              const visit = pay.invoices?.visits;
              const patName = visit?.patients ? `${visit.patients.first_name} ${visit.patients.last_name || ''}` : 'Patient';
              const docName = visit?.doctors?.profiles?.full_name || 'Doctor';

              return (
                <View 
                  key={pay.id} 
                  className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3"
                >
                  {/* Top Row: ID, Amount & Status */}
                  <View className="flex-row items-center justify-between border-b border-slate-100 pb-2.5">
                    <View className="flex-row items-center gap-2">
                      <View className="px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-100 items-center justify-center">
                        <Text className="text-sm font-black text-emerald-700">₹{pay.amount}</Text>
                      </View>
                      <View>
                        <Text className="text-xs font-mono font-bold text-slate-500">PAY-#{pay.id}</Text>
                        <Text className="text-[10px] text-slate-400 font-medium">{pay.payment_mode} • {visit?.visit_number || 'No visit'}</Text>
                      </View>
                    </View>

                    <View className={`px-2.5 py-1 rounded-xl border ${
                      pay.payment_status === 'Paid' 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                        : 'bg-amber-50 border-amber-100 text-amber-800'
                    }`}>
                      <Text className="text-[10px] font-black uppercase tracking-wide">{pay.payment_status}</Text>
                    </View>
                  </View>

                  {/* Middle Row: Patient & Doctor */}
                  <View className="gap-1.5">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-bold text-slate-400">Patient:</Text>
                      <Text className="text-xs font-black text-slate-900">{patName}</Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-bold text-slate-400">Doctor Assigned:</Text>
                      <Text className="text-xs font-bold text-slate-800">{docName}</Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-bold text-slate-400">Paid Timestamp:</Text>
                      <Text className="text-xs font-medium text-slate-600">
                        {pay.paid_at ? new Date(pay.paid_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Pending'}
                      </Text>
                    </View>
                  </View>

                  {/* Action Button */}
                  <View className="border-t border-slate-100 pt-2.5 flex-row justify-end">
                    <TouchableOpacity
                      onPress={() => setSelectedPaymentForView(pay)}
                      className="flex-row items-center gap-1.5 px-4 py-2 bg-slate-100/80 hover:bg-slate-200 rounded-xl active:bg-slate-200"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-700" />
                      <Text className="text-xs font-extrabold text-slate-800">View Receipt Stamp</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Inspect Payment Details Dialog */}
      <Dialog
        isOpen={Boolean(selectedPaymentForView)}
        onClose={() => setSelectedPaymentForView(null)}
        maxWidth="sm"
      >
        {selectedPaymentForView ? (
          <View className="gap-4">
            {/* Stamp logo */}
            <View className="items-center justify-center p-5 border border-dashed border-slate-200 rounded-3xl bg-slate-50/70">
              <Text className="text-slate-400 text-[10px] font-black tracking-wider uppercase mb-1">Receipt Stamp Voucher</Text>
              <Text className="font-mono text-slate-900 font-black text-lg">PAY-#{selectedPaymentForView.id}</Text>
              <Text className="text-emerald-600 font-black text-2xl mt-1">₹{selectedPaymentForView.amount}.00</Text>
              <View className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-xl mt-2.5">
                <Text className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">TRANSACTION AUDITED & PAID</Text>
              </View>
            </View>

            {/* Metadata breakdown */}
            <View className="gap-2.5">
              <View className="flex-row justify-between border-b border-slate-50 pb-2">
                <Text className="text-xs text-slate-400 font-bold">Invoice Reference</Text>
                <Text className="text-xs font-mono font-black text-slate-800">{selectedPaymentForView.invoices?.invoice_number}</Text>
              </View>
              <View className="flex-row justify-between border-b border-slate-50 pb-2">
                <Text className="text-xs text-slate-400 font-bold">Visit Ticket</Text>
                <Text className="text-xs font-mono font-black text-slate-800">{selectedPaymentForView.invoices?.visits?.visit_number}</Text>
              </View>
              <View className="flex-row justify-between border-b border-slate-50 pb-2">
                <Text className="text-xs text-slate-400 font-bold">Patient Enrolled</Text>
                <Text className="text-xs font-black text-slate-800">
                  {selectedPaymentForView.invoices?.visits?.patients?.first_name} {selectedPaymentForView.invoices?.visits?.patients?.last_name || ''}
                </Text>
              </View>
              <View className="flex-row justify-between border-b border-slate-50 pb-2">
                <Text className="text-xs text-slate-400 font-bold">Doctor Assigned</Text>
                <Text className="text-xs font-bold text-slate-800">
                  {selectedPaymentForView.invoices?.visits?.doctors?.profiles?.full_name}
                </Text>
              </View>
              <View className="flex-row justify-between border-b border-slate-50 pb-2">
                <Text className="text-xs text-slate-400 font-bold">Payment Mode</Text>
                <Text className="text-xs font-black text-cyan-700">{selectedPaymentForView.payment_mode}</Text>
              </View>
              <View className="flex-row justify-between border-b border-slate-50 pb-2">
                <Text className="text-xs text-slate-400 font-bold">Txn Reference</Text>
                <Text className="text-xs font-mono font-bold text-slate-800">{selectedPaymentForView.transaction_reference || 'DIRECT CASH'}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-slate-400 font-bold">Timestamp Audited</Text>
                <Text className="text-xs font-bold text-slate-800">
                  {selectedPaymentForView.paid_at ? new Date(selectedPaymentForView.paid_at).toLocaleString() : '—'}
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View className="border-t border-slate-100 pt-3 flex-row justify-end">
              <TouchableOpacity
                onPress={() => setSelectedPaymentForView(null)}
                className="px-5 py-2.5 bg-slate-100/80 hover:bg-slate-200 rounded-xl active:bg-slate-200"
              >
                <Text className="text-xs font-black text-slate-800">Dismiss Receipt</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </Dialog>
    </View>
  );
}
