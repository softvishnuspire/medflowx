import React, { useEffect, useState } from 'react';
import { TableSkeleton } from '@/components/ui/skeleton';
import { getTodayQueue } from '@/services/reception';
import { useToast } from '@/components/ui/toast';
import { Clock, Eye, Printer, RefreshCw } from 'lucide-react-native';
import PrintTokenModal from '../visits/print-token-modal';
import { Dialog } from '@/components/ui/dialog';
import { View, Text, TouchableOpacity } from 'react-native';

export default function QueueView() {
  const [queue, setQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Dialog and print states
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [printDetails, setPrintDetails] = useState<any | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const loadQueue = async () => {
    try {
      setIsLoading(true);
      const data = await getTodayQueue();
      setQueue(data);
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to load today\'s queue', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handlePrintClick = (v: any) => {
    setPrintDetails({
      visitNumber: v.visit_number,
      patientName: `${v.patients?.first_name} ${v.patients?.last_name || ''}`.trim(),
      tokenNumber: v.token_no,
      doctorName: v.doctors?.profiles?.full_name || 'Dr. Practitioner',
      departmentName: v.doctors?.departments?.department_name || 'OPD Service',
      visitDate: v.visit_date,
    });
    setIsPrintOpen(true);
  };

  const handleViewClick = (v: any) => {
    setSelectedVisit(v);
    setIsDetailOpen(true);
  };

  return (
    <View className="gap-4 w-full">
      {/* Title Bar */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-black text-slate-900">Today's Live Queue</Text>
          <Text className="text-xs text-slate-500 font-medium mt-0.5">Real-time status updates of OPD token sequence</Text>
        </View>
        
        <TouchableOpacity
          onPress={loadQueue}
          className="flex-row items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/70 rounded-xl active:bg-slate-100 shadow-2xs"
        >
          <RefreshCw className="h-3.5 w-3.5 text-cyan-600" />
          <Text className="text-xs font-bold text-slate-700">Refresh</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="p-4 bg-white rounded-3xl border border-slate-100">
          <TableSkeleton cols={4} rows={4} />
        </View>
      ) : queue.length === 0 ? (
        <View className="items-center justify-center py-12 px-4 bg-white rounded-3xl border border-slate-100">
          <Clock className="h-10 w-10 text-cyan-600 mb-2" />
          <Text className="font-black text-slate-900 text-base">No Active Tokens</Text>
          <Text className="text-slate-500 text-xs text-center mt-1 font-medium">No OPD visits scheduled for today yet.</Text>
        </View>
      ) : (
        <View className="gap-3">
          {queue.map((v) => {
            let uiStatus: 'Waiting' | 'In Progress' | 'Completed' | 'Cancelled' = 'Waiting';
            if (v.status === 'In Progress') {
              uiStatus = 'In Progress';
            } else if (['Prescribed', 'Dispensed', 'Closed'].includes(v.status)) {
              uiStatus = 'Completed';
            } else if (v.status === 'Cancelled') {
              uiStatus = 'Cancelled';
            }

            const statusColors = {
              Waiting: 'bg-amber-50 border-amber-100 text-amber-800',
              'In Progress': 'bg-cyan-50 border-cyan-100 text-cyan-800',
              Completed: 'bg-emerald-50 border-emerald-100 text-emerald-800',
              Cancelled: 'bg-rose-50 border-rose-100 text-rose-800',
            };

            const patName = `${v.patients?.first_name} ${v.patients?.last_name || ''}`.trim();
            const docName = v.doctors?.profiles?.full_name || 'Practitioner';

            return (
              <View 
                key={v.id}
                className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm flex-row items-center justify-between"
              >
                {/* Token Badge */}
                <View className="flex-row items-center gap-3 flex-1 mr-2">
                  <View className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 items-center justify-center">
                    <Text className="text-[10px] font-black text-cyan-700 uppercase">TOKEN</Text>
                    <Text className="text-base font-black text-cyan-900">#{v.token_no}</Text>
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-0.5">
                      <Text className="font-black text-slate-900 text-sm">{patName}</Text>
                      <View className={`px-2 py-0.5 rounded-full border ${statusColors[uiStatus]}`}>
                        <Text className="text-[9px] font-extrabold">{uiStatus}</Text>
                      </View>
                    </View>

                    <Text className="text-xs text-slate-500 font-medium">
                      {docName}
                    </Text>
                    <Text className="text-[10px] font-mono font-extrabold text-slate-400 mt-0.5">
                      #{v.visit_number}
                    </Text>
                  </View>
                </View>

                {/* Queue Actions */}
                <View className="gap-2">
                  <TouchableOpacity
                    onPress={() => handleViewClick(v)}
                    className="flex-row items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200/70 rounded-xl active:bg-slate-100"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-700" />
                    <Text className="text-xs font-bold text-slate-800">Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handlePrintClick(v)}
                    className="flex-row items-center gap-1 px-3 py-1.5 bg-cyan-600 rounded-xl active:bg-cyan-700 shadow-2xs"
                  >
                    <Printer className="h-3.5 w-3.5 text-white" />
                    <Text className="text-xs font-bold text-white">Token</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Details Dialog */}
      <Dialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedVisit ? `Token Visit Details (#${selectedVisit.visit_number})` : 'Token Visit Details'}
      >
        {selectedVisit && (
          <View className="gap-3 py-2">
            <View className="p-3 bg-cyan-50 border border-cyan-100 rounded-2xl flex-row justify-between items-center">
              <View>
                <Text className="text-[10px] font-black text-slate-400 uppercase">Token Sequence</Text>
                <Text className="text-xl font-black text-cyan-900">Token #{selectedVisit.token_no}</Text>
              </View>
              <View className="items-end">
                <Text className="text-[10px] font-black text-slate-400 uppercase">Current Status</Text>
                <Text className="text-xs font-bold text-cyan-700">{selectedVisit.status}</Text>
              </View>
            </View>

            <View className="p-3.5 bg-slate-50 rounded-2xl gap-2">
              <View className="flex-row justify-between">
                <Text className="text-xs font-bold text-slate-500">Patient Name:</Text>
                <Text className="text-xs font-bold text-slate-900">{selectedVisit.patients?.first_name} {selectedVisit.patients?.last_name || ''}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs font-bold text-slate-500">Phone:</Text>
                <Text className="text-xs font-bold text-slate-900">{selectedVisit.patients?.phone}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs font-bold text-slate-500">Assigned Practitioner:</Text>
                <Text className="text-xs font-bold text-slate-900">{selectedVisit.doctors?.profiles?.full_name}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs font-bold text-slate-500">Chief Complaints:</Text>
                <Text className="text-xs font-bold text-slate-900 flex-1 text-right ml-2">{selectedVisit.chief_complaints || 'N/A'}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setIsDetailOpen(false)}
              className="w-full py-2.5 bg-slate-900 rounded-xl items-center active:bg-slate-800"
            >
              <Text className="text-white font-bold text-xs">Close Details</Text>
            </TouchableOpacity>
          </View>
        )}
      </Dialog>

      {/* Print Token Modal Component */}
      {printDetails && (
        <PrintTokenModal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          visitDetails={printDetails}
        />
      )}
    </View>
  );
}
