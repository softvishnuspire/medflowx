'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@/components/ui/card';
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
} from 'lucide-react';

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
    <div className="space-y-6 animate-slide-in text-zinc-700">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Security & Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Configure your personal profile keys, change passwords, and monitor system modifications audits.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Admin Profile Settings */}
        <div className="space-y-6">
          <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-xs">
            <CardContent className="p-6">
              <h3 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-zinc-400" />
                Administrative Profile Details
              </h3>
              
              <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-zinc-500 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    {...regProfile('full_name')}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {profileErrors.full_name && (
                    <span className="text-[11px] text-red-500 mt-1 block font-medium">{profileErrors.full_name.message}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-zinc-500 uppercase mb-1">Email address</label>
                    <input
                      type="email"
                      {...regProfile('email')}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    {profileErrors.email && (
                      <span className="text-[11px] text-red-500 mt-1 block font-medium">{profileErrors.email.message}</span>
                    )}
                  </div>
                  
                  <div>
                    <label className="block font-semibold text-zinc-500 uppercase mb-1">Phone Number</label>
                    <input
                      type="text"
                      {...regProfile('phone')}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    {profileErrors.phone && (
                      <span className="text-[11px] text-red-500 mt-1 block font-medium">{profileErrors.phone.message}</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors inline-flex items-center"
                  >
                    {isUpdatingProfile && (
                      <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    Update Details
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Clinic Information metadata */}
          <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-xs">
            <CardContent className="p-6">
              <h3 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2">
                <Building className="h-4.5 w-4.5 text-zinc-400" />
                Clinic Organization Metadata
              </h3>
              
              {clinic ? (
                <div className="space-y-3.5 text-xs text-zinc-600">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Clinic Name</span>
                    <span className="font-bold text-zinc-800">{clinic.clinic_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Contact Number</span>
                    <span className="font-semibold text-zinc-800 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-zinc-400" />
                      {clinic.phone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">GST Registration ID</span>
                    <span className="font-mono font-semibold text-zinc-700">{clinic.gst_number}</span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-zinc-400 shrink-0">Corporate Address</span>
                    <span className="font-semibold text-zinc-700 text-right leading-relaxed">{clinic.address}</span>
                  </div>
                </div>
              ) : (
                <div className="h-20 bg-zinc-50 rounded animate-pulse" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Password Change Form */}
        <div className="space-y-6">
          <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-xs">
            <CardContent className="p-6">
              <h3 className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2">
                <KeyRound className="h-4.5 w-4.5 text-zinc-400" />
                Security Password Reset
              </h3>
              
              <form onSubmit={handlePassSubmit(onChangePassword)} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-zinc-500 uppercase mb-1">Current Password *</label>
                  <input
                    type="password"
                    {...regPass('current_password')}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="••••••••"
                  />
                  {passErrors.current_password && (
                    <span className="text-[11px] text-red-500 mt-1 block font-medium">{passErrors.current_password.message}</span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-zinc-500 uppercase mb-1">New Password *</label>
                  <input
                    type="password"
                    {...regPass('new_password')}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Min 6 characters"
                  />
                  {passErrors.new_password && (
                    <span className="text-[11px] text-red-500 mt-1 block font-medium">{passErrors.new_password.message}</span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-zinc-500 uppercase mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    {...regPass('confirm_password')}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Re-enter password"
                  />
                  {passErrors.confirm_password && (
                    <span className="text-[11px] text-red-500 mt-1 block font-medium">{passErrors.confirm_password.message}</span>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPass}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors inline-flex items-center"
                  >
                    {isChangingPass && (
                      <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    Reset Password
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Audit Log list at bottom */}
      <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
            <History className="h-4.5 w-4.5 text-zinc-400" />
            Administrative System Audit Logs
          </h3>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400 italic">No audit records logged yet. Modifications will record entries.</div>
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
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.action.includes('CREATE') 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : log.action.includes('TOGGLE') || log.action.includes('STATUS')
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-medium text-zinc-500">{log.table_name}</TableCell>
                  <TableCell className="font-mono text-xs text-zinc-500 truncate max-w-[120px]" title={log.record_id || '—'}>
                    {log.record_id || '—'}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div>{log.device || 'Admin console'}</div>
                    <span className="text-[10px] text-zinc-400 font-mono">{log.ip_address}</span>
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
    </div>
  );
}
