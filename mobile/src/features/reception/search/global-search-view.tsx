import React, { useState, useEffect, useRef } from 'react';
import { searchPatients } from '@/services/reception';
import { Patient } from '@/types/reception';
import { Search, Phone, Eye, CalendarPlus, UserCheck } from 'lucide-react-native';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';

interface GlobalSearchViewProps {
  onViewProfile: (id: number) => void;
  onCreateVisit: (patient: Patient) => void;
}

export default function GlobalSearchView({ onViewProfile, onCreateVisit }: GlobalSearchViewProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchChange = async (val: string) => {
    setQuery(val);
    if (!val || val.trim().length < 2) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const data = await searchPatients(val);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <View className="space-y-4 max-w-2xl mx-auto">
      <View>
        <Text className="text-xl font-black text-zinc-900">Universal Patient Search</Text>
        <Text className="text-xs text-zinc-500 font-medium">Search by Mobile Phone, Patient Code (MED-...), or Name</Text>
      </View>

      <View className="relative">
        <TextInput
          placeholder="Search mobile number, code, or name..."
          value={query}
          onChangeText={handleSearchChange}
          className="h-12 pl-11 pr-10 border border-zinc-200 rounded-xl text-xs bg-white text-zinc-900 shadow-xs"
        />
        <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-zinc-400" />
        
        {isSearching && (
          <View className="absolute right-3.5 top-3.5">
            <ActivityIndicator size="small" color="#0284c7" />
          </View>
        )}
      </View>

      {/* Search Results List */}
      {results.length > 0 ? (
        <View className="gap-2.5">
          {results.map((pat) => (
            <View
              key={pat.id}
              className="p-3.5 bg-white rounded-xl border border-zinc-200 shadow-xs flex-row items-center justify-between"
            >
              <View className="flex-1 mr-3">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="font-black text-zinc-900 text-sm">
                    {pat.first_name} {pat.last_name || ''}
                  </Text>
                  <Text className="font-mono text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                    {pat.patient_code}
                  </Text>
                </View>

                <View className="flex-row items-center gap-2">
                  <Phone className="h-3 w-3 text-zinc-400" />
                  <Text className="text-xs text-zinc-700 font-semibold">{pat.phone}</Text>
                  <Text className="text-[10px] text-zinc-400 font-medium">• {pat.gender} • {pat.age || 'N/A'}y</Text>
                </View>
              </View>

              <View className="gap-1.5">
                <TouchableOpacity
                  onPress={() => onViewProfile(pat.id)}
                  className="flex-row items-center gap-1 px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-lg active:bg-sky-100"
                >
                  <Eye className="h-3.5 w-3.5 text-sky-700" />
                  <Text className="text-xs font-bold text-sky-700">Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onCreateVisit(pat)}
                  className="flex-row items-center gap-1 px-3 py-1.5 bg-emerald-600 rounded-lg active:bg-emerald-700 shadow-xs"
                >
                  <CalendarPlus className="h-3.5 w-3.5 text-white" />
                  <Text className="text-xs font-bold text-white">Visit</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : query && !isSearching ? (
        <View className="items-center justify-center py-10 px-4 bg-white rounded-xl border border-zinc-200 border-dashed">
          <UserCheck className="h-8 w-8 text-zinc-400 mb-2" />
          <Text className="text-zinc-500 text-xs font-medium text-center">No patient records matching "{query}"</Text>
        </View>
      ) : (
        <View className="gap-2.5 pt-1">
          <View className="p-3.5 border border-zinc-200 rounded-xl bg-white space-y-1">
            <Text className="font-bold text-zinc-800 text-xs uppercase tracking-wider">Search Tips</Text>
            <Text className="text-xs text-zinc-500">🔍 Type 10-digit mobile number for instant patient lookup.</Text>
            <Text className="text-xs text-zinc-500">📝 Press "Visit" to jump directly to OPD visit scheduling.</Text>
          </View>
        </View>
      )}
    </View>
  );
}

