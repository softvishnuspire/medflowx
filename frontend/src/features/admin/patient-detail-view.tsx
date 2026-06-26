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
import { getAdminPatientProfile } from '@/services/admin';
import { Patient, Visit, Payment } from '@/types/reception';
import { useToast } from '@/components/ui/toast';
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  PhoneCall, 
  Activity, 
  CalendarDays, 
  CreditCard,
  Lock
} from 'lucide-react';

interface PatientDetailViewProps {
  patientId: number;
  onBack: () => void;
}

export default function PatientDetailView({ patientId, onBack }: PatientDetailViewProps) {
  const [data, setData] = useState<{ patient: Patient; visits: any[]; payments: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const res = await getAdminPatientProfile(patientId);
      setData(res);
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to load patient history files', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [patientId]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-zinc-200 rounded-lg"></div>
          <div className="h-8 bg-zinc-200 rounded w-1/4"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="h-48 bg-zinc-150 rounded-xl md:col-span-2"></div>
          <div className="h-48 bg-zinc-150 rounded-xl"></div>
        </div>
        <div className="h-64 bg-zinc-150 rounded-xl"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-zinc-150">
        <span className="text-zinc-500 text-sm">Failed to retrieve profile record.</span>
        <button onClick={onBack} className="block mt-4 mx-auto text-emerald-600 hover:underline text-xs font-bold">
          Back to directory
        </button>
      </div>
    );
  }

  const { patient, visits, payments } = data;
  const address = patient.addresses && patient.addresses.length > 0 ? patient.addresses[0] : null;

  return (
    <div className="space-y-6 animate-slide-in text-zinc-705 font-body">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-550 hover:text-primary hover:border-primary/30 bg-white border border-zinc-200 px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer hover:scale-[1.01]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Directory</span>
        </button>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-bold font-heading">
          <Lock className="h-3 w-3" />
          ADMIN PRIVILEGE BOUNDARY: READ ONLY
        </span>
      </div>

      {/* Grid Layout - Personal Info */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Card 1: Personal Profile */}
        <Card className="md:col-span-2 border border-zinc-150/60 bg-white rounded-xl shadow-xs">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2 font-heading">
              <User className="h-4.5 w-4.5 text-zinc-400" />
              Personal details
            </h3>
            
            <div className="grid grid-cols-2 gap-y-4 text-xs">
              <div>
                <span className="text-zinc-400 font-semibold uppercase tracking-wider block mb-0.5">Patient Code</span>
                <span className="font-semibold text-zinc-900 font-mono text-[13px]">{patient.patient_code}</span>
              </div>
              <div>
                <span className="text-zinc-400 font-semibold uppercase tracking-wider block mb-0.5">Full Name</span>
                <span className="font-bold text-zinc-900 text-[13px]">{patient.first_name} {patient.last_name || ''}</span>
              </div>
              <div>
                <span className="text-zinc-400 font-semibold uppercase tracking-wider block mb-0.5">Gender / Age</span>
                <span className="font-medium text-zinc-800 text-[13px]">{patient.gender} • {patient.age ? `${patient.age} years` : '—'}</span>
              </div>
              <div>
                <span className="text-zinc-400 font-semibold uppercase tracking-wider block mb-0.5">Blood Group</span>
                <span className="font-medium text-zinc-800 text-[13px]">
                  {patient.blood_group ? (
                    <span className="px-2 py-0.5 bg-red-50 text-red-700 font-bold border border-red-100 rounded text-[10px]">
                      {patient.blood_group}
                    </span>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 font-semibold uppercase tracking-wider block mb-0.5">Email</span>
                <span className="font-medium text-zinc-800 text-[13px] break-all">{patient.email || '—'}</span>
              </div>
              <div>
                <span className="text-zinc-400 font-semibold uppercase tracking-wider block mb-0.5">Occupation</span>
                <span className="font-medium text-zinc-800 text-[13px]">{patient.occupation || '—'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Contact & Address */}
        <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-xs">
          <CardContent className="p-6 space-y-5">
            {/* Contact numbers */}
            <div>
              <h3 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-2 mb-3 flex items-center gap-2 font-heading">
                <PhoneCall className="h-4 w-4 text-zinc-400" />
                Contact Info
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-zinc-400 font-semibold block mb-0.5">Primary Phone</span>
                  <span className="font-semibold text-zinc-800 text-[13px]">{patient.phone}</span>
                </div>
                <div>
                  <span className="text-zinc-400 font-semibold block mb-0.5">Emergency Contact</span>
                  <span className="font-medium text-zinc-800 text-[13px]">{patient.emergency_contact || '—'}</span>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-2 mb-3 flex items-center gap-2 font-heading">
                <MapPin className="h-4 w-4 text-zinc-400" />
                Primary Address
              </h3>
              {address ? (
                <div className="text-xs text-zinc-650 space-y-1">
                  <p className="font-semibold text-zinc-850">{address.address_line}</p>
                  <p>{address.city}, {address.district ? `${address.district}, ` : ''}{address.state}</p>
                  <p>{address.country} — {address.pincode}</p>
                </div>
              ) : (
                <span className="text-xs text-zinc-400 italic">No address registered.</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medical History (Read Only Warnings) */}
      <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-xs">
        <CardContent className="p-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
            <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2 font-heading">
              <Activity className="h-4.5 w-4.5 text-zinc-400" />
              Medical History Profile
            </h3>
            <span className="px-2 py-0.5 bg-red-50 text-red-655 rounded text-[9px] font-bold border border-red-100 font-heading">
              EDIT DISABLED
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 text-xs">
            <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-xl hover:shadow-xs transition-shadow">
              <span className="text-zinc-400 font-bold uppercase tracking-wider block mb-1 font-heading">Known Allergies</span>
              <p className="text-zinc-700 font-semibold leading-relaxed">
                {patient.allergies || 'No known allergies reported.'}
              </p>
            </div>
            
            <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-xl hover:shadow-xs transition-shadow">
              <span className="text-zinc-400 font-bold uppercase tracking-wider block mb-1 font-heading">Chronic History</span>
              <p className="text-zinc-700 font-semibold leading-relaxed">
                {patient.medical_history || 'No chronic records registered.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visits Log */}
      <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2 font-heading">
            <CalendarDays className="h-4.5 w-4.5 text-zinc-400" />
            Clinical Visits Log ({visits.length})
          </h3>
        </div>
        
        {visits.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400 italic bg-white">No historical visits logged.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visit Number</TableHead>
                <TableHead>Doctor Consulted</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Token No</TableHead>
                <TableHead>Visit Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.map((vis) => {
                const docName = vis.doctors?.profiles?.full_name || 'Doctor';
                const deptName = vis.doctors?.departments?.department_name || 'General';
                return (
                  <TableRow key={vis.id} className="hover:bg-zinc-50/50 transition-colors duration-150">
                    <TableCell className="font-mono text-xs font-semibold text-zinc-900">{vis.visit_number}</TableCell>
                    <TableCell className="font-semibold text-zinc-800">{docName}</TableCell>
                    <TableCell className="text-xs">{deptName}</TableCell>
                    <TableCell className="text-xs font-mono font-medium">{vis.token_no}</TableCell>
                    <TableCell className="text-xs">{new Date(vis.visit_date).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-700">
                        {vis.status}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Payments Log */}
      <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2 font-heading">
            <CreditCard className="h-4.5 w-4.5 text-zinc-400" />
            Consultation Billing & Payments Log ({payments.length})
          </h3>
        </div>
        
        {payments.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400 italic bg-white">No payments collected.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt ID</TableHead>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Consultation Fee</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((pay) => (
                <TableRow key={pay.id} className="hover:bg-zinc-50/50 transition-colors duration-150">
                  <TableCell className="font-mono text-xs font-semibold text-zinc-500">PAY-#{pay.id}</TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-zinc-900">
                    {pay.invoices?.invoice_number || '—'}
                  </TableCell>
                  <TableCell className="font-semibold text-emerald-600">₹{pay.amount}</TableCell>
                  <TableCell className="text-xs font-semibold text-zinc-700">{pay.payment_mode}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      pay.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {pay.payment_status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">
                    {pay.paid_at ? new Date(pay.paid_at).toLocaleString() : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
