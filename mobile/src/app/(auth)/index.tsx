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
import { useRouter } from 'expo-router';
import { setAuthUser } from '@/lib/storage';
import { Stethoscope, Mail, Lock, ArrowRight, Shield, Users, Pill, ChevronDown, Check } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { Input, Button } from '@/components/UI';

const ROLES = [
  {
    id: 'admin',
    name: 'Administrator',
    roleLabel: 'ADMINISTRATOR',
    authRole: 'Admin',
    description: 'Full system access',
    defaultEmail: 'sarahpost@trueupmedia.com',
    icon: Shield,
    color: '#3b82f6',
    path: '/admin',
  },
  {
    id: 'reception',
    name: 'Receptionist',
    roleLabel: 'RECEPTIONIST PANEL',
    authRole: 'Reception',
    description: 'Patient desk & billing',
    defaultEmail: 'sarah@medflowx.com',
    icon: Users,
    color: '#14b8a6',
    path: '/reception',
  },
  {
    id: 'doctor',
    name: 'Doctor',
    roleLabel: 'DOCTOR PORTAL',
    authRole: 'Doctor',
    description: 'Clinical consultation',
    defaultEmail: 'doctor@medflowx.com',
    icon: Stethoscope,
    color: '#10b981',
    path: '/doctor',
  },
  {
    id: 'pharmacy',
    name: 'Pharmacist',
    roleLabel: 'PHARMACY DESK',
    authRole: 'Pharmacy',
    description: 'Prescription & dispense',
    defaultEmail: 'pharmacy@medflowx.com',
    icon: Pill,
    color: '#a855f7',
    path: '/pharmacy',
  }
];

export default function AuthPage() {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState(ROLES[1]); // Default to Receptionist
  const [email, setEmail] = useState(ROLES[1].defaultEmail);
  const [password, setPassword] = useState('password123');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRoleChange = (role: typeof ROLES[0]) => {
    setActiveRole(role);
    setEmail(role.defaultEmail);
    setErrorMsg(null);
    setIsDropdownOpen(false);
  };

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

    setTimeout(async () => {
      try {
        await setAuthUser({
          email: email.trim().toLowerCase(),
          role: activeRole.authRole,
          name: activeRole.name,
          avatarCode: activeRole.name.substring(0, 2).toUpperCase(),
        });

        setLoading(false);
        router.replace(activeRole.path as any);
      } catch (err: any) {
        setErrorMsg('Authentication failed. Please try again.');
        setLoading(false);
      }
    }, 1200);
  };

  const ActiveIcon = activeRole.icon;

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
              Access your personalized workspace
            </Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Sign In</Text>
              <View style={[styles.roleBadge, { backgroundColor: activeRole.color + '1A', borderColor: activeRole.color + '33' }]}>
                <ActiveIcon size={12} color={activeRole.color} style={{ marginRight: 4 }} />
                <Text style={[styles.roleBadgeText, { color: activeRole.color }]}>{activeRole.roleLabel}</Text>
              </View>
            </View>

            {/* Role Selector */}
            <View style={styles.roleSelectorContainer}>
              <Text style={styles.inputLabel}>WORKSPACE ROLE</Text>
              <TouchableOpacity 
                style={styles.roleDropdownBtn}
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <View style={styles.roleDropdownLeft}>
                  <View style={styles.roleIconWrapper}>
                    <ActiveIcon size={20} color={activeRole.color} />
                  </View>
                  <View>
                    <Text style={styles.roleNameText}>{activeRole.name}</Text>
                    <Text style={styles.roleDescText}>{activeRole.description}</Text>
                  </View>
                </View>
                <ChevronDown size={20} color="#64748b" />
              </TouchableOpacity>

              {isDropdownOpen && (
                <View style={styles.dropdownList}>
                  {ROLES.map((role, index) => {
                    const RoleIcon = role.icon;
                    const isSelected = activeRole.id === role.id;
                    const isLast = index === ROLES.length - 1;
                    return (
                      <TouchableOpacity 
                        key={role.id}
                        onPress={() => handleRoleChange(role)}
                        style={[
                          styles.dropdownItem,
                          isSelected && styles.dropdownItemSelected,
                          !isLast && styles.dropdownItemBorder
                        ]}
                      >
                        <View style={styles.roleDropdownLeft}>
                          <View style={styles.dropdownIconWrapper}>
                            <RoleIcon size={16} color={role.color} />
                          </View>
                          <View>
                            <Text style={[styles.dropdownNameText, isSelected && { color: role.color }]}>{role.name}</Text>
                            <Text style={styles.dropdownDescText}>{role.description}</Text>
                          </View>
                        </View>
                        {isSelected && <Check size={18} color={role.color} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
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
              title={`Sign In to Terminal`}
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
    backgroundColor: '#14b8a6',
  },
  glow2: {
    bottom: '20%',
    right: '10%',
    width: 300,
    height: 300,
    backgroundColor: '#8b5cf6',
  },
  glow3: {
    bottom: '10%',
    left: '20%',
    width: 200,
    height: 200,
    backgroundColor: '#10b981',
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
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  roleSelectorContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  roleDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a0d16',
    borderWidth: 1,
    borderColor: '#1d293f',
    borderRadius: 16,
    padding: 12,
  },
  roleDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#0d111d',
    borderWidth: 1,
    borderColor: '#1d293f',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleNameText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  roleDescText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  dropdownList: {
    marginTop: 8,
    backgroundColor: '#0c101a',
    borderWidth: 1,
    borderColor: '#1e2a44',
    borderRadius: 16,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(27, 37, 59, 0.5)',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(27, 37, 59, 0.4)',
  },
  dropdownIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0a0d16',
    borderWidth: 1,
    borderColor: '#1d293f',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dropdownNameText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownDescText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
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
    backgroundColor: '#0284c7',
  },
});
