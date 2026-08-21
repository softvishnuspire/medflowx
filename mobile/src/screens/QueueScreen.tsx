import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Clock, RefreshCw, Eye, ShieldAlert, X, ChevronRight, User, Stethoscope } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { getTodayQueue } from '../services/reception';
import { socket } from '../config/socket';
import { Badge } from '../components/UI';

interface QueueScreenProps {
  onNavigate?: (screen: string, params?: any) => void;
}

export const QueueScreen: React.FC<QueueScreenProps> = ({ onNavigate }) => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Detail Modal States
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const fetchQueue = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getTodayQueue();
      setQueue(data);
    } catch (error) {
      console.error('Failed to load queue:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueue();

    // Listen to Socket.io events for live queue updates
    socket.connect();
    
    const handleQueueUpdate = (data: any) => {
      console.log('Socket queue update received:', data);
      fetchQueue(true); // reload list silently
    };

    socket.on('update-queue', handleQueueUpdate);
    socket.on('queue-updated', handleQueueUpdate); // handle duplicate variations

    return () => {
      socket.off('update-queue', handleQueueUpdate);
      socket.off('queue-updated', handleQueueUpdate);
      socket.disconnect();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchQueue(true);
  };

  const getStatusConfig = (status: string) => {
    let uiStatus = 'Waiting';
    let badgeVariant: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'neutral' = 'neutral';

    if (status === 'In Progress') {
      uiStatus = 'In Progress';
      badgeVariant = 'info';
    } else if (['Prescribed', 'Dispensed', 'Closed'].includes(status)) {
      uiStatus = 'Completed';
      badgeVariant = 'success';
    } else if (status === 'Cancelled') {
      uiStatus = 'Cancelled';
      badgeVariant = 'error';
    } else {
      uiStatus = 'Waiting';
      badgeVariant = 'warning';
    }

    return { uiStatus, badgeVariant };
  };

  const renderVisitCard = ({ item }: { item: any }) => {
    const { uiStatus, badgeVariant } = getStatusConfig(item.status);
    const patientName = `${item.patients?.first_name} ${item.patients?.last_name || ''}`.trim();
    const docName = item.doctors?.profiles?.full_name || 'Dr. Practitioner';
    const deptName = item.doctors?.departments?.department_name || 'General OPD';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          setSelectedVisit(item);
          setDetailVisible(true);
        }}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          {/* Token number block */}
          <View style={styles.tokenBox}>
            <Text style={styles.tokenLabel}>TOKEN</Text>
            <Text style={styles.tokenNum}>{item.token_no}</Text>
          </View>

          {/* Details */}
          <View style={styles.visitDetails}>
            <Text style={styles.patientName}>{patientName}</Text>
            <Text style={styles.patientSubText}>
              {item.patients?.patient_code} • {item.patients?.gender} • {item.patients?.age || 'N/A'} yrs
            </Text>
            <Text style={styles.docText}>
              {docName}
            </Text>
          </View>

          <ChevronRight size={16} color="#94a3b8" />
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <Text style={styles.visitNumText}>{item.visit_number}</Text>
          <Badge label={uiStatus} variant={badgeVariant} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header Controls */}
      <View style={styles.controlHeader}>
        <View>
          <Text style={styles.title}>Today's Waiting List</Text>
          <Text style={styles.subtitle}>Real-time Socket.io active queue</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleRefresh}
          style={styles.refreshBtn}
        >
          <RefreshCw size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Queue List */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={queue}
          renderItem={renderVisitCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Clock size={32} color={colors.primary} />
              </View>
              <Text style={styles.emptyText}>No active tokens today</Text>
              <Text style={styles.emptySubText}>
                No visits are registered for today's OPD session.
              </Text>
            </View>
          }
        />
      )}

      {/* Details Dialog Modal */}
      <Modal
        visible={detailVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Consultation Intake Detail</Text>
              <TouchableOpacity
                onPress={() => setDetailVisible(false)}
                style={styles.closeBtn}
              >
                <X size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            {selectedVisit && (
              <ScrollView contentContainerStyle={styles.modalContent}>
                {/* Patient Profile Box */}
                <View style={styles.modalSectionBox}>
                  <View style={styles.modalRow}>
                    <User size={16} color={colors.primary} style={styles.modalSectionIcon} />
                    <Text style={styles.modalSectionTitle}>Patient Details</Text>
                  </View>
                  <Text style={styles.modalItemValue}>
                    {selectedVisit.patients?.first_name} {selectedVisit.patients?.last_name || ''}
                  </Text>
                  <Text style={styles.modalItemSub}>
                    Code: {selectedVisit.patients?.patient_code} • Phone: {selectedVisit.patients?.phone}
                  </Text>
                </View>

                {/* Doctor Box */}
                <View style={styles.modalSectionBox}>
                  <View style={styles.modalRow}>
                    <Stethoscope size={16} color={colors.primary} style={styles.modalSectionIcon} />
                    <Text style={styles.modalSectionTitle}>Consulting Doctor</Text>
                  </View>
                  <Text style={styles.modalItemValue}>
                    {selectedVisit.doctors?.profiles?.full_name || 'Dr. Practitioner'}
                  </Text>
                  <Text style={styles.modalItemSub}>
                    Department: {selectedVisit.doctors?.departments?.department_name || 'General OPD'}
                  </Text>
                </View>

                {/* Chief Complaint */}
                <View style={styles.modalSectionBox}>
                  <Text style={styles.modalSectionTitle}>Chief Complaint</Text>
                  <View style={styles.complaintBubble}>
                    <Text style={styles.complaintText}>
                      {selectedVisit.chief_complaint || 'No complaint notes entered.'}
                    </Text>
                  </View>
                </View>

                {/* Allergies Alerts */}
                {selectedVisit.patients?.allergies && (
                  <View style={styles.allergyCard}>
                    <View style={styles.modalRow}>
                      <ShieldAlert size={18} color={colors.error} style={{ marginRight: 8 }} />
                      <Text style={styles.allergyTitle}>Allergy Warning</Text>
                    </View>
                    <Text style={styles.allergyText}>{selectedVisit.patients.allergies}</Text>
                  </View>
                )}
              </ScrollView>
            )}

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setDetailVisible(false)}
                style={styles.modalCloseAction}
              >
                <Text style={styles.modalCloseActionText}>Close Details</Text>
              </TouchableOpacity>
            </View>
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
  tokenBox: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  tokenLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  tokenNum: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
  },
  visitDetails: {
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
  visitNumText: {
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
    maxHeight: '80%',
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
  },
  modalSectionBox: {
    marginBottom: 18,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalSectionIcon: {
    marginRight: 6,
  },
  modalSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalItemValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalItemSub: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  complaintBubble: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  complaintText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '600',
  },
  allergyCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  allergyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.error,
    textTransform: 'uppercase',
  },
  allergyText: {
    fontSize: 13,
    color: '#7f1d1d',
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 18,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  modalCloseAction: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  modalCloseActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
});
