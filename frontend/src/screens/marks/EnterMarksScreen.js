import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { createResult, getCourseResults } from "../../services/api";
import api from "../../services/api";

const EnterMarksScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [marks, setMarks] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get("/courses/my-courses");
      setCourses(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load courses");
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchEnrolledStudents = async (courseId) => {
    try {
      const response = await api.get(
        `/enrollments/course/${courseId}/students`
      );
      setStudents(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load students");
    }
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setSelectedStudent(null);
    setStudents([]);
    fetchEnrolledStudents(course._id);
  };

  const handleSubmit = async () => {
    if (!selectedCourse || !selectedStudent || !marks) {
      Alert.alert("Error", "Please select course, student and enter marks");
      return;
    }

    if (isNaN(marks) || Number(marks) < 0 || Number(marks) > 100) {
      Alert.alert("Error", "Marks must be a number between 0 and 100");
      return;
    }

    setLoading(true);
    try {
      await createResult({
        student: selectedStudent._id,
        course: selectedCourse._id,
        marks: Number(marks),
        remarks,
      });

      Alert.alert("Success", "Result entered successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to enter result";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingCourses) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Loading courses...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Enter Student Marks</Text>

      {/* Course Selection */}
      <Text style={styles.label}>Select Course</Text>
      {courses.length === 0 ? (
        <Text style={styles.emptyText}>No courses found</Text>
      ) : (
        courses.map((course) => (
          <TouchableOpacity
            key={course._id}
            style={[
              styles.selectCard,
              selectedCourse?._id === course._id && styles.selectedCard,
            ]}
            onPress={() => handleCourseSelect(course)}
          >
            <Text
              style={[
                styles.selectCardText,
                selectedCourse?._id === course._id &&
                  styles.selectedCardText,
              ]}
            >
              {course.courseCode} - {course.title}
            </Text>
          </TouchableOpacity>
        ))
      )}

      {/* Student Selection */}
      {selectedCourse && (
        <>
          <Text style={styles.label}>Select Student</Text>
          {students.length === 0 ? (
            <Text style={styles.emptyText}>No enrolled students found</Text>
          ) : (
            students.map((item) => (
              <TouchableOpacity
                key={item.student._id}
                style={[
                  styles.selectCard,
                  selectedStudent?._id === item.student._id &&
                    styles.selectedCard,
                ]}
                onPress={() => setSelectedStudent(item.student)}
              >
                <Text
                  style={[
                    styles.selectCardText,
                    selectedStudent?._id === item.student._id &&
                      styles.selectedCardText,
                  ]}
                >
                  {item.student.name} — {item.student.studentId}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </>
      )}

      {/* Marks Input */}
      {selectedStudent && (
        <>
          <Text style={styles.label}>Marks (0 - 100)</Text>
          <TextInput
            style={styles.input}
            value={marks}
            onChangeText={setMarks}
            keyboardType="numeric"
            placeholder="Enter marks"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Remarks (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Enter remarks"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Submit Result</Text>
            )}
          </TouchableOpacity>
        </>
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
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 16,
  },
  selectCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedCard: {
    backgroundColor: "#1a73e8",
    borderColor: "#1a73e8",
  },
  selectCardText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  selectedCardText: {
    color: "#ffffff",
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#1a73e8",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyText: {
    color: "#999",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default EnterMarksScreen;