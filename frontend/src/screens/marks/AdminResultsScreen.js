import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
import { exportResults, toggleLock } from "../../services/api";

const AdminResultsScreen = ({ navigation }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await exportResults();
      setResults(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchResults();
    setRefreshing(false);
  };

  const handleToggleLock = async (resultId, isLocked) => {
    const action = isLocked ? "unlock" : "lock";
    Alert.alert(
      "Confirm",
      `Are you sure you want to ${action} this result?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              const response = await toggleLock(resultId);
              Alert.alert("Success", response.data.message);
              fetchResults();
            } catch (error) {
              Alert.alert("Error", "Failed to update lock status");
            }
          },
        },
      ]
    );
  };

  const getGradeColor = (grade) => {
    if (grade === "A") return "#27ae60";
    if (grade === "B") return "#2980b9";
    if (grade === "C") return "#f39c12";
    if (grade === "D") return "#e67e22";
    return "#e74c3c";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Loading all results...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Manage All Results</Text>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{results.length}</Text>
          <Text style={styles.summaryLabel}>Total Results</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {results.filter((r) => r.isPublished).length}
          </Text>
          <Text style={styles.summaryLabel}>Published</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {results.filter((r) => r.isLocked).length}
          </Text>
          <Text style={styles.summaryLabel}>Locked</Text>
        </View>
      </View>

      {/* Results List */}
      {results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptyText}>
            No results have been entered yet
          </Text>
        </View>
      ) : (
        results.map((result) => (
          <View key={result._id} style={styles.resultCard}>
            {/* Student Info */}
            <View style={styles.resultHeader}>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>
                  {result.student?.name}
                </Text>
                <Text style={styles.studentId}>
                  {result.student?.studentId} • {result.student?.email}
                </Text>
              </View>
              <Text
                style={[
                  styles.grade,
                  { color: getGradeColor(result.grade) },
                ]}
              >
                {result.grade}
              </Text>
            </View>

            {/* Course Info */}
            <View style={styles.courseRow}>
              <Text style={styles.courseText}>
                📚 {result.course?.title} ({result.course?.courseCode})
              </Text>
            </View>

            {/* Marks */}
            <View style={styles.marksRow}>
              <Text style={styles.marksText}>
                Marks: {result.marks}/100
              </Text>
              <Text style={styles.enteredBy}>
                By: {result.enteredBy?.name}
              </Text>
            </View>

            {result.remarks ? (
              <Text style={styles.remarks}>📝 {result.remarks}</Text>
            ) : null}

            {/* Status Row */}
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  result.isPublished
                    ? styles.publishedBadge
                    : styles.unpublishedBadge,
                ]}
              >
                <Text style={styles.statusText}>
                  {result.isPublished ? "✅ Published" : "⏳ Unpublished"}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.lockButton,
                  result.isLocked
                    ? styles.unlockButton
                    : styles.lockButtonActive,
                ]}
                onPress={() =>
                  handleToggleLock(result._id, result.isLocked)
                }
              >
                <Text style={styles.lockButtonText}>
                  {result.isLocked ? "🔓 Unlock" : "🔒 Lock"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: "5%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: "6%",
    marginTop: "2%",
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a73e8",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e0e0e0",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: "20%",
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
  },
  resultCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  studentId: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  grade: {
    fontSize: 32,
    fontWeight: "bold",
  },
  courseRow: {
    marginBottom: 8,
  },
  courseText: {
    fontSize: 14,
    color: "#555",
  },
  marksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  marksText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  enteredBy: {
    fontSize: 13,
    color: "#999",
  },
  remarks: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  publishedBadge: {
    backgroundColor: "#d5f5e3",
  },
  unpublishedBadge: {
    backgroundColor: "#fdecea",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  lockButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  lockButtonActive: {
    backgroundColor: "#e74c3c",
  },
  unlockButton: {
    backgroundColor: "#27ae60",
  },
  lockButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 40,
  },
});

export default AdminResultsScreen;