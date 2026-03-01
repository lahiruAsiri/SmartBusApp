// src/screens/policeman/InvestigationNoteScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../api/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const VIOLATION_TYPES = [
  'Speeding',
  'Reckless Driving',
  'Overloading',
  'Illegal Parking',
  'Running Red Light',
  'Wrong Direction',
  'Other',
];

export const InvestigationNoteScreen = ({ route, navigation }: any) => {
  const { colors, isDark } = useTheme();
  const { userData } = useAuth(); // To get Police Officer details
  
  // Accept optional params if navigated from a profile screen
  const initialBusId = route?.params?.busId || '';
  const initialDriverName = route?.params?.driverName || '';

  const [busNumber, setBusNumber] = useState(initialBusId);
  const [driverName, setDriverName] = useState(initialDriverName);
  const [violationType, setViolationType] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [ticketImageUri, setTicketImageUri] = useState<string | null>(null);
  const [ticketImageBase64, setTicketImageBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ──────────────────────────────────────────
  // Image picker
  // ──────────────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.3, // Compressed for Firestore limits
      base64: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets.length > 0) {
      setTicketImageUri(result.assets[0].uri);
      setTicketImageBase64(result.assets[0].base64 || null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.3, // Compressed for Firestore limits
      base64: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets.length > 0) {
      setTicketImageUri(result.assets[0].uri);
      setTicketImageBase64(result.assets[0].base64 || null);
    }
  };

  const handleImageAction = () => {
    Alert.alert('Upload Ticket Image', 'Choose a source', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Photo Library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ──────────────────────────────────────────
  // Submission
  // ──────────────────────────────────────────
  const handleSubmit = async () => {
    if (!busNumber.trim()) {
      Alert.alert('Required', 'Please enter the Bus Number.');
      return;
    }
    if (!driverName.trim()) {
      Alert.alert('Required', 'Please enter the Driver Name.');
      return;
    }
    if (!violationType) {
      Alert.alert('Required', 'Please select a Violation Type.');
      return;
    }
    if (!ticketImageBase64) {
      Alert.alert('Required', 'Please upload a photo of the fine ticket.');
      return;
    }

    setSubmitting(true);
    
    try {
      // Create a base64 string to store directly in Firestore
      // This bypasses Firebase Storage requirements
      const imageUrl = `data:image/jpeg;base64,${ticketImageBase64}`;

      // 2. Save the note record to Firestore
      const noteData = {
        busNumber: busNumber.trim().toUpperCase(),
        driverName: driverName.trim(),
        violationType: violationType,
        ticketImageUrl: imageUrl,
        officerId: userData?.uid || 'unknown_officer',
        officerName: userData?.displayName || 'Police Officer',
        status: 'investigating',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'investigation_notes'), noteData);

      Alert.alert(
        'Note Submitted ✅',
        `Investigation note for Bus ${busNumber.toUpperCase()} has been saved successfully to Firebase.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error("Firebase Submission Error:", error);
      Alert.alert('Submission Failed', error.message || 'There was an error saving the note.');
    } finally {
      setSubmitting(false);
    }
  };

  // ──────────────────────────────────────────
  // UI helpers
  // ──────────────────────────────────────────
  const inputBg = isDark ? '#1E293B' : '#F8FAFC';
  const borderColor = isDark ? '#334155' : '#E2E8F0';
  const labelColor = isDark ? '#94A3B8' : '#64748B';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="document-text" size={22} color="#FFF" />
          <Text style={styles.headerTitle}>Investigation Note</Text>
        </View>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Info banner ── */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#1E40AF" />
          <Text style={styles.infoText}>
            Use this form to log a physical fine ticket issued outside the app.
          </Text>
        </View>

        {/* ── Bus Number ── */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: labelColor }]}>
            Bus Number <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor }]}>
            <Ionicons name="bus" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g. NA-1234"
              placeholderTextColor={labelColor}
              value={busNumber}
              onChangeText={setBusNumber}
              autoCapitalize="characters"
              returnKeyType="next"
            />
          </View>
        </View>

        {/* ── Driver Name ── */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: labelColor }]}>
            Driver Name <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor }]}>
            <Ionicons name="person" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Full name of the driver"
              placeholderTextColor={labelColor}
              value={driverName}
              onChangeText={setDriverName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>
        </View>

        {/* ── Violation Type ── */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: labelColor }]}>
            Violation Type <Text style={styles.required}>*</Text>
          </Text>

          <TouchableOpacity
            style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor }]}
            onPress={() => setShowPicker(!showPicker)}
            activeOpacity={0.7}
          >
            <Ionicons name="warning" size={20} color="#F59E0B" style={styles.inputIcon} />
            <Text style={[styles.input, { color: violationType ? colors.text : labelColor }]}>
              {violationType || 'Select violation type...'}
            </Text>
            <Ionicons
              name={showPicker ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={labelColor}
            />
          </TouchableOpacity>

          {showPicker && (
            <View style={[styles.dropdownBox, { backgroundColor: colors.card, borderColor }]}>
              {VIOLATION_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.dropdownItem,
                    violationType === type && { backgroundColor: colors.primary + '18' },
                    { borderBottomColor: borderColor },
                  ]}
                  onPress={() => {
                    setViolationType(type);
                    setShowPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      { color: violationType === type ? colors.primary : colors.text },
                    ]}
                  >
                    {type}
                  </Text>
                  {violationType === type && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Ticket Image ── */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: labelColor }]}>
            Fine Ticket Image <Text style={styles.required}>*</Text>
          </Text>

          {ticketImageUri ? (
            <View style={styles.imagePreviewWrapper}>
              <Image source={{ uri: ticketImageUri }} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => {
                  setTicketImageUri(null);
                  setTicketImageBase64(null);
                }}
              >
                <Ionicons name="close-circle" size={28} color="#EF4444" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reuploadBtn, { backgroundColor: colors.primary }]}
                onPress={handleImageAction}
              >
                <Ionicons name="camera" size={16} color="#FFF" />
                <Text style={styles.reuploadText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.uploadArea, { backgroundColor: inputBg, borderColor }]}
              onPress={handleImageAction}
              activeOpacity={0.7}
            >
              <View style={[styles.uploadIconCircle, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="camera" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.uploadTitle, { color: colors.text }]}>Upload Ticket Photo</Text>
              <Text style={[styles.uploadSub, { color: labelColor }]}>
                Tap to take a photo or choose from library
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={22} color="#FFF" />
              <Text style={styles.submitText}>Submit Investigation Note</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    paddingBottom: 20,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },

  scrollContent: { padding: 20, paddingBottom: 40 },

  // Info banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoText: { flex: 1, color: '#1E3A8A', fontSize: 13, fontWeight: '500', lineHeight: 18 },

  // Fields
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, letterSpacing: 0.2 },
  required: { color: '#EF4444' },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontWeight: '500' },

  // Dropdown
  dropdownBox: {
    borderWidth: 1.5,
    borderRadius: 14,
    marginTop: 6,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  dropdownText: { fontSize: 15, fontWeight: '500' },

  // Image upload
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  uploadIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  uploadTitle: { fontSize: 16, fontWeight: '700' },
  uploadSub: { fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },

  imagePreviewWrapper: { borderRadius: 16, overflow: 'hidden', position: 'relative' },
  imagePreview: { width: '100%', height: 220, borderRadius: 16 },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFF',
    borderRadius: 16,
  },
  reuploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  reuploadText: { color: '#FFF', fontWeight: '600', fontSize: 13 },

  // Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1E40AF',
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 10,
    elevation: 4,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
