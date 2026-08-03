import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { searchPatients, getPatientById } from '@/services/reception';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, Alert, ActivityIndicator, Modal, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuthUser, removeAuthUser } from '@/lib/storage';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Pill,
  Search,
  User,
  LogOut,
  Stethoscope,
  Menu,
  X,
  Upload,
  CheckCircle2,
  FileImage,
  IndianRupee,
  Phone,
  Trash2,
  ChevronDown,
  ChevronRight,
  Package,
  History
} from 'lucide-react-native';

interface Patient {
  id: string | number;
  patient_code: string;
  first_name: string;
  last_name: string;
  phone: string;
  gender: string;
  age: number;
}

interface Visit {
  id: string | number;
  visit_date: string;
  token_no: number;
  chief_complaint: string;
  status: string;
  prescription_image_front?: string | null;
  prescription_image_back?: string | null;
  prescription_amount?: number | null;
  doctors?: {
    profiles?: {
      full_name: string;
    };
  };
}

export default function PharmacyPage() {
  const router = useRouter();
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'inventory' | 'history' | 'profile'>('queue');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  
  // Selection state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientVisits, setPatientVisits] = useState<Visit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [isVisitDropdownOpen, setIsVisitDropdownOpen] = useState(false);

  // Upload Form State
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const [amount, setAmount] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: 'Pharmacist Desk', email: '', avatarCode: 'RX' });

  // Initial load: recent patients
  useEffect(() => {
    (async () => {
      const saved = await getAuthUser();
      if (!saved) {
        router.replace('/(auth)');
        return;
      }
      if (saved.role?.toLowerCase() !== 'pharmacy' && saved.role?.toLowerCase() !== 'pharmacist') {
        router.replace('/(auth)');
        return;
      }
      setCurrentUser({
        name: saved.name || 'Pharmacist Desk',
        email: saved.email || '',
        avatarCode: saved.avatarCode || 'RX'
      });
      handleSearch('');
    })();
  }, []);

  const handleLogout = async () => {
    await removeAuthUser();
    router.replace('/(auth)');
  };

  const handleSearch = async (query: string) => {
    try {
      setSearching(true);
      const results = await searchPatients(query);
      setSearchResults(results as unknown as Patient[]);
    } catch (err: any) {
      console.error('Error searching patients:', err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setSelectedVisit(null);
    setFrontPreview(null);
    setBackPreview(null);
    setAmount('');
    try {
      setLoadingVisits(true);
      const res = await getPatientById(Number(patient.id));
      const visits = (res.visits || []) as unknown as Visit[];
      setPatientVisits(visits);
      if (visits.length > 0) {
        setSelectedVisit(visits[0]);
      }
    } catch (err: any) {
      console.error('Error fetching patient visits:', err.message);
    } finally {
      setLoadingVisits(false);
    }
  };

  const pickImage = async (side: 'front' | 'back') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll access is needed to select photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      if (side === 'front') {
        setFrontPreview(uri);
      } else {
        setBackPreview(uri);
      }
    }
  };

  const handleSubmitPrescription = async () => {
    if (!selectedVisit) {
      Alert.alert('Error', 'Please select a visit to attach the prescription.');
      return;
    }

    if (!frontPreview) {
      Alert.alert('Error', 'Front photo of physical prescription is required.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('visits')
        .update({ 
          status: 'Prescribed',
          prescription_amount: numericAmount,
        })
        .eq('id', selectedVisit.id);

      if (error) throw error;

      Alert.alert('Success', 'Physical prescription uploaded and transaction recorded successfully!');

      setFrontPreview(null);
      setBackPreview(null);
      setAmount('');
      
      if (selectedPatient) {
        const res = await getPatientById(Number(selectedPatient.id));
        setPatientVisits(res.visits as unknown as Visit[]);
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', `Error submitting prescription: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      {/* Top Header Bar */}
      <View className="h-14 bg-white border-b border-slate-150/50 px-4 flex-row items-center justify-between shadow-2xs z-20">
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-2">
            <View className="p-1.5 rounded-xl bg-cyan-600 shadow-2xs">
              <Stethoscope className="h-4 w-4 text-white" />
            </View>
            <View>
              <Text className="font-black text-slate-900 tracking-tight text-sm">
                Medflow<Text className="text-cyan-600">X</Text>
              </Text>
              <Text className="text-[10px] text-cyan-700 font-extrabold uppercase tracking-wider">
                Pharmacy Desk
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          {/* User Profile Badge */}
          <View className="flex-row items-center gap-2 bg-slate-100/60 pl-3 pr-1.5 py-1 rounded-full">
            <View className="items-end">
              <Text className="text-xs font-black text-slate-800 line-clamp-1">{currentUser.name}</Text>
              <Text className="text-[9px] text-cyan-600 font-bold uppercase tracking-wider">Pharmacist</Text>
            </View>
            <View className="w-7 h-7 rounded-full bg-cyan-600 items-center justify-center">
              <Pill className="h-3.5 w-3.5 text-white" />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            className="p-1.5 bg-rose-50 border border-rose-100 rounded-full active:bg-rose-100"
          >
            <LogOut size={16} color="#e11d48" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Workspace (Full Width) */}
      <ScrollView 
        className="flex-1 bg-slate-50"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'queue' && (
          <View className="gap-4 w-full">
          {/* Patient Search Section */}
          <View className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-3">
            <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">1. Search Patient Record</Text>
            
            <View className="relative">
              <TextInput
                placeholder="Search patient name or 10-digit mobile number..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  handleSearch(text);
                }}
                className="h-11 pl-11 pr-4 border border-slate-200/70 rounded-xl text-xs bg-slate-50/70 text-slate-900 font-medium"
              />
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </View>

            {/* Results List */}
            {searching ? (
              <View className="p-4 items-center">
                <ActivityIndicator size="small" color="#0891b2" />
              </View>
            ) : searchResults.length > 0 && (
              <View className="gap-2 pt-1 border-t border-slate-100">
                {searchResults.slice(0, 5).map((patient) => {
                  const isSelected = selectedPatient?.id === patient.id;
                  return (
                    <TouchableOpacity
                      key={String(patient.id)}
                      onPress={() => handleSelectPatient(patient)}
                      className={`p-3.5 rounded-2xl border flex-row items-center justify-between active:bg-cyan-50 ${
                        isSelected ? 'bg-cyan-50/80 border-cyan-600' : 'bg-slate-50/70 border-slate-200/70'
                      }`}
                    >
                      <View className="flex-1 mr-2">
                        <View className="flex-row items-center gap-2 mb-0.5">
                          <Text className="font-black text-slate-900 text-xs">
                            {patient.first_name} {patient.last_name || ''}
                          </Text>
                          <Text className="font-mono text-[10px] font-extrabold text-cyan-700 bg-white px-1.5 py-0.5 rounded border border-cyan-100">
                            {patient.patient_code}
                          </Text>
                        </View>
                        <Text className="text-[11px] text-slate-500 font-medium">
                          Phone: {patient.phone} • {patient.gender} • {patient.age ? `${patient.age}y` : '—'}
                        </Text>
                      </View>
                      <View className={`px-3 py-1.5 rounded-xl ${isSelected ? 'bg-cyan-600' : 'bg-slate-200'}`}>
                        <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                          {isSelected ? 'Selected' : 'Select'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Physical Prescription Upload Section */}
          {selectedPatient ? (
            <View className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm gap-4">
              <View className="border-b border-slate-100 pb-3">
                <Text className="text-[10px] font-extrabold text-cyan-700 uppercase tracking-wider">Active Patient Selected</Text>
                <Text className="text-lg font-black text-slate-900 mt-0.5">
                  {selectedPatient.first_name} {selectedPatient.last_name || ''}
                </Text>
                <Text className="text-xs text-slate-500 font-medium mt-0.5">
                  Phone: {selectedPatient.phone} • Code: <Text className="font-mono font-bold text-slate-800">{selectedPatient.patient_code}</Text>
                </Text>
              </View>

              {/* Visit Selector Dropdown */}
              {patientVisits.length > 0 && (
                <View className="gap-1.5">
                  <Text className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Select Clinical Visit *</Text>
                  <TouchableOpacity
                    onPress={() => setIsVisitDropdownOpen(!isVisitDropdownOpen)}
                    className="h-11 px-3.5 bg-slate-50/70 border border-slate-200/70 rounded-xl flex-row items-center justify-between"
                  >
                    <Text className="text-xs font-bold text-slate-900">
                      {selectedVisit
                        ? `Visit Date: ${new Date(selectedVisit.visit_date).toLocaleDateString()} (${selectedVisit.chief_complaint || 'OPD Visit'})`
                        : 'Select Visit'}
                    </Text>
                    <ChevronDown size={14} color="#0891b2" />
                  </TouchableOpacity>

                  {isVisitDropdownOpen && (
                    <View className="bg-white border border-slate-100 rounded-2xl p-2 gap-1 shadow-md">
                      {patientVisits.map((v) => (
                        <TouchableOpacity
                          key={String(v.id)}
                          onPress={() => {
                            setSelectedVisit(v);
                            setIsVisitDropdownOpen(false);
                          }}
                          className={`p-2.5 rounded-xl ${selectedVisit?.id === v.id ? 'bg-cyan-50' : 'active:bg-slate-50'}`}
                        >
                          <Text className={`text-xs font-bold ${selectedVisit?.id === v.id ? 'text-cyan-800' : 'text-slate-800'}`}>
                            Visit: {new Date(v.visit_date).toLocaleDateString()} ({v.chief_complaint || 'OPD Visit'})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Prescription Photos Upload */}
              <View className="gap-3">
                <View className="flex-row items-center gap-2">
                  <FileImage className="h-4 w-4 text-cyan-600" />
                  <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">2. Upload Physical Prescription Photos *</Text>
                </View>

                <View className="flex-row gap-3">
                  {/* Front Photo */}
                  <View className="flex-1 gap-1.5">
                    <Text className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Front Photo *</Text>
                    
                    {frontPreview ? (
                      <View className="relative h-32 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                        <Image source={{ uri: frontPreview }} className="w-full h-full" resizeMode="cover" />
                        <TouchableOpacity
                          onPress={() => setFrontPreview(null)}
                          className="absolute top-2 right-2 p-1.5 bg-rose-600 rounded-xl"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-white" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        onPress={() => pickImage('front')}
                        className="h-32 rounded-2xl border-2 border-dashed border-slate-200/80 bg-slate-50/50 items-center justify-center gap-1.5 p-3"
                      >
                        <Upload className="h-6 w-6 text-cyan-600" />
                        <Text className="text-xs font-bold text-slate-700">Upload Front</Text>
                        <Text className="text-[9px] text-slate-400 font-medium">JPEG / PNG</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Back Photo */}
                  <View className="flex-1 gap-1.5">
                    <Text className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Back Photo (Optional)</Text>
                    
                    {backPreview ? (
                      <View className="relative h-32 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                        <Image source={{ uri: backPreview }} className="w-full h-full" resizeMode="cover" />
                        <TouchableOpacity
                          onPress={() => setBackPreview(null)}
                          className="absolute top-2 right-2 p-1.5 bg-rose-600 rounded-xl"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-white" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        onPress={() => pickImage('back')}
                        className="h-32 rounded-2xl border-2 border-dashed border-slate-200/80 bg-slate-50/50 items-center justify-center gap-1.5 p-3"
                      >
                        <Upload className="h-6 w-6 text-slate-400" />
                        <Text className="text-xs font-bold text-slate-700">Upload Back</Text>
                        <Text className="text-[9px] text-slate-400 font-medium">Optional</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              {/* Amount Input */}
              <View className="gap-1.5 pt-2 border-t border-slate-100">
                <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">3. Prescription Amount (₹) *</Text>
                
                <View className="relative">
                  <TextInput
                    keyboardType="numeric"
                    placeholder="Enter cost (e.g. 350)"
                    value={amount}
                    onChangeText={setAmount}
                    className="h-12 pl-10 pr-4 border border-slate-200/70 rounded-xl text-base font-black text-slate-900 bg-slate-50/70"
                  />
                  <IndianRupee className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmitPrescription}
                disabled={submitting || !frontPreview || !amount}
                className={`h-12 rounded-2xl flex-row items-center justify-center gap-2 shadow-xs mt-1 ${
                  submitting || !frontPreview || !amount ? 'bg-slate-200' : 'bg-cyan-600 active:bg-cyan-700'
                }`}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-white" />
                    <Text className={`font-black text-sm ${!frontPreview || !amount ? 'text-slate-400' : 'text-white'}`}>
                      Submit Prescription & Log Transaction
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm items-center justify-center text-center gap-2">
              <View className="w-14 h-14 rounded-2xl bg-cyan-50 items-center justify-center mb-1">
                <Pill className="h-7 w-7 text-cyan-600" />
              </View>
              <Text className="font-black text-slate-900 text-base">Select a Patient Record</Text>
              <Text className="text-xs text-slate-500 font-medium text-center max-w-xs">
                Search and select a patient record above to digitize physical paper prescriptions and enter prescription charges.
              </Text>
            </View>
          )}
          </View>
        )}
        {activeTab !== 'queue' && (
          <View className="p-8 mt-10 items-center justify-center opacity-50">
            <Text className="font-bold text-slate-500">Module coming soon...</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Tab Navigation */}
      <View 
        className="h-[60px] flex-row bg-white border-t border-slate-100" 
        style={{ paddingBottom: Platform.OS === 'ios' ? 8 : 0 }}
      >
        <TouchableOpacity onPress={() => setActiveTab('queue')} className="flex-1 justify-center items-center gap-1">
          <Pill size={20} color={activeTab === 'queue' ? '#0d9488' : '#94a3b8'} />
          <Text className={`text-[10px] ${activeTab === 'queue' ? 'font-bold text-teal-600' : 'font-semibold text-slate-400'}`}>Queue</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setActiveTab('inventory')} className="flex-1 justify-center items-center gap-1">
          <Package size={20} color={activeTab === 'inventory' ? '#0d9488' : '#94a3b8'} />
          <Text className={`text-[10px] ${activeTab === 'inventory' ? 'font-bold text-teal-600' : 'font-semibold text-slate-400'}`}>Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTab('history')} className="flex-1 justify-center items-center gap-1">
          <History size={20} color={activeTab === 'history' ? '#0d9488' : '#94a3b8'} />
          <Text className={`text-[10px] ${activeTab === 'history' ? 'font-bold text-teal-600' : 'font-semibold text-slate-400'}`}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTab('profile')} className="flex-1 justify-center items-center gap-1">
          <User size={20} color={activeTab === 'profile' ? '#0d9488' : '#94a3b8'} />
          <Text className={`text-[10px] ${activeTab === 'profile' ? 'font-bold text-teal-600' : 'font-semibold text-slate-400'}`}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
