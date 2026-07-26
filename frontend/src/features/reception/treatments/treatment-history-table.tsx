'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { Treatment, DiagnosisType, TreatmentPaymentMode } from '@/types/reception';
import { getTreatmentsList, updateTreatment, deleteTreatment } from '@/services/reception';
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
  AlertTriangle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

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

  // Delete Modal State
  const [deletingTreatment, setDeletingTreatment] = useState<Treatment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      setIsDeleting(true);
      await deleteTreatment(deletingTreatment.id);
      toast(`Treatment record ${deletingTreatment.treatment_number} deleted`, 'success');
      setDeletingTreatment(null);
      fetchTreatments();
    } catch (err: any) {
      console.error('Failed to delete treatment:', err);
      toast(err.message || 'Failed to delete treatment record', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Statistics calculation
  const totalCount = treatments.length;
  const hairCount = treatments.filter((t) => t.diagnosis_type === 'Hair Diagnosis').length;
  const skinCount = treatments.filter((t) => t.diagnosis_type === 'Skin Diagnosis').length;
  const bothCount = treatments.filter((t) => t.diagnosis_type === 'Both Hair & Skin').length;
  const totalRevenue = treatments.reduce((sum, t) => sum + Number(t.treatment_amount), 0);

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-body">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border border-zinc-150 shadow-sm rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-heading">
                Total Treatments
              </span>
              <div className="text-2xl font-black text-zinc-900 mt-1 font-heading">{totalCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-zinc-150 shadow-sm rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-heading">
                Hair Treatments
              </span>
              <div className="text-2xl font-black text-amber-600 mt-1 font-heading">{hairCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Scissors className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-zinc-150 shadow-sm rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-heading">
                Skin / Both Care
              </span>
              <div className="text-2xl font-black text-sky-600 mt-1 font-heading">{skinCount + bothCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-zinc-150 shadow-sm rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-heading">
                Treatment Revenue
              </span>
              <div className="text-2xl font-black text-emerald-600 mt-1 font-heading">
                ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Table Container */}
      <Card className="bg-white border border-zinc-150 shadow-sm rounded-xl overflow-hidden">
        {/* Table Top Controls */}
        <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by Patient Name, Code, Treatment Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white text-zinc-800 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={fetchTreatments}
              className="p-2 border border-zinc-200 hover:bg-zinc-50 rounded-lg text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
              title="Refresh List"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {onAddNewClick && (
              <button
                onClick={onAddNewClick}
                className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                + New Treatment
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : treatments.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-800 font-heading">No Treatment Records Found</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                No patient treatment records match your search filter or none have been recorded yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50/80">
                  <TableRow className="border-b border-zinc-150">
                    <TableHead className="font-bold text-zinc-700 text-xs font-heading">Treatment ID</TableHead>
                    <TableHead className="font-bold text-zinc-700 text-xs font-heading">Patient Code & Name</TableHead>
                    <TableHead className="font-bold text-zinc-700 text-xs font-heading">Treatment Name</TableHead>
                    <TableHead className="font-bold text-zinc-700 text-xs font-heading">Diagnosis Type</TableHead>
                    <TableHead className="font-bold text-zinc-700 text-xs font-heading">Amount (₹)</TableHead>
                    <TableHead className="font-bold text-zinc-700 text-xs font-heading">Payment Mode</TableHead>
                    <TableHead className="font-bold text-zinc-700 text-xs font-heading">Date & Time</TableHead>
                    <TableHead className="font-bold text-zinc-700 text-xs font-heading text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {treatments.map((item) => {
                    const patName = item.patients
                      ? `${item.patients.first_name} ${item.patients.last_name || ''}`
                      : 'Selected Patient';
                    const patCode = item.patients ? item.patients.patient_code : `ID #${item.patient_id}`;

                    const typeBadgeStyles = {
                      'Hair Diagnosis': 'bg-amber-50 text-amber-700 border-amber-200',
                      'Skin Diagnosis': 'bg-sky-50 text-sky-700 border-sky-200',
                      'Both Hair & Skin': 'bg-purple-50 text-purple-700 border-purple-200',
                    };

                    const typeBadgeColor = typeBadgeStyles[item.diagnosis_type] || 'bg-zinc-100 text-zinc-700';

                    return (
                      <TableRow key={item.id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                        <TableCell className="font-mono text-xs font-bold text-primary">
                          {item.treatment_number}
                        </TableCell>

                        <TableCell>
                          <div className="font-bold text-xs text-zinc-900">{patName}</div>
                          <div className="font-mono text-[11px] text-zinc-400">{patCode}</div>
                        </TableCell>

                        <TableCell className="font-semibold text-xs text-zinc-800">
                          {item.diagnosis_name}
                        </TableCell>

                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${typeBadgeColor}`}>
                            {item.diagnosis_type}
                          </span>
                        </TableCell>

                        <TableCell className="font-mono text-xs font-bold text-zinc-900">
                          ₹{Number(item.treatment_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>

                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                            {item.payment_mode}
                          </span>
                        </TableCell>

                        <TableCell className="text-xs text-zinc-500 font-medium">
                          {new Date(item.created_at).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Receipt Button */}
                            <button
                              onClick={() => setSelectedReceipt(item)}
                              className="px-2 py-1 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg border border-primary/20 transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Print Receipt"
                            >
                              <Receipt className="w-3.5 h-3.5" /> Receipt
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-xs font-bold text-zinc-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg border border-zinc-200 hover:border-amber-200 transition-colors cursor-pointer"
                              title="Edit Treatment Record"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => setDeletingTreatment(item)}
                              className="p-1.5 text-xs font-bold text-zinc-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-zinc-200 hover:border-red-200 transition-colors cursor-pointer"
                              title="Delete Treatment Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EDIT TREATMENT MODAL */}
      {editingTreatment && (
        <div className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-zinc-150 animate-in fade-in zoom-in duration-150 font-body">
            {/* Header */}
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <Pencil className="w-4.5 h-4.5 text-primary" />
                <span className="font-bold text-sm text-zinc-900 font-heading">
                  Edit Treatment Record ({editingTreatment.treatment_number})
                </span>
              </div>
              <button
                onClick={() => setEditingTreatment(null)}
                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-200 text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="p-6 space-y-4">
              {/* Patient Banner */}
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs flex justify-between items-center">
                <div>
                  <span className="text-zinc-400 font-medium">Patient:</span>{' '}
                  <span className="font-bold text-zinc-900">
                    {editingTreatment.patients
                      ? `${editingTreatment.patients.first_name} ${editingTreatment.patients.last_name || ''}`
                      : 'Selected Patient'}
                  </span>
                </div>
                <div className="font-mono text-zinc-500 font-semibold">
                  {editingTreatment.patients?.patient_code}
                </div>
              </div>

              {/* Treatment Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 font-heading">
                  Treatment Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. PRP Hair Therapy, Laser Skin Resurfacing..."
                  value={editDiagnosisName}
                  onChange={(e) => setEditDiagnosisName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-zinc-250 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Diagnosis Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 font-heading">
                  Diagnosis Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Hair Diagnosis', 'Skin Diagnosis', 'Both Hair & Skin'] as DiagnosisType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditDiagnosisType(t)}
                      className={`p-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        editDiagnosisType === t
                          ? 'border-primary bg-primary/10 text-primary shadow-xs'
                          : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Treatment Amount */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 font-heading">
                  Treatment Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-3.5 py-2 border border-zinc-250 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Payment Mode */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 font-heading">
                  Mode of Payment <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Cash', 'UPI', 'Debit/Credit Card'] as TreatmentPaymentMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setEditPaymentMode(m)}
                      className={`p-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        editPaymentMode === m
                          ? 'border-primary bg-primary/10 text-primary shadow-xs'
                          : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {editError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  {editError}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTreatment(null)}
                className="px-4 py-2 border border-zinc-250 text-zinc-700 font-semibold rounded-xl text-xs hover:bg-zinc-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-primary hover:opacity-90 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingEdit ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingTreatment && (
        <div className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-zinc-150 animate-in fade-in zoom-in duration-150 font-body">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-zinc-900 font-heading">Delete Treatment Record?</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Are you sure you want to delete treatment record{' '}
                  <span className="font-mono font-bold text-zinc-800">{deletingTreatment.treatment_number}</span> for{' '}
                  <span className="font-bold text-zinc-900">
                    {deletingTreatment.patients
                      ? `${deletingTreatment.patients.first_name} ${deletingTreatment.patients.last_name || ''}`
                      : 'this patient'}
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-left text-xs space-y-1">
                <div>
                  <span className="text-zinc-400 font-medium">Treatment Name:</span>{' '}
                  <span className="font-semibold text-zinc-800">{deletingTreatment.diagnosis_name}</span>
                </div>
                <div>
                  <span className="text-zinc-400 font-medium">Amount:</span>{' '}
                  <span className="font-bold text-zinc-900">
                    ₹{Number(deletingTreatment.treatment_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingTreatment(null)}
                className="px-4 py-2 border border-zinc-250 text-zinc-700 font-semibold rounded-xl text-xs hover:bg-zinc-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-zinc-150 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <Receipt className="w-4.5 h-4.5 text-primary" />
                <span className="font-bold text-sm text-zinc-900 font-heading">Treatment Billing Receipt</span>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-200 text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Receipt Area */}
            <div className="p-6 space-y-4 font-body" id="printable-receipt">
              <div className="text-center border-b border-dashed border-zinc-200 pb-4">
                <h2 className="text-xl font-black tracking-tight text-zinc-900 font-heading">Medflow<span className="text-primary">X</span> Clinic</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Specialized Hair & Skin Care Center</p>
                <div className="mt-2 font-mono text-[11px] font-bold text-zinc-600 bg-zinc-100 py-1 px-2 rounded inline-block">
                  Receipt #: {selectedReceipt.treatment_number}
                </div>
              </div>

              {/* Patient & Date Details */}
              <div className="text-xs space-y-1.5 text-zinc-700 border-b border-dashed border-zinc-200 pb-3">
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-medium">Patient Code:</span>
                  <span className="font-mono font-bold text-zinc-900">
                    {selectedReceipt.patients?.patient_code || `ID #${selectedReceipt.patient_id}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-medium">Patient Name:</span>
                  <span className="font-bold text-zinc-900">
                    {selectedReceipt.patients
                      ? `${selectedReceipt.patients.first_name} ${selectedReceipt.patients.last_name || ''}`
                      : 'Selected Patient'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-medium">Date & Time:</span>
                  <span className="font-semibold text-zinc-700">
                    {new Date(selectedReceipt.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Treatment Particulars */}
              <div className="text-xs space-y-2 border-b border-dashed border-zinc-200 pb-4">
                <div className="font-bold text-zinc-800 uppercase tracking-wider font-heading text-[10px]">
                  Particulars & Diagnosis
                </div>
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-150 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-zinc-900 text-sm">{selectedReceipt.diagnosis_name}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">Category: {selectedReceipt.diagnosis_type}</div>
                  </div>
                  <div className="font-mono font-bold text-zinc-900 text-sm">
                    ₹{Number(selectedReceipt.treatment_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Total & Payment Method */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-medium">Payment Mode:</span>
                  <span className="font-bold text-zinc-800">{selectedReceipt.payment_mode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-medium">Payment Status:</span>
                  <span className="font-bold text-emerald-600">Paid / Verified</span>
                </div>
                <div className="flex justify-between items-center pt-2 text-sm border-t border-zinc-200 font-bold">
                  <span className="text-zinc-900">Total Paid Amount:</span>
                  <span className="font-black text-emerald-700 text-lg">
                    ₹{Number(selectedReceipt.treatment_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 border border-zinc-250 hover:bg-zinc-100 text-zinc-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handlePrintReceipt}
                className="px-5 py-2 bg-primary hover:opacity-90 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
