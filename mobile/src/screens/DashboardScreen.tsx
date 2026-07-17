import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle,
  IndianRupee,
  UserPlus,
  Search,
  CreditCard,
  ListOrdered,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { getDashboardStats } from '../services/reception';

interface DashboardScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    todayPatients: 0,
    todayVisits: 0,
    waitingPatients: 0,
    completedVisits: 0,
    todayRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const statCards = [
    {
      title: 'Patients Today',
      value: stats.todayPatients,
      icon: <Users size={20} color={colors.primary} />,
      bgColor: '#e0f2fe', // sky-100 tint
    },
    {
      title: 'Visits Scheduled',
      value: stats.todayVisits,
      icon: <Calendar size={20} color="#0891b2" />,
      bgColor: '#ecfeff', // cyan-100 tint
    },
    {
      title: 'Patients Waiting',
      value: stats.waitingPatients,
      icon: <Clock size={20} color="#d97706" />,
      bgColor: '#fef3c7', // amber-100 tint
    },
    {
      title: 'Consultations Done',
      value: stats.completedVisits,
      icon: <CheckCircle size={20} color="#16a34a" />,
      bgColor: '#dcfce7', // green-100 tint
    },
    {
      title: "Today's Revenue",
      value: `₹${stats.todayRevenue}`,
      icon: <IndianRupee size={20} color="#0d9488" />,
      bgColor: '#f0fdfa', // teal-100 tint
      fullWidth: true,
    },
  ];

  const menuItems = [
    {
      label: 'Register Patient',
      subtitle: 'Add new outpatient',
      icon: <UserPlus size={24} color="#ffffff" />,
      bgColor: colors.primary,
      target: 'registration',
    },
    {
      label: 'Visit Wizard',
      subtitle: 'Schedule consultation',
      icon: <Calendar size={24} color="#ffffff" />,
      bgColor: '#0891b2',
      target: 'visit',
    },
    {
      label: 'Today Queue',
      subtitle: 'Track waiting list',
      icon: <ListOrdered size={24} color="#ffffff" />,
      bgColor: '#d97706',
      target: 'queue',
    },
    {
      label: 'Payments Desk',
      subtitle: 'Checkout & billing',
      icon: <CreditCard size={24} color="#ffffff" />,
      bgColor: '#16a34a',
      target: 'payments',
    },
    {
      label: 'Search Database',
      subtitle: 'Find patient records',
      icon: <Search size={24} color="#ffffff" />,
      bgColor: '#6366f1',
      target: 'patients',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Daily Overview</Text>
        <Text style={styles.sectionSubtitle}>Live dashboard aggregations</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.statsGrid}>
          {statCards.map((card, idx) => (
            <View
              key={idx}
              style={[
                styles.statCard,
                card.fullWidth ? styles.fullWidthCard : styles.halfWidthCard,
                { backgroundColor: card.bgColor },
              ]}
            >
              <View style={styles.statHeader}>
                <Text style={styles.statTitle}>{card.title}</Text>
                <View style={styles.statIcon}>{card.icon}</View>
              </View>
              <Text style={styles.statValue}>{card.value}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Services</Text>
        <Text style={styles.sectionSubtitle}>Access terminal workflows</Text>
      </View>

      <View style={styles.menuGrid}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.85}
            onPress={() => item.target && onNavigate(item.target)}
            style={styles.menuCard}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.bgColor }]}>
              {item.icon}
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
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
    paddingBottom: 32,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  loaderContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  halfWidthCard: {
    width: '48.5%',
  },
  fullWidthCard: {
    width: '100%',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  statIcon: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 6,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  menuGrid: {
    marginTop: 4,
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1.5,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuInfo: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 2,
  },
});
