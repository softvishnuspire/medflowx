import React from 'react';
import { View, Text } from 'react-native';

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <View
      className={`bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, className = '', ...props }: CardProps) {
  return (
    <View className={`p-6 border-b border-zinc-50 ${className}`} {...props}>
      {children}
    </View>
  );
}

export function CardTitle({ children, className = '', ...props }: CardProps) {
  return (
    <Text className={`text-lg font-semibold text-zinc-900 tracking-tight ${className}`} {...props}>
      {children}
    </Text>
  );
}

export function CardDescription({ children, className = '', ...props }: CardProps) {
  return (
    <Text className={`text-sm text-zinc-500 mt-1 ${className}`} {...props}>
      {children}
    </Text>
  );
}

export function CardContent({ children, className = '', ...props }: CardProps) {
  return (
    <View className={`p-6 ${className}`} {...props}>
      {children}
    </View>
  );
}

export function CardFooter({ children, className = '', ...props }: CardProps) {
  return (
    <View className={`px-6 py-4 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between ${className}`} {...props}>
      {children}
    </View>
  );
}
