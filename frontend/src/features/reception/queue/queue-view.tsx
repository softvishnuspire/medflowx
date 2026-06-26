'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/skeleton';
import { getTodayQueue } from '@/services/reception';
import { useToast } from '@/components/ui/toast';
import { Clock, Eye, Printer, AlertTriangle } from 'lucide-react';
import PrintTokenModal from '../visits/print-token-modal';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function QueueView() {
  const [queue, setQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Dialog and print states
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [printDetails, setPrintDetails] = useState<any | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const loadQueue = async () => {
    try {
      setIsLoading(true);
      const data = await getTodayQueue();
      setQueue(data);
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to load today\'s queue', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handlePrintClick = (v: any) => {
    setPrintDetails({
      visitNumber: v.visit_number,
      patientName: `${v.patients?.first_name} ${v.patients?.last_name || ''}`.trim(),
      tokenNumber: v.token_no,
      doctorName: v.doctors?.profiles?.full_name || 'Dr. Practitioner',
      departmentName: v.doctors?.departments?.department_name || 'OPD Service',
      visitDate: v.visit_date,
    });
    setIsPrintOpen(true);
  };

  const handleViewClick = (v: any) => {
    setSelectedVisit(v);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6 font-body text-zinc-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">Today's Live Queue</h1>
          <p className="text-sm text-zinc-500 mt-1">Real-time status updates of visits scheduled for today.</p>
        </div>
        
        <button
          onClick={loadQueue}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-50 hover:text-primary hover:border-primary/30 text-zinc-700 rounded-lg text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
        >
          Refresh Queue
        </button>
      </div>

      <Card className="border border-zinc-150/60 bg-white shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton cols={8} rows={6} />
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 mb-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-zinc-900 text-base font-heading">No active tokens</h3>
              <p className="text-zinc-500 text-xs mt-1">No visits scheduled for today. Use the Scheduler to create new visits.</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-50/50">
                  <TableRow className="border-b border-zinc-100 hover:bg-transparent">
                    <TableHead className="w-[120px] font-semibold text-zinc-650 font-heading">Token No</TableHead>
                    <TableHead className="font-semibold text-zinc-650 font-heading">Visit Number</TableHead>
                    <TableHead className="font-semibold text-zinc-650 font-heading">Patient Details</TableHead>
                    <TableHead className="font-semibold text-zinc-650 font-heading">Phone</TableHead>
                    <TableHead className="font-semibold text-zinc-650 font-heading">Department</TableHead>
                    <TableHead className="font-semibold text-zinc-650 font-heading">Practitioner</TableHead>
                    <TableHead className="font-semibold text-zinc-650 font-heading">Visit Status</TableHead>
                    <TableHead className="text-right font-semibold text-zinc-650 font-heading">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queue.map((v) => {
                    const statusColors = {
                      Created: 'bg-zinc-100 text-zinc-700 border-zinc-200',
                      Waiting: 'bg-cyan-50 text-cyan-700 border-cyan-100',
                      'In Progress': 'bg-amber-50 text-amber-700 border-amber-100',
                      Completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                      Cancelled: 'bg-red-50 text-red-700 border-red-100',
                    };

                    // Map postgres status details to the 4 requested UI statuses:
                    // Created/Waiting -> Waiting
                    // In Progress -> In Progress
                    // Prescribed/Dispensed/Closed -> Completed
                    // Cancelled -> Cancelled
                    let uiStatus: 'Waiting' | 'In Progress' | 'Completed' | 'Cancelled' = 'Waiting';
                    if (v.status === 'In Progress') {
                      uiStatus = 'In Progress';
                    } else if (['Prescribed', 'Dispensed', 'Closed'].includes(v.status)) {
                      uiStatus = 'Completed';
                    } else if (v.status === 'Cancelled') {
                      uiStatus = 'Cancelled';
                    }

                    const mappedColors = statusColors[uiStatus] || 'bg-zinc-100 text-zinc-700 border-zinc-200';

                    return (
                      <TableRow key={v.id} className="border-b border-zinc-100 hover:bg-zinc-50/40 transition-colors">
                        <TableCell className="font-mono text-base font-black text-primary px-6">
                          {v.token_no}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-zinc-650">
                          {v.visit_number}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-zinc-900">
                            {v.patients?.first_name} {v.patients?.last_name || ''}
                          </div>
                          <span className="text-[10px] text-zinc-405 font-mono font-semibold block mt-0.5">
                            {v.patients?.patient_code} | {v.patients?.gender}
                          </span>
                        </TableCell>
                        <TableCell className="text-zinc-600 text-xs font-medium">
                          {v.patients?.phone}
                        </TableCell>
                        <TableCell className="font-semibold text-zinc-800 text-xs font-heading">
                          {v.doctors?.departments?.department_name || 'General OPD'}
                        </TableCell>
                        <TableCell className="text-zinc-800 text-xs font-medium">
                          {v.doctors?.profiles?.full_name || 'Dr. Practitioner'}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${mappedColors}`}>
                            {uiStatus}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleViewClick(v)}
                              className="p-1.5 text-zinc-400 hover:text-primary rounded-lg hover:bg-cyan-50/80 transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handlePrintClick(v)}
                              className="p-1.5 text-zinc-400 hover:text-cta rounded-lg hover:bg-emerald-50/80 transition-colors cursor-pointer"
                              title="Print Token Slip"
                            >
                              <Printer className="h-4.5 w-4.5" />
                            </button>
                          </div>
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

      {/* Details View Modal */}
      <Dialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Visit Consultation Details"
        maxWidth="md"
        footer={
          <button
            onClick={() => setIsDetailOpen(false)}
            className="h-9 px-4 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Close Details
          </button>
        }
      >
        {selectedVisit && (
          <div className="space-y-4 font-body text-zinc-700">
            <div className="grid grid-cols-2 gap-4 border-b border-zinc-100 pb-4 text-sm bg-primary/5 p-4 rounded-xl border border-primary/10">
              <div>
                <span className="text-zinc-450 text-xs font-bold block font-heading">Patient Name</span>
                <span className="font-bold text-zinc-900">
                  {selectedVisit.patients?.first_name} {selectedVisit.patients?.last_name || ''}
                </span>
              </div>
              <div>
                <span className="text-zinc-450 text-xs font-bold block font-heading">Patient Code</span>
                <span className="font-mono text-zinc-700 font-bold">
                  {selectedVisit.patients?.patient_code}
                </span>
              </div>
              <div>
                <span className="text-zinc-450 text-xs font-bold block font-heading">Doctor Assigned</span>
                <span className="font-semibold text-zinc-800">
                  {selectedVisit.doctors?.profiles?.full_name}
                </span>
              </div>
              <div>
                <span className="text-zinc-450 text-xs font-bold block font-heading">Department</span>
                <span className="font-semibold text-zinc-800">
                  {selectedVisit.doctors?.departments?.department_name}
                </span>
              </div>
            </div>

            <div>
              <span className="text-zinc-500 font-bold text-xs uppercase tracking-wider block font-heading">Chief Complaint</span>
              <p className="mt-2 text-zinc-750 bg-white border border-zinc-200 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap shadow-xs">
                {selectedVisit.chief_complaint || 'No complaint notes entered.'}
              </p>
            </div>
            
            {selectedVisit.patients?.allergies && (
              <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl flex gap-2.5 items-start">
                <AlertTriangle className="h-4.5 w-4.5 text-red-650 shrink-0 mt-0.5" />
                <div>
                  <span className="text-red-700 font-bold text-xs block uppercase tracking-wide font-heading">Patient Allergies Warning</span>
                  <p className="text-red-650 text-xs mt-1 font-semibold leading-relaxed">{selectedVisit.patients.allergies}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Print Slip Modal */}
      <PrintTokenModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        visitDetails={printDetails}
      />
    </div>
  );
}
