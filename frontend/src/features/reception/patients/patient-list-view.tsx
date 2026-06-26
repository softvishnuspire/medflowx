'use client';

import React, { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { getPatientsList } from '@/services/reception';
import { Patient } from '@/types/reception';
import { useToast } from '@/components/ui/toast';
import { Search, Eye, CalendarPlus, UserCheck, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface PatientListViewProps {
  onViewProfile: (patientId: number) => void;
  onCreateVisit: (patient: Patient) => void;
}

export default function PatientListView({ onViewProfile, onCreateVisit }: PatientListViewProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Filter states
  const [filters, setFilters] = useState({
    code: '',
    name: '',
    phone: '',
    gender: 'All',
  });

  const [activeFilters, setActiveFilters] = useState({
    code: '',
    name: '',
    phone: '',
    gender: 'All',
  });

  const loadPatients = async (currentPage: number) => {
    try {
      setIsLoading(true);
      const res = await getPatientsList(activeFilters, currentPage, 10);
      setPatients(res.patients);
      setTotal(res.total);
      setPage(res.page);
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to load patient records', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients(1);
  }, [activeFilters]);

  // Handle pagination
  useEffect(() => {
    loadPatients(page);
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveFilters(filters);
    setPage(1);
  };

  const handleClearFilters = () => {
    const cleared = { code: '', name: '', phone: '', gender: 'All' };
    setFilters(cleared);
    setActiveFilters(cleared);
    setPage(1);
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-6 font-body text-zinc-700">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">Patient Records</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage and view registered patient profiles, or quickly schedule visits.</p>
      </div>

      {/* Filters Card */}
      <Card className="border border-zinc-150/70 shadow-sm bg-white rounded-xl">
        <CardContent className="p-6">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 font-heading">
              <Filter className="h-4 w-4 text-primary" />
              <span>Search Filters</span>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">Patient Code</label>
                <input
                  type="text"
                  placeholder="MED-2026-..."
                  value={filters.code}
                  onChange={(e) => setFilters((prev) => ({ ...prev, code: e.target.value }))}
                  className="w-full h-10 px-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-zinc-400"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">Patient Name</label>
                <input
                  type="text"
                  placeholder="First or last name..."
                  value={filters.name}
                  onChange={(e) => setFilters((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full h-10 px-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-zinc-400"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">Phone Number</label>
                <input
                  type="text"
                  placeholder="Mobile number..."
                  value={filters.phone}
                  onChange={(e) => setFilters((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full h-10 px-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-zinc-400"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 font-heading">Gender</label>
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters((prev) => ({ ...prev, gender: e.target.value }))}
                  className="w-full h-10 px-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer font-medium text-zinc-700"
                >
                  <option value="All">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClearFilters}
                className="h-9 px-4 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="submit"
                className="h-9 px-4 bg-cta hover:opacity-90 text-white rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="h-4 w-4" />
                Apply Filters
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Patients Table Card */}
      <Card className="border border-zinc-150/60 bg-white shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton cols={7} rows={6} />
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 mb-3">
                <UserCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-zinc-900 text-base font-heading">No patients found</h3>
              <p className="text-zinc-500 text-xs mt-1">Try modifying your search criteria or register a new patient profile.</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-50/50">
                  <TableRow className="border-b border-zinc-100 hover:bg-transparent">
                    <TableHead className="font-semibold text-zinc-650 font-heading">Patient Code</TableHead>
                    <TableHead className="font-semibold text-zinc-650 font-heading">Full Name</TableHead>
                    <TableHead className="font-semibold text-zinc-650 font-heading">Gender</TableHead>
                    <TableHead className="font-semibold text-zinc-650 font-heading">Age</TableHead>
                    <TableHead className="font-semibold text-zinc-650 font-heading">Phone</TableHead>
                    <TableHead className="font-semibold text-zinc-650 font-heading">District & State</TableHead>
                    <TableHead className="text-right font-semibold text-zinc-650 font-heading">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((p) => {
                    const addr = p.addresses && p.addresses[0];
                    const addressStr = addr 
                      ? `${addr.city}, ${addr.state}` 
                      : 'Not Provided';
                    return (
                      <TableRow key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50/40 transition-colors">
                        <TableCell className="font-mono text-xs font-semibold text-zinc-600">
                          {p.patient_code}
                        </TableCell>
                        <TableCell className="font-medium text-zinc-900">
                          {p.first_name} {p.last_name || ''}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            p.gender === 'Male' 
                              ? 'bg-cyan-50 text-cyan-700 border-cyan-100' 
                              : p.gender === 'Female' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                          }`}>
                            {p.gender}
                          </span>
                        </TableCell>
                        <TableCell className="text-zinc-600 font-medium">{p.age ?? 'N/A'}</TableCell>
                        <TableCell className="text-zinc-600 font-medium">{p.phone}</TableCell>
                        <TableCell className="text-zinc-500">{addressStr}</TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => onViewProfile(p.id)}
                              className="p-1.5 text-zinc-400 hover:text-primary rounded-lg hover:bg-cyan-50/80 transition-colors cursor-pointer"
                              title="View Profile"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onCreateVisit(p)}
                              className="p-1.5 text-zinc-400 hover:text-cta rounded-lg hover:bg-emerald-50/80 transition-colors cursor-pointer"
                              title="Create Visit"
                            >
                              <CalendarPlus className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination controls */}
              <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-xs text-zinc-500">
                  Showing <span className="font-semibold text-zinc-700">{patients.length}</span> of{' '}
                  <span className="font-semibold text-zinc-700">{total}</span> patient records
                </span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="p-2 border border-zinc-250/70 bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages || totalPages === 0}
                    className="p-2 border border-zinc-250/70 bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
