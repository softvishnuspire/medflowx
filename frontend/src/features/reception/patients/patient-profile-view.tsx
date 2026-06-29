'use client';

import React, { useEffect, useState } from 'react';
import { getPatientById } from '@/services/reception';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Patient } from '@/types/reception';
import { useToast } from '@/components/ui/toast';
import { 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  CalendarDays, 
  ArrowLeft, 
  CalendarPlus 
} from 'lucide-react';

interface PatientProfileViewProps {
  patientId: number;
  onBack: () => void;
  onCreateVisit: (patient: Patient) => void;
}

export default function PatientProfileView({ patientId, onBack, onCreateVisit }: PatientProfileViewProps) {
  const [data, setData] = useState<{ patient: Patient; visits: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadPatientProfile = async () => {
    try {
      setIsLoading(true);
      const res = await getPatientById(patientId);
      setData(res);
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to load patient profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatientProfile();
  }, [patientId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 md:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 font-body">
        <p className="text-zinc-500 text-sm">Patient profile not found.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { patient, visits } = data;
  const address = patient.addresses && patient.addresses[0];

  return (
    <div className="space-y-6 font-body text-zinc-700">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 border border-zinc-250/70 hover:bg-zinc-50 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">
                {patient.first_name} {patient.last_name || ''}
              </h1>
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-650">
                {patient.patient_code}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Patient registered on {new Date(patient.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div>
          <button
            onClick={() => onCreateVisit(patient)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-cta hover:opacity-90 text-white rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            <CalendarPlus className="h-4.5 w-4.5" />
            Create OP Visit
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Personal & Contact Details Card */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-zinc-150/70 shadow-sm bg-white rounded-xl">
            <CardContent className="p-6 space-y-6">
              {/* Personal details */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2 font-heading">
                  <User className="h-4.5 w-4.5 text-primary" />
                  <span>Personal Details</span>
                </h3>
                <div className="grid gap-y-4 gap-x-6 sm:grid-cols-2 mt-4 text-sm">
                  <div>
                    <span className="block text-zinc-400 text-xs font-medium font-heading">Gender</span>
                    <span className="text-zinc-800 font-semibold">{patient.gender}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-400 text-xs font-medium font-heading">Date of Birth</span>
                    <span className="text-zinc-800 font-semibold">
                      {patient.dob ? new Date(patient.dob).toLocaleDateString() : 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-zinc-400 text-xs font-medium font-heading">Age</span>
                    <span className="text-zinc-800 font-semibold">{patient.age ?? 'N/A'} years</span>
                  </div>
                  <div>
                    <span className="block text-zinc-400 text-xs font-medium font-heading">Blood Group</span>
                    <span className="text-zinc-800 font-semibold">{patient.blood_group || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Contact details */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2 font-heading">
                  <Phone className="h-4.5 w-4.5 text-primary" />
                  <span>Contact Details</span>
                </h3>
                <div className="grid gap-y-4 gap-x-6 sm:grid-cols-2 mt-4 text-sm">
                  <div>
                    <span className="block text-zinc-400 text-xs font-medium font-heading">Phone Number</span>
                    <span className="text-zinc-800 font-semibold">{patient.phone}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-400 text-xs font-medium font-heading">Email Address</span>
                    <span className="text-zinc-800 font-semibold">{patient.email || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-400 text-xs font-medium font-heading">Emergency Contact</span>
                    <span className="text-zinc-800 font-semibold">{patient.emergency_contact || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-400 text-xs font-medium font-heading">Occupation</span>
                    <span className="text-zinc-800 font-semibold">{patient.occupation || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Address details */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2 font-heading">
                  <MapPin className="h-4.5 w-4.5 text-primary" />
                  <span>Address Information</span>
                </h3>
                <div className="mt-4 text-sm">
                  {address ? (
                    <div className="grid gap-y-4 gap-x-6 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <span className="block text-zinc-400 text-xs font-medium font-heading">Street Address</span>
                        <span className="text-zinc-800 font-semibold">{address.address_line}</span>
                      </div>
                      <div>
                        <span className="block text-zinc-400 text-xs font-medium font-heading">City & District</span>
                        <span className="text-zinc-800 font-semibold">
                          {address.city}
                          {address.district ? `, ${address.district}` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="block text-zinc-400 text-xs font-medium font-heading">State & Country</span>
                        <span className="text-zinc-800 font-semibold">{address.state}, {address.country}</span>
                      </div>
                      <div>
                        <span className="block text-zinc-400 text-xs font-medium font-heading">Pincode</span>
                        <span className="text-zinc-800 font-semibold font-mono">{address.pincode}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-zinc-500">No address details configured.</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Medical History Sidebar */}
        <div className="space-y-6">
          <Card className="bg-primary/5 border border-primary/10 rounded-xl shadow-xs">
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 border-b border-primary/10 pb-2 flex items-center gap-2 font-heading">
                  <FileText className="h-4.5 w-4.5 text-primary" />
                  <span>Medical Information</span>
                </h3>
                
                <div className="mt-4 space-y-4 text-sm">
                  <div>
                    <span className="block text-red-650 font-bold text-xs uppercase tracking-wider font-heading">Known Allergies</span>
                    <p className="text-zinc-700 bg-white border border-zinc-150/70 p-3 rounded-lg mt-1 min-h-[60px] text-xs shadow-xs leading-relaxed font-semibold">
                      {patient.allergies || 'No known allergies reported.'}
                    </p>
                  </div>
                  
                  <div>
                    <span className="block text-zinc-500 font-bold text-xs uppercase tracking-wider font-heading">Medical History</span>
                    <p className="text-zinc-700 bg-white border border-zinc-150/70 p-3 rounded-lg mt-1 min-h-[80px] text-xs shadow-xs leading-relaxed">
                      {patient.medical_history || 'No medical conditions reported.'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Clinical Visits Table */}
      <Card className="border border-zinc-150/60 bg-white shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2 font-heading">
            <CalendarDays className="h-4.5 w-4.5 text-primary" />
            <span>Visit History</span>
          </h3>

          {visits.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-zinc-200 rounded-lg">
              <span className="text-zinc-400 text-xs font-medium">No visit history found for this patient.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50/50">
                  <TableRow className="border-b border-zinc-100 hover:bg-transparent">
                    <TableHead className="font-semibold text-zinc-650 font-heading">Visit Number</TableHead>
                    <TableHead className="font-semibold text-zinc-650 font-heading">Department</TableHead>
                    <TableHead className="font-semibold text-zinc-650 font-heading">Doctor</TableHead>
                    <TableHead className="font-semibold text-zinc-650 font-heading">Visit Date</TableHead>
                    <TableHead className="font-semibold text-zinc-650 font-heading">Token No</TableHead>
                    <TableHead className="font-semibold text-zinc-650 font-heading">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.map((v) => {
                    const statusColors = {
                      Created: 'bg-zinc-100 text-zinc-700',
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

                    const mappedColors = statusColors[uiStatus] || 'bg-zinc-100 text-zinc-700';

                    return (
                      <TableRow key={v.id} className="border-b border-zinc-100 hover:bg-zinc-50/40 transition-colors">
                        <TableCell className="font-mono text-xs font-semibold text-zinc-650">
                          {v.visit_number}
                        </TableCell>
                        <TableCell className="font-medium text-zinc-800">
                          {v.doctors?.departments?.department_name || 'General Medicine'}
                        </TableCell>
                        <TableCell className="text-zinc-800 font-medium">
                          {v.doctors?.profiles?.full_name || 'Unknown Doctor'}
                        </TableCell>
                        <TableCell className="text-zinc-600 font-medium">
                          {new Date(v.visit_date).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-zinc-700 font-bold">{v.token_no}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${mappedColors}`}>
                            {uiStatus}
                          </span>
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
