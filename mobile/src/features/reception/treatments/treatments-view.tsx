import React, { useState } from 'react';
import TreatmentFormWizard from './treatment-form-wizard';
import TreatmentHistoryTable from './treatment-history-table';
import { Sparkles, PlusCircle, History, Stethoscope } from 'lucide-react-native';
import { View, Text, TouchableOpacity } from 'react-native';

export default function TreatmentsView() {
  const [activeSubTab, setActiveSubTab] = useState<'new' | 'history'>('new');

  return (
    <View className="space-y-6 font-body text-zinc-800">
      {/* Header Banner */}
      <View className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-150 pb-5">
        <View>
          <View className="flex items-center gap-2">
            <Text className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">
              Patient Treatments & Billing
            </Text>
            <Text className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-primary/10 text-primary border border-primary/20">
              Reception Module
            </Text>
          </View>
          <Text className="text-xs text-zinc-500 mt-1">
            Record hair & skin diagnosis details, calculate treatment charges, and collect payments.
          </Text>
        </View>

        {/* Tab Buttons */}
        <View className="flex items-center p-1 bg-zinc-100/80 border border-zinc-200 rounded-xl self-start sm:self-center">
          <TouchableOpacity
            onPress={() => setActiveSubTab('new')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'new'
                ? 'bg-white text-primary shadow-xs font-extrabold'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <Text>Record New Treatment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveSubTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-white text-primary shadow-xs font-extrabold'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <History className="w-4 h-4" />
            <Text>Treatment History & Logs</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Subtab Content Area */}
      {activeSubTab === 'new' ? (
        <TreatmentFormWizard
          onNavigateToHistory={() => setActiveSubTab('history')}
        />
      ) : (
        <TreatmentHistoryTable
          onAddNewClick={() => setActiveSubTab('new')}
        />
      )}
    </View>
  );
}
