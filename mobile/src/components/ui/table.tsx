import React from 'react';
import { View, Text } from 'react-native';

interface TableProps extends React.ComponentProps<typeof View> {
  children: React.ReactNode;
}

export function Table({ children, className = '', ...props }: TableProps) {
  return (
    <View className="w-full flex-col" {...props}>
      <View className={`w-full ${className}`}>
        {children}
      </View>
    </View>
  );
}

export function TableHeader({ children, className = '', ...props }: React.ComponentProps<typeof View>) {
  return (
    <View className={`bg-zinc-50 border-b border-zinc-100 ${className}`} {...props}>
      {children}
    </View>
  );
}

export function TableBody({ children, className = '', ...props }: React.ComponentProps<typeof View>) {
  return (
    <View className={`divide-y divide-zinc-100 ${className}`} {...props}>
      {children}
    </View>
  );
}

export function TableRow({ children, className = '', ...props }: React.ComponentProps<typeof View>) {
  return (
    <View className={`flex-row border-b border-zinc-100 items-center ${className}`} {...props}>
      {children}
    </View>
  );
}

export function TableHead({ children, className = '', ...props }: React.ComponentProps<typeof View>) {
  return (
    <View className={`px-3 py-3 justify-center ${className}`} {...props}>
      <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{children}</Text>
    </View>
  );
}

export function TableCell({ children, className = '', ...props }: React.ComponentProps<typeof View>) {
  return (
    <View className={`px-3 py-3 justify-center ${className}`} {...props}>
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text className={`text-xs font-bold text-slate-800 ${className}`}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}
