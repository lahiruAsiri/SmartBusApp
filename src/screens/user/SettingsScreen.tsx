// File: src/screens/user/SettingsScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { STORAGE_KEYS } from '../../constants/config';

export const SettingsScreen = ({ navigation }: any) => {
  const { theme, isDark, colors, setTheme, toggleTheme } = useTheme();

  const ThemeOption = ({ label, value, icon }: { label: string; value: 'light' | 'dark' | 'system'; icon: string }) => (
    <TouchableOpacity
      style={[
        styles.themeOption,
        {
          backgroundColor: theme === value ? colors.primary + '20' : colors.card,
          borderColor: theme === value ? colors.primary : colors.border,
        }
      ]}
      onPress={() => setTheme(value)}
    >
      <Ionicons
        name={icon as any}
        size={24}
        color={theme === value ? colors.primary : colors.textLight}
      />
      <Text style={[
        styles.themeOptionText,
        { color: theme === value ? colors.primary : colors.text }
      ]}>
        {label}
      </Text>
      {theme === value && (
        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textLight }]}>APPEARANCE</Text>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {/* Quick Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons
                  name={isDark ? "moon" : "sunny"}
                  size={22}
                  color={colors.primary}
                />
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Dark Mode
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary + '50' }}
                thumbColor={isDark ? colors.primary : '#f4f3f4'}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Theme Options */}
            <Text style={[styles.subLabel, { color: colors.textLight }]}>
              Theme Preference
            </Text>
            <View style={styles.themeOptions}>
              <ThemeOption label="Light" value="light" icon="sunny-outline" />
              <ThemeOption label="Dark" value="dark" icon="moon-outline" />
              <ThemeOption label="System" value="system" icon="phone-portrait-outline" />
            </View>
          </View>
        </View>

        {/* Other Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textLight }]}>NOTIFICATIONS</Text>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <SettingToggle
              icon="notifications-outline"
              label="Push Notifications"
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingToggle
              icon="bus-outline"
              label="Bus Arrival Alerts"
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingToggle
              icon="alert-circle-outline"
              label="Crowded Bus Alerts"
              colors={colors}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textLight }]}>ABOUT</Text>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <SettingRow icon="information-circle-outline" label="App Version" value="1.0.0" colors={colors} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingRow icon="document-text-outline" label="Terms of Service" colors={colors} hasArrow />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SettingRow icon="shield-checkmark-outline" label="Privacy Policy" colors={colors} hasArrow />
          </View>
        </View>

        {/* Development Section (Temporary) */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textLight }]}>DEVELOPMENT</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={async () => {
                Alert.alert(
                  'Reset Onboarding',
                  'Are you sure? This will reset the onboarding flag and you will see the intro screens again on next restart.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Reset',
                      style: 'destructive',
                      onPress: async () => {
                        await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
                        Alert.alert('Success', 'Onboarding reset. Please restart the app.');
                      }
                    }
                  ]
                );
              }}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="code-slash-outline" size={22} color={colors.primary} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Reset Onboarding</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Helper Components
const SettingToggle = ({ icon, label, colors }: any) => {
  const [enabled, setEnabled] = React.useState(true);
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={22} color={colors.primary} />
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={setEnabled}
        trackColor={{ false: colors.border, true: colors.primary + '50' }}
        thumbColor={enabled ? colors.primary : '#f4f3f4'}
      />
    </View>
  );
};

const SettingRow = ({ icon, label, value, colors, hasArrow }: any) => (
  <TouchableOpacity style={styles.settingRow}>
    <View style={styles.settingLeft}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
    </View>
    {value && <Text style={[styles.settingValue, { color: colors.textLight }]}>{value}</Text>}
    {hasArrow && <Ionicons name="chevron-forward" size={20} color={colors.textLight} />}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 55,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 14,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  subLabel: {
    fontSize: 13,
    marginTop: 10,
    marginBottom: 12,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});