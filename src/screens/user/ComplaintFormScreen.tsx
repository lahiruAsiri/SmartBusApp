import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  List,
  Surface,
  Searchbar,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../../contexts/ThemeContext";
import {
  submitComplaint,
  fetchBusesForComplaint,
} from "../../services/complaintService";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export const ComplaintFormScreen = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const [buses, setBuses] = useState<any[]>([]);
  const [selectedBus, setSelectedBus] = useState<any | null>(null);
  const [complaintText, setComplaintText] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingBuses, setFetchingBuses] = useState(true);
  const [showBusList, setShowBusList] = useState(false);
  const [incidentTime, setIncidentTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadBuses = async () => {
      try {
        const busList = await fetchBusesForComplaint();
        setBuses(busList || []);
      } catch (error) {
        console.error("Failed to fetch buses:", error);
      } finally {
        setFetchingBuses(false);
      }
    };

    loadBuses();
  }, []);

  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedDate) {
      setIncidentTime(selectedDate);
    }
  };

  const filteredBuses = buses.filter((bus) => {
    const query = searchQuery.toLowerCase();
    return (
      bus.license_plate?.toLowerCase().includes(query) ||
      bus.route_number?.toLowerCase().includes(query) ||
      bus.route_name?.toLowerCase().includes(query)
    );
  });

  const handleSubmit = async () => {
    if (!selectedBus) {
      Alert.alert("Error", "Please select a bus");
      return;
    }

    if (!complaintText.trim()) {
      Alert.alert("Error", "Please enter your complaint");
      return;
    }

    setLoading(true);
    try {
      await submitComplaint({
        busId: selectedBus.id,
        complaintText,
        incidentTime,
      });
      Alert.alert("Success", "Complaint submitted successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  const getBusBadgeColor = (status: string) => {
    if (!status) return colors.primary;
    if (status.toLowerCase() === "active") return "#22C55E";
    if (status.toLowerCase() === "maintenance") return "#F59E0B";
    return "#EF4444";
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              styles.backButton,
              { backgroundColor: isDark ? colors.card : "#fff" },
            ]}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>
              Report an Issue
            </Text>
            <Text style={[styles.subtitle, { color: colors.textLight }]}>
              Help us improve by providing feedback on your journey.
            </Text>
          </View>
        </View>

        <Surface
          style={[styles.mainCard, { backgroundColor: colors.card }]}
          elevation={2}
        >
          {/* Bus Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bus-outline" size={20} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>
                Associated Bus
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowBusList(!showBusList)}
              style={[
                styles.busSelector,
                {
                  backgroundColor: isDark ? colors.background : "#F8FAFC",
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              {selectedBus ? (
                <View style={styles.selectedBusInfo}>
                  <View
                    style={[
                      styles.routeBadge,
                      {
                        backgroundColor: getBusBadgeColor(selectedBus.status),
                      },
                    ]}
                  >
                    <Text style={styles.routeNumber}>
                      {selectedBus.route_number || "Bus"}
                    </Text>
                  </View>
                  <View style={styles.selectedBusDetails}>
                    <Text style={[styles.busName, { color: colors.text }]}>
                      {selectedBus.license_plate ||
                        selectedBus.route_name ||
                        "Unknown Bus"}
                    </Text>
                    <Text style={[styles.busSub, { color: colors.textLight }]}>
                      {selectedBus.route_name || "No Route Assigned"}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={[styles.placeholder, { color: colors.textLight }]}>
                  Select the bus you encountered an issue with
                </Text>
              )}
              <Ionicons
                name={showBusList ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textLight}
              />
            </TouchableOpacity>

            {showBusList && (
              <View
                style={[
                  styles.busDropdown,
                  { borderColor: colors.border, backgroundColor: colors.card },
                ]}
              >
                <Searchbar
                  placeholder="Search bus..."
                  onChangeText={setSearchQuery}
                  value={searchQuery}
                  style={[styles.searchBar, { borderColor: colors.border }]}
                  inputStyle={{ color: colors.text, fontSize: 14 }}
                  iconColor={colors.primary}
                  placeholderTextColor={colors.textLight + "80"}
                />
                {fetchingBuses ? (
                  <ActivityIndicator
                    style={styles.loader}
                    color={colors.primary}
                  />
                ) : (
                  filteredBuses.map((bus) => (
                    <TouchableOpacity
                      key={bus.id}
                      style={[
                        styles.busSelectItem,
                        selectedBus?.id === bus.id && {
                          backgroundColor: colors.primary + "15",
                        },
                      ]}
                      onPress={() => {
                        setSelectedBus(bus);
                        setShowBusList(false);
                        setSearchQuery("");
                      }}
                    >
                      <View
                        style={[
                          styles.busListItemBadge,
                          { backgroundColor: getBusBadgeColor(bus.status) },
                        ]}
                      >
                        <Text style={styles.busListItemBadgeText}>
                          {bus.route_number || "Bus"}
                        </Text>
                      </View>
                      <View style={styles.busListItemBody}>
                        <Text
                          style={[
                            styles.busListItemTitle,
                            { color: colors.text },
                          ]}
                        >
                          {bus.license_plate || bus.route_name || "Unknown Bus"}
                        </Text>
                        <Text
                          style={[
                            styles.busListItemSub,
                            { color: colors.textLight },
                          ]}
                        >
                          {bus.route_name || "No Route Assigned"}
                        </Text>
                      </View>
                      {selectedBus?.id === bus.id && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))
                )}
                {filteredBuses.length === 0 && !fetchingBuses && (
                  <Text
                    style={[styles.emptySearch, { color: colors.textLight }]}
                  >
                    No buses found
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Incident Time Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>
                Incident Time
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              style={[
                styles.timeSelector,
                {
                  backgroundColor: isDark ? colors.background : "#F8FAFC",
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.selectedTimeInfo}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.timeText, { color: colors.text }]}>
                  {incidentTime.toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </Text>
              </View>
              <Ionicons name="pencil" size={16} color={colors.textLight} />
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={incidentTime}
                mode="datetime"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onTimeChange}
                textColor={isDark ? colors.text : undefined}
                themeVariant={isDark ? "dark" : "light"}
              />
            )}
          </View>

          {/* Complaint Input */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.label, { color: colors.text }]}>
                How can we help?
              </Text>
            </View>
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={8}
              placeholder="Tell us what happened..."
              value={complaintText}
              onChangeText={setComplaintText}
              style={[
                styles.textInput,
                { backgroundColor: isDark ? colors.background : "#F8FAFC" },
              ]}
              outlineColor="transparent"
              activeOutlineColor={colors.primary}
              textColor={colors.text}
              placeholderTextColor={colors.textLight + "80"}
            />
          </View>

          {/* Warning Box */}
          <View
            style={[
              styles.warningBox,
              { backgroundColor: colors.primary + "10" },
            ]}
          >
            <Ionicons
              name="information-circle"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.warningText, { color: colors.text }]}>
              Your feedback is anonymous and will be reviewed by our monitoring
              team within 24 hours.
            </Text>
          </View>
        </Surface>

        <TouchableOpacity
          style={[styles.submitButton, { opacity: loading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={["#0EA5E9", "#0284C7"]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitText}>Submit Feedback</Text>
                <Ionicons
                  name="send"
                  size={18}
                  color="#fff"
                  style={styles.sendIcon}
                />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    marginBottom: 30,
    alignItems: "flex-start",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  mainCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 30,
    overflow: "hidden",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  busSelector: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  placeholder: {
    fontSize: 14,
    flex: 1,
  },
  selectedBusInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  routeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  routeNumber: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  selectedBusDetails: {
    flex: 1,
  },
  busName: {
    fontWeight: "600",
    fontSize: 15,
  },
  busSub: {
    fontSize: 12,
    marginTop: 2,
  },
  busDropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 16,
    maxHeight: 300,
    overflow: "hidden",
  },
  searchBar: {
    margin: 8,
    height: 48,
    borderRadius: 12,
    elevation: 0,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  emptySearch: {
    textAlign: "center",
    padding: 20,
    fontSize: 14,
  },
  timeSelector: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "space-between",
  },
  selectedTimeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 15,
    fontWeight: "600",
  },
  busSelectItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  busListItemBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  busListItemBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  busListItemBody: {
    flex: 1,
  },
  busListItemTitle: {
    fontWeight: "600",
    fontSize: 14,
  },
  busListItemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  loader: {
    padding: 20,
  },
  textInput: {
    minHeight: 160,
    fontSize: 15,
    borderRadius: 16,
  },
  warningBox: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    marginLeft: 10,
    lineHeight: 18,
    opacity: 0.8,
  },
  submitButton: {
    height: 56,
    borderRadius: 18,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#0EA5E9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  sendIcon: {
    marginLeft: 10,
    transform: [{ rotate: "-15deg" }],
  },
});
