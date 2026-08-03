import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string) => void;
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    
    // Automatically remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
      
      {/* Toast Portal Container */}
      <View className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const bgColors = {
            success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
            error: 'bg-red-50 border-red-200 text-red-800',
            info: 'bg-blue-50 border-blue-200 text-blue-800',
            warning: 'bg-amber-50 border-amber-200 text-amber-800',
          };
          
          const iconColors = {
            success: 'text-emerald-500',
            error: 'text-red-500',
            info: 'text-blue-500',
            warning: 'text-amber-500',
          };

          return (
            <View
              key={t.id}
              className={`p-4 rounded-xl border shadow-lg flex-row gap-3 items-start bg-white ${bgColors[t.type]} transition-all duration-300`}
            >
              {/* Icon */}
              <View className={`mt-0.5 ${iconColors[t.type]}`}>
                {t.type === 'success' && <CheckCircle size={20} color="#10b981" />}
                {t.type === 'error' && <XCircle size={20} color="#ef4444" />}
                {t.type === 'info' && <Info size={20} color="#3b82f6" />}
                {t.type === 'warning' && <AlertTriangle size={20} color="#f59e0b" />}
              </View>

              {/* Text content */}
              <View className="flex-1">
                {t.title && <Text className="font-semibold text-zinc-900 text-sm mb-1">{t.title}</Text>}
                <Text className="text-zinc-600 text-xs">{t.message}</Text>
              </View>

              {/* Dismiss button */}
              <TouchableOpacity
                onPress={() => removeToast(t.id)}
                className="p-1 rounded-lg hover:bg-zinc-100/50"
              >
                <X size={16} color="#a1a1aa" />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
