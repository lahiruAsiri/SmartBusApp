// File: src/screens/auth/SignupScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const POLICEMAN_SECRET_CODE = "POLICE2025"; // Change this to anything you want
const DRIVER_SECRET_CODE = "BUS2025"; // Secret code for bus drivers

export const SignupScreen = ({ navigation }: any) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'user' | 'policeman' | 'driver'>('user');
  const [secretCode, setSecretCode] = useState(''); // Only shown for policeman and driver
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignup = async () => {
    if (!displayName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Special check for Policeman
    if (role === 'policeman') {
      if (secretCode !== POLICEMAN_SECRET_CODE) {
        Alert.alert(
          'Access Denied',
          'Invalid police verification code.\n\nPlease contact admin for the correct code.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    // Special check for Driver
    if (role === 'driver') {
      if (secretCode !== DRIVER_SECRET_CODE) {
        Alert.alert(
          'Access Denied',
          'Invalid driver verification code.\n\nPlease contact admin for the correct code.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    setLoading(true);
    try {
      await signUp(email, password, displayName, role);
      Alert.alert('Success', 'Account created successfully!');
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Minimal Header - Theme Toggle Only */}
      <View style={styles.header}>
        <View style={{ width: 56 }} />
        <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
          <Ionicons
            name={isDark ? 'sunny-outline' : 'moon-outline'}
            size={26}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo & Title */}
        <View style={styles.topSection}>
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textLight }]}>
            Sign up to get started
          </Text>
        </View>

        {/* Form Card */}
        <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Join SmartBus</Text>

          {/* Full Name */}
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Full Name"
              placeholderTextColor={colors.textLight + '80'}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          </View>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Email Address"
              placeholderTextColor={colors.textLight + '80'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={colors.textLight + '80'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Confirm Password */}
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Confirm Password"
              placeholderTextColor={colors.textLight + '80'}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Role Selector */}
          <View style={styles.roleSection}>
            <Text style={[styles.roleLabel, { color: colors.text }]}>Select Your Role</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'user' && styles.roleButtonActive,
                  role === 'user' && { borderColor: colors.primary },
                ]}
                onPress={() => setRole('user')}
              >
                <Ionicons name="person-outline" size={24} color={role === 'user' ? colors.primary : colors.textLight} />
                <Text style={[styles.roleText, role === 'user' && { color: colors.primary, fontWeight: '700' }]}>User</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'policeman' && styles.roleButtonActive,
                  role === 'policeman' && { borderColor: colors.primary },
                ]}
                onPress={() => setRole('policeman')}
              >
                <Ionicons name="shield-checkmark-outline" size={24} color={role === 'policeman' ? colors.primary : colors.textLight} />
                <Text style={[styles.roleText, role === 'policeman' && { color: colors.primary, fontWeight: '700' }]}>Police</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'driver' && styles.roleButtonActive,
                  role === 'driver' && { borderColor: colors.primary },
                ]}
                onPress={() => setRole('driver')}
              >
                <Ionicons name="bus-outline" size={24} color={role === 'driver' ? colors.primary : colors.textLight} />
                <Text style={[styles.roleText, role === 'driver' && { color: colors.primary, fontWeight: '700' }]}>Driver</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Secret Code Input - Only visible when Policeman or Driver is selected */}
          {(role === 'policeman' || role === 'driver') && (
            <View style={styles.inputWrapper}>
              <Ionicons name="key-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { borderColor: colors.primary + '60', color: colors.text }]}
                placeholder={role === 'policeman' ? "Enter Police Code (Required)" : "Enter Driver Code (Required)"}
                placeholderTextColor={colors.textLight + '80'}
                value={secretCode}
                onChangeText={setSecretCode}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          )}

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[styles.signupButton, { backgroundColor: colors.primary }]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: colors.textLight }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, { color: colors.primary }]}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: -10,
  },
  themeButton: {
    padding: 10,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderRadius: 30,
  },
  scrollContent: { flexGrow: 1, paddingVertical: 20 },
  topSection: { alignItems: 'center', marginBottom: 40, marginTop: -20 },
  logoContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
  },
  logo: { width: 100, height: 100 },
  title: { fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', opacity: 0.85 },
  formContainer: {
    marginHorizontal: 24,
    padding: 28,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  formTitle: { fontSize: 19, fontWeight: '700', textAlign: 'center', marginBottom: 24 },
  inputWrapper: { position: 'relative', marginBottom: 16 },
  inputIcon: { position: 'absolute', left: 16, top: 18, zIndex: 1 },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 48,
    fontSize: 16,
    fontWeight: '500',
  },
  roleSection: { marginVertical: 10 },
  roleLabel: { fontSize: 16, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  roleButtons: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  roleButton: {
    width: 95,
    height: 100,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  roleButtonActive: {
    backgroundColor: '#0EA5E9' + '15',
  },
  roleText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  signupButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  signupButtonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { fontSize: 15 },
  loginLink: { fontSize: 15, fontWeight: '700' },
});