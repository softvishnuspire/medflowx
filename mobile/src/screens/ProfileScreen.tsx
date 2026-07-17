import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  ChevronLeft,
  CalendarPlus,
  HeartCrack,
  FileSpreadsheet,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { getPatientById } from '../services/reception';
import { Patient, Visit } from '../types/reception';
import { Badge } from '../components/UI';

interface ProfileScreenProps {
  patientId: number;
  onBack: () => void;
  onNavigate: (screen: string, params?: any) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ patientId, onBack, onNavigate }) => {
  const [data, setData] = useState<{ patient: Patient; visits: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getPatientById(patientId);
      setData(res);
    } catch (error) {
      console.error('Failed to fetch patient profile:', error);
      Alert.alert('Error', 'Failed to retrieve patient details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [patientId]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Created':
        return 'primary';
      case 'Waiting':
        return 'warning';
      case 'In Progress':
        return 'info';
      case 'Prescribed':
      case 'Dispensed':
      case 'Closed':
        return 'success';
      case 'Cancelled':
      default:
        return 'neutral';
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Patient not found.</Text>
      </View>
    );
  }

  const { patient, visits } = data;
  const address = patient.patient_addresses?.[0];

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.primary} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => onNavigate('visit', { selectedPatient: patient })}
          style={styles.headerActionBtn}
        >
          <CalendarPlus size={16} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.headerActionBtnText}>New Visit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(patient.first_name[0] || '') + (patient.last_name ? patient.last_name[0] : '')}
              </Text>
            </View>
            <View style={styles.patientMeta}>
              <Text style={styles.patientName}>
                {patient.first_name} {patient.last_name || ''}
              </Text>
              <Text style={styles.patientCode}>{patient.patient_code}</Text>
            </View>
          </View>

          <View style={styles.demographicsGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Gender</Text>
              <Text style={styles.gridValue}>{patient.gender}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Age</Text>
              <Text style={styles.gridValue}>{patient.age || 'N/A'} yrs</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Blood Group</Text>
              <Text style={styles.gridValue}>{patient.blood_group || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Contact Info Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Contact details</Text>
          <View style={styles.contactItem}>
            <Phone size={16} color="#64748b" style={styles.contactIcon} />
            <Text style={styles.contactText}>{patient.phone}</Text>
          </View>
          {patient.email && (
            <View style={styles.contactItem}>
              <Mail size={16} color="#64748b" style={styles.contactIcon} />
              <Text style={styles.contactText}>{patient.email}</Text>
            </View>
          )}
          {address && (
            <View style={[styles.contactItem, { alignItems: 'flex-start' }]}>
              <MapPin size={16} color="#64748b" style={[styles.contactIcon, { marginTop: 2 }]} />
              <Text style={styles.contactText}>
                {address.address_line}, {address.city}, {address.state} - {address.pincode}
              </Text>
            </View>
          )}
        </View>

        {/* Medical Context */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Allergies & Medical History</Text>
          
          <View style={styles.medicalAlertBox}>
            <HeartCrack size={16} color={colors.error} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.medicalAlertTitle}>Allergies</Text>
              <Text style={styles.medicalAlertValue}>{patient.allergies || 'No known allergies reported.'}</Text>
            </View>
          </View>

          <View style={[styles.medicalAlertBox, { marginTop: 12, backgroundColor: '#f1f5f9' }]}>
            <FileSpreadsheet size={16} color="#475569" style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.medicalAlertTitle, { color: '#475569' }]}>Medical History</Text>
              <Text style={[styles.medicalAlertValue, { color: '#334155' }]}>{patient.medical_history || 'No previous medical history recorded.'}</Text>
            </View>
          </View>
        </View>

        {/* Visits History */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Visit History ({visits.length})</Text>
          
          {visits.length === 0 ? (
            <Text style={styles.noHistoryText}>No visits registered yet.</Text>
          ) : (
            visits.map((visit: any, index: number) => {
              const docName = visit.doctors?.profiles?.full_name || 'General Doctor';
              const deptName = visit.doctors?.departments?.department_name || 'General';
              
              return (
                <View key={visit.id} style={styles.visitItem}>
                  <View style={styles.visitHeader}>
                    <View style={styles.visitTitleRow}>
                      <Clock size={14} color="#64748b" style={{ marginRight: 6 }} />
                      <Text style={styles.visitDate}>
                        {new Date(visit.visit_date).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    <Badge label={visit.status} variant={getStatusVariant(visit.status)} />
                  </View>

                  <Text style={styles.visitMeta}>
                    No: <Text style={styles.visitBold}>{visit.visit_number}</Text> • Token:{' '}
                    <Text style={styles.visitBold}>{visit.token_no}</Text>
                  </Text>

                  <Text style={styles.visitDoc}>
                    Consultation with <Text style={styles.docBold}>{docName}</Text> ({deptName})
                  </Text>

                  {visit.chief_complaint && (
                    <Text style={styles.visitComplaint}>
                      Complaint: <Text style={{ color: '#475569' }}>{visit.chief_complaint}</Text>
                    </Text>
                  )}
                  
                  {index < visits.length - 1 && <View style={styles.visitItemDivider} />}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 2,
  },
  headerActionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  patientMeta: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  patientCode: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  demographicsGrid: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactIcon: {
    marginRight: 10,
  },
  contactText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  medicalAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
  },
  medicalAlertTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.error,
    textTransform: 'uppercase',
  },
  medicalAlertValue: {
    fontSize: 13,
    color: '#7f1d1d',
    fontWeight: '600',
    marginTop: 2,
  },
  visitItem: {
    paddingVertical: 12,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  visitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visitDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  visitMeta: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  visitBold: {
    fontWeight: '700',
    color: '#334155',
  },
  visitDoc: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  docBold: {
    fontWeight: '700',
    color: '#0f172a',
  },
  visitComplaint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  visitItemDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginTop: 12,
  },
  noHistoryText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
