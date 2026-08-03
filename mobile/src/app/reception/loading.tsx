import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export default function ReceptionLoading() {
  return (
    <View className="flex-1 flex flex-col items-center justify-center p-12 bg-white min-h-[400px]">
      <ActivityIndicator size="large" color="#059669" />
      <Text className="text-zinc-800 font-semibold mt-4 text-sm tracking-tight">Loading MedflowX Reception...</Text>
      <Text className="text-zinc-400 text-xs mt-1">Establishing secure connection to clinical database.</Text>
    </View>
  );
}
