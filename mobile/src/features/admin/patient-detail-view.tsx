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
import { View, Text, TouchableOpacity } from 'react-native';
  import { 
ArrowLeft, 
  User, 
  MapPin, 
  PhoneCall, 
  Activity, 
  CalendarDays, 
  CreditCard,
  Lock
} from 'lucide-react-native';

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
      <View className="space-y-6 animate-pulse">
        <View className="flex items-center gap-3">
          <View className="h-8 w-8 bg-zinc-200 rounded-lg"></View>
          <View className="h-8 bg-zinc-200 rounded w-1/4"></View>
        </View>
        <View className="grid gap-6 md:grid-cols-3">
          <View className="h-48 bg-zinc-150 rounded-xl md:col-span-2"></View>
          <View className="h-48 bg-zinc-150 rounded-xl"></View>
        </View>
        <View className="h-64 bg-zinc-150 rounded-xl"></View>
      </View>
    );
  }

  if (!data) {
    return (
      <View className="p-8 text-center bg-white rounded-xl border border-zinc-150">
        <Text className="text-zinc-500 text-sm">Failed to retrieve profile record.</Text>
        <TouchableOpacity onPress={onBack} className="block mt-4 mx-auto text-emerald-600 hover:underline text-xs font-bold">
          Back to directory
        </TouchableOpacity>
      </View>
    );
  }

  const { patient, visits, payments } = data;
  const address = patient.addresses && patient.addresses.length > 0 ? patient.addresses[0] : null;

  return (
    <View className="space-y-6 animate-slide-in text-zinc-705 font-body">
      {/* Top Navigation */}
      <View className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <TouchableOpacity
          onPress={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-550 hover:text-primary hover:border-primary/30 bg-white border border-zinc-200 px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer hover:scale-[1.01]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <Text>Back to Directory</Text>
        </TouchableOpacity>

        <Text className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-bold font-heading">
          <Lock className="h-3 w-3" />
          ADMIN PRIVILEGE BOUNDARY: READ ONLY
        </Text>
      </View>

      {/* Grid Layout - Personal Info */}
      <View className="grid gap-6 md:grid-cols-3">
        {/* Card 1: Personal Profile */}
        <Card className="md:col-span-2 border border-zinc-150/60 bg-white rounded-xl shadow-xs">
          <CardContent className="p-6">
            <Text className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2 font-heading">
              <User className="h-4.5 w-4.5 text-zinc-400" />
              Personal details
            </Text>
            
            <View className="grid grid-cols-2 gap-y-4 text-xs">
              <View>
                <Text className="text-zinc-400 font-semibold uppercase tracking-wider block mb-0.5">Patient Code</Text>
                <Text className="font-semibold text-zinc-900 font-mono text-[13px]">{patient.patient_code}</Text>
              </View>
              <View>
                <Text className="text-zinc-400 font-semibold uppercase tracking-wider block mb-0.5">Full Name</Text>
                <Text className="font-bold text-zinc-900 text-[13px]">{patient.first_name} {patient.last_name || ''}</Text>
              </View>
              <View>
                <Text className="text-zinc-400 font-semibold uppercase tracking-wider block mb-0.5">Gender / Age</Text>
                <Text className="font-medium text-zinc-800 text-[13px]">{patient.gender} • {patient.age ? `${patient.age} years` : '—'}</Text>
              </View>
              <View>
                <Text className="text-zinc-400 font-semibold uppercase tracking-wider block mb-0.5">Blood Group</Text>
                <Text className="font-medium text-zinc-800 text-[13px]">
                  {patient.blood_group ? (
                    <Text className="px-2 py-0.5 bg-red-50 text-red-700 font-bold border border-red-100 rounded text-[10px]">
                      {patient.blood_group}
                    </Text>
                  ) : (
                    '—'
                  )}
                </Text>
              </View>
              <View>
                <Text className="text-zinc-400 font-semibold uppercase tracking-wider block mb-0.5">Email</Text>
                <Text className="font-medium text-zinc-800 text-[13px] break-all">{patient.email || '—'}</Text>
              </View>
              <View>
                <Text className="text-zinc-400 font-semibold uppercase tracking-wider block mb-0.5">Occupation</Text>
                <Text className="font-medium text-zinc-800 text-[13px]">{patient.occupation || '—'}</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Card 2: Contact & Address */}
        <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-xs">
          <CardContent className="p-6 space-y-5">
            {/* Contact numbers */}
            <View>
              <Text className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-2 mb-3 flex items-center gap-2 font-heading">
                <PhoneCall className="h-4 w-4 text-zinc-400" />
                Contact Info
              </Text>
              <View className="space-y-2 text-xs">
                <View>
                  <Text className="text-zinc-400 font-semibold block mb-0.5">Primary Phone</Text>
                  <Text className="font-semibold text-zinc-800 text-[13px]">{patient.phone}</Text>
                </View>
                <View>
                  <Text className="text-zinc-400 font-semibold block mb-0.5">Emergency Contact</Text>
                  <Text className="font-medium text-zinc-800 text-[13px]">{patient.emergency_contact || '—'}</Text>
                </View>
              </View>
            </View>

            {/* Address */}
            <View>
              <Text className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-2 mb-3 flex items-center gap-2 font-heading">
                <MapPin className="h-4 w-4 text-zinc-400" />
                Primary Address
              </Text>
              {address ? (
                <View className="text-xs text-zinc-650 space-y-1">
                  <Text className="font-semibold text-zinc-850">{address.address_line}</Text>
                  <Text>{address.city}, {address.district ? `${address.district}, ` : ''}{address.state}</Text>
                  <Text>{address.country} — {address.pincode}</Text>
                </View>
              ) : (
                <Text className="text-xs text-zinc-400 italic">No address registered.</Text>
              )}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* Medical History (Read Only Warnings) */}
      <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-xs">
        <CardContent className="p-6">
          <View className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-100 pb-3 mb-4 gap-2">
            <Text className="text-sm font-bold text-zinc-800 flex items-center gap-2 font-heading">
              <Activity className="h-4.5 w-4.5 text-zinc-400" />
              Medical History Profile
            </Text>
            <Text className="px-2 py-0.5 bg-red-50 text-red-655 rounded text-[9px] font-bold border border-red-100 font-heading">
              EDIT DISABLED
            </Text>
          </View>

          <View className="grid gap-4 md:grid-cols-2 text-xs">
            <View className="p-4 bg-zinc-50 border border-zinc-150 rounded-xl hover:shadow-xs transition-shadow">
              <Text className="text-zinc-400 font-bold uppercase tracking-wider block mb-1 font-heading">Known Allergies</Text>
              <Text className="text-zinc-700 font-semibold leading-relaxed">
                {patient.allergies || 'No known allergies reported.'}
              </Text>
            </View>
            
            <View className="p-4 bg-zinc-50 border border-zinc-150 rounded-xl hover:shadow-xs transition-shadow">
              <Text className="text-zinc-400 font-bold uppercase tracking-wider block mb-1 font-heading">Chronic History</Text>
              <Text className="text-zinc-700 font-semibold leading-relaxed">
                {patient.medical_history || 'No chronic records registered.'}
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Visits Log */}
      <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-sm overflow-hidden">
        <View className="px-6 py-4 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between bg-zinc-50/50 gap-2">
          <Text className="text-sm font-bold text-zinc-800 flex items-center gap-2 font-heading">
            <CalendarDays className="h-4.5 w-4.5 text-zinc-400" />
            Clinical Visits Log ({visits.length})
          </Text>
        </View>
        
        {visits.length === 0 ? (
          <View className="p-8 text-center text-xs text-zinc-400 italic bg-white">No historical visits logged.</View>
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
                      <Text className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-700">
                        {vis.status}
                      </Text>
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
        <View className="px-6 py-4 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between bg-zinc-50/50 gap-2">
          <Text className="text-sm font-bold text-zinc-800 flex items-center gap-2 font-heading">
            <CreditCard className="h-4.5 w-4.5 text-zinc-400" />
            Consultation Billing & Payments Log ({payments.length})
          </Text>
        </View>
        
        {payments.length === 0 ? (
          <View className="p-8 text-center text-xs text-zinc-400 italic bg-white">No payments collected.</View>
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
                    <Text className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      pay.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {pay.payment_status}
                    </Text>
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
    </View>
  );
}
