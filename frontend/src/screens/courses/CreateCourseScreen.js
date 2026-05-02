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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import api from "../../services/api";

const CreateCourseScreen = ({ navigation }) => {
  const [courseCode, setCourseCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [credits, setCredits] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [academicSemester, setAcademicSemester] = useState("");
  const [department, setDepartment] = useState("");
  const [eligibilityNote, setEligibilityNote] = useState("");
  const [syllabusFile, setSyllabusFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickSyllabus = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });
      if (!result.canceled) {
        setSyllabusFile(result.assets[0]);
        Alert.alert("Success", "Syllabus PDF selected: " + result.assets[0].name);
      }
    } catch (error) {
      Alert.alert("Error", "Could not pick file");
    }
  };

  const pickBanner = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (!result.canceled) {
        setBannerFile(result.assets[0]);
        Alert.alert("Success", "Banner image selected");
      }
    } catch (error) {
      Alert.alert("Error", "Could not pick image");
    }
  };

  const handleCreateCourse = async () => {
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

      const formData = new FormData();
      formData.append("courseCode", courseCode);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("credits", credits);
      formData.append("academicYear", academicYear);
      formData.append("academicSemester", academicSemester);
      formData.append("department", department);
      formData.append("eligibilityNote", eligibilityNote || "No prerequisites");

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

      await api.post("/courses", formData);

      Alert.alert("Success", "Course created successfully!");
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Course Information</Text>

          <TextInput
            style={styles.input}
            placeholder="Course Code (e.g. CS201)"
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
            placeholder="Credits (e.g. 3)"
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
            placeholder="Eligibility Note (e.g. Must pass CS101 with 50%)"
            value={eligibilityNote}
            onChangeText={setEligibilityNote}
          />

          <Text style={styles.sectionTitle}>File Uploads</Text>

          <TouchableOpacity style={styles.uploadBtn} onPress={pickSyllabus}>
            <Text style={styles.uploadBtnText}>
              {syllabusFile ? "✓ Syllabus Selected" : "Upload Syllabus PDF"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.uploadBtn} onPress={pickBanner}>
            <Text style={styles.uploadBtnText}>
              {bannerFile ? "✓ Banner Selected" : "Upload Banner Image"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleCreateCourse}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Create Course</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: "4%",
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#999",
    textTransform: "uppercase",
    marginBottom: "3%",
    marginTop: "3%",
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
    marginBottom: "5%",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CreateCourseScreen;