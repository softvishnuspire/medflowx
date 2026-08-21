import React, { useEffect, useState } from 'react';
import { getPatientById } from '@/services/reception';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Patient } from '@/types/reception';
import { useToast } from '@/components/ui/toast';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  CalendarDays, 
  ArrowLeft, 
  CalendarPlus 
} from 'lucide-react-native';

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
      <View className="gap-4 p-4">
        <View className="flex-row items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-8 w-48 rounded-xl" />
        </View>
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </View>
    );
  }

  if (!data) {
    return (
      <View className="items-center justify-center py-16 p-4">
        <Text className="text-slate-500 text-sm font-medium">Patient profile not found.</Text>
        <TouchableOpacity
          onPress={onBack}
          className="mt-4 px-4 py-2 bg-slate-100 rounded-xl border border-slate-200"
        >
          <Text className="text-xs font-bold text-slate-700">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { patient, visits } = data;
  const address = patient.patient_addresses && patient.patient_addresses[0];

  return (
    <View className="gap-5 font-body text-slate-700">
      {/* Header bar */}
      <View className="gap-3 border-b border-slate-100 pb-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={onBack}
            className="w-10 h-10 border border-slate-200/70 rounded-2xl items-center justify-center bg-white active:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4 text-slate-700" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onCreateVisit(patient)}
            className="flex-row items-center gap-2 px-4 py-2.5 bg-cyan-600 active:bg-cyan-700 rounded-2xl shadow-xs"
          >
            <CalendarPlus className="h-4 w-4 text-white" />
            <Text className="text-xs font-black text-white">Create OP Visit</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-xl font-black text-slate-900">
              {patient.first_name} {patient.last_name || ''}
            </Text>
            <Text className="font-mono text-[10px] font-black px-2 py-0.5 rounded-md bg-cyan-50 border border-cyan-100 text-cyan-800">
              {patient.patient_code}
            </Text>
          </View>
          <Text className="text-xs text-slate-400 font-medium mt-0.5">
            Patient registered on {new Date(patient.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Main Details */}
      <View className="gap-5">
        {/* Personal & Contact Card */}
        <Card className="border border-slate-100 shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardContent className="p-5 gap-5">
            {/* Personal details */}
            <View className="gap-3">
              <View className="flex-row items-center gap-2 border-b border-slate-100 pb-2">
                <User className="h-4 w-4 text-cyan-600" />
                <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Personal Details</Text>
              </View>
              <View className="flex-row flex-wrap gap-y-3">
                <View className="w-1/2">
                  <Text className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Gender</Text>
                  <Text className="text-xs font-bold text-slate-800">{patient.gender}</Text>
                </View>
                <View className="w-1/2">
                  <Text className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Date of Birth</Text>
                  <Text className="text-xs font-bold text-slate-800">
                    {patient.dob ? new Date(patient.dob).toLocaleDateString() : 'Not provided'}
                  </Text>
                </View>
                <View className="w-1/2">
                  <Text className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Age</Text>
                  <Text className="text-xs font-bold text-slate-800">{patient.age ?? 'N/A'} years</Text>
                </View>
                <View className="w-1/2">
                  <Text className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Blood Group</Text>
                  <Text className="text-xs font-bold text-slate-800">{patient.blood_group || 'Not provided'}</Text>
                </View>
              </View>
            </View>

            {/* Contact details */}
            <View className="gap-3 pt-2">
              <View className="flex-row items-center gap-2 border-b border-slate-100 pb-2">
                <Phone className="h-4 w-4 text-cyan-600" />
                <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Contact Details</Text>
              </View>
              <View className="flex-row flex-wrap gap-y-3">
                <View className="w-1/2">
                  <Text className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Phone Number</Text>
                  <Text className="text-xs font-bold text-slate-800">{patient.phone}</Text>
                </View>
                <View className="w-1/2">
                  <Text className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Email Address</Text>
                  <Text className="text-xs font-bold text-slate-800">{patient.email || 'Not provided'}</Text>
                </View>
                <View className="w-1/2">
                  <Text className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Emergency Contact</Text>
                  <Text className="text-xs font-bold text-slate-800">{patient.emergency_contact || 'Not provided'}</Text>
                </View>
                <View className="w-1/2">
                  <Text className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Occupation</Text>
                  <Text className="text-xs font-bold text-slate-800">{patient.occupation || 'Not provided'}</Text>
                </View>
              </View>
            </View>

            {/* Address details */}
            <View className="gap-3 pt-2">
              <View className="flex-row items-center gap-2 border-b border-slate-100 pb-2">
                <MapPin className="h-4 w-4 text-cyan-600" />
                <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Address Information</Text>
              </View>
              {address ? (
                <View className="gap-2">
                  <View>
                    <Text className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Street Address</Text>
                    <Text className="text-xs font-bold text-slate-800">{address.address_line}</Text>
                  </View>
                  <View className="flex-row">
                    <View className="w-1/2">
                      <Text className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">City & District</Text>
                      <Text className="text-xs font-bold text-slate-800">
                        {address.city}{address.district ? `, ${address.district}` : ''}
                      </Text>
                    </View>
                    <View className="w-1/2">
                      <Text className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">State & Pincode</Text>
                      <Text className="text-xs font-bold text-slate-800">{address.state} - {address.pincode}</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <Text className="text-xs text-slate-400 font-medium">No address details configured.</Text>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card className="bg-cyan-50/60 border border-cyan-100 rounded-3xl overflow-hidden shadow-xs">
          <CardContent className="p-5 gap-3">
            <View className="flex-row items-center gap-2 border-b border-cyan-100 pb-2">
              <FileText className="h-4 w-4 text-cyan-600" />
              <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Medical Information</Text>
            </View>
            
            <View className="gap-3 mt-1">
              <View>
                <Text className="text-[10px] font-black text-rose-600 uppercase tracking-wider mb-1">Known Allergies</Text>
                <View className="bg-white border border-slate-200/70 p-3 rounded-2xl min-h-[50px] justify-center">
                  <Text className="text-xs font-bold text-slate-800">
                    {patient.allergies || 'No known allergies reported.'}
                  </Text>
                </View>
              </View>
              
              <View>
                <Text className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Medical History</Text>
                <View className="bg-white border border-slate-200/70 p-3 rounded-2xl min-h-[60px] justify-center">
                  <Text className="text-xs font-medium text-slate-700">
                    {patient.medical_history || 'No medical conditions reported.'}
                  </Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Clinical Visits Table with Horizontal Scroll */}
        <Card className="border border-slate-100 bg-white shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-5 gap-4">
            <View className="flex-row items-center gap-2">
              <CalendarDays className="h-4 w-4 text-cyan-600" />
              <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Visit History</Text>
            </View>

            {visits.length === 0 ? (
              <View className="items-center justify-center py-8 border border-dashed border-slate-200 rounded-2xl">
                <Text className="text-slate-400 text-xs font-bold">No visit history found for this patient.</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="w-full">
                <View className="min-w-[650px]">
                  <Table>
                    <TableHeader className="bg-slate-50/80 rounded-xl">
                      <TableRow className="border-b border-slate-100">
                        <TableHead className="w-28 text-[10px] font-black text-slate-400">VISIT NUMBER</TableHead>
                        <TableHead className="w-44 text-[10px] font-black text-slate-400">DEPARTMENT</TableHead>
                        <TableHead className="w-36 text-[10px] font-black text-slate-400">DOCTOR</TableHead>
                        <TableHead className="w-40 text-[10px] font-black text-slate-400">VISIT DATE</TableHead>
                        <TableHead className="w-20 text-[10px] font-black text-slate-400">TOKEN</TableHead>
                        <TableHead className="w-28 text-[10px] font-black text-slate-400">STATUS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visits.map((v) => {
                        let uiStatus: 'Waiting' | 'In Progress' | 'Completed' | 'Cancelled' = 'Waiting';
                        if (v.status === 'In Progress') {
                          uiStatus = 'In Progress';
                        } else if (['Prescribed', 'Dispensed', 'Closed'].includes(v.status)) {
                          uiStatus = 'Completed';
                        } else if (v.status === 'Cancelled') {
                          uiStatus = 'Cancelled';
                        }

                        const statusBadgeStyle = {
                          Waiting: 'bg-cyan-50 border-cyan-100 text-cyan-700',
                          'In Progress': 'bg-amber-50 border-amber-100 text-amber-700',
                          Completed: 'bg-emerald-50 border-emerald-100 text-emerald-700',
                          Cancelled: 'bg-rose-50 border-rose-100 text-rose-700',
                        }[uiStatus];

                        return (
                          <TableRow key={v.id} className="border-b border-slate-100">
                            <TableCell className="w-28">
                              <Text className="font-mono text-xs font-bold text-slate-700">{v.visit_number}</Text>
                            </TableCell>
                            <TableCell className="w-44">
                              <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>
                                {v.doctors?.departments?.department_name || 'Hair Care & Trichology'}
                              </Text>
                            </TableCell>
                            <TableCell className="w-36">
                              <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>
                                {v.doctors?.profiles?.full_name || 'Unknown Doctor'}
                              </Text>
                            </TableCell>
                            <TableCell className="w-40">
                              <Text className="text-xs font-medium text-slate-600">
                                {new Date(v.visit_date).toLocaleDateString()} {new Date(v.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                            </TableCell>
                            <TableCell className="w-20">
                              <Text className="font-mono text-xs font-black text-cyan-800">{v.token_no}</Text>
                            </TableCell>
                            <TableCell className="w-28">
                              <View className={`px-2.5 py-1 rounded-full border items-center justify-center ${statusBadgeStyle}`}>
                                <Text className="text-[10px] font-black uppercase tracking-wider">{uiStatus}</Text>
                              </View>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </View>
              </ScrollView>
            )}
          </CardContent>
        </Card>
      </View>
    </View>
  );
}
