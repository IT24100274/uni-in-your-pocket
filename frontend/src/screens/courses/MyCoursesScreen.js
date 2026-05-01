import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../services/api";

const MyCoursesScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch lecturer's own courses when screen loads
  useEffect(() => {
    fetchMyCourses();
  }, []);

  // Also refresh when screen comes back into focus
  // This handles the case where lecturer edits a course and comes back
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchMyCourses();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchMyCourses = async () => {
    try {
      const response = await api.get("/courses/my-courses");
      setCourses(response.data);
    } catch (error) {
      console.log("Error fetching my courses:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId, courseTitle) => {
    // Ask for confirmation before deleting
    Alert.alert(
      "Delete Course",
      `Are you sure you want to delete "${courseTitle}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/courses/${courseId}`);
              Alert.alert("Success", "Course deleted successfully");
              // Remove deleted course from the list without refetching
              setCourses(courses.filter((c) => c._id !== courseId));
            } catch (error) {
              Alert.alert(
                "Error",
                error.response?.data?.message || "Something went wrong"
              );
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
    <SafeAreaView style={styles.container}>
      {/* Create new course button */}
      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => navigation.navigate("CreateCourse")}
      >
        <Text style={styles.createBtnText}>+ Create New Course</Text>
      </TouchableOpacity>

      <FlatList
        data={courses}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.courseCard}>
            {/* Course header */}
            <View style={styles.cardHeader}>
              <Text style={styles.courseCode}>{item.courseCode}</Text>
              <Text
                style={[
                  styles.badge,
                  item.isActive ? styles.activeBadge : styles.inactiveBadge,
                ]}
              >
                {item.isActive ? "Active" : "Inactive"}
              </Text>
            </View>

            <Text style={styles.courseTitle}>{item.title}</Text>
            <Text style={styles.courseMeta}>
              {item.credits} Credits • Y{item.academicYear}S
              {item.academicSemester} • {item.department}
            </Text>

            {/* Action buttons */}
            <View style={styles.actionRow}>
              {/* View course details */}
              <TouchableOpacity
                style={styles.viewBtn}
                onPress={() =>
                  navigation.navigate("CourseDetail", { courseId: item._id })
                }
              >
                <Text style={styles.viewBtnText}>View</Text>
              </TouchableOpacity>

              {/* Manage enrollments */}
              <TouchableOpacity
                style={styles.manageBtn}
                onPress={() =>
                  navigation.navigate("ManageEnrollments", {
                    courseId: item._id,
                  })
                }
              >
                <Text style={styles.manageBtnText}>Enrollments</Text>
              </TouchableOpacity>

              {/* Delete course */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteCourse(item._id, item.title)}
              >
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              You have not created any courses yet
            </Text>
            <Text style={styles.emptySubText}>
              Tap the button above to create your first course
            </Text>
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
  createBtn: {
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    padding: "4%",
    alignItems: "center",
    marginBottom: "4%",
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  courseCard: {
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
  badge: {
    fontSize: 11,
    paddingHorizontal: "2%",
    paddingVertical: "1%",
    borderRadius: 4,
    fontWeight: "bold",
  },
  activeBadge: {
    backgroundColor: "#e6f4ea",
    color: "#2e7d32",
  },
  inactiveBadge: {
    backgroundColor: "#fce8e6",
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
    marginBottom: "3%",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  viewBtn: {
    flex: 1,
    backgroundColor: "#e8f0fe",
    padding: "3%",
    borderRadius: 7,
    alignItems: "center",
  },
  viewBtnText: {
    color: "#1a73e8",
    fontWeight: "bold",
    fontSize: 13,
  },
  manageBtn: {
    flex: 1,
    backgroundColor: "#e6f4ea",
    padding: "3%",
    borderRadius: 7,
    alignItems: "center",
  },
  manageBtnText: {
    color: "#2e7d32",
    fontWeight: "bold",
    fontSize: 13,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: "#fce8e6",
    padding: "3%",
    borderRadius: 7,
    alignItems: "center",
  },
  deleteBtnText: {
    color: "#c62828",
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
    marginBottom: "2%",
  },
  emptySubText: {
    fontSize: 12,
    color: "#bbb",
  },
});

export default MyCoursesScreen;