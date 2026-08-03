import React, { useEffect, useState } from 'react';
import { TableSkeleton } from '@/components/ui/skeleton';
import { getPatientsList } from '@/services/reception';
import { Patient } from '@/types/reception';
import { useToast } from '@/components/ui/toast';
import { Search, Eye, CalendarPlus, UserCheck, ChevronLeft, ChevronRight, Filter, Phone, MapPin } from 'lucide-react-native';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { NativePicker } from '@/components/ui/native-picker';

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

  const handleApplyFilters = () => {
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
    <View className="gap-4 w-full">
      {/* Title */}
      <View>
        <Text className="text-xl font-black text-slate-900">Patients Directory</Text>
        <Text className="text-xs text-slate-500 font-medium mt-0.5">Search intake records or initiate consultation</Text>
      </View>

      {/* Filters Panel */}
      <View className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3">
        <View className="flex-row items-center gap-2">
          <View className="p-1.5 rounded-xl bg-cyan-50">
            <Filter className="h-4 w-4 text-cyan-600" />
          </View>
          <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Search Filters</Text>
        </View>

        <View className="gap-2.5">
          {/* Inputs Row 1 */}
          <View className="flex-row gap-2.5">
            <View className="flex-1">
              <Text className="text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Patient Code</Text>
              <TextInput
                placeholder="MED-2026-..."
                value={filters.code}
                onChangeText={(text) => setFilters((prev) => ({ ...prev, code: text }))}
                className="h-10 px-3 border border-slate-200/70 rounded-xl text-xs bg-slate-50/70 text-slate-900 font-medium"
              />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Patient Name</Text>
              <TextInput
                placeholder="First or last name..."
                value={filters.name}
                onChangeText={(text) => setFilters((prev) => ({ ...prev, name: text }))}
                className="h-10 px-3 border border-slate-200/70 rounded-xl text-xs bg-slate-50/70 text-slate-900 font-medium"
              />
            </View>
          </View>

          {/* Inputs Row 2 */}
          <View className="flex-row gap-2.5">
            <View className="flex-1">
              <Text className="text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Phone Number</Text>
              <TextInput
                placeholder="10-digit mobile..."
                value={filters.phone}
                keyboardType="phone-pad"
                onChangeText={(text) => setFilters((prev) => ({ ...prev, phone: text }))}
                className="h-10 px-3 border border-slate-200/70 rounded-xl text-xs bg-slate-50/70 text-slate-900 font-medium"
              />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Gender</Text>
              <NativePicker
                value={filters.gender}
                onValueChange={(val) => setFilters((prev) => ({ ...prev, gender: val }))}
                placeholder="All Genders"
                options={[
                  { label: 'All Genders', value: 'All' },
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' },
                  { label: 'Other', value: 'Other' },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Filter Action Buttons */}
        <View className="flex-row justify-end gap-2 pt-1">
          <TouchableOpacity
            onPress={handleClearFilters}
            className="px-3.5 py-2 border border-slate-200/70 bg-white rounded-xl active:bg-slate-100"
          >
            <Text className="text-xs font-bold text-slate-600">Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleApplyFilters}
            className="flex-row items-center gap-1.5 px-4 py-2 bg-cyan-600 rounded-xl active:bg-cyan-700 shadow-2xs"
          >
            <Search className="h-3.5 w-3.5 text-white" />
            <Text className="text-xs font-bold text-white">Apply Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Patient Card List */}
      {isLoading ? (
        <View className="p-4 bg-white rounded-3xl border border-slate-100">
          <TableSkeleton cols={4} rows={4} />
        </View>
      ) : patients.length === 0 ? (
        <View className="items-center justify-center py-12 px-4 bg-white rounded-3xl border border-slate-100">
          <UserCheck className="h-10 w-10 text-cyan-600 mb-2" />
          <Text className="font-black text-slate-900 text-base">No Patients Found</Text>
          <Text className="text-slate-500 text-xs text-center mt-1 font-medium">Try modifying search filters or register a new patient.</Text>
        </View>
      ) : (
        <View className="gap-3">
          {patients.map((p) => {
            const addr = p.patient_addresses && p.patient_addresses[0];
            const addressStr = addr ? `${addr.city}, ${addr.state}` : 'No address recorded';

            return (
              <View 
                key={p.id}
                className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm flex-row items-center justify-between"
              >
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="font-black text-slate-900 text-sm">
                      {p.first_name} {p.last_name || ''}
                    </Text>
                    <View className={`px-2 py-0.5 rounded-full border ${
                      p.gender === 'Male' 
                        ? 'bg-cyan-50 border-cyan-100 text-cyan-800' 
                        : p.gender === 'Female' 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                        : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}>
                      <Text className="text-[10px] font-extrabold">{p.gender} • {p.age ?? 'N/A'}y</Text>
                    </View>
                  </View>

                  <View className="gap-1 mt-0.5">
                    <View className="flex-row items-center gap-1.5">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <Text className="text-xs text-slate-800 font-bold">{p.phone}</Text>
                      <Text className="text-[10px] font-mono text-cyan-700 font-extrabold bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100 ml-1">
                        {p.patient_code}
                      </Text>
                    </View>
                    
                    <View className="flex-row items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <Text className="text-[11px] text-slate-500 font-medium line-clamp-1">{addressStr}</Text>
                    </View>
                  </View>
                </View>

                {/* Patient Action Buttons */}
                <View className="gap-2">
                  <TouchableOpacity
                    onPress={() => onViewProfile(p.id)}
                    className="flex-row items-center gap-1 px-3 py-2 bg-slate-50 border border-slate-200/70 rounded-xl active:bg-slate-100"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-700" />
                    <Text className="text-xs font-bold text-slate-800">Profile</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => onCreateVisit(p)}
                    className="flex-row items-center gap-1 px-3 py-2 bg-cyan-600 rounded-xl active:bg-cyan-700 shadow-2xs"
                  >
                    <CalendarPlus className="h-3.5 w-3.5 text-white" />
                    <Text className="text-xs font-bold text-white">Visit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* Pagination Controls */}
          <View className="flex-row items-center justify-between p-3.5 bg-white rounded-3xl border border-slate-100 mt-1 shadow-sm">
            <Text className="text-xs text-slate-500 font-medium">
              Showing <Text className="font-bold text-slate-900">{patients.length}</Text> of <Text className="font-bold text-slate-900">{total}</Text>
            </Text>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className={`p-2 border rounded-xl ${page === 1 ? 'border-slate-200 bg-slate-50 opacity-40' : 'border-slate-200/70 bg-white active:bg-slate-100'}`}
              >
                <ChevronLeft className="h-4 w-4 text-slate-700" />
              </TouchableOpacity>

              <Text className="text-xs font-black text-slate-800 px-1">{page} / {totalPages || 1}</Text>

              <TouchableOpacity
                onPress={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages || totalPages === 0}
                className={`p-2 border rounded-xl ${page === totalPages || totalPages === 0 ? 'border-slate-200 bg-slate-50 opacity-40' : 'border-slate-200/70 bg-white active:bg-slate-100'}`}
              >
                <ChevronRight className="h-4 w-4 text-slate-700" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
