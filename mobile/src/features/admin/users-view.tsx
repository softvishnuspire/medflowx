import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, ConfirmationDialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { 
  getStaffUsers, 
  createStaffUser, 
  updateStaffUser, 
  toggleUserActive, 
  resetStaffUserPassword 
} from '@/services/admin';
import { StaffUser } from '@/types/admin';
import UserFormModal from './user-form-modal';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { NativePicker } from '@/components/ui/native-picker';
import {
  Search, 
  UserPlus, 
  Eye, 
  Edit2, 
  ShieldAlert, 
  Key, 
  UserCheck, 
  UserX,
  RefreshCw,
  SlidersHorizontal,
  Phone,
  Mail,
  Building2,
  FilterX
} from 'lucide-react-native';

export default function UsersView() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<StaffUser | null>(null);
  
  const [selectedUserForView, setSelectedUserForView] = useState<StaffUser | null>(null);
  
  const [userToToggle, setUserToToggle] = useState<StaffUser | null>(null);
  const [isToggleConfirmOpen, setIsToggleConfirmOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const [userToReset, setUserToReset] = useState<StaffUser | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const { toast } = useToast();

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await getStaffUsers({
        search,
        role: roleFilter,
        status: statusFilter
      });
      setUsers(data);
    } catch (err: any) {
      console.error('Error loading users:', err.message);
      toast(err.message || 'Failed to load staff user database', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter]);

  const handleToggleActive = async () => {
    if (!userToToggle) return;
    try {
      setIsToggling(true);
      const newStatus = await toggleUserActive(userToToggle.id, userToToggle.is_active);
      toast(
        `User ${userToToggle.full_name} is now ${newStatus ? 'enabled' : 'disabled'}.`,
        'success'
      );
      setIsToggleConfirmOpen(false);
      setUserToToggle(null);
      loadUsers();
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to toggle account activation status', 'error');
    } finally {
      setIsToggling(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userToReset) return;
    try {
      setIsResetting(true);
      await resetStaffUserPassword(userToReset.id);
      toast(`Successfully reset password for ${userToReset.full_name}.`, 'success');
      setIsResetConfirmOpen(false);
      setUserToReset(null);
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to reset password', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <View className="gap-5 w-full">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-2">
          <Text className="text-xl font-black text-slate-900">Staff Management</Text>
          <Text className="text-xs text-slate-500 font-medium mt-0.5">Configure access credentials & roles for clinic staff</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setUserToEdit(null);
            setIsFormOpen(true);
          }}
          className="flex-row items-center gap-1.5 px-3.5 py-2 bg-cyan-600 rounded-2xl active:bg-cyan-700 shadow-2xs"
        >
          <UserPlus className="h-4 w-4 text-white" />
          <Text className="text-xs font-black text-white">Add User</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Card - Explicit Rows without flex-wrap */}
      <View className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3">
        <View className="flex-row items-center justify-between border-b border-slate-100 pb-2.5">
          <View className="flex-row items-center gap-1.5">
            <SlidersHorizontal className="h-4 w-4 text-slate-600" />
            <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Search & Filter Staff</Text>
          </View>
          <View className="flex-row items-center gap-2">
            {(search || roleFilter || statusFilter) ? (
              <TouchableOpacity
                onPress={() => {
                  setSearch('');
                  setRoleFilter('');
                  setStatusFilter('');
                }}
                className="flex-row items-center gap-1 px-2.5 py-1 bg-rose-50 rounded-xl border border-rose-100"
              >
                <FilterX className="h-3 w-3 text-rose-600" />
                <Text className="text-[10px] font-black text-rose-600">Clear</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={loadUsers}
              className="flex-row items-center gap-1.5 px-3 py-1.5 bg-slate-100/80 rounded-xl active:bg-slate-200"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-700" />
              <Text className="text-xs font-black text-slate-700">Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Input */}
        <View className="flex-row items-center bg-slate-50 border border-slate-200/70 rounded-2xl px-3 h-11">
          <Search className="h-4 w-4 text-slate-400 mr-2" />
          <TextInput
            placeholder="Search by name, phone or email..."
            value={search}
            onChangeText={setSearch}
            className="flex-1 text-xs font-bold text-slate-800"
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Explicit Row: Role & Status */}
        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <Text className="text-[10px] font-bold text-slate-400 uppercase mb-1">Role</Text>
            <NativePicker
              value={roleFilter}
              onValueChange={setRoleFilter}
              placeholder="All Roles"
              options={[
                { label: 'All Roles', value: '' },
                { label: 'Receptionist', value: 'Reception' },
                { label: 'Doctor', value: 'Doctor' },
                { label: 'Pharmacy User', value: 'Pharmacy' },
              ]}
            />
          </View>

          <View className="flex-1">
            <Text className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</Text>
            <NativePicker
              value={statusFilter}
              onValueChange={setStatusFilter}
              placeholder="All Statuses"
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Active', value: 'Active' },
                { label: 'Disabled', value: 'Disabled' },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Users List Cards */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Staff User Profiles</Text>
          <Text className="text-xs font-bold text-cyan-600">{users.length} accounts</Text>
        </View>

        {isLoading ? (
          <View className="p-10 bg-white rounded-3xl border border-slate-100 items-center justify-center">
            <ActivityIndicator size="small" color="#0891b2" />
            <Text className="text-xs font-bold text-slate-400 mt-2">Loading user database...</Text>
          </View>
        ) : users.length === 0 ? (
          <View className="p-12 bg-white rounded-3xl border border-slate-100 items-center justify-center text-center">
            <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mb-3">
              <ShieldAlert className="h-6 w-6 text-slate-400" />
            </View>
            <Text className="text-sm font-black text-slate-800">No User Accounts Found</Text>
            <Text className="text-xs text-slate-400 font-medium mt-1 text-center">Adjust filter criteria or create a new user account above.</Text>
          </View>
        ) : (
          <View className="gap-3">
            {users.map((user) => {
              let roleBg = 'bg-blue-50 border-blue-100 text-blue-800';
              if (user.roles?.role_name === 'Doctor') {
                roleBg = 'bg-violet-50 border-violet-100 text-violet-800';
              } else if (user.roles?.role_name === 'Pharmacy') {
                roleBg = 'bg-purple-50 border-purple-100 text-purple-800';
              }

              return (
                <View 
                  key={user.id} 
                  className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3"
                >
                  {/* Top Row: Name & Role */}
                  <View className="flex-row items-center justify-between border-b border-slate-100 pb-2.5">
                    <View className="flex-1 mr-2">
                      <Text className="text-base font-black text-slate-900 line-clamp-1">{user.full_name}</Text>
                      <Text className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{user.id}</Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                      <View className={`px-2.5 py-1 rounded-xl border ${roleBg}`}>
                        <Text className="text-[10px] font-black uppercase tracking-wide">
                          {user.roles?.role_name === 'Reception' ? 'Receptionist' : user.roles?.role_name}
                        </Text>
                      </View>

                      <View className={`px-2 py-1 rounded-xl border flex-row items-center gap-1 ${
                        user.is_active 
                          ? 'bg-emerald-50 border-emerald-100' 
                          : 'bg-rose-50 border-rose-100'
                      }`}>
                        <View className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <Text className={`text-[9px] font-black uppercase ${user.is_active ? 'text-emerald-800' : 'text-rose-800'}`}>
                          {user.is_active ? 'Active' : 'Disabled'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Middle Row: Contact Info & Doctor Dept */}
                  <View className="gap-1.5">
                    {user.roles?.role_name === 'Doctor' && user.doctors ? (
                      <View className="flex-row items-center justify-between p-2.5 bg-violet-50/50 rounded-2xl border border-violet-100/50 mb-1">
                        <View className="flex-row items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-violet-600" />
                          <Text className="text-xs font-bold text-violet-900">{user.doctors.departments?.department_name || 'General'}</Text>
                        </View>
                        <Text className="text-xs font-black text-emerald-600">Fee: ₹{user.doctors.consultation_fee}</Text>
                      </View>
                    ) : null}

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <Text className="text-xs font-bold text-slate-700">{user.phone || 'No phone'}</Text>
                      </View>

                      <View className="flex-row items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <Text className="text-xs font-medium text-slate-500">{user.email || 'No email'}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Bottom Row: 4 Action Buttons */}
                  <View className="border-t border-slate-100 pt-2.5 flex-row items-center justify-end gap-2">
                    <TouchableOpacity
                      onPress={() => setSelectedUserForView(user)}
                      className="p-2 rounded-xl bg-slate-100/80 active:bg-slate-200"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-700" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setUserToEdit(user);
                        setIsFormOpen(true);
                      }}
                      className="p-2 rounded-xl bg-slate-100/80 active:bg-slate-200"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-slate-700" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setUserToReset(user);
                        setIsResetConfirmOpen(true);
                      }}
                      className="p-2 rounded-xl bg-amber-50 border border-amber-200/60 active:bg-amber-100"
                    >
                      <Key className="h-3.5 w-3.5 text-amber-700" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setUserToToggle(user);
                        setIsToggleConfirmOpen(true);
                      }}
                      className={`flex-row items-center gap-1 px-3 py-1.5 rounded-xl border active:opacity-80 ${
                        user.is_active
                          ? 'bg-rose-50 border-rose-200/70'
                          : 'bg-emerald-50 border-emerald-200/70'
                      }`}
                    >
                      {user.is_active ? <UserX className="h-3.5 w-3.5 text-rose-700" /> : <UserCheck className="h-3.5 w-3.5 text-emerald-700" />}
                      <Text className={`text-[10px] font-black ${user.is_active ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {user.is_active ? 'Disable' : 'Enable'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Forms & Actions Modals */}
      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setUserToEdit(null);
        }}
        onSuccess={() => {
          loadUsers();
        }}
        userToEdit={userToEdit}
        onSubmitAction={async (payload) => {
          if (userToEdit) {
            return await updateStaffUser(userToEdit.id, payload);
          } else {
            return await createStaffUser(payload);
          }
        }}
      />

      {/* View User Details Modal */}
      <Dialog
        isOpen={Boolean(selectedUserForView)}
        onClose={() => setSelectedUserForView(null)}
        maxWidth="sm"
      >
        {selectedUserForView ? (
          <View className="gap-4">
            <View className="flex-row items-center gap-3 pb-3 border-b border-slate-100">
              <View className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 items-center justify-center font-black text-xl text-cyan-800">
                <Text className="text-xl font-black text-cyan-800">{selectedUserForView.full_name.charAt(0)}</Text>
              </View>
              <View>
                <Text className="font-black text-slate-900 text-base">{selectedUserForView.full_name}</Text>
                <Text className="text-[11px] font-mono font-bold text-slate-400 mt-0.5">{selectedUserForView.id}</Text>
              </View>
            </View>

            <View className="gap-2.5">
              <View className="flex-row justify-between border-b border-slate-50 pb-2">
                <Text className="text-xs text-slate-400 font-bold">Role</Text>
                <Text className="text-xs font-black text-slate-800">
                  {selectedUserForView.roles?.role_name === 'Reception' ? 'Receptionist' : selectedUserForView.roles?.role_name}
                </Text>
              </View>
              
              <View className="flex-row justify-between border-b border-slate-50 pb-2">
                <Text className="text-xs text-slate-400 font-bold">Status</Text>
                <Text className={`text-xs font-black ${selectedUserForView.is_active ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {selectedUserForView.is_active ? 'Active' : 'Disabled'}
                </Text>
              </View>

              <View className="flex-row justify-between border-b border-slate-50 pb-2">
                <Text className="text-xs text-slate-400 font-bold">Email</Text>
                <Text className="text-xs font-bold text-slate-800">{selectedUserForView.email || '—'}</Text>
              </View>

              <View className="flex-row justify-between border-b border-slate-50 pb-2">
                <Text className="text-xs text-slate-400 font-bold">Phone</Text>
                <Text className="text-xs font-bold text-slate-800">{selectedUserForView.phone || '—'}</Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-xs text-slate-400 font-bold">Onboarded Date</Text>
                <Text className="text-xs font-bold text-slate-800">
                  {new Date(selectedUserForView.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {selectedUserForView.roles?.role_name === 'Doctor' && selectedUserForView.doctors ? (
              <View className="p-3.5 bg-violet-50/60 border border-violet-100 rounded-2xl gap-2">
                <Text className="text-[10px] font-black text-violet-800 uppercase tracking-wider">Doctor Attributes</Text>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-violet-600 font-bold">Department:</Text>
                  <Text className="text-xs font-black text-violet-900">{selectedUserForView.doctors.departments?.department_name || 'General'}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-violet-600 font-bold">Consultation Fee:</Text>
                  <Text className="text-xs font-black text-emerald-700">₹{selectedUserForView.doctors.consultation_fee}</Text>
                </View>
              </View>
            ) : null}

            <View className="border-t border-slate-100 pt-3 flex-row justify-end">
              <TouchableOpacity
                onPress={() => setSelectedUserForView(null)}
                className="px-5 py-2.5 bg-slate-100/80 hover:bg-slate-200 rounded-xl active:bg-slate-200"
              >
                <Text className="text-xs font-black text-slate-800">Dismiss Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </Dialog>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={isToggleConfirmOpen}
        onClose={() => {
          setIsToggleConfirmOpen(false);
          setUserToToggle(null);
        }}
        onConfirm={handleToggleActive}
        isConfirming={isToggling}
        description={`Are you sure you want to ${userToToggle?.is_active ? 'DISABLE' : 'ENABLE'} account for ${userToToggle?.full_name}?`}
        confirmText={userToToggle?.is_active ? 'Disable' : 'Enable'}
      />

      <ConfirmationDialog
        isOpen={isResetConfirmOpen}
        onClose={() => {
          setIsResetConfirmOpen(false);
          setUserToReset(null);
        }}
        onConfirm={handleResetPassword}
        isConfirming={isResetting}
        description={`Are you sure you want to reset password for ${userToReset?.full_name}?`}
        confirmText="Reset Password"
      />
    </View>
  );
}
