// File: src/screens/auth/LoginScreen.tsx
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

export const LoginScreen = ({ navigation }: any) => {
  const { colors, isDark, toggleTheme } = useTheme(); // Added toggleTheme
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');
    if (!validateEmail(email)) return Alert.alert('Error', 'Please enter a valid email address');

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Something went wrong');
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

     {/* Minimal Header – only theme button on the right */}
      <View style={styles.header}>
        {/* Invisible spacer so the button stays perfectly on the right */}
        <View style={{ width: 56 }} />

        {/* Theme Toggle Button */}
        <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
          <Ionicons
            name={isDark ? 'sunny-outline' : 'moon-outline'}
            size={26}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo & Greeting */}
        <View style={styles.topSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/login.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: colors.textLight }]}>
            Sign in to track your buses
          </Text>
        </View>

        {/* Login Form */}
        <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Login to Your Account</Text>

          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Email address"
              placeholderTextColor={colors.textLight + '80'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

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

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={[styles.signupText, { color: colors.textLight }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={[styles.signupLink, { color: colors.primary }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // New Header with Theme Button
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  themeButton: {
    padding: 8,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderRadius: 30,
  },

  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 60,
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
  },
  logo: { width: 200, height: 500 },
  title: { fontSize: 32, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
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

  loginButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  loginButtonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },

  signupContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupText: { fontSize: 15 },
  signupLink: { fontSize: 15, fontWeight: '700' },
});