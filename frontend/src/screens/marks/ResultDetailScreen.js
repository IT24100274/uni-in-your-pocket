import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
} from "react-native";
import { uploadConcernFile } from "../../services/api";
import * as DocumentPicker from "expo-document-picker";

const ResultDetailScreen = ({ route }) => {
  const { result, userRole } = route.params;
  const [uploading, setUploading] = useState(false);
  const [concernUrl, setConcernUrl] = useState(
    result.feedbackFile?.url || ""
  );

  const getGradeColor = (grade) => {
    if (grade === "A") return "#27ae60";
    if (grade === "B") return "#2980b9";
    if (grade === "C") return "#f39c12";
    if (grade === "D") return "#e67e22";
    return "#e74c3c";
  };

  const getGradeBg = (grade) => {
    if (grade === "A") return "#d5f5e3";
    if (grade === "B") return "#d6eaf8";
    if (grade === "C") return "#fef9e7";
    if (grade === "D") return "#fdebd0";
    return "#fdecea";
  };

  const handleDownloadResultSheet = async () => {
    Alert.alert("Result Sheet", 
      `Course: ${result.course?.title}\nMarks: ${result.marks}/100\nGrade: ${result.grade}\nRemarks: ${result.remarks || "None"}`,
      [{ text: "OK" }]
    );
  };

  const handleViewConcern = async () => {
    if (!concernUrl) {
      Alert.alert("No File", "No concern file uploaded yet");
      return;
    }
    try {
      await Linking.openURL(concernUrl);
    } catch (error) {
      Alert.alert("Error", "Could not open the file");
    }
  };

  const handleUploadConcern = async () => {
    try {
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (pickerResult.canceled) return;

      const file = pickerResult.assets[0];
      setUploading(true);

      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        type: file.mimeType || "application/pdf",
        name: file.name || "concern.pdf",
      });

      const response = await uploadConcernFile(result._id, formData);
      setConcernUrl(response.data.result.feedbackFile.url);
      Alert.alert("Success", "Concern file uploaded successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to upload concern file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Result Details</Text>

      {/* Grade Card */}
      <View style={[styles.gradeCard, { backgroundColor: getGradeBg(result.grade) }]}>
        <Text style={[styles.gradeText, { color: getGradeColor(result.grade) }]}>
          {result.grade}
        </Text>
        <Text style={styles.marksText}>{result.marks} / 100</Text>
      </View>

      {/* Course Info */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Course Information</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Course</Text>
          <Text style={styles.infoValue}>{result.course?.title}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Course Code</Text>
          <Text style={styles.infoValue}>{result.course?.courseCode}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Marks</Text>
          <Text style={styles.infoValue}>{result.marks} / 100</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Grade</Text>
          <Text style={[styles.infoValue, { color: getGradeColor(result.grade), fontWeight: "bold" }]}>
            {result.grade}
          </Text>
        </View>

        {result.remarks ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Remarks</Text>
            <Text style={styles.infoValue}>{result.remarks}</Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status</Text>
          <Text style={[styles.infoValue, styles.publishedText]}>Published ✅</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date</Text>
          <Text style={styles.infoValue}>
            {new Date(result.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Download Result Sheet — everyone can see */}
        <TouchableOpacity
          style={styles.downloadResultButton}
          onPress={handleDownloadResultSheet}
        >
          <Text style={styles.downloadResultButtonText}>
            📥 Download Result Sheet
          </Text>
        </TouchableOpacity>
      </View>

      {/* Concern File Section */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Concern / Appeal</Text>

        {concernUrl ? (
          <>
            <Text style={styles.fileAvailable}>✅ Concern file submitted</Text>
            <TouchableOpacity
              style={styles.viewConcernButton}
              onPress={handleViewConcern}
            >
              <Text style={styles.viewConcernButtonText}>
                📄 View Concern File
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.noFile}>No concern file uploaded yet</Text>
        )}

        {/* Upload concern — only students */}
        {(userRole === "student" || userRole === "student_representative") && (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadConcern}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.uploadButtonText}>
                📤 Upload Concern File
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Lecturer sees a note */}
        {userRole === "lecturer" && concernUrl && (
          <Text style={styles.lecturerNote}>
            ℹ️ Student has submitted a concern. View the file above.
          </Text>
        )}
      </View>

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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: "6%",
    marginTop: "2%",
  },
  gradeCard: {
    borderRadius: 16,
    padding: "8%",
    alignItems: "center",
    marginBottom: 20,
  },
  gradeText: {
    fontSize: 72,
    fontWeight: "bold",
  },
  marksText: {
    fontSize: 22,
    color: "#555",
    marginTop: 8,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: "6%",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 13,
    color: "#999",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  publishedText: {
    color: "#27ae60",
  },
  downloadResultButton: {
    backgroundColor: "#1a73e8",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  downloadResultButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
  fileAvailable: {
    fontSize: 15,
    color: "#27ae60",
    marginBottom: 12,
    fontWeight: "500",
  },
  noFile: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    marginBottom: 12,
  },
  viewConcernButton: {
    backgroundColor: "#8e44ad",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  viewConcernButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
  uploadButton: {
    backgroundColor: "#27ae60",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  uploadButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
  lecturerNote: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginTop: 12,
    textAlign: "center",
  },
  bottomSpacing: {
    height: 40,
  },
});

export default ResultDetailScreen;