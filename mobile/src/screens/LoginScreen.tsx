import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stethoscope, Mail, Lock, ArrowRight, Shield } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { Input, Button } from '../components/UI';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('sarah@medflowx.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMsg(null);
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);

    // Simulate network latency for a premium login feedback cycle
    setTimeout(async () => {
      try {
        const userProfile = {
          email: email.trim().toLowerCase(),
          role: 'Reception',
          name: 'Sarah Connor',
          avatarCode: 'SC',
        };

        await AsyncStorage.setItem(
          'medflowx_logged_in_user',
          JSON.stringify(userProfile)
        );

        setLoading(false);
        onLoginSuccess(userProfile);
      } catch (err: any) {
        setErrorMsg('Authentication failed. Please try again.');
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <View style={styles.container}>
      {/* Background glowing blur elements */}
      <View style={[styles.glow, styles.glow1]} />
      <View style={[styles.glow, styles.glow2]} />
      <View style={[styles.glow, styles.glow3]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBox}>
              <View style={styles.logoIcon}>
                <Stethoscope size={24} color="#ffffff" />
              </View>
              <Text style={styles.logoText}>
                Medflow<Text style={{ color: '#10b981' }}>X</Text>
              </Text>
            </View>
            
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subWelcome}>
              Access the receptionist terminal panel
            </Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Sign In</Text>
              <View style={styles.roleBadge}>
                <Shield size={12} color={colors.secondary} style={{ marginRight: 4 }} />
                <Text style={styles.roleBadgeText}>RECEPTIONIST PANEL</Text>
              </View>
            </View>

            {/* Email Field */}
            <Input
              label="Email Address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrorMsg(null);
              }}
              placeholder="name@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              dark={true}
              icon={<Mail size={18} color="#64748b" />}
            />

            {/* Password Field */}
            <Input
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrorMsg(null);
              }}
              placeholder="••••••••"
              secureTextEntry
              dark={true}
              icon={<Lock size={18} color="#64748b" />}
            />

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'Demo Note',
                  'Password reset link is disabled in the preview environment.'
                )
              }
              style={styles.forgotContainer}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Error Message */}
            {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

            {/* Submit Button */}
            <Button
              title="Sign In to Terminal"
              onPress={handleLogin}
              loading={loading}
              icon={<ArrowRight size={18} color="#ffffff" />}
              style={styles.signInButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040812',
    position: 'relative',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
  },
  glow1: {
    top: '10%',
    left: '10%',
    width: 250,
    height: 250,
    backgroundColor: '#14b8a6', // Teal
  },
  glow2: {
    bottom: '20%',
    right: '10%',
    width: 300,
    height: 300,
    backgroundColor: '#8b5cf6', // Violet
  },
  glow3: {
    bottom: '10%',
    left: '20%',
    width: 200,
    height: 200,
    backgroundColor: '#10b981', // Emerald
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0d16',
    borderWidth: 1,
    borderColor: '#1b253b',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  logoIcon: {
    backgroundColor: '#10b981',
    padding: 6,
    borderRadius: 10,
    marginRight: 10,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  welcomeText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subWelcome: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(13, 17, 29, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(27, 37, 59, 0.5)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
    borderColor: 'rgba(20, 184, 166, 0.2)',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  roleBadgeText: {
    color: '#14b8a6',
    fontSize: 10,
    fontWeight: '700',
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  forgotText: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  signInButton: {
    backgroundColor: '#0284c7', // Sky blue match
  },
});
