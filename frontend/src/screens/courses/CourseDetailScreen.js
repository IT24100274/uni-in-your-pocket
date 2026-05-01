import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Share,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";

const CourseDetailScreen = ({ route, navigation }) => {
  const { courseId } = route.params;
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchCourseAndStatus();
  }, []);

  const fetchCourseAndStatus = async () => {
    try {
      // Get user role from AsyncStorage
      const userData = await AsyncStorage.getItem("user");
      const user = JSON.parse(userData);
      setUserRole(user.role);

      // Fetch course details
      const courseRes = await api.get(`/courses/${courseId}`);
      setCourse(courseRes.data);

      // If student, check if already enrolled or applied
      if (user.role === "student") {
        const enrollRes = await api.get("/enrollments/my");
        const existing = enrollRes.data.find(
          (e) => e.course._id === courseId
        );
        if (existing) {
          setEnrollmentStatus(existing.status);
        }
      }
    } catch (error) {
      console.log("Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Student requests enrollment
  const handleEnrollRequest = async () => {
    try {
      setEnrolling(true);
      await api.post("/enrollments", { courseId });
      Alert.alert(
        "Success",
        "Enrollment request submitted! Waiting for approval."
      );
      setEnrollmentStatus("pending");
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Something went wrong"
      );
    } finally {
      setEnrolling(false);
    }
  };

  // Lecturer or admin toggles course active/inactive
  const handleToggle = async () => {
    try {
      const response = await api.patch(`/courses/${courseId}/toggle`);
      Alert.alert("Success", response.data.message);
      setCourse({ ...course, isActive: response.data.isActive });
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Something went wrong");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.centered}>
        <Text>Course not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Course header */}
      <View style={styles.header}>
        {course.bannerUrl && (
          <Image
            source={{ uri: course.bannerUrl }}
            style={{ width: "100%", height: 180 }}
          />
        )}
        <Text style={styles.courseCode}>{course.courseCode}</Text>
        <Text style={styles.courseTitle}>{course.title}</Text>
        <Text style={styles.courseMeta}>
          {course.department} • Y{course.academicYear}S{course.academicSemester}{" "}
          • {course.credits} Credits
        </Text>
        <Text style={styles.lecturerName}>
          Lecturer: {course.lecturer?.name}
        </Text>
      </View>

      {/* Course details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>{course.description}</Text>
      </View>

      {/* Eligibility requirement */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Eligibility Requirement</Text>
        <Text style={styles.eligibilityText}>{course.eligibilityNote}</Text>
      </View>

      {/* Downloads section */}
      {(course.syllabusUrl || course.bannerUrl) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Downloads</Text>
          {course.syllabusUrl && (
            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={() => {
                if (course.syllabusUrl) {
                  const viewerUrl = 'https://drive.google.com/viewerng/viewer?embedded=true&url=' + encodeURIComponent(course.syllabusUrl);
                  Linking.openURL(viewerUrl);
                } else {
                  Alert.alert("No syllabus uploaded yet");
                }
              }}
            >
              <Text style={styles.downloadBtnText}>Syllabus PDF</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Action buttons based on role */}

      {/* Student — show enroll button or status */}
      {(userRole === "student" || userRole === "lecturer") && (
        <View style={styles.section}>
          {enrollmentStatus === "approved" && (
            <View style={styles.statusBox}>
              <Text style={styles.approvedText}>
                You are enrolled in this course
              </Text>
            </View>
          )}
          {enrollmentStatus === "pending" && (
            <View style={styles.statusBox}>
              <Text style={styles.pendingText}>
                Enrollment request is pending approval
              </Text>
            </View>
          )}
          {enrollmentStatus === "denied" && (
            <View style={styles.statusBox}>
              <Text style={styles.deniedText}>
                Your enrollment request was denied
              </Text>
            </View>
          )}
          {!enrollmentStatus && (
            <TouchableOpacity
              style={styles.enrollBtn}
              onPress={handleEnrollRequest}
              disabled={enrolling}
            >
              <Text style={styles.enrollBtnText}>
                {enrolling ? "Submitting..." : "Request Enrollment"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Lecturer and admin — show manage buttons */}
      {(userRole === "lecturer" || userRole === "admin") && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() =>
              navigation.navigate("ManageEnrollments", { courseId })
            }
          >
            <Text style={styles.manageBtnText}>Manage Enrollments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleBtn,
              course.isActive ? styles.deactivateBtn : styles.activateBtn,
            ]}
            onPress={handleToggle}
          >
            <Text style={styles.toggleBtnText}>
              {course.isActive ? "Deactivate Course" : "Activate Course"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() =>
              navigation.navigate("EditCourse", { courseId, course })
            }
          >
            <Text style={styles.editBtnText}>Edit Course</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#1a73e8",
    padding: "5%",
  },
  courseCode: {
    fontSize: 13,
    color: "#c2d7fb",
    marginBottom: "1%",
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: "2%",
  },
  courseMeta: {
    fontSize: 13,
    color: "#c2d7fb",
    marginBottom: "1%",
  },
  lecturerName: {
    fontSize: 13,
    color: "#c2d7fb",
  },
  section: {
    backgroundColor: "#fff",
    padding: "4%",
    marginTop: "2%",
    borderRadius: 8,
    marginHorizontal: "3%",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#999",
    marginBottom: "2%",
    textTransform: "uppercase",
  },
  description: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22,
  },
  eligibilityText: {
    fontSize: 14,
    color: "#333",
  },
  downloadBtn: {
    backgroundColor: "#f0f0f0",
    padding: "3%",
    borderRadius: 8,
    marginBottom: "2%",
  },
  downloadBtnText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  statusBox: {
    padding: "3%",
    borderRadius: 8,
    alignItems: "center",
  },
  approvedText: {
    color: "#2e7d32",
    fontWeight: "bold",
    fontSize: 14,
  },
  pendingText: {
    color: "#e65100",
    fontWeight: "bold",
    fontSize: 14,
  },
  deniedText: {
    color: "#c62828",
    fontWeight: "bold",
    fontSize: 14,
  },
  enrollBtn: {
    backgroundColor: "#1a73e8",
    padding: "4%",
    borderRadius: 8,
    alignItems: "center",
  },
  enrollBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  manageBtn: {
    backgroundColor: "#1a73e8",
    padding: "4%",
    borderRadius: 8,
    alignItems: "center",
    marginBottom: "3%",
  },
  manageBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  toggleBtn: {
    padding: "4%",
    borderRadius: 8,
    alignItems: "center",
    marginBottom: "3%",
  },
  deactivateBtn: {
    backgroundColor: "#fce8e6",
  },
  activateBtn: {
    backgroundColor: "#e6f4ea",
  },
  toggleBtnText: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
  },
  editBtn: {
    backgroundColor: "#f0f0f0",
    padding: "4%",
    borderRadius: 8,
    alignItems: "center",
    marginBottom: "3%",
  },
  editBtnText: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
  },
});

export default CourseDetailScreen;