import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as DocumentPicker from "expo-document-picker";
import api from "../../services/api";

const CreateAssignmentScreen = ({ navigation }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [briefFile, setBriefFile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    fetchAllCourses();
  }, []);

  // Fetch ALL active courses (not just my-courses)
  const fetchAllCourses = async () => {
    try {
      const response = await api.get("/courses");
      // Only show active courses
      const activeCourses = response.data.filter((c) => c.isActive);
      setCourses(activeCourses);

      // Auto-select first course if available
      if (activeCourses.length > 0) {
        setCourseId(activeCourses[0]._id);
      }
    } catch (error) {
      console.log("Error fetching courses:", error.message);
      Alert.alert("Error", "Could not load courses");
    } finally {
      setLoadingCourses(false);
    }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setBriefFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Could not pick file");
    }
  };

  const handleCreate = async () => {
    if (!title || !description || !courseId || !deadline) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      Alert.alert("Error", "Please enter a valid deadline (YYYY-MM-DD HH:MM)");
      return;
    }

    if (deadlineDate < new Date()) {
      Alert.alert("Error", "Deadline cannot be in the past");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("courseId", courseId);
      formData.append("deadline", deadlineDate.toISOString());

      if (briefFile) {
        formData.append("brief", {
          uri: briefFile.uri,
          type: briefFile.mimeType || "application/pdf",
          name: briefFile.name,
        });
      }

      await api.post("/assignments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert("Success", "Assignment created successfully!");
      navigation.goBack();
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to create assignment";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingCourses) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Loading courses...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.screenTitle}>Create Assignment</Text>

      {/* Title */}
      <Text style={styles.label}>Title *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Lab Report 01"
        value={title}
        onChangeText={setTitle}
      />

      {/* Description */}
      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe what students need to do..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      {/* Course Dropdown */}
      <Text style={styles.label}>Select Course *</Text>
      {courses.length === 0 ? (
        <View style={styles.noCoursesBox}>
          <Text style={styles.noCourses}>
            ⚠️ No active courses found. Ask the lecturer to create a course first.
          </Text>
        </View>
      ) : (
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={courseId}
            onValueChange={(value) => setCourseId(value)}
            style={styles.picker}
          >
            {courses.map((course) => (
              <Picker.Item
                key={course._id}
                label={`${course.courseCode} — ${course.title}`}
                value={course._id}
              />
            ))}
          </Picker>
        </View>
      )}

      {/* Deadline */}
      <Text style={styles.label}>Deadline * (YYYY-MM-DD HH:MM)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 2026-05-30 23:59"
        value={deadline}
        onChangeText={setDeadline}
      />

      {/* Brief File Upload */}
      <Text style={styles.label}>Brief / Rubric File (optional)</Text>
      <TouchableOpacity style={styles.fileButton} onPress={pickFile}>
        <Text style={styles.fileButtonText}>
          {briefFile ? `📄 ${briefFile.name}` : "📎 Pick File (PDF or Word)"}
        </Text>
      </TouchableOpacity>

      {/* Remove file option */}
      {briefFile && (
        <TouchableOpacity onPress={() => setBriefFile(null)}>
          <Text style={styles.removeFile}>✕ Remove file</Text>
        </TouchableOpacity>
      )}

      {/* Create Button */}
      <TouchableOpacity
        style={[
          styles.createButton,
          (loading || courses.length === 0) && styles.buttonDisabled,
        ]}
        onPress={handleCreate}
        disabled={loading || courses.length === 0}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createButtonText}>Create Assignment</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: "5%",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: "4%",
    marginBottom: "5%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: "2%",
    marginTop: "3%",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: "3%",
    fontSize: 14,
    color: "#333",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  pickerWrapper: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
  },
  picker: {
    height: 52,
    color: "#333",
  },
  noCoursesBox: {
    backgroundColor: "#fff3e0",
    borderRadius: 8,
    padding: "4%",
    borderWidth: 1,
    borderColor: "#f39c12",
  },
  noCourses: {
    color: "#e67e22",
    fontSize: 13,
    lineHeight: 20,
  },
  fileButton: {
    backgroundColor: "#e8f0fe",
    borderRadius: 8,
    padding: "4%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1a73e8",
  },
  fileButtonText: {
    color: "#1a73e8",
    fontWeight: "bold",
    fontSize: 14,
  },
  removeFile: {
    color: "#e74c3c",
    fontSize: 13,
    marginTop: "2%",
    textAlign: "center",
  },
  createButton: {
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    padding: "4%",
    alignItems: "center",
    marginTop: "6%",
    marginBottom: "8%",
  },
  buttonDisabled: {
    backgroundColor: "#93b8f0",
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default CreateAssignmentScreen;