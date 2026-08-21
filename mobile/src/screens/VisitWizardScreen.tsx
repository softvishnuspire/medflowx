import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Calendar, User, Search, Stethoscope, ArrowRight, Check } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { getDoctors, checkIsFirstVisit, createVisit } from '../services/reception';
import { Patient, Doctor } from '../types/reception';
import { Input, Button, Card } from '../components/UI';

interface VisitWizardScreenProps {
  initialPatient?: Patient;
  onNavigate: (screen: string, params?: any) => void;
}

export const VisitWizardScreen: React.FC<VisitWizardScreenProps> = ({ initialPatient, onNavigate }) => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(initialPatient || null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  
  // States for dynamic fee
  const [checkingFirstVisit, setCheckingFirstVisit] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const docs = await getDoctors();
        setDoctors(docs);
      } catch (error) {
        console.error('Failed to load doctors:', error);
      } finally {
        setLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, []);

  useEffect(() => {
    if (initialPatient) {
      setSelectedPatient(initialPatient);
    }
  }, [initialPatient]);

  useEffect(() => {
    const checkFeeStatus = async () => {
      if (!selectedPatient) return;
      try {
        setCheckingFirstVisit(true);
        const isFirst = await checkIsFirstVisit(selectedPatient.id);
        setIsFirstVisit(isFirst);
      } catch (error) {
        console.error('Error checking visit frequency:', error);
      } finally {
        setCheckingFirstVisit(false);
      }
    };

    checkFeeStatus();
  }, [selectedPatient]);

  const handleCreateVisit = async () => {
    if (!selectedPatient) {
      Alert.alert('Selection Required', 'Please select a patient first.');
      return;
    }
    if (!selectedDoctor) {
      Alert.alert('Selection Required', 'Please select a doctor.');
      return;
    }
    if (!chiefComplaint.trim()) {
      Alert.alert('Input Required', 'Please enter a chief complaint.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await createVisit({
        patient_id: selectedPatient.id,
        doctor_id: selectedDoctor.id,
        consultation_fee: selectedDoctor.consultation_fee,
        chief_complaint: chiefComplaint.trim(),
      });

      const actualFee = isFirstVisit ? selectedDoctor.consultation_fee : 0;

      Alert.alert(
        'Visit Created',
        `Visit scheduled successfully!\nToken Number: ${response.visit.token_no}\nBill Amount: ₹${actualFee}`,
        [
          {
            text: actualFee > 0 ? 'Proceed to Payment' : 'View Queue',
            onPress: () => {
              if (actualFee > 0) {
                // Navigate to payments checkout
                onNavigate('payments', {
                  selectedInvoice: {
                    visitId: response.visit.id,
                    invoiceId: response.invoice.id,
                    amount: actualFee,
                    patientName: `${selectedPatient.first_name} ${selectedPatient.last_name || ''}`,
                    visitNumber: response.visit.visit_number,
                  },
                });
              } else {
                onNavigate('queue');
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Scheduling Failed', error.message || 'An error occurred during scheduling.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Patient Selection Card */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <User size={16} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>Patient Detail</Text>
        </View>

        {selectedPatient ? (
          <View style={styles.selectedPatientBox}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(selectedPatient.first_name[0] || '') + (selectedPatient.last_name ? selectedPatient.last_name[0] : '')}
              </Text>
            </View>
            <View style={styles.patientMeta}>
              <Text style={styles.patientName}>
                {selectedPatient.first_name} {selectedPatient.last_name || ''}
              </Text>
              <Text style={styles.patientCode}>
                {selectedPatient.patient_code} • {selectedPatient.phone}
              </Text>
              {checkingFirstVisit ? (
                <Text style={styles.checkFeeText}>Checking visit frequency...</Text>
              ) : (
                <Text style={[styles.feeStatusText, isFirstVisit ? styles.feeFirst : styles.feeSubsequent]}>
                  {isFirstVisit ? 'First Visit (Standard Rate Applies)' : 'Repeat Visit (Free Consultation)'}
                </Text>
              )}
            </View>
            
            {/* Clear selected patient button if not passed from profile */}
            {!initialPatient && (
              <TouchableOpacity
                onPress={() => setSelectedPatient(null)}
                style={styles.changeBtn}
              >
                <Text style={styles.changeBtnText}>Change</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigate('patients')}
            style={styles.selectPatientBtn}
          >
            <Search size={18} color="#64748b" style={{ marginRight: 10 }} />
            <Text style={styles.selectPatientBtnText}>Search and Select Patient</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Doctor Selection Card */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Stethoscope size={16} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>Select Consultant Doctor</Text>
        </View>

        {loadingDoctors ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <View style={styles.doctorsList}>
            {doctors.map((doc) => {
              const docName = doc.profiles?.full_name || 'General Doctor';
              const deptName = doc.departments?.department_name || 'General';
              const isSelected = selectedDoctor?.id === doc.id;

              return (
                <TouchableOpacity
                  key={doc.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedDoctor(doc)}
                  style={[styles.doctorCard, isSelected && styles.doctorCardSelected]}
                >
                  <View style={styles.doctorInfo}>
                    <Text style={[styles.doctorName, isSelected && styles.docSelectedText]}>{docName}</Text>
                    <Text style={[styles.doctorDept, isSelected && styles.docSelectedSubText]}>
                      {doc.qualification || 'MD - Dermatology & Trichology'}
                    </Text>
                  </View>
                  <View style={styles.doctorPricing}>
                    <Text style={[styles.doctorFee, isSelected && styles.docSelectedText]}>
                      ₹{doc.consultation_fee}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Check size={10} color="#ffffff" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Case Intake */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Calendar size={16} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>Intake Info</Text>
        </View>

        <Input
          label="Chief Complaint *"
          value={chiefComplaint}
          onChangeText={setChiefComplaint}
          placeholder="Enter primary medical complaint/reason for visit..."
          multiline
          style={{ height: 80, textAlignVertical: 'top', paddingTop: 8 }}
        />
      </View>

      {/* OPD Summary Summary */}
      {selectedPatient && selectedDoctor && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>OPD Consultation Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Base Fee ({selectedDoctor.profiles?.full_name})</Text>
            <Text style={styles.summaryValue}>₹{selectedDoctor.consultation_fee}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>First Visit Discount</Text>
            <Text style={[styles.summaryValue, { color: '#16a34a' }]}>
              {isFirstVisit ? '₹0' : `-₹${selectedDoctor.consultation_fee}`}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>
              ₹{isFirstVisit ? selectedDoctor.consultation_fee : 0}
            </Text>
          </View>

          {!isFirstVisit && (
            <View style={styles.repeatBadge}>
              <Text style={styles.repeatBadgeText}>REPEAT OUTPATIENT VISIT - FREE CONSULTATION</Text>
            </View>
          )}
        </View>
      )}

      {/* Submit Button */}
      <Button
        title="Confirm & Schedule Visit"
        onPress={handleCreateVisit}
        loading={submitting}
        disabled={!selectedPatient || !selectedDoctor || !chiefComplaint.trim()}
        icon={<ArrowRight size={18} color="#ffffff" />}
        style={{ marginTop: 12 }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectPatientBtn: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  selectPatientBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  selectedPatientBox: {
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
  patientMeta: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  patientCode: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  checkFeeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  feeStatusText: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  feeFirst: {
    color: '#0284c7',
  },
  feeSubsequent: {
    color: '#16a34a',
  },
  changeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  changeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  doctorsList: {
    gap: 10,
  },
  doctorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  doctorCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  docSelectedText: {
    color: '#ffffff',
  },
  doctorDept: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  docSelectedSubText: {
    color: 'rgba(255,255,255,0.85)',
  },
  doctorPricing: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorFee: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  summaryCard: {
    backgroundColor: '#f0fdfa', // Light teal tint
    borderWidth: 1.5,
    borderColor: 'rgba(13, 148, 136, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textCustom,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textCustom,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textCustom,
  },
  repeatBadge: {
    backgroundColor: '#ccfbf1',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'center',
    marginTop: 10,
  },
  repeatBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0d9488',
  },
});
