'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/components/ui/dialog';
import { 
  userCreateSchema, 
  userEditSchema, 
  UserCreateFormValues, 
  UserEditFormValues 
} from './schemas';
import { getAdminDepartments } from '@/services/admin';
import { Department } from '@/types/reception';
import { StaffUser } from '@/types/admin';
import { useToast } from '@/components/ui/toast';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: StaffUser) => void;
  userToEdit?: StaffUser | null;
  onSubmitAction: (values: any) => Promise<StaffUser>;
}

export default function UserFormModal({
  isOpen,
  onClose,
  onSuccess,
  userToEdit,
  onSubmitAction
}: UserFormModalProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const isEditMode = Boolean(userToEdit);

  // Define defaults
  const defaultValues = {
    full_name: userToEdit?.full_name || '',
    role: (userToEdit?.roles?.role_name as any) || 'Reception',
    department_id: userToEdit?.doctors?.department_id || null,
    qualification: userToEdit?.doctors?.qualification || '',
    consultation_fee: userToEdit?.doctors?.consultation_fee || 0,
    phone: userToEdit?.phone || '',
    email: userToEdit?.email || '',
    password: '',
    status: userToEdit?.is_active ? 'Active' : 'Disabled'
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<any>({
    resolver: zodResolver(isEditMode ? userEditSchema : userCreateSchema),
    defaultValues
  });

  const selectedRole = watch('role');

  // Reset form when modal opens/closes or target edit changes
  useEffect(() => {
    if (isOpen) {
      reset(defaultValues);
      
      // Load departments
      getAdminDepartments()
        .then(setDepartments)
        .catch((err) => {
          console.error(err);
          toast('Failed to load clinic departments', 'error');
        });
    }
  }, [isOpen, userToEdit, reset]);

  const onFormSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      // Clean up values
      const payload = { ...values };
      if (payload.role !== 'Doctor') {
        payload.department_id = null;
        payload.qualification = null;
        payload.consultation_fee = 0;
      } else {
        payload.department_id = Number(payload.department_id);
        payload.consultation_fee = Number(payload.consultation_fee);
      }

      if (isEditMode && !payload.password) {
        delete payload.password;
      }

      const result = await onSubmitAction(payload);
      toast(
        isEditMode 
          ? `Successfully updated staff account for ${result.full_name}` 
          : `Successfully created staff account for ${result.full_name}`,
        'success'
      );
      onSuccess(result);
      onClose();
    } catch (err: any) {
      console.error(err);
      let errorMsg = err.message || 'Operation failed. Please verify unique fields.';
      if (errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('limit exceeded')) {
        errorMsg = 'Email rate limit exceeded. Please wait a few minutes before trying again. Developer tip: Disable "Confirm Email" in your Supabase Dashboard (Authentication -> Providers -> Email -> Confirm email) to avoid hitting this limit during testing.';
      }
      toast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Staff User Account' : 'Create New Staff User Account'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 text-zinc-700">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Full Name *</label>
          <input
            type="text"
            {...register('full_name')}
            className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
              errors.full_name ? 'border-red-300 bg-red-50/10' : 'border-zinc-200'
            }`}
            placeholder="e.g. Dr. John Carter"
          />
          {errors.full_name && (
            <span className="text-[11px] text-red-500 mt-1 block font-medium">{String(errors.full_name.message)}</span>
          )}
        </div>

        {/* Role & Status Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Role *</label>
            <select
              {...register('role')}
              className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
                errors.role ? 'border-red-300' : 'border-zinc-200'
              }`}
            >
              <option value="Reception">Receptionist</option>
              <option value="Doctor">Doctor</option>
              <option value="Pharmacy">Pharmacy User</option>
            </select>
            {errors.role && (
              <span className="text-[11px] text-red-500 mt-1 block font-medium">{String(errors.role.message)}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Account Status *</label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>
        </div>

        {/* Doctor Fields (Rendered only if Doctor is selected) */}
        {selectedRole === 'Doctor' && (
          <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-150 space-y-4 animate-slide-in">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Doctor Clinical Setup</h4>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Department *</label>
                <select
                  {...register('department_id', { valueAsNumber: true })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20' ${
                    errors.department_id ? 'border-red-300' : 'border-zinc-200'
                  }`}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.department_name}</option>
                  ))}
                </select>
                {errors.department_id && (
                  <span className="text-[11px] text-red-500 mt-1 block font-medium">{String(errors.department_id.message)}</span>
                )}
              </div>

              {/* Consultation Fee */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Consultation Fee (₹) *</label>
                <input
                  type="number"
                  {...register('consultation_fee', { valueAsNumber: true })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20' ${
                    errors.consultation_fee ? 'border-red-300' : 'border-zinc-200'
                  }`}
                  placeholder="e.g. 500"
                />
                {errors.consultation_fee && (
                  <span className="text-[11px] text-red-500 mt-1 block font-medium">{String(errors.consultation_fee.message)}</span>
                )}
              </div>
            </div>

            {/* Qualification */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Qualifications *</label>
              <input
                type="text"
                {...register('qualification')}
                className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20' ${
                  errors.qualification ? 'border-red-300' : 'border-zinc-200'
                }`}
                placeholder="e.g. MBBS, MD - Cardiology"
              />
              {errors.qualification && (
                <span className="text-[11px] text-red-500 mt-1 block font-medium">{String(errors.qualification.message)}</span>
              )}
            </div>
          </div>
        )}

        {/* Contact Info Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Phone Number *</label>
            <input
              type="text"
              {...register('phone')}
              className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
                errors.phone ? 'border-red-300 bg-red-50/10' : 'border-zinc-200'
              }`}
              placeholder="e.g. 9876543210"
            />
            {errors.phone && (
              <span className="text-[11px] text-red-500 mt-1 block font-medium">{String(errors.phone.message)}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Email Address *</label>
            <input
              type="email"
              {...register('email')}
              className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
                errors.email ? 'border-red-300 bg-red-50/10' : 'border-zinc-200'
              }`}
              placeholder="e.g. john@medflowx.com"
            />
            {errors.email && (
              <span className="text-[11px] text-red-500 mt-1 block font-medium">{String(errors.email.message)}</span>
            )}
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">
            Password {isEditMode ? '(Leave blank to keep current)' : '*'}
          </label>
          <input
            type="password"
            {...register('password')}
            className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
              errors.password ? 'border-red-300 bg-red-50/10' : 'border-zinc-200'
            }`}
            placeholder="••••••••"
          />
          {errors.password && (
            <span className="text-[11px] text-red-500 mt-1 block font-medium">{String(errors.password.message)}</span>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-zinc-250 hover:bg-zinc-50 text-zinc-700 rounded-lg text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm inline-flex items-center"
          >
            {isSubmitting && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {isEditMode ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
