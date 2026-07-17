import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { User, Phone, MapPin, ClipboardList } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { Input, Button } from '../components/UI';
import { registerPatient } from '../services/reception';
import { Gender } from '../types/reception';

interface RegistrationScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

export const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ onNavigate }) => {
  // Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [age, setAge] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [occupation, setOccupation] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');

  // Loader & Errors
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'First name is required.';
    if (!phone.trim()) {
      errs.phone = 'Phone number is required.';
    } else if (phone.trim().length < 10) {
      errs.phone = 'Invalid phone number (min 10 digits).';
    }
    if (!addressLine.trim()) errs.addressLine = 'Address line is required.';
    if (!city.trim()) errs.city = 'City is required.';
    if (!state.trim()) errs.state = 'State is required.';
    if (!pincode.trim()) {
      errs.pincode = 'Pincode is required.';
    } else if (isNaN(Number(pincode.trim()))) {
      errs.pincode = 'Pincode must be a number.';
    }
    if (age && isNaN(Number(age))) {
      errs.age = 'Age must be a number.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please correct the highlighted errors before submitting.');
      return;
    }

    setLoading(true);
    try {
      const response = await registerPatient({
        first_name: firstName.trim(),
        last_name: lastName.trim() || undefined,
        gender,
        age: age ? Number(age) : undefined,
        blood_group: bloodGroup.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        emergency_contact: emergencyContact.trim() || undefined,
        occupation: occupation.trim() || undefined,
        address_line: addressLine.trim(),
        city: city.trim(),
        district: district.trim() || undefined,
        state: state.trim(),
        country: 'India',
        pincode: pincode.trim(),
        allergies: allergies.trim() || undefined,
        medical_history: medicalHistory.trim() || undefined,
      });

      Alert.alert(
        'Registration Success',
        `Patient ${response.patient.first_name} has been successfully registered with code ${response.patient.patient_code}.`,
        [
          {
            text: 'View Profile',
            onPress: () => onNavigate('profile', { patientId: response.patient.id }),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <User size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Demographics</Text>
          </View>

          <Input
            label="First Name *"
            value={firstName}
            onChangeText={(t) => {
              setFirstName(t);
              setErrors((e) => ({ ...e, firstName: '' }));
            }}
            placeholder="John"
            error={errors.firstName}
          />

          <Input
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Doe"
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectLabel}>Gender *</Text>
              <View style={styles.genderRow}>
                {['Male', 'Female', 'Other'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(g as Gender)}
                    style={[
                      styles.genderBtn,
                      gender === g && styles.genderBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        gender === g && styles.genderTextActive,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ width: 110, marginLeft: 12 }}>
              <Input
                label="Age"
                value={age}
                onChangeText={(t) => {
                  setAge(t);
                  setErrors((e) => ({ ...e, age: '' }));
                }}
                placeholder="28"
                keyboardType="numeric"
                error={errors.age}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input
                label="Blood Group"
                value={bloodGroup}
                onChangeText={setBloodGroup}
                placeholder="O+"
                autoCapitalize="characters"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Input
                label="Occupation"
                value={occupation}
                onChangeText={setOccupation}
                placeholder="Engineer"
              />
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Phone size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Contact & Info</Text>
          </View>

          <Input
            label="Phone Number *"
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              setErrors((e) => ({ ...e, phone: '' }));
            }}
            placeholder="10-digit mobile"
            keyboardType="phone-pad"
            error={errors.phone}
          />

          <Input
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="example@mail.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Emergency Contact No."
            value={emergencyContact}
            onChangeText={setEmergencyContact}
            placeholder="Guardian phone number"
            keyboardType="phone-pad"
          />
        </View>

        {/* Address Info */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <MapPin size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Address Details</Text>
          </View>

          <Input
            label="Address Line *"
            value={addressLine}
            onChangeText={(t) => {
              setAddressLine(t);
              setErrors((e) => ({ ...e, addressLine: '' }));
            }}
            placeholder="House/Plot/Street address"
            error={errors.addressLine}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input
                label="City *"
                value={city}
                onChangeText={(t) => {
                  setCity(t);
                  setErrors((e) => ({ ...e, city: '' }));
                }}
                placeholder="City"
                error={errors.city}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Input
                label="District"
                value={district}
                onChangeText={setDistrict}
                placeholder="District"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input
                label="State *"
                value={state}
                onChangeText={(t) => {
                  setState(t);
                  setErrors((e) => ({ ...e, state: '' }));
                }}
                placeholder="State"
                error={errors.state}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Input
                label="Pincode *"
                value={pincode}
                onChangeText={(t) => {
                  setPincode(t);
                  setErrors((e) => ({ ...e, pincode: '' }));
                }}
                placeholder="Pincode"
                keyboardType="numeric"
                error={errors.pincode}
              />
            </View>
          </View>
        </View>

        {/* Medical Notes */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <ClipboardList size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Medical Context</Text>
          </View>

          <Input
            label="Allergies"
            value={allergies}
            onChangeText={setAllergies}
            placeholder="e.g. Penicillin, Peanuts (or None)"
            multiline
            style={{ height: 60, textAlignVertical: 'top', paddingTop: 8 }}
          />

          <Input
            label="Medical History"
            value={medicalHistory}
            onChangeText={setMedicalHistory}
            placeholder="e.g. Hypertension, Diabetes, Past surgeries"
            multiline
            style={{ height: 60, textAlignVertical: 'top', paddingTop: 8 }}
          />
        </View>

        {/* Actions */}
        <View style={styles.actionContainer}>
          <Button
            title="Register Patient"
            onPress={handleRegister}
            loading={loading}
            style={styles.submitBtn}
          />
          <Button
            title="Cancel"
            onPress={() => onNavigate('patients')}
            variant="ghost"
            style={styles.cancelBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
  },
  selectLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  genderRow: {
    flexDirection: 'row',
    height: 52,
    gap: 8,
    marginBottom: 16,
  },
  genderBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  genderBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  genderTextActive: {
    color: '#ffffff',
  },
  actionContainer: {
    gap: 8,
    marginTop: 8,
  },
  submitBtn: {
    backgroundColor: colors.primary,
  },
  cancelBtn: {
    height: 48,
  },
});
