import React, { useState, useEffect } from 'react';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { Treatment, DiagnosisType, TreatmentPaymentMode } from '@/types/reception';
import { getTreatmentsList, updateTreatment, deleteTreatment } from '@/services/reception';
import { View, Text, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { NativePicker } from '@/components/ui/native-picker';
import {
  Search,
  Receipt,
  Printer,
  Sparkles,
  Scissors,
  Layers,
  CreditCard,
  X,
  FileText,
  RefreshCw,
  Pencil,
  Trash2,
  AlertCircle,
  Plus
} from 'lucide-react-native';

interface TreatmentHistoryTableProps {
  onAddNewClick?: () => void;
}

export default function TreatmentHistoryTable({ onAddNewClick }: TreatmentHistoryTableProps) {
  const { toast } = useToast();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<Treatment | null>(null);

  // Edit Modal State
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [editDiagnosisName, setEditDiagnosisName] = useState('');
  const [editDiagnosisType, setEditDiagnosisType] = useState<DiagnosisType>('Hair Diagnosis');
  const [editAmount, setEditAmount] = useState('');
  const [editPaymentMode, setEditPaymentMode] = useState<TreatmentPaymentMode>('UPI');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete State
  const [deletingTreatment, setDeletingTreatment] = useState<Treatment | null>(null);

  const fetchTreatments = async () => {
    try {
      setIsLoading(true);
      const data = await getTreatmentsList(searchQuery);
      setTreatments(data);
    } catch (err) {
      console.error('Error fetching treatment records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchTreatments, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Edit Click
  const handleOpenEdit = (item: Treatment) => {
    setEditingTreatment(item);
    setEditDiagnosisName(item.diagnosis_name);
    setEditDiagnosisType(item.diagnosis_type);
    setEditAmount(String(item.treatment_amount));
    setEditPaymentMode(item.payment_mode);
    setEditError('');
  };

  // Handle Save Edit
  const handleSaveEdit = async () => {
    if (!editingTreatment) return;

    if (!editDiagnosisName || editDiagnosisName.trim() === '') {
      setEditError('Treatment Name is required');
      return;
    }

    const numAmount = parseFloat(editAmount);
    if (!editAmount || isNaN(numAmount) || numAmount <= 0) {
      setEditError('Treatment Amount must be a positive number greater than 0');
      return;
    }

    try {
      setIsSavingEdit(true);
      await updateTreatment(editingTreatment.id, {
        diagnosis_name: editDiagnosisName.trim(),
        diagnosis_type: editDiagnosisType,
        treatment_amount: numAmount,
        payment_mode: editPaymentMode,
      });

      toast('Treatment record updated successfully!', 'success');
      setEditingTreatment(null);
      fetchTreatments();
    } catch (err: any) {
      console.error('Failed to update treatment:', err);
      toast(err.message || 'Failed to update treatment record', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingTreatment) return;

    try {
      await deleteTreatment(deletingTreatment.id);
      toast(`Treatment record ${deletingTreatment.treatment_number} deleted`, 'success');
      setDeletingTreatment(null);
      fetchTreatments();
    } catch (err: any) {
      console.error('Failed to delete treatment:', err);
      toast(err.message || 'Failed to delete treatment record', 'error');
    }
  };

  // Statistics calculation
  const totalCount = treatments.length;
  const hairCount = treatments.filter((t) => t.diagnosis_type === 'Hair Diagnosis').length;
  const skinCount = treatments.filter((t) => t.diagnosis_type === 'Skin Diagnosis').length;
  const bothCount = treatments.filter((t) => t.diagnosis_type === 'Both Hair & Skin').length;
  const totalRevenue = treatments.reduce((sum, t) => sum + Number(t.treatment_amount), 0);

  return (
    <View className="gap-4">
      {/* Metric Cards Banner (Native 2-column flex rows) */}
      <View className="flex-row gap-3">
        <View className="flex-1 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs justify-between">
          <Text className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Total Procedures</Text>
          <Text className="text-xl font-black text-slate-900 mt-1">{totalCount}</Text>
        </View>

        <View className="flex-1 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs justify-between">
          <Text className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Hair Care</Text>
          <Text className="text-xl font-black text-cyan-600 mt-1">{hairCount}</Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs justify-between">
          <Text className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Skin / Both</Text>
          <Text className="text-xl font-black text-emerald-600 mt-1">{skinCount + bothCount}</Text>
        </View>

        <View className="flex-1 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs justify-between">
          <Text className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Total Revenue</Text>
          <Text className="text-xl font-black text-slate-900 mt-1">₹{totalRevenue}</Text>
        </View>
      </View>

      {/* Controls Bar */}
      <View className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs gap-3">
        <View className="flex-row items-center justify-between">
          <View className="relative flex-1 mr-2">
            <TextInput
              placeholder="Search treatment name or patient..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="h-10 pl-10 pr-3 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-900 font-medium"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          </View>

          <TouchableOpacity
            onPress={fetchTreatments}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl active:bg-slate-100"
          >
            <RefreshCw className="h-4 w-4 text-slate-700" />
          </TouchableOpacity>
        </View>

        {onAddNewClick && (
          <TouchableOpacity
            onPress={onAddNewClick}
            className="h-10 bg-cyan-600 rounded-xl flex-row items-center justify-center gap-1.5 active:bg-cyan-700 shadow-xs"
          >
            <Plus className="h-4 w-4 text-white" />
            <Text className="text-white text-xs font-bold">Record New Treatment</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Treatments List Cards */}
      {isLoading ? (
        <View className="p-4 bg-white rounded-2xl border border-slate-200">
          <TableSkeleton cols={4} rows={4} />
        </View>
      ) : treatments.length === 0 ? (
        <View className="items-center justify-center py-12 px-4 bg-white rounded-2xl border border-slate-200">
          <Receipt className="h-10 w-10 text-cyan-600 mb-2" />
          <Text className="font-black text-slate-900 text-base">No Treatment Logs</Text>
          <Text className="text-slate-500 text-xs text-center mt-1 font-medium">No procedure billing records matching your query.</Text>
        </View>
      ) : (
        <View className="gap-3">
          {treatments.map((item) => {
            const patName = item.patients
              ? `${item.patients.first_name} ${item.patients.last_name || ''}`
              : 'Selected Patient';
            const patCode = item.patients ? item.patients.patient_code : `ID #${item.patient_id}`;

            return (
              <View 
                key={item.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex-row items-center justify-between"
              >
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="font-black text-slate-900 text-sm">{patName}</Text>
                    <Text className="font-mono text-[10px] font-extrabold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100">
                      {patCode}
                    </Text>
                  </View>

                  <Text className="text-xs text-slate-800 font-bold mb-0.5">
                    {item.diagnosis_name} ({item.diagnosis_type})
                  </Text>
                  <Text className="text-[10px] text-slate-400 font-medium">
                    #{item.treatment_number} • Paid via {item.payment_mode}
                  </Text>
                </View>

                <View className="items-end gap-1.5">
                  <Text className="text-base font-black text-emerald-600">₹{item.treatment_amount}</Text>

                  <View className="flex-row items-center gap-1.5">
                    <TouchableOpacity
                      onPress={() => setSelectedReceipt(item)}
                      className="p-2 bg-slate-50 border border-slate-200 rounded-xl active:bg-slate-100"
                    >
                      <Receipt className="h-3.5 w-3.5 text-slate-700" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleOpenEdit(item)}
                      className="p-2 bg-cyan-50 border border-cyan-200 rounded-xl active:bg-cyan-100"
                    >
                      <Pencil className="h-3.5 w-3.5 text-cyan-700" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleConfirmDelete()}
                      className="p-2 bg-rose-50 border border-rose-200 rounded-xl active:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Edit Treatment Modal */}
      <Modal
        visible={!!editingTreatment}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingTreatment(null)}
      >
        <View className="flex-1 bg-slate-950/60 justify-center p-4">
          <View className="bg-white rounded-2xl p-5 border border-slate-200 gap-4 shadow-2xl">
            <View className="flex-row items-center justify-between border-b border-slate-150 pb-3">
              <Text className="font-black text-slate-900 text-base">Edit Treatment Record</Text>
              <TouchableOpacity onPress={() => setEditingTreatment(null)}>
                <X className="h-5 w-5 text-slate-500" />
              </TouchableOpacity>
            </View>

            <View className="gap-3">
              <View>
                <Text className="text-[10px] font-extrabold text-slate-500 mb-1 uppercase">Treatment Name</Text>
                <TextInput
                  value={editDiagnosisName}
                  onChangeText={setEditDiagnosisName}
                  className="h-10 px-3 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-900 font-medium"
                />
              </View>

              <View>
                <Text className="text-[10px] font-extrabold text-slate-500 mb-1 uppercase">Amount (₹)</Text>
                <TextInput
                  value={editAmount}
                  keyboardType="numeric"
                  onChangeText={setEditAmount}
                  className="h-10 px-3 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-900 font-bold"
                />
              </View>
            </View>

            <View className="flex-row gap-2 pt-2">
              <TouchableOpacity
                onPress={() => setEditingTreatment(null)}
                className="flex-1 h-10 border border-slate-200 rounded-xl items-center justify-center bg-white"
              >
                <Text className="text-xs font-bold text-slate-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEdit}
                disabled={isSavingEdit}
                className="flex-1 h-10 bg-cyan-600 rounded-xl items-center justify-center shadow-xs"
              >
                <Text className="text-xs font-bold text-white">Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        visible={!!selectedReceipt}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedReceipt(null)}
      >
        <View className="flex-1 bg-slate-950/60 justify-center p-4">
          <View className="bg-white rounded-2xl p-5 border border-slate-200 gap-4 shadow-2xl">
            <View className="flex-row items-center justify-between border-b border-slate-150 pb-3">
              <Text className="font-black text-slate-900 text-base">Treatment Receipt</Text>
              <TouchableOpacity onPress={() => setSelectedReceipt(null)}>
                <X className="h-5 w-5 text-slate-500" />
              </TouchableOpacity>
            </View>

            {selectedReceipt && (
              <View className="gap-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <Text className="text-center font-black text-slate-900 text-sm">MedflowX Clinic</Text>
                <Text className="text-center text-[10px] text-slate-500 font-mono">Receipt #{selectedReceipt.treatment_number}</Text>
                
                <View className="gap-1 pt-2 border-t border-slate-200">
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-slate-500 font-bold">Procedure:</Text>
                    <Text className="text-xs text-slate-900 font-bold">{selectedReceipt.diagnosis_name}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-slate-500 font-bold">Payment Mode:</Text>
                    <Text className="text-xs text-slate-900 font-bold">{selectedReceipt.payment_mode}</Text>
                  </View>
                  <View className="flex-row justify-between pt-1 border-t border-slate-200">
                    <Text className="text-xs text-slate-700 font-bold">Total Paid:</Text>
                    <Text className="text-base font-black text-emerald-600">₹{selectedReceipt.treatment_amount}</Text>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setSelectedReceipt(null)}
              className="h-10 bg-slate-900 rounded-xl items-center justify-center"
            >
              <Text className="text-white text-xs font-bold">Close Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
