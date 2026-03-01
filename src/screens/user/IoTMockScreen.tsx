import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, SafeAreaView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ref, push, set, serverTimestamp } from 'firebase/database';
import { database } from '../../api/firebase';
import { useTheme } from '../../contexts/ThemeContext';

export const IoTMockScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const [passengerCount, setPassengerCount] = useState<number>(15);
  const [lat, setLat] = useState<string>('6.635076833');
  const [lng, setLng] = useState<string>('79.969253667');
  const [isPushing, setIsPushing] = useState(false);
  
  const BUS_ID = 'Bus_01';

  const formatTimestamp = () => {
    // Format: "YYYY-MM-DD HH:mm:ss" mimicking the IoT device
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  };

  const handlePushData = async (newCount: number) => {
    if (isPushing) return;
    
    // Validate parsing
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      Alert.alert('Error', 'Please enter valid numbers for latitude and longitude.');
      return;
    }

    setIsPushing(true);
    setPassengerCount(newCount);
    
    const timestampStr = formatTimestamp();

    try {
      // 1. Push new history entry (passenger count)
      const historyRef = ref(database, `${BUS_ID}/history`);
      const newHistoryEntryRef = push(historyRef);
      await set(newHistoryEntryRef, {
        count: newCount,
        timestamp: timestampStr
      });

      // 2. Update live_data (location + lastUpdate trigger)
      const liveDataRef = ref(database, `${BUS_ID}/live_data`);
      await set(liveDataRef, {
        lat: latNum,
        lng: lngNum,
        lastUpdate: timestampStr,
        speed: Math.random() * 5, // random speed mock
        accel: 0
      });

      // Show temporary silent success log instead of an intrusive Alert
      console.log(`[IoT Mock] Success: count -> ${newCount}`);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to update Realtime DB.');
    } finally {
      setIsPushing(false);
    }
  };

  const handleIncrement = () => handlePushData(Math.min(passengerCount + 1, 52));
  const handleDecrement = () => handlePushData(Math.max(passengerCount - 1, 0));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>[Temp] IoT Simulator</Text>
        <View style={{ width: 40 }} />
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          <View style={[styles.warningBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2', borderColor: '#EF4444' }]}>
            <Ionicons name="warning-outline" size={20} color="#EF4444" />
            <Text style={[styles.warningText, { color: isDark ? '#FCA5A5' : '#7F1D1D' }]}>
              REMOVE THIS SCREEN BEFORE PRODUCTION
            </Text>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Target Bus ID</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border, opacity: 0.7 }]} 
            value={BUS_ID}
            editable={false}
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Passenger Count (Auto-Push)</Text>
          <View style={styles.counterContainer}>
            <TouchableOpacity 
              style={[styles.counterBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' }]} 
              onPress={handleDecrement}
              disabled={isPushing || passengerCount <= 0}
            >
              <Ionicons name="remove" size={28} color="#EF4444" />
            </TouchableOpacity>

            <View style={[styles.countDisplay, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.countText, { color: colors.text }]}>{passengerCount}</Text>
              <Text style={[styles.countLabel, { color: colors.textLight }]}>Passengers</Text>
            </View>

            <TouchableOpacity 
              style={[styles.counterBtn, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7' }]} 
              onPress={handleIncrement}
              disabled={isPushing || passengerCount >= 52}
            >
              <Ionicons name="add" size={28} color="#22C55E" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.text, marginTop: 30 }]}>Latitude (Mock)</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} 
            value={lat}
            onChangeText={setLat}
            keyboardType="decimal-pad"
            placeholderTextColor={colors.textLight}
          />

          <Text style={[styles.label, { color: colors.text }]}>Longitude (Mock)</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]} 
            value={lng}
            onChangeText={setLng}
            keyboardType="decimal-pad"
            placeholderTextColor={colors.textLight}
          />

          <Text style={[styles.infoText, { color: colors.textLight }]}>
            Location fields above will implicitly be pushed if you tap +/- on the passenger count.
          </Text>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  warningText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  counterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  counterBtn: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countDisplay: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
    paddingVertical: 15,
  },
  countText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  countLabel: {
    fontSize: 12,
    marginTop: 2,
  }
});
