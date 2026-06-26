'use client';

import React, { useEffect, useState } from 'react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { getPaymentsList, getDoctors } from '@/services/admin';
import { Doctor } from '@/types/reception';
import { 
  Search, 
  Calendar, 
  CreditCard, 
  Eye, 
  IndianRupee, 
  RefreshCw,
  TrendingUp,
  Receipt,
  FileCheck2,
  AlertCircle
} from 'lucide-react';

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
      console.error(err);
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
      console.error(err);
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

  return (
    <div className="space-y-6 animate-slide-in text-zinc-705 font-body">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">Payments & Revenue Audit</h1>
          <p className="text-sm text-zinc-500 mt-1">Audit daily consultation collections, payment status registers, and pending balances.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-400 block font-heading">Today's Revenue</span>
              <h3 className="text-2xl font-bold text-zinc-800 tracking-tight mt-1">₹{stats?.todayRevenue || 0}</h3>
              <p className="text-[10px] text-zinc-400 mt-0.5">Clinical consultation receipts today</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-400 block font-heading">Monthly Revenue</span>
              <h3 className="text-2xl font-bold text-zinc-800 tracking-tight mt-1">₹{stats?.monthlyRevenue || 0}</h3>
              <p className="text-[10px] text-zinc-400 mt-0.5">Accumulated calendar month total</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-400 block font-heading">Total Revenue</span>
              <h3 className="text-2xl font-bold text-zinc-800 tracking-tight mt-1">₹{stats?.totalRevenue || 0}</h3>
              <p className="text-[10px] text-zinc-400 mt-0.5">Historical accumulated receipts</p>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
              <FileCheck2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-400 block font-heading">Pending Payments</span>
              <h3 className="text-2xl font-bold text-zinc-800 tracking-tight mt-1">₹{stats?.pendingPayments || 0}</h3>
              <p className="text-[10px] text-zinc-400 mt-0.5">Consultations awaiting collections</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase mr-1 font-heading">
              <CreditCard className="h-4 w-4" />
              <span>Audit filters</span>
            </div>

            {/* Date Input */}
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white focus:outline-none font-medium text-zinc-650 pl-8 cursor-pointer"
              />
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            </div>

            {/* Payment Mode Filter */}
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white focus:outline-none font-medium text-zinc-650 cursor-pointer"
            >
              <option value="">All payment methods</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>

            {/* Payment Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white focus:outline-none font-medium text-zinc-650 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Refund">Refunded</option>
            </select>

            {/* Doctor Filter */}
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white focus:outline-none font-medium text-zinc-650 max-w-[180px] cursor-pointer"
            >
              <option value="">All Doctors</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.profiles?.full_name}</option>
              ))}
            </select>

            {/* Reset */}
            {(selectedDate || selectedMethod || selectedStatus || selectedDoctor) && (
              <button
                onClick={() => {
                  setSelectedDate('');
                  setSelectedMethod('');
                  setSelectedStatus('');
                  setSelectedDoctor('');
                }}
                className="text-xs text-red-500 hover:text-red-700 font-bold transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={loadPayments}
            className="p-2 border border-zinc-200 rounded-lg bg-white text-zinc-500 hover:text-primary hover:border-primary/30 hover:bg-zinc-50 transition-colors shrink-0 cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 rounded-full border-4 border-zinc-200 border-t-primary animate-spin" />
            <span className="text-sm text-zinc-400">Loading collection database...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-16 text-center">
            <Receipt className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <h3 className="font-semibold text-zinc-800 text-sm font-heading">No payment records located</h3>
            <p className="text-zinc-500 text-xs mt-1">Try updating the search parameters or verify receipt numbers.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt ID</TableHead>
                <TableHead>Visit Number</TableHead>
                <TableHead>Patient Consulted</TableHead>
                <TableHead>Doctor Assigned</TableHead>
                <TableHead>Consult Fee</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((pay) => {
                const visit = pay.invoices?.visits;
                const patName = visit?.patients ? `${visit.patients.first_name} ${visit.patients.last_name || ''}` : 'Patient';
                const docName = visit?.doctors?.profiles?.full_name || 'Doctor';

                return (
                  <TableRow key={pay.id} className="hover:bg-zinc-50/50 transition-colors duration-150">
                    {/* Receipt ID */}
                    <TableCell className="font-mono text-xs font-semibold text-zinc-500">
                      PAY-#{pay.id}
                    </TableCell>

                    {/* Visit */}
                    <TableCell className="font-mono text-xs font-semibold text-zinc-900">
                      {visit?.visit_number || '—'}
                    </TableCell>

                    {/* Patient */}
                    <TableCell>
                      <div className="font-semibold text-zinc-800 text-sm">{patName}</div>
                      <span className="text-[10px] text-zinc-400 font-mono block">{visit?.patients?.patient_code}</span>
                    </TableCell>

                    {/* Doctor */}
                    <TableCell className="font-semibold text-zinc-700 text-sm">
                      {docName}
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="font-semibold text-emerald-650">
                      ₹{pay.amount}
                    </TableCell>

                    {/* Mode */}
                    <TableCell className="text-xs font-semibold text-zinc-700">
                      {pay.payment_mode}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        pay.payment_status === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {pay.payment_status}
                      </span>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-xs">
                      {pay.paid_at ? new Date(pay.paid_at).toLocaleString() : 'Pending'}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <button
                        onClick={() => setSelectedPaymentForView(pay)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-150 bg-white hover:bg-zinc-50 hover:text-primary hover:border-primary/30 text-zinc-700 font-semibold text-xs transition-all cursor-pointer"
                        title="View detailed transaction receipt"
                      >
                        <Eye className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Receipt</span>
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Inspect Payment Details Dialog */}
      <Dialog
        isOpen={Boolean(selectedPaymentForView)}
        onClose={() => setSelectedPaymentForView(null)}
        title="Transaction Audit Receipt"
        maxWidth="sm"
      >
        {selectedPaymentForView && (
          <div className="space-y-4 text-zinc-705 font-body">
            {/* Stamp logo */}
            <div className="flex flex-col items-center justify-center p-4 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
              <span className="text-zinc-400 text-[10px] font-bold tracking-wider uppercase mb-1 font-heading">Receipt Stamp ID</span>
              <h3 className="font-mono text-zinc-800 font-bold text-lg">PAY-#{selectedPaymentForView.id}</h3>
              <span className="text-emerald-600 font-bold text-xl mt-2 font-heading">₹{selectedPaymentForView.amount}.00</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-bold mt-2.5 font-heading">
                TRANSACTION AUDITED & PAID
              </span>
            </div>

            {/* Metadata breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-zinc-100 pb-1.5">
                <span className="text-zinc-400 font-medium">Invoice Reference</span>
                <span className="font-mono font-bold text-zinc-800">{selectedPaymentForView.invoices?.invoice_number}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-1.5">
                <span className="text-zinc-400 font-medium">Visit Ticket</span>
                <span className="font-mono font-bold text-zinc-800">{selectedPaymentForView.invoices?.visits?.visit_number}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-1.5">
                <span className="text-zinc-400 font-medium">Patient Enrolled</span>
                <span className="font-semibold text-zinc-800">
                  {selectedPaymentForView.invoices?.visits?.patients?.first_name} {selectedPaymentForView.invoices?.visits?.patients?.last_name || ''}
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-1.5">
                <span className="text-zinc-400 font-medium">Doctor assigned</span>
                <span className="font-semibold text-zinc-800">
                  {selectedPaymentForView.invoices?.visits?.doctors?.profiles?.full_name}
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-1.5">
                <span className="text-zinc-400 font-medium">Payment Mode</span>
                <span className="font-bold text-zinc-700">{selectedPaymentForView.payment_mode}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-1.5">
                <span className="text-zinc-400 font-medium">Txn Reference</span>
                <span className="font-mono font-semibold text-zinc-800">{selectedPaymentForView.transaction_reference || 'DIRECT CASH'}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-zinc-400 font-medium">Timestamp Audited</span>
                <span className="font-semibold text-zinc-800">
                  {selectedPaymentForView.paid_at ? new Date(selectedPaymentForView.paid_at).toLocaleString() : '—'}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-100 pt-4 flex justify-end">
              <button
                onClick={() => setSelectedPaymentForView(null)}
                className="px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 hover:text-primary hover:border-primary/30 text-zinc-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Dismiss Receipt
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
