import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Search, UserPlus, Phone, Hash, ChevronRight, Filter } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { getPatientsList } from '../services/reception';
import { Patient } from '../types/reception';

interface PatientsScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  onSelectPatient: (patient: Patient) => void;
}

export const PatientsScreen: React.FC<PatientsScreenProps> = ({ onNavigate, onSelectPatient }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [nameFilter, setNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [codeFilter, setCodeFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const fetchPatients = async (resetPage = false) => {
    const targetPage = resetPage ? 1 : page;
    setLoading(true);
    try {
      const data = await getPatientsList(
        {
          name: nameFilter,
          phone: phoneFilter,
          code: codeFilter,
          gender: genderFilter,
        },
        targetPage,
        15
      );

      if (resetPage) {
        setPatients(data.patients);
      } else {
        setPatients((prev) => [...prev, ...data.patients]);
      }
      setTotal(data.total);
      setPage(targetPage + 1);
    } catch (error) {
      console.error('Failed to fetch patients list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(true);
  }, [genderFilter]);

  const handleSearchSubmit = () => {
    fetchPatients(true);
  };

  const handleLoadMore = () => {
    if (patients.length < total && !loading) {
      fetchPatients(false);
    }
  };

  const renderPatientCard = ({ item }: { item: Patient }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          onSelectPatient(item);
          onNavigate('profile', { patientId: item.id });
        }}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.first_name[0] || '') + (item.last_name ? item.last_name[0] : '')}
            </Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>
              {item.first_name} {item.last_name || ''}
            </Text>
            <View style={styles.patientSubDetail}>
              <Text style={styles.subDetailText}>
                {item.gender} • {item.age || item.dob || 'Age N/A'} yrs
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <View style={styles.metaItem}>
            <Hash size={13} color="#64748b" style={styles.metaIcon} />
            <Text style={styles.metaText}>{item.patient_code}</Text>
          </View>
          <View style={styles.metaItem}>
            <Phone size={13} color="#64748b" style={styles.metaIcon} />
            <Text style={styles.metaText}>{item.phone}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={() => onNavigate('visit', { selectedPatient: item })}
          >
            <Text style={styles.actionButtonText}>Create Visit</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top action block */}
      <View style={styles.topActions}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onNavigate('registration')}
          style={styles.registerBtn}
        >
          <UserPlus size={18} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.registerBtnText}>New Registration</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowFilters(!showFilters)}
          style={[styles.filterToggleBtn, showFilters && styles.filterToggleActive]}
        >
          <Filter size={18} color={showFilters ? colors.primary : '#64748b'} />
        </TouchableOpacity>
      </View>

      {/* Advanced filters card */}
      {showFilters && (
        <View style={styles.filtersCard}>
          <Text style={styles.filtersTitle}>Filters</Text>
          
          <View style={styles.filtersGrid}>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>Patient Name</Text>
              <TextInput
                style={styles.filterInput}
                value={nameFilter}
                onChangeText={setNameFilter}
                placeholder="First or Last Name"
                placeholderTextColor="#94a3b8"
                returnKeyType="search"
                onSubmitEditing={handleSearchSubmit}
              />
            </View>
            
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>Phone Number</Text>
              <TextInput
                style={styles.filterInput}
                value={phoneFilter}
                onChangeText={setPhoneFilter}
                placeholder="Mobile number"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                returnKeyType="search"
                onSubmitEditing={handleSearchSubmit}
              />
            </View>

            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>Patient Code</Text>
              <TextInput
                style={styles.filterInput}
                value={codeFilter}
                onChangeText={setCodeFilter}
                placeholder="e.g. PAT00012"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                returnKeyType="search"
                onSubmitEditing={handleSearchSubmit}
              />
            </View>

            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>Gender</Text>
              <View style={styles.genderSelectRow}>
                {['All', 'Male', 'Female', 'Other'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGenderFilter(g)}
                    style={[
                      styles.genderSelectBtn,
                      genderFilter === g && styles.genderSelectActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderSelectText,
                        genderFilter === g && styles.genderSelectTextActive,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.filterActions}>
            <TouchableOpacity
              style={styles.clearFilterBtn}
              onPress={() => {
                setNameFilter('');
                setPhoneFilter('');
                setCodeFilter('');
                setGenderFilter('All');
                setPatients([]);
                setPage(1);
                setTimeout(() => fetchPatients(true), 50);
              }}
            >
              <Text style={styles.clearFilterText}>Reset Filters</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyFilterBtn}
              onPress={() => fetchPatients(true)}
            >
              <Text style={styles.applyFilterText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Patients List */}
      <FlatList
        data={patients}
        renderItem={renderPatientCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No outpatients found.</Text>
            </View>
          )
        }
        ListFooterComponent={
          loading ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topActions: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    gap: 12,
  },
  registerBtn: {
    flex: 1,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  filterToggleBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterToggleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundCustom,
  },
  filtersCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filtersGrid: {
    gap: 12,
  },
  filterField: {
    gap: 4,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  filterInput: {
    height: 40,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  genderSelectRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderSelectBtn: {
    flex: 1,
    height: 38,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderSelectActive: {
    backgroundColor: colors.primary,
  },
  genderSelectText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  genderSelectTextActive: {
    color: '#ffffff',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    alignItems: 'center',
  },
  clearFilterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearFilterText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  applyFilterBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  applyFilterText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  patientSubDetail: {
    marginTop: 2,
  },
  subDetailText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: colors.backgroundCustom,
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.15)',
  },
  actionButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
