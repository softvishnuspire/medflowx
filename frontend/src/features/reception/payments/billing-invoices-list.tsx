'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/skeleton';
import { getPendingInvoices } from '@/services/reception';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Receipt, DollarSign } from 'lucide-react';

interface BillingInvoicesListProps {
  onSelectInvoice: (invoiceDetails: {
    visitId: number;
    invoiceId: number;
    amount: number;
    patientName: string;
    visitNumber: string;
  }) => void;
}

export default function BillingInvoicesList({ onSelectInvoice }: BillingInvoicesListProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await getPendingInvoices();
      setInvoices(data);
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to load pending invoices', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  return (
    <div className="space-y-6 font-body text-zinc-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">Pending Consultation Billing</h1>
          <p className="text-sm text-zinc-500 mt-1">Collect consultation payments for newly scheduled clinical visits.</p>
        </div>
        
        <button
          onClick={loadInvoices}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-50 hover:text-primary hover:border-primary/30 text-zinc-700 rounded-lg text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
        >
          Refresh Billing
        </button>
      </div>

      <Card className="border border-zinc-150/60 bg-white shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton cols={6} rows={5} />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 mb-3">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-zinc-900 text-base font-heading">No pending bills</h3>
              <p className="text-zinc-500 text-xs mt-1">All OPD visit consultation fees have been paid. No pending transactions.</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-50/50">
                  <TableRow className="border-b border-zinc-100 hover:bg-transparent">
                    <TableHead className="font-semibold text-zinc-650 font-heading">Invoice Code</TableHead>
                    <TableHead className="font-semibold text-zinc-650 font-heading">Patient Details</TableHead>
                    <TableHead className="font-semibold text-zinc-650 font-heading">Practitioner</TableHead>
                    <TableHead className="font-semibold text-zinc-650 font-heading">Total Fee</TableHead>
                    <TableHead className="font-semibold text-zinc-650 font-heading">Status</TableHead>
                    <TableHead className="text-right font-semibold text-zinc-650 font-heading">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => {
                    const patName = `${inv.patients?.first_name} ${inv.patients?.last_name || ''}`.trim();
                    const visitNum = inv.visits?.visit_number || 'OPD-VISIT';
                    return (
                      <TableRow key={inv.id} className="border-b border-zinc-100 hover:bg-zinc-50/40 transition-colors">
                        <TableCell className="font-mono text-xs font-semibold text-zinc-650">
                          {inv.invoice_number}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-zinc-900">{patName}</div>
                          <span className="text-[10px] text-zinc-400 font-mono font-semibold block mt-0.5">
                            {inv.patients?.patient_code} | {inv.patients?.phone}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-zinc-700 font-medium">
                          <div className="font-semibold text-zinc-800">{inv.visits?.doctors?.profiles?.full_name || 'Dr. Practitioner'}</div>
                          <span className="text-[10px] text-zinc-405 font-semibold font-heading block mt-0.5">
                            {inv.visits?.doctors?.departments?.department_name || 'General OPD'}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold text-zinc-900">
                          ₹{inv.final_amount}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border bg-red-50 border-red-100 text-red-700">
                            Unpaid
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cta hover:opacity-90 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                            onClick={() => onSelectInvoice({
                              visitId: inv.visit_id,
                              invoiceId: inv.id,
                              amount: Number(inv.final_amount),
                              patientName: patName,
                              visitNumber: visitNum,
                            })}
                          >
                            <DollarSign className="h-3.5 w-3.5" />
                            Collect Payment
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
