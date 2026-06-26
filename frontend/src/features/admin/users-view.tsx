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
  SlidersHorizontal
} from 'lucide-react';

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
      console.error(err);
      toast(err.message || 'Failed to load staff user database', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debounce/delay fetch slightly when typing search
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
    <div className="space-y-6 animate-slide-in text-zinc-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Staff Management</h1>
          <p className="text-sm text-zinc-500 mt-1">Configure and audits clinic access keys for Receptionists, Doctors, and Pharmacy staff.</p>
        </div>
        <button
          onClick={() => {
            setUserToEdit(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-lg text-sm font-semibold transition-all hover:scale-[1.01] shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="h-4.5 w-4.5" />
          <span>Add User Account</span>
        </button>
      </div>

      {/* Filters Bar */}
      <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-zinc-400"
            />
          </div>

          <div className="flex flex-wrap w-full md:w-auto items-center gap-3 justify-end">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase mr-1">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white focus:outline-none font-medium text-zinc-600"
            >
              <option value="">All Roles</option>
              <option value="Reception">Receptionist</option>
              <option value="Doctor">Doctor</option>
              <option value="Pharmacy">Pharmacy User</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white focus:outline-none font-medium text-zinc-600"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
            </select>

            {/* Refresh */}
            <button
              onClick={loadUsers}
              className="p-2 border border-zinc-200 rounded-lg bg-white text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-colors"
              title="Refresh database"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border border-zinc-150/60 bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 rounded-full border-4 border-zinc-200 border-t-primary animate-spin" />
            <span className="text-sm text-zinc-400">Loading user database table...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center">
            <ShieldAlert className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <h3 className="font-semibold text-zinc-800 text-sm">No accounts found</h3>
            <p className="text-zinc-500 text-xs mt-1">Adjust filters or create a new user profile above.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Name</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Department / Fees</TableHead>
                <TableHead>Contact info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Onboarded On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  {/* Name */}
                  <TableCell>
                    <div className="font-semibold text-zinc-900 text-sm">{user.full_name}</div>
                    <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">{user.id}</span>
                  </TableCell>

                  {/* Role */}
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      user.roles?.role_name === 'Doctor' 
                        ? 'bg-violet-50 text-violet-700' 
                        : user.roles?.role_name === 'Pharmacy'
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {user.roles?.role_name === 'Reception' ? 'Receptionist' : user.roles?.role_name}
                    </span>
                  </TableCell>

                  {/* Department (Doctors Only) */}
                  <TableCell>
                    {user.roles?.role_name === 'Doctor' && user.doctors ? (
                      <div>
                        <div className="text-xs font-semibold text-zinc-800">
                          {user.doctors.departments?.department_name || 'General'}
                        </div>
                        <span className="text-[10px] text-zinc-400">
                          Fee: ₹{user.doctors.consultation_fee}
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </TableCell>

                  {/* Contact Info */}
                  <TableCell>
                    <div className="text-xs font-medium text-zinc-800">{user.phone || 'No phone'}</div>
                    <div className="text-[10px] text-zinc-400">{user.email || 'No email'}</div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold leading-4 ${
                      user.is_active 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-red-50 text-red-700'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {user.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </TableCell>

                  {/* Onboarded On */}
                  <TableCell>
                    <span className="text-xs font-medium text-zinc-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedUserForView(user)}
                        className="p-1.5 rounded-lg border border-zinc-150 bg-white hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
                        title="View profile details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setUserToEdit(user);
                          setIsFormOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-zinc-150 bg-white hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
                        title="Edit profile"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setUserToReset(user);
                          setIsResetConfirmOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-zinc-150 bg-white hover:bg-zinc-50 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
                        title="Reset user password"
                      >
                        <Key className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setUserToToggle(user);
                          setIsToggleConfirmOpen(true);
                        }}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          user.is_active
                            ? 'border-red-100 bg-red-50/20 text-red-600 hover:bg-red-50 hover:text-red-700'
                            : 'border-primary/10 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary'
                        }`}
                        title={user.is_active ? 'Disable account' : 'Enable account'}
                      >
                        {user.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Forms & Actions Modals */}

      {/* User Form Modal */}
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
        title="Staff Profile Details"
        maxWidth="sm"
      >
        {selectedUserForView && (
          <div className="space-y-4 text-zinc-700">
            <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shadow-inner">
                {selectedUserForView.full_name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-base">{selectedUserForView.full_name}</h3>
                <span className="text-[11px] font-mono text-zinc-400">{selectedUserForView.id}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
              <div>
                <span className="block text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">Role</span>
                <span className="font-semibold text-zinc-800 text-sm">
                  {selectedUserForView.roles?.role_name === 'Reception' ? 'Receptionist' : selectedUserForView.roles?.role_name}
                </span>
              </div>
              
              <div>
                <span className="block text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">Status</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedUserForView.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  {selectedUserForView.is_active ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div>
                <span className="block text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">Email</span>
                <span className="font-medium text-zinc-800 break-all text-[13px]">{selectedUserForView.email || '—'}</span>
              </div>

              <div>
                <span className="block text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">Phone</span>
                <span className="font-medium text-zinc-800 text-[13px]">{selectedUserForView.phone || '—'}</span>
              </div>

              <div>
                <span className="block text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">Onboarded Date</span>
                <span className="font-medium text-zinc-800 text-[13px]">
                  {new Date(selectedUserForView.created_at).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="block text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">Last Modification</span>
                <span className="font-medium text-zinc-800 text-[13px]">
                  {new Date(selectedUserForView.updated_at).toLocaleString()}
                </span>
              </div>
            </div>

            {selectedUserForView.roles?.role_name === 'Doctor' && selectedUserForView.doctors && (
              <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-xl mt-4 space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Clinical Attributes</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="block text-zinc-400 mb-0.5">Department</span>
                    <span className="font-bold text-zinc-800">
                      {selectedUserForView.doctors.departments?.department_name || 'General Medicine'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-zinc-400 mb-0.5">Consultation Fee</span>
                    <span className="font-bold text-emerald-600">₹{selectedUserForView.doctors.consultation_fee}</span>
                  </div>
                  <div className="col-span-2 mt-1">
                    <span className="block text-zinc-400 mb-0.5">Qualifications</span>
                    <span className="font-semibold text-zinc-700">{selectedUserForView.doctors.qualification || 'MBBS'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-zinc-100 pt-4 flex justify-end">
              <button
                onClick={() => setSelectedUserForView(null)}
                className="px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-bold transition-colors"
              >
                Dismiss Details
              </button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Confirmation Dialog for Enabling/Disabling accounts */}
      <ConfirmationDialog
        isOpen={isToggleConfirmOpen}
        onClose={() => {
          setIsToggleConfirmOpen(false);
          setUserToToggle(null);
        }}
        onConfirm={handleToggleActive}
        isConfirming={isToggling}
        title={userToToggle?.is_active ? 'Disable Account Access' : 'Enable Account Access'}
        description={`Are you sure you want to ${userToToggle?.is_active ? 'DISABLE' : 'ENABLE'} the staff user account for ${userToToggle?.full_name}? The user will ${userToToggle?.is_active ? 'lose all entry permissions' : 'regain login access'} immediately.`}
        confirmText={userToToggle?.is_active ? 'Disable' : 'Enable'}
      />

      {/* Confirmation Dialog for Resetting Passwords */}
      <ConfirmationDialog
        isOpen={isResetConfirmOpen}
        onClose={() => {
          setIsResetConfirmOpen(false);
          setUserToReset(null);
        }}
        onConfirm={handleResetPassword}
        isConfirming={isResetting}
        title="Reset Account Password"
        description={`Are you sure you want to reset the password for ${userToReset?.full_name}? This action will record an administrative audit log.`}
        confirmText="Reset Password"
      />
    </div>
  );
}
