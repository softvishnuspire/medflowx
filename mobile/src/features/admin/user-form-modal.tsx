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
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { NativePicker } from '@/components/ui/native-picker';

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
      maxWidth="md"
    >
      <View className="space-y-4 text-zinc-700">
        {/* Full Name */}
        <View>
          <Text className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Full Name *</Text>
          <TextInput
            {...register('full_name')}
            className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
              errors.full_name ? 'border-red-300 bg-red-50/10' : 'border-zinc-200'
            }`}
            placeholder="e.g. Dr. John Carter"
          />
          {errors.full_name && (
            <Text className="text-[11px] text-red-500 mt-1 block font-medium">{String(errors.full_name.message)}</Text>
          )}
        </View>

        {/* Role & Status Row */}
        <View className="grid grid-cols-2 gap-4">
          <View>
            <Text className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Role *</Text>
            <NativePicker
              value={watch('role') || 'Reception'}
              onValueChange={(val: any) => setValue('role', val, { shouldValidate: true })}
              placeholder="Select Role"
              options={[
                { label: 'Receptionist', value: 'Reception' },
                { label: 'Doctor', value: 'Doctor' },
                { label: 'Pharmacy User', value: 'Pharmacy' },
              ]}
              className={errors.role ? 'border-red-300' : 'border-zinc-200'}
            />
            {errors.role && (
              <Text className="text-[11px] text-red-500 mt-1 block font-medium">{String(errors.role.message)}</Text>
            )}
          </View>

          <View>
            <Text className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Account Status *</Text>
            <NativePicker
              value={watch('status') || 'Active'}
              onValueChange={(val: any) => setValue('status', val, { shouldValidate: true })}
              placeholder="Select Status"
              options={[
                { label: 'Active', value: 'Active' },
                { label: 'Disabled', value: 'Disabled' },
              ]}
              className="border-zinc-200"
            />
          </View>
        </View>

        {/* Doctor Fields (Rendered only if Doctor is selected) */}
        {selectedRole === 'Doctor' && (
          <View className="p-4 bg-zinc-50 rounded-xl border border-zinc-150 space-y-4 animate-slide-in">
            <Text className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Doctor Clinical Setup</Text>
            
            <View className="grid grid-cols-2 gap-4">
              {/* Department */}
              <View>
                <Text className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Department *</Text>
                <NativePicker
                  value={String(watch('department_id') || '')}
                  onValueChange={(val: any) => setValue('department_id', val ? Number(val) : null, { shouldValidate: true })}
                  placeholder="Select Department"
                  options={[
                    { label: 'Select Department', value: '' },
                    ...departments.map(dept => ({ label: dept.department_name, value: String(dept.id) }))
                  ]}
                  className={errors.department_id ? 'border-red-300' : 'border-zinc-200'}
                />
                {errors.department_id && (
                  <Text className="text-[11px] text-red-500 mt-1 block font-medium">{String(errors.department_id.message)}</Text>
                )}
              </View>

              {/* Consultation Fee */}
              <View>
                <Text className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Consultation Fee (₹) *</Text>
                <TextInput
                  {...register('consultation_fee', { valueAsNumber: true })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20' ${
                    errors.consultation_fee ? 'border-red-300' : 'border-zinc-200'
                  }`}
                  placeholder="e.g. 500"
                />
                {errors.consultation_fee && (
                  <Text className="text-[11px] text-red-500 mt-1 block font-medium">{String(errors.consultation_fee.message)}</Text>
                )}
              </View>
            </View>

            {/* Qualification */}
            <View>
              <Text className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Qualifications *</Text>
              <TextInput
                {...register('qualification')}
                className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20' ${
                  errors.qualification ? 'border-red-300' : 'border-zinc-200'
                }`}
                placeholder="e.g. MD - Dermatology & Trichology"
              />
              {errors.qualification && (
                <Text className="text-[11px] text-red-500 mt-1 block font-medium">{String(errors.qualification.message)}</Text>
              )}
            </View>
          </View>
        )}

        {/* Contact Info Row */}
        <View className="grid grid-cols-2 gap-4">
          <View>
            <Text className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Phone Number *</Text>
            <TextInput
              {...register('phone')}
              className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
                errors.phone ? 'border-red-300 bg-red-50/10' : 'border-zinc-200'
              }`}
              placeholder="e.g. 9876543210"
            />
            {errors.phone && (
              <Text className="text-[11px] text-red-500 mt-1 block font-medium">{String(errors.phone.message)}</Text>
            )}
          </View>

          <View>
            <Text className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Email Address *</Text>
            <TextInput
              {...register('email')}
              className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
                errors.email ? 'border-red-300 bg-red-50/10' : 'border-zinc-200'
              }`}
              placeholder="e.g. john@medflowx.com"
            />
            {errors.email && (
              <Text className="text-[11px] text-red-500 mt-1 block font-medium">{String(errors.email.message)}</Text>
            )}
          </View>
        </View>

        {/* Password */}
        <View>
          <Text className="block text-xs font-semibold text-zinc-500 uppercase mb-1">
            Password {isEditMode ? '(Leave blank to keep current)' : '*'}
          </Text>
          <TextInput
            {...register('password')}
            className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${
              errors.password ? 'border-red-300 bg-red-50/10' : 'border-zinc-200'
            }`}
            placeholder="••••••••"
          />
          {errors.password && (
            <Text className="text-[11px] text-red-500 mt-1 block font-medium">{String(errors.password.message)}</Text>
          )}
        </View>

        {/* Footer Actions */}
        <View className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-4 mt-6">
          <TouchableOpacity
            onPress={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-zinc-250 hover:bg-zinc-50 text-zinc-700 rounded-lg text-sm font-semibold transition-colors"
          >
            <Text>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit(onFormSubmit)}
            disabled={isSubmitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm inline-flex items-center flex-row"
          >
            {isSubmitting && (
              <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
            )}
            <Text className="text-white font-semibold">{isEditMode ? 'Save Changes' : 'Create User'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Dialog>
  );
}
