import React, { useEffect, useState } from 'react';
import { TableSkeleton } from '@/components/ui/skeleton';
import { getPendingInvoices } from '@/services/reception';
import { useToast } from '@/components/ui/toast';
import { Receipt, IndianRupee, RefreshCw, ChevronRight, User } from 'lucide-react-native';
import { View, Text, TouchableOpacity } from 'react-native';

interface BillingInvoicesListProps {
  onSelectInvoice: (invoiceDetails: {
    visitId: number;
    invoiceId: number;
    amount: number;
    patientName: string;
    visitNumber: string;
  }) => void;
}

export default function BillingInvoicesList({ onSelectInvoice }: BillingInvoicesListProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await getPendingInvoices();
      setInvoices(data);
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to load pending invoices', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  return (
    <View className="space-y-4">
      {/* Title Bar */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-black text-zinc-900">Pending Billing</Text>
          <Text className="text-xs text-zinc-500 font-medium">Unpaid consultation fees for today's visits</Text>
        </View>
        
        <TouchableOpacity
          onPress={loadInvoices}
          className="flex-row items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg active:bg-zinc-100"
        >
          <RefreshCw className="h-3.5 w-3.5 text-zinc-600" />
          <Text className="text-xs font-bold text-zinc-700">Refresh</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="p-4 bg-white rounded-xl border border-zinc-200">
          <TableSkeleton cols={4} rows={4} />
        </View>
      ) : invoices.length === 0 ? (
        <View className="items-center justify-center py-12 px-4 bg-white rounded-xl border border-zinc-200">
          <Receipt className="h-10 w-10 text-sky-500 mb-2" />
          <Text className="font-bold text-zinc-900 text-base">No Pending Bills</Text>
          <Text className="text-zinc-500 text-xs text-center mt-1">All OPD consultation fees have been paid.</Text>
        </View>
      ) : (
        <View className="gap-2.5">
          {invoices.map((inv) => {
            const patName = `${inv.patients?.first_name} ${inv.patients?.last_name || ''}`.trim();
            const visitNum = inv.visits?.visit_number || 'OPD-VISIT';

            return (
              <View 
                key={inv.id}
                className="p-4 bg-white rounded-xl border border-zinc-200 shadow-xs flex-row items-center justify-between"
              >
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="font-black text-zinc-900 text-sm">{patName}</Text>
                    <View className="px-2 py-0.5 rounded-full bg-red-50 border border-red-200">
                      <Text className="text-[9px] font-bold text-red-600">Unpaid</Text>
                    </View>
                  </View>

                  <Text className="text-xs text-zinc-500 font-medium">
                    {inv.visits?.doctors?.profiles?.full_name || 'Dr. Practitioner'}
                  </Text>
                  <Text className="text-[10px] font-mono font-bold text-zinc-400 mt-0.5">#{inv.invoice_number} • #{visitNum}</Text>
                </View>

                {/* Amount & Collect Button */}
                <View className="items-end gap-1.5">
                  <Text className="font-black text-emerald-600 text-base">₹{inv.final_amount}</Text>
                  
                  <TouchableOpacity
                    onPress={() => onSelectInvoice({
                      visitId: inv.visit_id,
                      invoiceId: inv.id,
                      amount: Number(inv.final_amount),
                      patientName: patName,
                      visitNumber: visitNum,
                    })}
                    className="flex-row items-center gap-1 px-3 py-1.5 bg-emerald-600 rounded-lg active:bg-emerald-700 shadow-xs"
                  >
                    <IndianRupee className="h-3.5 w-3.5 text-white" />
                    <Text className="text-xs font-bold text-white">Pay Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

