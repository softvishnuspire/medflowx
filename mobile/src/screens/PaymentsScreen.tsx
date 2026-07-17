import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { CreditCard, RefreshCw, ChevronRight, IndianRupee, ShieldCheck, X } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { getPendingInvoices, collectPayment } from '../services/reception';
import { PaymentMode } from '../types/reception';
import { Badge, Button } from '../components/UI';

interface PaymentsScreenProps {
  onNavigate?: (screen: string, params?: any) => void;
  checkoutInvoice?: any;
  onClearCheckout?: () => void;
}

export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({
  onNavigate,
  checkoutInvoice,
  onClearCheckout,
}) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Checkout Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [submitting, setSubmitting] = useState(false);

  const fetchInvoices = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getPendingInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to load pending invoices:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Handle immediate checkout navigation from visit wizard
  useEffect(() => {
    if (checkoutInvoice) {
      setSelectedInvoice(checkoutInvoice);
      setCheckoutVisible(true);
    }
  }, [checkoutInvoice]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchInvoices(true);
  };

  const handleOpenCheckout = (inv: any) => {
    const formattedInvoice = {
      visitId: inv.visit_id,
      invoiceId: inv.id,
      amount: inv.final_amount,
      patientName: `${inv.patients?.first_name} ${inv.patients?.last_name || ''}`.trim(),
      visitNumber: inv.visits?.visit_number,
    };
    setSelectedInvoice(formattedInvoice);
    setCheckoutVisible(true);
  };

  const handleCloseCheckout = () => {
    setCheckoutVisible(false);
    setSelectedInvoice(null);
    if (onClearCheckout) onClearCheckout();
  };

  const handleCollect = async () => {
    if (!selectedInvoice) return;
    setSubmitting(true);
    try {
      await collectPayment({
        visit_id: selectedInvoice.visitId,
        invoice_id: selectedInvoice.invoiceId,
        amount: selectedInvoice.amount,
        payment_mode: paymentMode,
      });

      Alert.alert(
        'Billing Complete',
        `Payment of ₹${selectedInvoice.amount} via ${paymentMode} recorded successfully.`,
        [
          {
            text: 'OK',
            onPress: () => {
              handleCloseCheckout();
              fetchInvoices();
              if (onNavigate) onNavigate('queue');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Checkout Failed', error.message || 'An error occurred during payment collection.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderInvoiceCard = ({ item }: { item: any }) => {
    const patientName = `${item.patients?.first_name} ${item.patients?.last_name || ''}`.trim();
    const docName = item.visits?.doctors?.profiles?.full_name || 'Dr. Practitioner';
    const deptName = item.visits?.doctors?.departments?.department_name || 'General OPD';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleOpenCheckout(item)}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.amountBox}>
            <Text style={styles.amountSymbol}>₹</Text>
            <Text style={styles.amountVal}>{item.final_amount}</Text>
          </View>

          <View style={styles.invoiceDetails}>
            <Text style={styles.patientName}>{patientName}</Text>
            <Text style={styles.patientSubText}>
              {item.patients?.patient_code} • {item.visits?.visit_number}
            </Text>
            <Text style={styles.docText}>
              {docName} ({deptName})
            </Text>
          </View>

          <ChevronRight size={16} color="#94a3b8" />
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <Text style={styles.invoiceNumText}>{item.invoice_number}</Text>
          <Badge label="UNPAID" variant="error" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header Controls */}
      <View style={styles.controlHeader}>
        <View>
          <Text style={styles.title}>Billing desk</Text>
          <Text style={styles.subtitle}>Outstanding consultation invoices</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleRefresh}
          style={styles.refreshBtn}
        >
          <RefreshCw size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Invoice list */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={invoices}
          renderItem={renderInvoiceCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <CreditCard size={32} color={colors.primary} />
              </View>
              <Text style={styles.emptyText}>No pending invoices</Text>
              <Text style={styles.emptySubText}>
                All consultations have been checked out and paid.
              </Text>
            </View>
          }
        />
      )}

      {/* Checkout Bottom Modal */}
      <Modal
        visible={checkoutVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseCheckout}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Collect Payment</Text>
              <TouchableOpacity
                onPress={handleCloseCheckout}
                style={styles.closeBtn}
              >
                <X size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            {selectedInvoice && (
              <View style={styles.modalContent}>
                {/* Billing Summary Box */}
                <View style={styles.checkoutSummary}>
                  <Text style={styles.summaryLabel}>PATIENT OUTPATIENT</Text>
                  <Text style={styles.summaryName}>{selectedInvoice.patientName}</Text>
                  <Text style={styles.summarySub}>
                    Visit: {selectedInvoice.visitNumber}
                  </Text>

                  <View style={styles.amountLargeBox}>
                    <Text style={styles.amountLargeLabel}>AMOUNT DUE</Text>
                    <View style={styles.amountLargeRow}>
                      <IndianRupee size={28} color={colors.textCustom} />
                      <Text style={styles.amountLargeVal}>{selectedInvoice.amount}</Text>
                    </View>
                  </View>
                </View>

                {/* Payment mode selector */}
                {selectedInvoice.amount > 0 ? (
                  <View style={styles.modeSection}>
                    <Text style={styles.modeSectionLabel}>SELECT PAYMENT METHOD</Text>
                    <View style={styles.modeRow}>
                      {(['Cash', 'UPI', 'Card'] as PaymentMode[]).map((mode) => {
                        const isSelected = paymentMode === mode;
                        return (
                          <TouchableOpacity
                            key={mode}
                            onPress={() => setPaymentMode(mode)}
                            style={[
                              styles.modeBtn,
                              isSelected && styles.modeBtnActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.modeText,
                                isSelected && styles.modeTextActive,
                              ]}
                            >
                              {mode}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  <View style={styles.freeVisitAlert}>
                    <ShieldCheck size={20} color="#16a34a" style={{ marginRight: 8 }} />
                    <Text style={styles.freeVisitText}>Repeat consultation visit. No fee is required.</Text>
                  </View>
                )}

                {/* Submit action */}
                <Button
                  title={
                    selectedInvoice.amount > 0
                      ? `Record Payment (via ${paymentMode})`
                      : 'Confirm Free Visit'
                  }
                  onPress={handleCollect}
                  loading={submitting}
                  style={styles.collectBtn}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountBox: {
    width: 56,
    height: 56,
    backgroundColor: '#ecfdf5', // Light green
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.1)',
  },
  amountSymbol: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  amountVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  invoiceDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  patientSubText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  docText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    marginTop: 4,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptySubText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 220,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
    gap: 20,
  },
  checkoutSummary: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1.5,
    borderColor: 'rgba(13, 148, 136, 0.2)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0d9488',
    letterSpacing: 0.5,
  },
  summaryName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
  },
  summarySub: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  amountLargeBox: {
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    width: '100%',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.1)',
  },
  amountLargeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  amountLargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  amountLargeVal: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textCustom,
    marginLeft: 4,
  },
  modeSection: {
    gap: 8,
  },
  modeSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  modeRow: {
    flexDirection: 'row',
    height: 52,
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  modeTextActive: {
    color: '#ffffff',
  },
  freeVisitAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderColor: 'rgba(22, 163, 74, 0.15)',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
  },
  freeVisitText: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '700',
  },
  collectBtn: {
    backgroundColor: colors.primary,
  },
});
