'use client';

import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface PrintTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitDetails: {
    clinicName?: string;
    visitNumber: string;
    patientName: string;
    tokenNumber: number;
    doctorName: string;
    departmentName: string;
    visitDate: string;
  } | null;
}

export default function PrintTokenModal({ isOpen, onClose, visitDetails }: PrintTokenModalProps) {
  if (!visitDetails) return null;

  const handlePrint = () => {
    window.print();
  };

  const {
    clinicName = 'MedflowX Family Clinic',
    visitNumber,
    patientName,
    tokenNumber,
    doctorName,
    departmentName,
    visitDate,
  } = visitDetails;

  const formattedDate = new Date(visitDate).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Print Visit Token Slip"
      maxWidth="sm"
      footer={
        <div className="flex gap-2 w-full justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrint}>
            <Printer className="h-4.5 w-4.5 mr-1.5" />
            Print Token
          </Button>
        </div>
      }
    >
      {/* Print Slip Container */}
      <div className="flex flex-col items-center justify-center p-4">
        {/* Token Slip Card (Outer box target for CSS @media print styling) */}
        <div id="print-slip" className="w-[300px] border border-zinc-200 p-6 rounded-lg bg-zinc-50/20 text-zinc-800 space-y-4 shadow-sm print:shadow-none print:border-none print:w-full print:p-0">
          <div className="text-center border-b border-dashed border-zinc-200 pb-3">
            <h2 className="text-sm font-extrabold text-zinc-950 uppercase tracking-wide">{clinicName}</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5">OPD VISIT SLIP</p>
          </div>

          {/* Large Token display */}
          <div className="text-center py-2 border-b border-dashed border-zinc-200">
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Token Number</span>
            <span className="text-5xl font-extrabold text-zinc-950 tracking-tight block mt-1">{tokenNumber}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-400">Visit Code:</span>
              <span className="font-mono font-bold text-zinc-850">{visitNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Patient:</span>
              <span className="font-semibold text-zinc-800">{patientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Department:</span>
              <span className="font-semibold text-zinc-800">{departmentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Consultant:</span>
              <span className="font-semibold text-zinc-800">{doctorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Date/Time:</span>
              <span className="text-zinc-800 font-medium">{formattedDate}</span>
            </div>
          </div>

          {/* Stylized Mock QR Code */}
          <div className="flex flex-col items-center justify-center pt-2 border-t border-dashed border-zinc-200">
            <div className="p-2 border border-zinc-200 roundedbg-white bg-white">
              <svg className="h-20 w-20 text-zinc-900" viewBox="0 0 24 24" fill="currentColor">
                {/* Visual grid layout representing a QR code */}
                <rect x="0" y="0" width="6" height="6" />
                <rect x="1" y="1" width="4" height="4" fill="white" />
                <rect x="2" y="2" width="2" height="2" />
                
                <rect x="18" y="0" width="6" height="6" />
                <rect x="19" y="1" width="4" height="4" fill="white" />
                <rect x="20" y="2" width="2" height="2" />
                
                <rect x="0" y="18" width="6" height="6" />
                <rect x="1" y="18" width="4" height="4" fill="white" />
                <rect x="2" y="19" width="2" height="2" />
                
                {/* Random blocks */}
                <rect x="8" y="2" width="2" height="2" />
                <rect x="11" y="1" width="1" height="3" />
                <rect x="14" y="3" width="2" height="1" />
                <rect x="9" y="8" width="4" height="2" />
                <rect x="15" y="7" width="2" height="4" />
                <rect x="8" y="13" width="3" height="3" />
                <rect x="13" y="15" width="2" height="2" />
                <rect x="18" y="9" width="3" height="2" />
                <rect x="21" y="13" width="2" height="4" />
                <rect x="18" y="19" width="3" height="3" />
              </svg>
            </div>
            <span className="text-[8px] text-zinc-400 mt-2">Scan at doctor desk to retrieve EHR</span>
          </div>
        </div>
      </div>

      {/* CSS stylesheet injected for printing formatting */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-slip, #print-slip * {
            visibility: visible;
          }
          #print-slip {
            position: absolute;
            left: 50%;
            top: 10%;
            transform: translateX(-50%);
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            background: white !important;
          }
        }
      `}</style>
    </Dialog>
  );
}
