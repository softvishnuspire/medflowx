import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@/components/ui/card';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
  import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { 
  profileUpdateSchema, 
  passwordChangeSchema, 
  ProfileUpdateFormValues, 
  PasswordChangeFormValues 
} from './schemas';
import { getClinicSettings, getAuditLogs } from '@/services/admin';
import { AuditLog } from '@/types/admin';
import { useToast } from '@/components/ui/toast';
import { 
User, 
  KeyRound, 
  History, 
  Building, 
  Mail, 
  Phone,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react-native';

export default function ProfileView() {
  const [clinic, setClinic] = useState<any>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [settings, audit] = await Promise.all([
        getClinicSettings(),
        getAuditLogs()
      ]);
      setClinic(settings);
      setLogs(audit);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Form 1: Profile Details Form
  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      full_name: 'MedflowX System Admin',
      email: 'admin@medflowx.com',
      phone: '9998887776'
    }
  });

  // Form 2: Password Reset Form
  const {
    register: regPass,
    handleSubmit: handlePassSubmit,
    formState: { errors: passErrors },
    reset: resetPass
  } = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema)
  });

  const onUpdateProfile = async (values: ProfileUpdateFormValues) => {
    try {
      setIsUpdatingProfile(true);
      // Simulate service delay
      await new Promise(resolve => setTimeout(resolve, 800));
      toast('Admin profile successfully updated!', 'success');
      loadData();
    } catch (err: any) {
      toast(err.message || 'Profile update failed', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onChangePassword = async (values: PasswordChangeFormValues) => {
    try {
      setIsChangingPass(true);
      // Simulate service delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast('Security password successfully updated!', 'success');
      resetPass({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (err: any) {
      toast(err.message || 'Password update failed', 'error');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <View className="space-y-6 animate-slide-in text-zinc-700">
      {/* Header */}
      <View>
        <Text className="text-2xl font-bold text-zinc-900 tracking-tight">Security & Settings</Text>
        <Text className="text-sm text-zinc-500 mt-1">Configure your personal profile keys, change passwords, and monitor system modifications audits.</Text>
      </View>

      <View className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Admin Profile Settings */}
        <View className="space-y-6">
          <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-xs">
            <CardContent className="p-6">
              <Text className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-zinc-400" />
                Administrative Profile Details
              </Text>
              
              <View className="space-y-4 text-xs">
                <View>
                  <Text className="block font-semibold text-zinc-500 uppercase mb-1">Full Name</Text>
                  <TextInput
                    {...regProfile('full_name')}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {profileErrors.full_name && (
                    <Text className="text-[11px] text-red-500 mt-1 block font-medium">{profileErrors.full_name.message}</Text>
                  )}
                </View>

                <View className="grid grid-cols-2 gap-4">
                  <View>
                    <Text className="block font-semibold text-zinc-500 uppercase mb-1">Email address</Text>
                    <TextInput
                      {...regProfile('email')}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    {profileErrors.email && (
                      <Text className="text-[11px] text-red-500 mt-1 block font-medium">{profileErrors.email.message}</Text>
                    )}
                  </View>
                  
                  <View>
                    <Text className="block font-semibold text-zinc-500 uppercase mb-1">Phone Number</Text>
                    <TextInput
                      {...regProfile('phone')}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    {profileErrors.phone && (
                      <Text className="text-[11px] text-red-500 mt-1 block font-medium">{profileErrors.phone.message}</Text>
                    )}
                  </View>
                </View>

                <View className="flex justify-end pt-2">
                  <TouchableOpacity
                    onPress={handleProfileSubmit(onUpdateProfile)}
                    disabled={isUpdatingProfile}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors inline-flex items-center flex-row"
                  >
                    {isUpdatingProfile && (
                      <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
                    )}
                    <Text className="text-white font-semibold">Update Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Clinic Information metadata */}
          <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-xs">
            <CardContent className="p-6">
              <Text className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2">
                <Building className="h-4.5 w-4.5 text-zinc-400" />
                Clinic Organization Metadata
              </Text>
              
              {clinic ? (
                <View className="space-y-3.5 text-xs text-zinc-600">
                  <View className="flex justify-between">
                    <Text className="text-zinc-400">Clinic Name</Text>
                    <Text className="font-bold text-zinc-800">{clinic.clinic_name}</Text>
                  </View>
                  <View className="flex justify-between">
                    <Text className="text-zinc-400">Contact Number</Text>
                    <Text className="font-semibold text-zinc-800 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-zinc-400" />
                      {clinic.phone}
                    </Text>
                  </View>
                  <View className="flex justify-between">
                    <Text className="text-zinc-400">GST Registration ID</Text>
                    <Text className="font-mono font-semibold text-zinc-700">{clinic.gst_number}</Text>
                  </View>
                  <View className="flex justify-between items-start gap-4">
                    <Text className="text-zinc-400 shrink-0">Corporate Address</Text>
                    <Text className="font-semibold text-zinc-700 text-right leading-relaxed">{clinic.address}</Text>
                  </View>
                </View>
              ) : (
                <View className="h-20 bg-zinc-50 rounded animate-pulse" />
              )}
            </CardContent>
          </Card>
        </View>

        {/* Right Column: Password Change Form */}
        <View className="space-y-6">
          <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-xs">
            <CardContent className="p-6">
              <Text className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2">
                <KeyRound className="h-4.5 w-4.5 text-zinc-400" />
                Security Password Reset
              </Text>
              
              <View className="space-y-4 text-xs">
                <View>
                  <Text className="block font-semibold text-zinc-500 uppercase mb-1">Current Password *</Text>
                  <TextInput
                    {...regPass('current_password')}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="••••••••"
                  />
                  {passErrors.current_password && (
                    <Text className="text-[11px] text-red-500 mt-1 block font-medium">{passErrors.current_password.message}</Text>
                  )}
                </View>

                <View>
                  <Text className="block font-semibold text-zinc-500 uppercase mb-1">New Password *</Text>
                  <TextInput
                    {...regPass('new_password')}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Min 6 characters"
                  />
                  {passErrors.new_password && (
                    <Text className="text-[11px] text-red-500 mt-1 block font-medium">{passErrors.new_password.message}</Text>
                  )}
                </View>

                <View>
                  <Text className="block font-semibold text-zinc-500 uppercase mb-1">Confirm New Password *</Text>
                  <TextInput
                    {...regPass('confirm_password')}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Re-enter password"
                  />
                  {passErrors.confirm_password && (
                    <Text className="text-[11px] text-red-500 mt-1 block font-medium">{passErrors.confirm_password.message}</Text>
                  )}
                </View>

                <View className="flex justify-end pt-2">
                  <TouchableOpacity
                    onPress={handlePassSubmit(onChangePassword)}
                    disabled={isChangingPass}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors inline-flex items-center flex-row"
                  >
                    {isChangingPass && (
                      <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
                    )}
                    <Text className="text-white font-semibold">Reset Password</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </CardContent>
          </Card>
        </View>
      </View>

      {/* Audit Log list at bottom */}
      <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-sm overflow-hidden">
        <View className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <Text className="text-sm font-bold text-zinc-800 flex items-center gap-2">
            <History className="h-4.5 w-4.5 text-zinc-400" />
            Administrative System Audit Logs
          </Text>
        </View>

        {logs.length === 0 ? (
          <View className="p-8 text-center text-xs text-zinc-400 italic">No audit records logged yet. Modifications will record entries.</View>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Audit ID</TableHead>
                <TableHead>Administrator</TableHead>
                <TableHead>Operation Action</TableHead>
                <TableHead>Target table</TableHead>
                <TableHead>Record Reference</TableHead>
                <TableHead>Device/IP Source</TableHead>
                <TableHead>Created Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs text-zinc-400 font-semibold">#AUD-${log.id}</TableCell>
                  <TableCell className="font-semibold text-zinc-800">
                    {log.profiles?.full_name || 'Admin User'}
                  </TableCell>
                  <TableCell>
                    <Text className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.action.includes('CREATE') 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : log.action.includes('TOGGLE') || log.action.includes('STATUS')
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {log.action}
                    </Text>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-medium text-zinc-500">{log.table_name}</TableCell>
                  <TableCell className="font-mono text-xs text-zinc-500 truncate max-w-[120px]">
                    {log.record_id || '—'}
                  </TableCell>
                  <TableCell className="text-xs">
                    <View>{log.device || 'Admin console'}</View>
                    <Text className="text-[10px] text-zinc-400 font-mono">{log.ip_address}</Text>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">
                    {new Date(log.created_at).toLocaleString()}
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
