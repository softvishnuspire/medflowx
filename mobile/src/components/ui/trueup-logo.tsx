import React from 'react';
import { View, Text } from 'react-native';

interface TrueUpLogoProps {
  className?: string;
}

export default function TrueUpLogo({ className = '' }: TrueUpLogoProps) {
  return (
    <View className={`bg-[#05080f] border border-emerald-950/70 rounded-2xl p-4 flex-row items-center justify-center shadow-lg ${className}`}>
      <View className="flex-row items-baseline">
        <Text className="text-lime-400 font-normal text-3xl tracking-tight">True</Text>
        <View className="flex-row items-baseline">
          <Text className="text-lime-400 font-bold text-3xl">U</Text>
          <Text className="text-lime-400 font-bold text-xl -ml-1">↑</Text>
          <Text className="text-lime-400 font-semibold text-3xl">p</Text>
        </View>
        <Text className="text-teal-400 font-medium text-xs ml-1.5 tracking-widest uppercase self-end mb-1">Media</Text>
      </View>
    </View>
  );
}
