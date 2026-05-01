import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";

const CourseListScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const userData = await AsyncStorage.getItem('user');
    const user = JSON.parse(userData);
    setUserRole(user.role);
    try {
      const response = await api.get("/courses");
      setCourses(response.data);
      setFilteredCourses(response.data);
    } catch (error) {
      console.log("Error fetching courses:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter courses based on search text
  const handleSearch = (text) => {
    setSearchText(text);
    const filtered = courses.filter(
      (course) =>
        course.title.toLowerCase().includes(text.toLowerCase()) ||
        course.courseCode.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredCourses(filtered);
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Course",
      "Are you sure you want to delete this course?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete("/courses/" + id);
              setCourses((prev) => prev.filter((c) => c._id !== id));
              setFilteredCourses((prev) => prev.filter((c) => c._id !== id));
              Alert.alert("Success", "Course deleted successfully");
            } catch (error) {
              console.log("Error deleting course:", error.message);
            }
          },
        },
      ]
    );
  };

  // Show loading spinner while fetching
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {userRole === "admin" && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate("CreateCourse")}
        >
          <Text style={styles.createButtonText}>+ Create New Course</Text>
        </TouchableOpacity>
      )}

      {/* Search bar */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search by title or code..."
        value={searchText}
        onChangeText={handleSearch}
      />

      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.courseCard}
            onPress={() =>
              navigation.navigate("CourseDetail", { courseId: item._id })
            }
          >
            {/* Course code and status badge */}
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

            {/* Course title */}
            <Text style={styles.courseTitle}>{item.title}</Text>

            {/* Course details */}
            <Text style={styles.courseMeta}>
              {item.lecturer?.name} • {item.credits} Credits • Y
              {item.academicYear}S{item.academicSemester}
            </Text>

            <Text style={styles.courseDept}>{item.department}</Text>

            {userRole === "admin" && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item._id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No courses found</Text>
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
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: "3%",
    marginBottom: "3%",
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 14,
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
    marginBottom: "1%",
  },
  courseDept: {
    fontSize: 11,
    color: "#999",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: "10%",
    fontSize: 14,
  },
  deleteButton: {
    marginTop: "3%",
    backgroundColor: "#d32f2f",
    borderRadius: 6,
    paddingVertical: "2%",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  createButton: {
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    paddingVertical: "3%",
    alignItems: "center",
    marginBottom: "3%",
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default CourseListScreen;