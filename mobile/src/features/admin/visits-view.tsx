import React, { useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { 
  getVisitsList, 
  getDoctors, 
  getAdminDepartments 
} from '@/services/admin';
import { Visit, Doctor, Department } from '@/types/reception';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { NativePicker } from '@/components/ui/native-picker';
import {
  Calendar, 
  Clock, 
  Eye, 
  Building2, 
  RefreshCw,
  SlidersHorizontal,
  FileSpreadsheet,
  UserCheck,
  Stethoscope,
  FilterX
} from 'lucide-react-native';

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
      console.error('Error loading lookups:', err.message);
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
      console.error('Error loading visits:', err.message);
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
    <View className="gap-5 w-full">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-2">
          <Text className="text-xl font-black text-slate-900">Clinical Visits Log</Text>
          <Text className="text-xs text-slate-500 font-medium mt-0.5">Audit and monitor patient consultations, queue tokens & statuses</Text>
        </View>
      </View>

      {/* Filter Cards - Explicit 2-Row Stack without flex-wrap */}
      <View className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3">
        <View className="flex-row items-center justify-between border-b border-slate-100 pb-2.5">
          <View className="flex-row items-center gap-1.5">
            <SlidersHorizontal className="h-4 w-4 text-slate-600" />
            <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Filter Visits Directory</Text>
          </View>
          <View className="flex-row items-center gap-2">
            {(selectedDoctor || selectedDept || selectedDate || selectedStatus) ? (
              <TouchableOpacity
                onPress={() => {
                  setSelectedDoctor('');
                  setSelectedDept('');
                  setSelectedDate('');
                  setSelectedStatus('');
                }}
                className="flex-row items-center gap-1 px-2.5 py-1 bg-rose-50 rounded-xl border border-rose-100"
              >
                <FilterX className="h-3 w-3 text-rose-600" />
                <Text className="text-[10px] font-black text-rose-600">Clear</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={loadVisits}
              className="flex-row items-center gap-1.5 px-3 py-1.5 bg-slate-100/80 rounded-xl active:bg-slate-200"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-700" />
              <Text className="text-xs font-black text-slate-700">Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Explicit Row 1: Doctor & Department */}
        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <Text className="text-[10px] font-bold text-slate-400 uppercase mb-1">Doctor</Text>
            <NativePicker
              value={selectedDoctor}
              onValueChange={setSelectedDoctor}
              placeholder="All Doctors"
              options={[
                { label: 'All Doctors', value: '' },
                ...doctors.map(doc => ({ label: doc.profiles?.full_name || 'Doctor', value: doc.id }))
              ]}
            />
          </View>

          <View className="flex-1">
            <Text className="text-[10px] font-bold text-slate-400 uppercase mb-1">Department</Text>
            <NativePicker
              value={selectedDept}
              onValueChange={setSelectedDept}
              placeholder="All Departments"
              options={[
                { label: 'All Departments', value: '' },
                ...departments.map(d => ({ label: d.department_name, value: d.id }))
              ]}
            />
          </View>
        </View>

        {/* Explicit Row 2: Visit Date & Status */}
        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <Text className="text-[10px] font-bold text-slate-400 uppercase mb-1">Visit Date (YYYY-MM-DD)</Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-200/70 rounded-2xl px-3 h-10">
              <Calendar className="h-3.5 w-3.5 text-slate-400 mr-2" />
              <TextInput
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="All Dates"
                className="flex-1 text-xs font-bold text-slate-800"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View className="flex-1">
            <Text className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</Text>
            <NativePicker
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              placeholder="All Statuses"
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Created', value: 'Created' },
                { label: 'Waiting', value: 'Waiting' },
                { label: 'In Progress', value: 'In Progress' },
                { label: 'Prescribed', value: 'Prescribed' },
                { label: 'Sent to Pharmacy', value: 'Sent to Pharmacy' },
                { label: 'Dispensed', value: 'Dispensed' },
                { label: 'Closed', value: 'Closed' },
                { label: 'Cancelled', value: 'Cancelled' },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Visits List Cards */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Clinical Visit Logs</Text>
          <Text className="text-xs font-bold text-cyan-600">{visits.length} records</Text>
        </View>

        {isLoading ? (
          <View className="p-10 bg-white rounded-3xl border border-slate-100 items-center justify-center">
            <ActivityIndicator size="small" color="#0891b2" />
            <Text className="text-xs font-bold text-slate-400 mt-2">Loading clinic visit logs...</Text>
          </View>
        ) : visits.length === 0 ? (
          <View className="p-12 bg-white rounded-3xl border border-slate-100 items-center justify-center text-center">
            <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mb-3">
              <FileSpreadsheet className="h-6 w-6 text-slate-400" />
            </View>
            <Text className="text-sm font-black text-slate-800">No Visits Matching Filters</Text>
            <Text className="text-xs text-slate-400 font-medium mt-1 text-center">Try updating the department, status, or consultation date.</Text>
          </View>
        ) : (
          <View className="gap-3">
            {visits.map((vis) => {
              const patName = vis.patients ? `${vis.patients.first_name} ${vis.patients.last_name || ''}` : 'Patient';
              const docName = vis.doctors?.profiles?.full_name || 'Doctor';
              const deptName = vis.doctors?.departments?.department_name || 'General';

              let statusBg = 'bg-amber-50 border-amber-100 text-amber-800';
              if (['Prescribed', 'Dispensed', 'Closed'].includes(vis.status)) {
                statusBg = 'bg-emerald-50 border-emerald-100 text-emerald-800';
              } else if (vis.status === 'Cancelled') {
                statusBg = 'bg-rose-50 border-rose-100 text-rose-800';
              } else if (vis.status === 'In Progress') {
                statusBg = 'bg-blue-50 border-blue-100 text-blue-800';
              }

              return (
                <View 
                  key={vis.id} 
                  className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3"
                >
                  {/* Top Row: Token, Number & Status */}
                  <View className="flex-row items-center justify-between border-b border-slate-100 pb-2.5">
                    <View className="flex-row items-center gap-2">
                      <View className="w-9 h-9 rounded-2xl bg-cyan-50 border border-cyan-100 items-center justify-center">
                        <Text className="text-xs font-black text-cyan-800">#{vis.token_no}</Text>
                      </View>
                      <View>
                        <Text className="text-xs font-mono font-bold text-slate-500">{vis.visit_number}</Text>
                        <Text className="text-[10px] text-slate-400 font-medium">{new Date(vis.visit_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</Text>
                      </View>
                    </View>

                    <View className={`px-2.5 py-1 rounded-xl border ${statusBg}`}>
                      <Text className="text-[10px] font-black uppercase tracking-wide">{vis.status}</Text>
                    </View>
                  </View>

                  {/* Middle Row: Patient & Doctor Info */}
                  <View className="gap-1.5">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                        <Text className="text-xs font-bold text-slate-400">Patient:</Text>
                      </View>
                      <Text className="text-xs font-black text-slate-900">{patName} ({vis.patients?.patient_code})</Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5">
                        <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                        <Text className="text-xs font-bold text-slate-400">Doctor:</Text>
                      </View>
                      <Text className="text-xs font-bold text-slate-800">{docName}</Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <Text className="text-xs font-bold text-slate-400">Department:</Text>
                      </View>
                      <Text className="text-xs font-bold text-cyan-700">{deptName}</Text>
                    </View>
                  </View>

                  {/* Bottom Row: Action */}
                  <View className="border-t border-slate-100 pt-2.5 flex-row justify-end">
                    <TouchableOpacity
                      onPress={() => setSelectedVisitForView(vis)}
                      className="flex-row items-center gap-1.5 px-4 py-2 bg-slate-100/80 hover:bg-slate-200 rounded-xl active:bg-slate-200"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-700" />
                      <Text className="text-xs font-extrabold text-slate-800">Inspect Log</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Inspect Visit Details Modal */}
      <Dialog
        isOpen={Boolean(selectedVisitForView)}
        onClose={() => setSelectedVisitForView(null)}
        maxWidth="md"
      >
        {selectedVisitForView ? (
          <View className="gap-4">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <View>
                <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Visit Audit Log</Text>
                <Text className="font-mono text-slate-900 font-black text-base mt-0.5">{selectedVisitForView.visit_number}</Text>
              </View>
              <View className="px-3 py-1 rounded-xl bg-cyan-50 border border-cyan-100">
                <Text className="text-xs font-black text-cyan-800 uppercase">Token #{selectedVisitForView.token_no}</Text>
              </View>
            </View>

            <View className="gap-2.5">
              <View className="flex-row justify-between border-b border-slate-50 pb-2">
                <Text className="text-xs text-slate-400 font-bold">Status</Text>
                <Text className="text-xs font-black text-slate-900">{selectedVisitForView.status}</Text>
              </View>
              <View className="flex-row justify-between border-b border-slate-50 pb-2">
                <Text className="text-xs text-slate-400 font-bold">Patient Name</Text>
                <Text className="text-xs font-bold text-slate-800">
                  {selectedVisitForView.patients?.first_name} {selectedVisitForView.patients?.last_name || ''}
                </Text>
              </View>
              <View className="flex-row justify-between border-b border-slate-50 pb-2">
                <Text className="text-xs text-slate-400 font-bold">Doctor Consulted</Text>
                <Text className="text-xs font-bold text-slate-800">
                  {selectedVisitForView.doctors?.profiles?.full_name || 'Dr. Practitioner'}
                </Text>
              </View>
              <View className="flex-row justify-between border-b border-slate-50 pb-2">
                <Text className="text-xs text-slate-400 font-bold">Department</Text>
                <Text className="text-xs font-bold text-slate-800">
                  {selectedVisitForView.doctors?.departments?.department_name || 'General Medicine'}
                </Text>
              </View>
              <View className="flex-row justify-between border-b border-slate-50 pb-2">
                <Text className="text-xs text-slate-400 font-bold">Scheduled Time</Text>
                <Text className="text-xs font-bold text-slate-800">
                  {new Date(selectedVisitForView.visit_date).toLocaleString()}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-slate-400 font-bold">Consultation Fee</Text>
                <Text className="text-xs font-black text-emerald-600">
                  ₹{selectedVisitForView.doctors?.consultation_fee || 0}
                </Text>
              </View>
            </View>

            <View className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
              <Text className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Chief Complaint</Text>
              <Text className="text-xs text-slate-700 font-bold leading-relaxed">
                {selectedVisitForView.chief_complaint || 'No symptoms reported during registration.'}
              </Text>
            </View>

            <View className="border-t border-slate-100 pt-3 flex-row justify-end">
              <TouchableOpacity
                onPress={() => setSelectedVisitForView(null)}
                className="px-5 py-2.5 bg-slate-100/80 hover:bg-slate-200 rounded-xl active:bg-slate-200"
              >
                <Text className="text-xs font-black text-slate-800">Close Summary</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </Dialog>
    </View>
  );
}
