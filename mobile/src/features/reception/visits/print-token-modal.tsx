import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react-native';
import { View, Text, Alert } from 'react-native';

interface PrintTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitDetails: {
    clinicName?: string;
    visitNumber: string;
    patientName: string;
    tokenNumber: number;
    doctorName: string;
    departmentName: string;
    visitDate: string;
  } | null;
}

export default function PrintTokenModal({ isOpen, onClose, visitDetails }: PrintTokenModalProps) {
  if (!visitDetails) return null;

  const handlePrint = () => {
    Alert.alert('Print Token', 'Printing is not supported on mobile. Please use the web version to print token slips.');
  };

  const {
    clinicName = 'MedflowX Family Clinic',
    visitNumber,
    patientName,
    tokenNumber,
    doctorName,
    departmentName,
    visitDate,
  } = visitDetails;

  const formattedDate = new Date(visitDate).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      footer={
        <View className="flex-row gap-2 w-full justify-end">
          <Button variant="outline" size="sm" onPress={onClose}>
            <Text>Close</Text>
          </Button>
          <Button variant="primary" size="sm" onPress={handlePrint}>
            <View className="flex-row items-center gap-1.5">
              <Printer className="h-4.5 w-4.5" color="#fff" />
              <Text className="text-white">Print Token</Text>
            </View>
          </Button>
        </View>
      }
    >
      {/* Token Slip Container */}
      <View className="flex flex-col items-center justify-center p-4">
        {/* Token Slip Card */}
        <View className="w-full border border-zinc-200 p-6 rounded-lg bg-zinc-50/20 space-y-4 shadow-sm">
          <View className="text-center border-b border-dashed border-zinc-200 pb-3">
            <Text className="text-sm font-extrabold text-zinc-950 uppercase tracking-wide">{clinicName}</Text>
            <Text className="text-[10px] text-zinc-500 mt-0.5">OPD VISIT SLIP</Text>
          </View>

          {/* Large Token display */}
          <View className="text-center py-2 border-b border-dashed border-zinc-200">
            <Text className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Token Number</Text>
            <Text className="text-5xl font-extrabold text-zinc-950 tracking-tight block mt-1">{tokenNumber}</Text>
          </View>

          <View className="space-y-2 text-xs">
            <View className="flex-row justify-between">
              <Text className="text-zinc-400">Visit Code:</Text>
              <Text className="font-mono font-bold text-zinc-850">{visitNumber}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-zinc-400">Patient:</Text>
              <Text className="font-semibold text-zinc-800">{patientName}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-zinc-400">Department:</Text>
              <Text className="font-semibold text-zinc-800">{departmentName}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-zinc-400">Consultant:</Text>
              <Text className="font-semibold text-zinc-800">{doctorName}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-zinc-400">Date/Time:</Text>
              <Text className="text-zinc-800 font-medium">{formattedDate}</Text>
            </View>
          </View>

          {/* Footer */}
          <View className="flex flex-col items-center justify-center pt-2 border-t border-dashed border-zinc-200">
            <Text className="text-[8px] text-zinc-400 mt-2">Present this slip at doctor desk</Text>
          </View>
        </View>
      </View>
    </Dialog>
  );
}
