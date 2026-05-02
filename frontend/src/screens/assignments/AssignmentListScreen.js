import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";

const AssignmentListScreen = ({ navigation }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    loadUserAndAssignments();
  }, []);

  // Reload when screen comes back into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchAssignments();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUserAndAssignments = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      const user = JSON.parse(userData);
      setUserRole(user.role);
      await fetchAssignments();
    } catch (error) {
      console.log("Error:", error.message);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await api.get("/assignments");
      setAssignments(response.data);
    } catch (error) {
      console.log("Error fetching assignments:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Format deadline nicely
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if deadline has passed
  const isPastDeadline = (deadline) => {
    return new Date() > new Date(deadline);
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assignments</Text>
        {/* Lecturer sees Create button */}
        {(userRole === "lecturer" || userRole === "admin") && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate("CreateAssignment")}
          >
            <Text style={styles.createButtonText}>+ Create</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={assignments}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchAssignments();
            }}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("AssignmentDetail", { assignmentId: item._id, userRole })
            }
          >
            {/* Course name */}
            <Text style={styles.courseName}>
              {item.courseId?.courseCode} — {item.courseId?.title}
            </Text>

            {/* Assignment title */}
            <Text style={styles.assignmentTitle}>{item.title}</Text>

            {/* Deadline */}
            <Text
              style={[
                styles.deadline,
                isPastDeadline(item.deadline) && styles.deadlinePast,
              ]}
            >
              📅 Due: {formatDate(item.deadline)}
              {isPastDeadline(item.deadline) ? " (Closed)" : ""}
            </Text>

            {/* Published badge - lecturers see this */}
            {(userRole === "lecturer" || userRole === "admin") && (
              <View
                style={[
                  styles.badge,
                  item.isPublished ? styles.publishedBadge : styles.draftBadge,
                ]}
              >
                <Text style={styles.badgeText}>
                  {item.isPublished ? "Published" : "Draft"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No assignments found</Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4%",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  createButton: {
    backgroundColor: "#1a73e8",
    paddingHorizontal: "4%",
    paddingVertical: "2%",
    borderRadius: 8,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: "4%",
    marginBottom: "3%",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  courseName: {
    fontSize: 12,
    color: "#1a73e8",
    fontWeight: "bold",
    marginBottom: "1%",
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: "2%",
  },
  deadline: {
    fontSize: 13,
    color: "#27ae60",
  },
  deadlinePast: {
    color: "#e74c3c",
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: "2%",
    paddingHorizontal: "3%",
    paddingVertical: "1%",
    borderRadius: 6,
  },
  publishedBadge: {
    backgroundColor: "#e6f4ea",
  },
  draftBadge: {
    backgroundColor: "#fff3e0",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: "10%",
    fontSize: 14,
  },
});

export default AssignmentListScreen;