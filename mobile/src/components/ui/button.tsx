import React from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps, ActivityIndicator, View } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children?: React.ReactNode;
  className?: string;
  type?: string; // ignore web type attribute if passed
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  type,
  ...props
}: ButtonProps) {
  const baseStyles = 'flex-row items-center justify-center font-medium rounded-lg transition-colors';
  
  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
    secondary: 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900',
    outline: 'border border-zinc-200 bg-transparent hover:bg-zinc-50 text-zinc-700',
    ghost: 'hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  };

  const textVariants = {
    primary: 'text-white font-semibold',
    secondary: 'text-zinc-900 font-semibold',
    outline: 'text-zinc-700 font-semibold',
    ghost: 'text-zinc-600 font-semibold',
    danger: 'text-white font-semibold',
  };

  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-6 text-base',
  };

  const spinnerColor = variant === 'outline' || variant === 'ghost' || variant === 'secondary' ? '#3f3f46' : '#ffffff';

  return (
    <TouchableOpacity
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading && (
        <ActivityIndicator size="small" color={spinnerColor} className="mr-2" />
      )}
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text className={textVariants[variant]}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}
