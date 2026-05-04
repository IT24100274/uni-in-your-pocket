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
  TextInput,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { getCourseResults, togglePublish, updateResult, deleteResult } from "../../services/api";
import api from "../../services/api";

const ManageResultsScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingResult, setEditingResult] = useState(null);
  const [editMarks, setEditMarks] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [editLoading, setEditLoading] = useState(false);

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

  const fetchResults = async (courseId) => {
    setLoading(true);
    try {
      const response = await getCourseResults(courseId);
      setResults(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    fetchResults(course._id);
  };

  const handleTogglePublish = async (resultId) => {
    try {
      const response = await togglePublish(resultId);
      Alert.alert("Success", response.data.message);
      fetchResults(selectedCourse._id);
    } catch (error) {
      Alert.alert("Error", "Failed to update publish status");
    }
  };

  const handleEditPress = (result) => {
    setEditingResult(result);
    setEditMarks(String(result.marks));
    setEditRemarks(result.remarks || "");
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    Keyboard.dismiss();
    if (!editMarks || isNaN(editMarks) || Number(editMarks) < 0 || Number(editMarks) > 100) {
      Alert.alert("Error", "Please enter valid marks between 0 and 100");
      return;
    }
    setEditLoading(true);
    try {
      await updateResult(editingResult._id, {
        marks: Number(editMarks),
        remarks: editRemarks,
      });
      Alert.alert("Success", "Result updated successfully!");
      setEditModalVisible(false);
      fetchResults(selectedCourse._id);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update result";
      Alert.alert("Error", message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = (resultId) => {
    Alert.alert(
      "Delete Result",
      "Are you sure you want to delete this result? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteResult(resultId);
              Alert.alert("Success", "Result deleted successfully!");
              fetchResults(selectedCourse._id);
            } catch (error) {
              const message = error.response?.data?.message || "Failed to delete result";
              Alert.alert("Error", message);
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedCourse) {
      await fetchResults(selectedCourse._id);
    }
    setRefreshing(false);
  };

  const getGradeColor = (grade) => {
    if (grade === "A") return "#27ae60";
    if (grade === "B") return "#2980b9";
    if (grade === "C") return "#f39c12";
    if (grade === "D") return "#e67e22";
    return "#e74c3c";
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
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Manage Results</Text>

        <Text style={styles.label}>Select Course</Text>
        {courses.map((course) => (
          <TouchableOpacity
            key={course._id}
            style={[
              styles.courseCard,
              selectedCourse?._id === course._id && styles.selectedCourseCard,
            ]}
            onPress={() => handleCourseSelect(course)}
          >
            <Text
              style={[
                styles.courseCardText,
                selectedCourse?._id === course._id && styles.selectedCourseCardText,
              ]}
            >
              {course.courseCode} - {course.title}
            </Text>
          </TouchableOpacity>
        ))}

        {selectedCourse && (
          <>
            <Text style={styles.label}>Results for {selectedCourse.title}</Text>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate("EnterMarks")}
            >
              <Text style={styles.addButtonText}>+ Enter New Result</Text>
            </TouchableOpacity>

            {loading ? (
              <ActivityIndicator size="large" color="#1a73e8" style={{ marginTop: 20 }} />
            ) : results.length === 0 ? (
              <Text style={styles.emptyText}>No results entered for this course yet</Text>
            ) : (
              results.map((result) => (
                <View key={result._id} style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <View>
                      <Text style={styles.studentName}>{result.student?.name}</Text>
                      <Text style={styles.studentId}>{result.student?.studentId}</Text>
                    </View>
                    <View style={styles.gradeContainer}>
                      <Text style={[styles.grade, { color: getGradeColor(result.grade) }]}>
                        {result.grade}
                      </Text>
                      <Text style={styles.marks}>{result.marks}/100</Text>
                    </View>
                  </View>

                  {result.remarks ? (
                    <Text style={styles.remarks}>📝 {result.remarks}</Text>
                  ) : null}

                  {result.feedbackFile?.url ? (
                    <Text style={styles.concernIndicator}>
                      ⚠️ Student submitted a concern
                    </Text>
                  ) : null}

                  <View style={styles.resultFooter}>
                    <View style={[
                      styles.statusBadge,
                      result.isPublished ? styles.publishedBadge : styles.unpublishedBadge,
                    ]}>
                      <Text style={styles.statusText}>
                        {result.isPublished ? "Published" : "Unpublished"}
                      </Text>
                    </View>

                    {result.isLocked ? (
                      <View style={styles.lockedBadge}>
                        <Text style={styles.lockedText}>🔒 Locked</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.publishButton}
                        onPress={() => handleTogglePublish(result._id)}
                      >
                        <Text style={styles.publishButtonText}>
                          {result.isPublished ? "Unpublish" : "Publish"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {!result.isLocked && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditPress(result)}
                      >
                        <Text style={styles.editButtonText}>✏️ Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDelete(result._id)}
                      >
                        <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          Keyboard.dismiss();
          setEditModalVisible(false);
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Result</Text>
              <Text style={styles.modalStudent}>
                Student: {editingResult?.student?.name}
              </Text>

              <Text style={styles.modalLabel}>Marks (0 - 100)</Text>
              <TextInput
                style={styles.modalInput}
                value={editMarks}
                onChangeText={setEditMarks}
                keyboardType="numeric"
                placeholder="Enter marks"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />

              <Text style={styles.modalLabel}>Remarks</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={editRemarks}
                onChangeText={setEditRemarks}
                placeholder="Enter remarks"
                multiline
                numberOfLines={3}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    Keyboard.dismiss();
                    setEditModalVisible(false);
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleEditSubmit}
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalSaveText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
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
  courseCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedCourseCard: {
    backgroundColor: "#1a73e8",
    borderColor: "#1a73e8",
  },
  courseCardText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  selectedCourseCardText: {
    color: "#ffffff",
  },
  addButton: {
    backgroundColor: "#27ae60",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
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
  studentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  studentId: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
  },
  gradeContainer: {
    alignItems: "center",
  },
  grade: {
    fontSize: 28,
    fontWeight: "bold",
  },
  marks: {
    fontSize: 13,
    color: "#666",
  },
  remarks: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontStyle: "italic",
  },
  concernIndicator: {
    fontSize: 13,
    color: "#e67e22",
    marginBottom: 8,
    fontWeight: "500",
  },
  resultFooter: {
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
  lockedBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  lockedText: {
    fontSize: 13,
    color: "#666",
  },
  publishButton: {
    backgroundColor: "#1a73e8",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  publishButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 8,
  },
  editButton: {
    backgroundColor: "#f39c12",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  editButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    color: "#999",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "center",
  },
  bottomSpacing: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: "5%",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  modalStudent: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    gap: 12,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  modalCancelText: {
    fontSize: 15,
    color: "#666",
  },
  modalSaveButton: {
    backgroundColor: "#1a73e8",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalSaveText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
});

export default ManageResultsScreen;