import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';

interface PickerOption {
  label: string;
  value: any;
}

interface NativePickerProps {
  value: any;
  onValueChange: (value: any) => void;
  options: PickerOption[];
  placeholder?: string;
  className?: string;
}

/**
 * A mobile-native picker that replaces HTML <select> elements.
 * Renders as a button that opens a floating inline dropdown menu.
 */
export function NativePicker({ value, onValueChange, options, placeholder = 'Select...', className }: NativePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  return (
    <View className="relative z-50">
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className={`flex-row items-center justify-between py-2 px-3 bg-white rounded-lg border border-zinc-200 ${className || ''}`}
      >
        <Text className={`text-xs font-medium ${value ? 'text-zinc-800' : 'text-zinc-400'}`}>
          {selectedLabel}
        </Text>
        <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1} 
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContainer}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              bounces={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onValueChange(item.value);
                    setIsOpen(false);
                  }}
                  style={[
                    styles.option,
                    item.value === value && styles.selectedOption,
                  ]}
                >
                  <Text style={[
                    styles.optionText,
                    item.value === value && styles.selectedOptionText,
                  ]}>
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '80%',
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  selectedOption: {
    backgroundColor: '#0d9488', // teal primary color
  },
  optionText: {
    fontSize: 13,
    color: '#3f3f46',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

export default NativePicker;
