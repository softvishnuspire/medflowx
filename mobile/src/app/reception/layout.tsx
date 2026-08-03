import React from 'react';
import { View } from 'react-native';

export const metadata = {
  title: 'MedflowX - Reception Desk',
  description: 'Patient registration, visits queue, and billing collection.',
};

export default function ReceptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View className="reception-theme font-body min-h-screen bg-bg-custom flex flex-col flex-1">
      {children}
    </View>
  );
}
