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
    <View className={`flex-1 px-4 py-3 justify-center ${className}`} {...props}>
      <Text className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{children}</Text>
    </View>
  );
}

export function TableCell({ children, className = '', ...props }: React.ComponentProps<typeof View>) {
  return (
    <View className={`flex-1 px-4 py-4 justify-center ${className}`} {...props}>
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text className={`${className}`}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}
