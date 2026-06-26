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
import { getPatientsList } from '@/services/admin';
import { Patient } from '@/types/reception';
import { useToast } from '@/components/ui/toast';
import { Search, Eye, ClipboardList, RefreshCw } from 'lucide-react';

interface PatientsViewProps {
  onViewProfile: (patientId: number) => void;
}

export default function PatientsView({ onViewProfile }: PatientsViewProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const data = await getPatientsList(search);
      setPatients(data);
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to fetch patient records', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6 animate-slide-in text-zinc-705 font-body">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">Patient Directory</h1>
          <p className="text-sm text-zinc-500 mt-1">Read-only listing of all patients enrolled in the clinic database.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-xs">
        <CardContent className="p-4 flex gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by Code, Phone or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-zinc-400"
            />
          </div>

          <button
            onClick={loadPatients}
            className="p-2 border border-zinc-200 rounded-lg bg-white text-zinc-500 hover:text-primary hover:border-primary/30 hover:bg-zinc-50 transition-colors cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 rounded-full border-4 border-zinc-200 border-t-primary animate-spin" />
            <span className="text-sm text-zinc-400">Loading patient records...</span>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-16 text-center">
            <ClipboardList className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <h3 className="font-semibold text-zinc-800 text-sm font-heading">No patient profiles found</h3>
            <p className="text-zinc-500 text-xs mt-1">Make sure the query matches clinic codes or contact details.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Gender / Age</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((pat) => (
                <TableRow key={pat.id} className="hover:bg-zinc-50/50 transition-colors duration-150">
                  {/* Code */}
                  <TableCell className="font-semibold text-zinc-900 font-mono text-xs">
                    {pat.patient_code}
                  </TableCell>

                  {/* Name */}
                  <TableCell className="font-semibold text-zinc-800">
                    {pat.first_name} {pat.last_name || ''}
                  </TableCell>

                  {/* Gender / Age */}
                  <TableCell className="text-xs">
                    {pat.gender} • {pat.age ? `${pat.age} yrs` : '—'}
                  </TableCell>

                  {/* Phone */}
                  <TableCell className="text-xs font-medium">
                    {pat.phone}
                  </TableCell>

                  {/* Blood Group */}
                  <TableCell>
                    {pat.blood_group ? (
                      <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-bold border border-red-100">
                        {pat.blood_group}
                      </span>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </TableCell>

                  {/* Last Visit */}
                  <TableCell className="text-xs text-zinc-500">
                    {pat.dob ? ( // We mapped last visit date to dob field temporarily in service helper
                      <span>{new Date(pat.dob).toLocaleDateString()}</span>
                    ) : (
                      <span className="text-zinc-300">No visits recorded</span>
                    )}
                  </TableCell>

                  {/* Created Date */}
                  <TableCell className="text-xs text-zinc-400">
                    {new Date(pat.created_at).toLocaleDateString()}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <button
                      onClick={() => onViewProfile(pat.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-150 bg-white hover:bg-zinc-50 hover:text-primary hover:border-primary/30 text-zinc-700 font-semibold text-xs transition-all cursor-pointer"
                      title="Inspect patient profile"
                    >
                      <Eye className="h-3.5 w-3.5 text-zinc-400" />
                      <span>View Profile</span>
                    </button>
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
