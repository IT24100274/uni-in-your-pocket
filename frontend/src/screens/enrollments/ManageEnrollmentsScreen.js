import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import api from "../../services/api";

const ManageEnrollmentsScreen = ({ route }) => {
  // courseId is optional — if opened from tab it will be undefined
  // if opened from a specific course it will have a value
  const courseId = route.params?.courseId || null;
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [reviewedEnrollments, setReviewedEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  // selectedIds keeps track of which enrollments are ticked for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      // Get user role from AsyncStorage
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      const userData = await AsyncStorage.getItem("user");
      const user = JSON.parse(userData);
      setUserRole(user.role);

      // Fetch all enrollments for this course
      // If courseId exists fetch enrollments for that course only
      // If no courseId (opened from tab) fetch all pending enrollments
      let response;
      if (courseId) {
        response = await api.get(`/enrollments/course/${courseId}`);
      } else {
        response = await api.get("/enrollments/pending");
      }

      // Split into pending and reviewed
      const pending = response.data.filter((e) => e.status === "pending");
      const reviewed = response.data.filter((e) => e.status !== "pending");

      setPendingEnrollments(pending);
      setReviewedEnrollments(reviewed);
    } catch (error) {
      console.log("Error fetching enrollments:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle selection of an enrollment for bulk actions
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Select all pending enrollments at once
  const selectAll = () => {
    const allIds = pendingEnrollments.map((e) => e._id);
    setSelectedIds(allIds);
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedIds([]);
  };

  // Approve a single enrollment
  const handleApprove = async (enrollmentId) => {
    try {
      await api.patch(`/enrollments/${enrollmentId}/approve`);
      Alert.alert("Success", "Enrollment approved");
      fetchEnrollments();
      setSelectedIds([]);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Something went wrong");
    }
  };

  // Deny a single enrollment
  const handleDeny = async (enrollmentId) => {
    Alert.alert(
      "Deny Enrollment",
      "Are you sure you want to deny this enrollment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deny",
          style: "destructive",
          onPress: async () => {
            try {
              await api.patch(`/enrollments/${enrollmentId}/deny`, {
                denialReason: "Does not meet enrollment requirements",
              });
              Alert.alert("Success", "Enrollment denied");
              fetchEnrollments();
            } catch (error) {
              Alert.alert("Error", error.response?.data?.message || "Something went wrong");
            }
          },
        },
      ]
    );
  };

  // Admin override — force approve
  const handleOverride = async (enrollmentId) => {
    Alert.alert(
      "Admin Override",
      "Force approve this enrollment regardless of eligibility?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Override",
          onPress: async () => {
            try {
              await api.patch(`/enrollments/${enrollmentId}/override`, {
                overrideNote: "Approved by admin override",
              });
              Alert.alert("Success", "Enrollment approved by override");
              fetchEnrollments();
            } catch (error) {
              Alert.alert("Error", error.response?.data?.message || "Something went wrong");
            }
          },
        },
      ]
    );
  };

  // Bulk approve all selected enrollments
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      Alert.alert("Error", "Please select at least one enrollment");
      return;
    }
    Alert.alert(
      "Bulk Approve",
      `Approve ${selectedIds.length} selected enrollments?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve All",
          onPress: async () => {
            try {
              await api.post("/enrollments/bulk-approve", {
                enrollmentIds: selectedIds,
              });
              Alert.alert("Success", `${selectedIds.length} enrollments approved`);
              fetchEnrollments();
              setSelectedIds([]);
            } catch (error) {
              Alert.alert("Error", error.response?.data?.message || "Something went wrong");
            }
          },
        },
      ]
    );
  };

  // Bulk deny all selected enrollments
  const handleBulkDeny = async () => {
    if (selectedIds.length === 0) {
      Alert.alert("Error", "Please select at least one enrollment");
      return;
    }
    Alert.alert(
      "Bulk Deny",
      `Deny ${selectedIds.length} selected enrollments?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deny All",
          style: "destructive",
          onPress: async () => {
            try {
              await api.post("/enrollments/bulk-deny", {
                enrollmentIds: selectedIds,
                denialReason: "Denied by bulk action",
              });
              Alert.alert("Success", `${selectedIds.length} enrollments denied`);
              fetchEnrollments();
              setSelectedIds([]);
            } catch (error) {
              Alert.alert("Error", error.response?.data?.message || "Something went wrong");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Bulk action bar — only shows when pending enrollments exist */}
      {pendingEnrollments.length > 0 && (
        <View style={styles.bulkBar}>
          <TouchableOpacity onPress={selectAll}>
            <Text style={styles.bulkLink}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearSelection}>
            <Text style={styles.bulkLink}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bulkApproveBtn}
            onPress={handleBulkApprove}
          >
            <Text style={styles.bulkApproveBtnText}>
              Approve Selected ({selectedIds.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bulkDenyBtn}
            onPress={handleBulkDeny}
          >
            <Text style={styles.bulkDenyBtnText}>Deny Selected</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={[...pendingEnrollments, ...reviewedEnrollments]}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          pendingEnrollments.length > 0 ? (
            <Text style={styles.sectionLabel}>
              Pending ({pendingEnrollments.length})
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              // Highlight selected cards
              selectedIds.includes(item._id) && styles.selectedCard,
            ]}
          >
            {/* Student name and status */}
            <View style={styles.cardHeader}>
              <TouchableOpacity
                onPress={() =>
                  item.status === "pending" && toggleSelect(item._id)
                }
              >
                <Text style={styles.studentName}>
                  {item.status === "pending"
                    ? selectedIds.includes(item._id)
                      ? "☑ "
                      : "☐ "
                    : ""}
                  {item.student?.name}
                </Text>
              </TouchableOpacity>
              <Text
                style={[
                  styles.statusBadge,
                  item.status === "approved"
                    ? styles.approvedBadge
                    : item.status === "pending"
                    ? styles.pendingBadge
                    : styles.deniedBadge,
                ]}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>

            {/* Student details */}
            <Text style={styles.studentMeta}>
              {item.student?.studentId} • {item.student?.email}
            </Text>
            <Text style={styles.studentMeta}>
              Y{item.student?.academicYear}S{item.student?.academicSemester} •{" "}
              {item.semester}
            </Text>

            {/* Eligibility note box */}
            <View style={styles.eligibilityBox}>
              <Text style={styles.eligibilityLabel}>Eligibility</Text>
              <Text style={styles.eligibilityText}>
                {item.eligibilityNote}
              </Text>
            </View>

            {/* Show denial reason if denied */}
            {item.status === "denied" && item.denialReason && (
              <View style={styles.denialBox}>
                <Text style={styles.denialText}>
                  Reason: {item.denialReason}
                </Text>
              </View>
            )}

            {/* Action buttons for pending enrollments only */}
            {item.status === "pending" && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => handleApprove(item._id)}
                >
                  <Text style={styles.approveBtnText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.denyBtn}
                  onPress={() => handleDeny(item._id)}
                >
                  <Text style={styles.denyBtnText}>Deny</Text>
                </TouchableOpacity>

                {/* Override button only for admin */}
                {userRole === "admin" && (
                  <TouchableOpacity
                    style={styles.overrideBtn}
                    onPress={() => handleOverride(item._id)}
                  >
                    <Text style={styles.overrideBtnText}>Override</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No enrollment requests yet</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: "4%",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bulkBar: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: "3%",
    marginBottom: "3%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  bulkLink: {
    color: "#1a73e8",
    fontSize: 13,
    fontWeight: "bold",
  },
  bulkApproveBtn: {
    backgroundColor: "#e6f4ea",
    paddingHorizontal: "3%",
    paddingVertical: "2%",
    borderRadius: 6,
  },
  bulkApproveBtnText: {
    color: "#2e7d32",
    fontWeight: "bold",
    fontSize: 12,
  },
  bulkDenyBtn: {
    backgroundColor: "#fce8e6",
    paddingHorizontal: "3%",
    paddingVertical: "2%",
    borderRadius: 6,
  },
  bulkDenyBtnText: {
    color: "#c62828",
    fontWeight: "bold",
    fontSize: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#999",
    textTransform: "uppercase",
    marginBottom: "3%",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: "4%",
    marginBottom: "3%",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedCard: {
    borderColor: "#1a73e8",
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2%",
  },
  studentName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: "bold",
    paddingHorizontal: "3%",
    paddingVertical: "1%",
    borderRadius: 4,
  },
  approvedBadge: {
    backgroundColor: "#e6f4ea",
    color: "#2e7d32",
  },
  pendingBadge: {
    backgroundColor: "#fff3e0",
    color: "#e65100",
  },
  deniedBadge: {
    backgroundColor: "#fce8e6",
    color: "#c62828",
  },
  studentMeta: {
    fontSize: 12,
    color: "#666",
    marginBottom: "1%",
  },
  eligibilityBox: {
    backgroundColor: "#e8f0fe",
    padding: "3%",
    borderRadius: 7,
    marginTop: "2%",
    marginBottom: "2%",
  },
  eligibilityLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1a73e8",
    marginBottom: "1%",
  },
  eligibilityText: {
    fontSize: 12,
    color: "#1a73e8",
  },
  denialBox: {
    backgroundColor: "#fce8e6",
    padding: "3%",
    borderRadius: 7,
    marginBottom: "2%",
  },
  denialText: {
    fontSize: 12,
    color: "#c62828",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: "2%",
  },
  approveBtn: {
    flex: 1,
    backgroundColor: "#e6f4ea",
    padding: "3%",
    borderRadius: 7,
    alignItems: "center",
  },
  approveBtnText: {
    color: "#2e7d32",
    fontWeight: "bold",
    fontSize: 13,
  },
  denyBtn: {
    flex: 1,
    backgroundColor: "#fce8e6",
    padding: "3%",
    borderRadius: 7,
    alignItems: "center",
  },
  denyBtnText: {
    color: "#c62828",
    fontWeight: "bold",
    fontSize: 13,
  },
  overrideBtn: {
    flex: 1,
    backgroundColor: "#fff3e0",
    padding: "3%",
    borderRadius: 7,
    alignItems: "center",
  },
  overrideBtnText: {
    color: "#e65100",
    fontWeight: "bold",
    fontSize: 13,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: "10%",
    fontSize: 14,
  },
});

export default ManageEnrollmentsScreen;