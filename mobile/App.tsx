import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { LogOut, Stethoscope, Home, Clock, CreditCard, Users } from 'lucide-react-native';

// Theme & Config
import { colors } from './src/theme/colors';

// Screens
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { PatientsScreen } from './src/screens/PatientsScreen';
import { RegistrationScreen } from './src/screens/RegistrationScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { VisitWizardScreen } from './src/screens/VisitWizardScreen';
import { QueueScreen } from './src/screens/QueueScreen';
import { PaymentsScreen } from './src/screens/PaymentsScreen';

type Tab = 'home' | 'patients' | 'registration' | 'visit' | 'queue' | 'payments' | 'profile';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  
  // Navigation Params
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [patientForVisit, setPatientForVisit] = useState<any>(null);
  const [invoiceForPayment, setInvoiceForPayment] = useState<any>(null);

  // Check login session on mount
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const saved = await AsyncStorage.getItem('medflowx_logged_in_user');
        if (saved) {
          setCurrentUser(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error reading auth state:', error);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkLogin();
  }, []);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setActiveTab('home');
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('medflowx_logged_in_user');
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigate = (tabName: string, params?: any) => {
    // Reset parameters first
    if (tabName !== 'profile') setSelectedPatientId(null);
    if (tabName !== 'visit') setPatientForVisit(null);
    if (tabName !== 'payments') setInvoiceForPayment(null);

    // Apply parameters
    if (params) {
      if (params.patientId) setSelectedPatientId(params.patientId);
      if (params.selectedPatient) setPatientForVisit(params.selectedPatient);
      if (params.selectedInvoice) setInvoiceForPayment(params.selectedInvoice);
    }

    setActiveTab(tabName as Tab);
  };

  if (checkingAuth) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Not logged in -> Render dark login
  if (!currentUser) {
    return (
      <SafeAreaProvider>
        <ExpoStatusBar style="light" />
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </SafeAreaProvider>
    );
  }

  // Logged in -> Render main receptionist workspace
  return (
    <SafeAreaProvider>
      <ExpoStatusBar style="dark" />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        
        {/* Top Header Bar */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Stethoscope size={16} color="#ffffff" />
            </View>
            <Text style={styles.logoText}>
              Medflow<Text style={{ color: colors.primary }}>X</Text>
            </Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{currentUser.avatarCode}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLogout}
              style={styles.logoutBtn}
            >
              <LogOut size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Screen Content */}
        <View style={styles.content}>
          {activeTab === 'home' && (
            <DashboardScreen onNavigate={handleNavigate} />
          )}

          {activeTab === 'patients' && (
            <PatientsScreen
              onNavigate={handleNavigate}
              onSelectPatient={(p) => setPatientForVisit(p)}
            />
          )}

          {activeTab === 'registration' && (
            <RegistrationScreen onNavigate={handleNavigate} />
          )}

          {activeTab === 'profile' && selectedPatientId && (
            <ProfileScreen
              patientId={selectedPatientId}
              onBack={() => handleNavigate('patients')}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'visit' && (
            <VisitWizardScreen
              initialPatient={patientForVisit}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'queue' && (
            <QueueScreen onNavigate={handleNavigate} />
          )}

          {activeTab === 'payments' && (
            <PaymentsScreen
              onNavigate={handleNavigate}
              checkoutInvoice={invoiceForPayment}
              onClearCheckout={() => setInvoiceForPayment(null)}
            />
          )}
        </View>

        {/* Bottom Navigation Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => handleNavigate('home')}
          >
            <Home size={20} color={activeTab === 'home' ? colors.primary : '#94a3b8'} />
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => handleNavigate('patients')}
          >
            <Users size={20} color={activeTab === 'patients' || activeTab === 'profile' ? colors.primary : '#94a3b8'} />
            <Text style={[styles.tabLabel, (activeTab === 'patients' || activeTab === 'profile') && styles.tabLabelActive]}>
              Patients
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => handleNavigate('queue')}
          >
            <Clock size={20} color={activeTab === 'queue' ? colors.primary : '#94a3b8'} />
            <Text style={[styles.tabLabel, activeTab === 'queue' && styles.tabLabelActive]}>
              Queue
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => handleNavigate('payments')}
          >
            <CreditCard size={20} color={activeTab === 'payments' ? colors.primary : '#94a3b8'} />
            <Text style={[styles.tabLabel, activeTab === 'payments' && styles.tabLabelActive]}>
              Payments
            </Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    backgroundColor: colors.primary,
    padding: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.2)',
  },
  avatarText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  tabBar: {
    height: 60,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    paddingBottom: Platform.OS === 'ios' ? 8 : 0,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
