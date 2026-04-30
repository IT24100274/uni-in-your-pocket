import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../services/api";

const MyEnrollmentsScreen = ({ navigation }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyEnrollments();
  }, []);

  // Refresh when screen comes back into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchMyEnrollments();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchMyEnrollments = async () => {
    try {
      const response = await api.get("/enrollments/my");
      setEnrollments(response.data);
    } catch (error) {
      console.log("Error fetching enrollments:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Return different styles based on enrollment status
  const getStatusStyle = (status) => {
    if (status === "approved") return styles.approvedBadge;
    if (status === "pending") return styles.pendingBadge;
    if (status === "denied") return styles.deniedBadge;
  };

  const getStatusTextStyle = (status) => {
    if (status === "approved") return styles.approvedText;
    if (status === "pending") return styles.pendingText;
    if (status === "denied") return styles.deniedText;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={enrollments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Course code and status */}
            <View style={styles.cardHeader}>
              <Text style={styles.courseCode}>
                {item.course?.courseCode}
              </Text>
              <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                <Text
                  style={[styles.statusText, getStatusTextStyle(item.status)]}
                >
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
            </View>

            {/* Course title */}
            <Text style={styles.courseTitle}>{item.course?.title}</Text>

            {/* Semester and department */}
            <Text style={styles.courseMeta}>
              Y{item.course?.academicYear}S{item.course?.academicSemester} •{" "}
              {item.course?.department}
            </Text>

            {/* Eligibility note */}
            <Text style={styles.eligibilityNote}>
              {item.eligibilityNote}
            </Text>

            {/* Show denial reason if denied */}
            {item.status === "denied" && item.denialReason && (
              <View style={styles.denialBox}>
                <Text style={styles.denialTitle}>Reason:</Text>
                <Text style={styles.denialText}>{item.denialReason}</Text>
              </View>
            )}

            {/* Show success message if approved */}
            {item.status === "approved" && (
              <View style={styles.approvedBox}>
                <Text style={styles.approvedBoxText}>
                  You are enrolled. Access materials via Assignments and
                  Results modules.
                </Text>
              </View>
            )}

            {/* View course button */}
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() =>
                navigation.navigate("CourseDetail", {
                  courseId: item.course?._id,
                })
              }
            >
              <Text style={styles.viewBtnText}>View Course</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              You have not applied for any courses yet
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => navigation.navigate("CourseList")}
            >
              <Text style={styles.browseBtnText}>Browse Courses</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: "4%",
    marginBottom: "3%",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2%",
  },
  courseCode: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1a73e8",
    backgroundColor: "#e8f0fe",
    paddingHorizontal: "2%",
    paddingVertical: "1%",
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: "3%",
    paddingVertical: "1%",
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  approvedBadge: {
    backgroundColor: "#e6f4ea",
  },
  approvedText: {
    color: "#2e7d32",
  },
  pendingBadge: {
    backgroundColor: "#fff3e0",
  },
  pendingText: {
    color: "#e65100",
  },
  deniedBadge: {
    backgroundColor: "#fce8e6",
  },
  deniedText: {
    color: "#c62828",
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: "1%",
  },
  courseMeta: {
    fontSize: 12,
    color: "#666",
    marginBottom: "2%",
  },
  eligibilityNote: {
    fontSize: 12,
    color: "#888",
    marginBottom: "2%",
  },
  denialBox: {
    backgroundColor: "#fce8e6",
    padding: "3%",
    borderRadius: 7,
    marginBottom: "2%",
  },
  denialTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#c62828",
    marginBottom: "1%",
  },
  denialText: {
    fontSize: 12,
    color: "#c62828",
  },
  approvedBox: {
    backgroundColor: "#e6f4ea",
    padding: "3%",
    borderRadius: 7,
    marginBottom: "2%",
  },
  approvedBoxText: {
    fontSize: 12,
    color: "#2e7d32",
  },
  viewBtn: {
    backgroundColor: "#f0f0f0",
    padding: "3%",
    borderRadius: 7,
    alignItems: "center",
    marginTop: "2%",
  },
  viewBtnText: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: "20%",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    marginBottom: "4%",
  },
  browseBtn: {
    backgroundColor: "#1a73e8",
    padding: "3%",
    borderRadius: 8,
    paddingHorizontal: "6%",
  },
  browseBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default MyEnrollmentsScreen;