import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import api from "../../services/api";

const EditCourseScreen = ({ route, navigation }) => {
  // course data is passed from CourseDetailScreen
  const { courseId, course } = route.params;

  // Pre-fill all fields with existing course data
  const [courseCode, setCourseCode] = useState(course.courseCode);
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [credits, setCredits] = useState(String(course.credits));
  const [academicYear, setAcademicYear] = useState(String(course.academicYear));
  const [academicSemester, setAcademicSemester] = useState(
    String(course.academicSemester)
  );
  const [department, setDepartment] = useState(course.department);
  const [eligibilityNote, setEligibilityNote] = useState(
    course.eligibilityNote || ""
  );
  const [syllabusFile, setSyllabusFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Let lecturer pick a new PDF for syllabus
  const pickSyllabus = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });
      if (!result.canceled) {
        setSyllabusFile(result.assets[0]);
        Alert.alert("Success", "New syllabus PDF selected: " + result.assets[0].name);
      }
    } catch (error) {
      Alert.alert("Error", "Could not pick file");
    }
  };

  // Let lecturer pick a new banner image
  const pickBanner = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (!result.canceled) {
        setBannerFile(result.assets[0]);
        Alert.alert("Success", "New banner image selected");
      }
    } catch (error) {
      Alert.alert("Error", "Could not pick image");
    }
  };

  const handleUpdateCourse = async () => {
    // Basic validation
    if (
      !courseCode ||
      !title ||
      !description ||
      !credits ||
      !academicYear ||
      !academicSemester ||
      !department
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      // Use FormData because we may be sending files + text together
      const formData = new FormData();
      formData.append("courseCode", courseCode);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("credits", credits);
      formData.append("academicYear", academicYear);
      formData.append("academicSemester", academicSemester);
      formData.append("department", department);
      formData.append("eligibilityNote", eligibilityNote || "No prerequisites");

      // Only attach files if new ones were selected
      if (syllabusFile) {
        formData.append("syllabus", {
          uri: syllabusFile.uri,
          name: syllabusFile.name,
          type: "application/pdf",
        });
      }
      if (bannerFile) {
        formData.append("banner", {
          uri: bannerFile.uri,
          name: "banner.jpg",
          type: "image/jpeg",
        });
      }

      await api.put(`/courses/${courseId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert("Success", "Course updated successfully!");
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Edit Course Information</Text>

      <TextInput
        style={styles.input}
        placeholder="Course Code"
        value={courseCode}
        onChangeText={setCourseCode}
      />
      <TextInput
        style={styles.input}
        placeholder="Course Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />
      <TextInput
        style={styles.input}
        placeholder="Credits"
        value={credits}
        onChangeText={setCredits}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Academic Year (1, 2, 3 or 4)"
        value={academicYear}
        onChangeText={setAcademicYear}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Academic Semester (1 or 2)"
        value={academicSemester}
        onChangeText={setAcademicSemester}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Department"
        value={department}
        onChangeText={setDepartment}
      />
      <TextInput
        style={styles.input}
        placeholder="Eligibility Note"
        value={eligibilityNote}
        onChangeText={setEligibilityNote}
      />

      {/* File upload section */}
      <Text style={styles.sectionTitle}>Update Files (optional)</Text>
      <Text style={styles.fileNote}>
        Leave empty to keep existing files
      </Text>

      <TouchableOpacity style={styles.uploadBtn} onPress={pickSyllabus}>
        <Text style={styles.uploadBtnText}>
          {syllabusFile ? "New Syllabus Selected" : "Replace Syllabus PDF"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.uploadBtn} onPress={pickBanner}>
        <Text style={styles.uploadBtnText}>
          {bannerFile ? "New Banner Selected" : "Replace Banner Image"}
        </Text>
      </TouchableOpacity>

      {/* Update button */}
      <TouchableOpacity
        style={styles.submitBtn}
        onPress={handleUpdateCourse}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Update Course</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: "4%",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#999",
    textTransform: "uppercase",
    marginBottom: "3%",
    marginTop: "3%",
  },
  fileNote: {
    fontSize: 12,
    color: "#999",
    marginBottom: "3%",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: "3%",
    marginBottom: "3%",
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  uploadBtn: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: "4%",
    marginBottom: "3%",
    borderWidth: 1,
    borderColor: "#1a73e8",
    alignItems: "center",
    borderStyle: "dashed",
  },
  uploadBtnText: {
    color: "#1a73e8",
    fontSize: 14,
    fontWeight: "bold",
  },
  submitBtn: {
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    padding: "4%",
    alignItems: "center",
    marginTop: "3%",
    marginBottom: "10%",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default EditCourseScreen;