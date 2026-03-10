import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { Text, ActivityIndicator, Surface } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import {
  getUserComplaints,
  Complaint,
  updateComplaintFeedback,
} from "../../services/complaintService";
import { auth } from "../../api/firebase";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export const MyComplaintsScreen = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchComplaints = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const data = await getUserComplaints(user.uid);
      setComplaints(data);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  const handleFeedback = async (
    complaintId: string,
    feedback: "like" | "dislike",
  ) => {
    try {
      // Optimistically update local state
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId ? { ...c, resolutionFeedback: feedback } : c,
        ),
      );
      await updateComplaintFeedback(complaintId, feedback);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      // Revert optimism if needed (optional, or just show error)
      fetchComplaints();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return colors.success;
      case "in progress":
        return colors.warning;
      case "pending":
        return colors.textLight;
      default:
        return colors.primary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return "checkmark-done-circle";
      case "in progress":
        return "time";
      case "pending":
        return "hourglass";
      default:
        return "alert-circle";
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";

    let date: Date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === "string") {
      date = new Date(timestamp);
    } else if (timestamp._seconds) {
      date = new Date(timestamp._seconds * 1000);
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return "Invalid Date";

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const renderItem = ({ item }: { item: Complaint }) => (
    <Surface
      style={[styles.card, { backgroundColor: colors.card }]}
      elevation={1}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "15" },
          ]}
        >
          <Ionicons
            name={getStatusIcon(item.status) as any}
            size={16}
            color={getStatusColor(item.status)}
          />
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Text>
        </View>
        <Text style={[styles.date, { color: colors.textLight }]}>
          {formatDate(item.timestamp)}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.category, { color: colors.primary }]}>
          Category: {item.complaintCategory || "General"}
        </Text>
        <Text
          style={[styles.complaintText, { color: colors.text }]}
          numberOfLines={3}
        >
          {item.complaintText}
        </Text>
      </View>

      {item.resolutionMessage && (
        <View
          style={[
            styles.resolutionBox,
            {
              backgroundColor: colors.success + "08",
              borderLeftColor: colors.success,
            },
          ]}
        >
          <View style={styles.resolutionHeader}>
            <Ionicons name="sparkles" size={14} color={colors.success} />
            <Text style={[styles.resolutionTitle, { color: colors.success }]}>
              Official Resolution
            </Text>
          </View>
          <Text style={[styles.resolutionText, { color: colors.text }]}>
            {item.resolutionMessage}
          </Text>

          <View style={styles.feedbackContainer}>
            <Text style={[styles.feedbackLabel, { color: colors.textLight }]}>
              Was this resolution helpful?
            </Text>
            <View style={styles.feedbackButtons}>
              <TouchableOpacity
                onPress={() => handleFeedback(item.id, "like")}
                style={[
                  styles.feedbackBtn,
                  item.resolutionFeedback === "like" && {
                    backgroundColor: colors.success + "20",
                    borderColor: colors.success,
                  },
                ]}
              >
                <Ionicons
                  name={
                    item.resolutionFeedback === "like"
                      ? "thumbs-up"
                      : "thumbs-up-outline"
                  }
                  size={18}
                  color={
                    item.resolutionFeedback === "like"
                      ? colors.success
                      : colors.textLight
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleFeedback(item.id, "dislike")}
                style={[
                  styles.feedbackBtn,
                  item.resolutionFeedback === "dislike" && {
                    backgroundColor: colors.error + "20",
                    borderColor: colors.error,
                  },
                ]}
              >
                <Ionicons
                  name={
                    item.resolutionFeedback === "dislike"
                      ? "thumbs-down"
                      : "thumbs-down-outline"
                  }
                  size={18}
                  color={
                    item.resolutionFeedback === "dislike"
                      ? colors.error
                      : colors.textLight
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View
        style={[styles.cardFooter, { borderTopColor: colors.border + "50" }]}
      >
        <View style={styles.busRef}>
          <Ionicons name="bus" size={14} color={colors.textLight} />
          <Text style={[styles.busId, { color: colors.textLight }]}>
            Ref: {item.busId.substring(0, 8)}
          </Text>
        </View>
        <TouchableOpacity style={styles.detailBtn}>
          <Text style={[styles.detailBtnText, { color: colors.primary }]}>
            View Details
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </Surface>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom Header */}
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
          <Text style={[styles.title, { color: colors.text }]}>My Complaints</Text>
          <Text style={[styles.subtitle, { color: colors.textLight }]}>
            Track the status of your submitted feedback.
          </Text>
        </View>
      </View>

      <FlatList
        data={complaints}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconBg,
                { backgroundColor: colors.primary + "10" },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={60}
                color={colors.primary + "40"}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No reports found
            </Text>
            <Text style={[styles.emptySub, { color: colors.textLight }]}>
              You haven't submitted any complaints yet. Happy travels!
            </Text>
            <TouchableOpacity
              style={[styles.reportBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate("ComplaintForm" as any)}
            >
              <Text style={styles.reportBtnText}>Make a Report</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: "row",
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
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
    textTransform: "capitalize",
  },
  date: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardBody: {
    marginBottom: 16,
  },
  category: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  complaintText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
  },
  resolutionBox: {
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 3,
    marginBottom: 16,
  },
  resolutionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  resolutionTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 6,
  },
  resolutionText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  busRef: {
    flexDirection: "row",
    alignItems: "center",
  },
  busId: {
    fontSize: 12,
    marginLeft: 6,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailBtnText: {
    fontSize: 13,
    fontWeight: "700",
    marginRight: 4,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  emptySub: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  reportBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#0EA5E9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  reportBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  feedbackContainer: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 12,
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  feedbackButtons: {
    flexDirection: "row",
  },
  feedbackBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "rgba(0,0,0,0.03)",
  },
});
