import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
}: DialogProps) {
  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center p-4 bg-black/40">
        {/* Overlay - tap to close */}
        <TouchableOpacity
          className="absolute inset-0"
          onPress={onClose}
          activeOpacity={1}
        />

        {/* Modal Content */}
        <View className="relative bg-white rounded-xl shadow-xl w-full max-w-md border border-zinc-100 flex flex-col max-h-[80%] overflow-hidden">
          {/* Header */}
          <View className="px-6 py-4 border-b border-zinc-100 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-zinc-900">{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              className="text-zinc-400 rounded-lg p-1"
            >
              <X size={20} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView className="px-6 py-5 flex-1">
            {children}
          </ScrollView>

          {/* Footer */}
          {footer && (
            <View className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex-row items-center justify-end gap-3 rounded-b-xl">
              {footer}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isConfirming = false,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      footer={
        <>
          <TouchableOpacity
            onPress={onClose}
            disabled={isConfirming}
            className="px-4 py-2 border border-zinc-200 bg-white rounded-lg"
          >
            <Text className="text-zinc-700 text-sm font-medium">{cancelText}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            disabled={isConfirming}
            className="px-4 py-2 bg-red-600 rounded-lg shadow-sm flex-row items-center"
          >
            {isConfirming && (
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            )}
            <Text className="text-white text-sm font-medium">{confirmText}</Text>
          </TouchableOpacity>
        </>
      }
    >
      <Text className="text-zinc-600">{description}</Text>
    </Dialog>
  );
}
