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
import { 
  getVisitsList, 
  getDoctors, 
  getAdminDepartments 
} from '@/services/admin';
import { Visit, Doctor, Department } from '@/types/reception';
import { 
  Search, 
  Calendar, 
  Clock, 
  Eye, 
  Stethoscope, 
  Building2, 
  RefreshCw,
  SlidersHorizontal,
  FileSpreadsheet
} from 'lucide-react';

export default function VisitsView() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Selected visit for detailed dialog inspect
  const [selectedVisitForView, setSelectedVisitForView] = useState<any | null>(null);

  const { toast } = useToast();

  const loadLookups = async () => {
    try {
      const [docs, depts] = await Promise.all([
        getDoctors(),
        getAdminDepartments()
      ]);
      setDoctors(docs);
      setDepartments(depts);
    } catch (err: any) {
      console.error(err);
      toast('Failed to load filter directories', 'error');
    }
  };

  const loadVisits = async () => {
    try {
      setIsLoading(true);
      const data = await getVisitsList({
        doctorId: selectedDoctor,
        departmentId: selectedDept,
        date: selectedDate,
        status: selectedStatus
      });
      setVisits(data);
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to retrieve visits records', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    loadVisits();
  }, [selectedDoctor, selectedDept, selectedDate, selectedStatus]);

  return (
    <div className="space-y-6 animate-slide-in text-zinc-705 font-body">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">Clinical Visits Log</h1>
          <p className="text-sm text-zinc-500 mt-1">Audit and monitor every patient consultation, queue tickets, and statuses.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="flex items-center gap-1 text-xs font-semibold text-zinc-400 uppercase mr-1">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
            </div>

            {/* Doctor Filter */}
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white focus:outline-none font-medium text-zinc-650 max-w-[180px] cursor-pointer"
            >
              <option value="">All Doctors</option>
              {doctors.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.profiles?.full_name}</option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white focus:outline-none font-medium text-zinc-655 max-w-[180px] cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.department_name}</option>
              ))}
            </select>

            {/* Date Input */}
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white focus:outline-none font-medium text-zinc-655 pl-8 cursor-pointer"
              />
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white focus:outline-none font-medium text-zinc-655 max-w-[150px] cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Created">Created</option>
              <option value="Waiting">Waiting</option>
              <option value="In Progress">In Progress</option>
              <option value="Prescribed">Prescribed</option>
              <option value="Sent to Pharmacy">Sent to Pharmacy</option>
              <option value="Dispensed">Dispensed</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Reset */}
            {(selectedDoctor || selectedDept || selectedDate || selectedStatus) && (
              <button
                onClick={() => {
                  setSelectedDoctor('');
                  setSelectedDept('');
                  setSelectedDate('');
                  setSelectedStatus('');
                }}
                className="text-xs text-red-500 hover:text-red-700 font-bold transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          <button
            onClick={loadVisits}
            className="p-2 border border-zinc-200 rounded-lg bg-white text-zinc-500 hover:text-primary hover:border-primary/30 hover:bg-zinc-50 transition-colors shrink-0 cursor-pointer"
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
            <span className="text-sm text-zinc-400">Loading clinic visit logs...</span>
          </div>
        ) : visits.length === 0 ? (
          <div className="p-16 text-center">
            <FileSpreadsheet className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <h3 className="font-semibold text-zinc-800 text-sm font-heading">No visits matching search filters</h3>
            <p className="text-zinc-500 text-xs mt-1">Try updating the department, status, or consultation date.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visit Number</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Visit Date</TableHead>
                <TableHead>Token No</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.map((vis) => {
                const patName = vis.patients ? `${vis.patients.first_name} ${vis.patients.last_name || ''}` : 'Patient';
                const docName = vis.doctors?.profiles?.full_name || 'Doctor';
                const deptName = vis.doctors?.departments?.department_name || 'General';

                return (
                  <TableRow key={vis.id} className="hover:bg-zinc-50/50 transition-colors duration-150">
                    {/* Number */}
                    <TableCell className="font-mono text-xs font-semibold text-zinc-900">
                      {vis.visit_number}
                    </TableCell>

                    {/* Patient */}
                    <TableCell>
                      <div className="font-semibold text-zinc-800 text-sm">{patName}</div>
                      <span className="text-[10px] text-zinc-400 font-mono block">{vis.patients?.patient_code}</span>
                    </TableCell>

                    {/* Doctor */}
                    <TableCell className="font-semibold text-zinc-700 text-sm">
                      {docName}
                    </TableCell>

                    {/* Dept */}
                    <TableCell className="text-xs font-medium text-zinc-500">
                      {deptName}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-xs">
                      {new Date(vis.visit_date).toLocaleString()}
                    </TableCell>

                    {/* Token */}
                    <TableCell className="text-xs font-mono font-bold text-zinc-800">
                      #{vis.token_no}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ['Prescribed', 'Dispensed', 'Closed'].includes(vis.status)
                          ? 'bg-emerald-50 text-emerald-700'
                          : vis.status === 'Cancelled'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {vis.status}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <button
                        onClick={() => setSelectedVisitForView(vis)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-150 bg-white hover:bg-zinc-50 hover:text-primary hover:border-primary/30 text-zinc-700 font-semibold text-xs transition-all cursor-pointer"
                        title="View visit specifics"
                      >
                        <Eye className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Inspect</span>
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Inspect Visit Details Modal */}
      <Dialog
        isOpen={Boolean(selectedVisitForView)}
        onClose={() => setSelectedVisitForView(null)}
        title="Clinical Visit Summary"
        maxWidth="md"
      >
        {selectedVisitForView && (
          <div className="space-y-4 text-zinc-705 font-body">
            {/* Header info */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block font-heading">Visit Number</span>
                <span className="font-mono text-zinc-900 font-bold text-base">{selectedVisitForView.visit_number}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase font-heading ${
                ['Prescribed', 'Dispensed', 'Closed'].includes(selectedVisitForView.status)
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                {selectedVisitForView.status}
              </span>
            </div>

            {/* Visit properties */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
              <div>
                <span className="text-zinc-400 font-semibold uppercase block mb-0.5 font-heading">Patient Details</span>
                <span className="font-semibold text-zinc-800 text-sm">
                  {selectedVisitForView.patients?.first_name} {selectedVisitForView.patients?.last_name || ''}
                </span>
                <span className="block text-[10px] text-zinc-400 mt-0.5 font-mono">{selectedVisitForView.patients?.patient_code}</span>
              </div>

              <div>
                <span className="text-zinc-400 font-semibold uppercase block mb-0.5 font-heading">Doctor Consulted</span>
                <span className="font-semibold text-zinc-800 text-sm">
                  {selectedVisitForView.doctors?.profiles?.full_name || 'Dr. Practitioner'}
                </span>
                <span className="block text-[10px] text-zinc-400 mt-0.5">{selectedVisitForView.doctors?.qualification || 'MBBS'}</span>
              </div>

              <div>
                <span className="text-zinc-400 font-semibold uppercase block mb-0.5 font-heading">Assigned Department</span>
                <span className="font-medium text-zinc-800 text-sm flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                  {selectedVisitForView.doctors?.departments?.department_name || 'General Medicine'}
                </span>
              </div>

              <div>
                <span className="text-zinc-400 font-semibold uppercase block mb-0.5 font-heading">Token Queue Number</span>
                <span className="font-bold text-zinc-800 text-sm flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-zinc-400 animate-pulse" />
                  Queue ticket #{selectedVisitForView.token_no}
                </span>
              </div>

              <div>
                <span className="text-zinc-400 font-semibold uppercase block mb-0.5 font-heading">Visit Scheduled time</span>
                <span className="font-medium text-zinc-800">
                  {new Date(selectedVisitForView.visit_date).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-zinc-400 font-semibold uppercase block mb-0.5 font-heading">Department Consultation Fee</span>
                <span className="font-bold text-emerald-650 text-sm">
                  ₹{selectedVisitForView.doctors?.consultation_fee || 0}
                </span>
              </div>
            </div>

            {/* Chief Complaint */}
            <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-xl mt-3">
              <span className="block text-zinc-400 font-bold uppercase tracking-wider text-xs mb-1 font-heading">Chief Complaint</span>
              <p className="text-zinc-700 text-xs leading-relaxed font-semibold">
                {selectedVisitForView.chief_complaint || 'No symptoms reported during registration.'}
              </p>
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-100 pt-4 flex justify-end">
              <button
                onClick={() => setSelectedVisitForView(null)}
                className="px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 hover:text-primary hover:border-primary/30 text-zinc-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Close Summary
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
