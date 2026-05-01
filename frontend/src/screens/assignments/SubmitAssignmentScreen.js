import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import api from "../../services/api";

const SubmitAssignmentScreen = ({ route, navigation }) => {
  const { assignmentId, isResubmit } = route.params;
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // Allow any file type
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Could not pick file");
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      Alert.alert("Error", "Please select a file first");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        type: file.mimeType || "application/octet-stream",
        name: file.name,
      });

      if (isResubmit) {
        // Replace existing submission
        await api.put(`/assignments/${assignmentId}/resubmit`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        Alert.alert("Success", "Your submission has been replaced!");
      } else {
        // First time submission
        await api.post(`/assignments/${assignmentId}/submit`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        Alert.alert("Success", "Assignment submitted successfully!");
      }

      navigation.goBack();
    } catch (error) {
      const message = error.response?.data?.message || "Submission failed";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.screenTitle}>
        {isResubmit ? "Replace Submission" : "Submit Assignment"}
      </Text>

      <View style={styles.card}>
        <Text style={styles.info}>
          {isResubmit
            ? "⚠️ This will replace your existing submission. Only allowed before the deadline."
            : "📤 Upload your assignment file below. Make sure it is the correct file before submitting."}
        </Text>

        {/* File Picker */}
        <TouchableOpacity style={styles.fileButton} onPress={pickFile}>
          <Text style={styles.fileButtonText}>
            {file ? `📄 ${file.name}` : "📎 Pick Your File"}
          </Text>
        </TouchableOpacity>

        {/* File size info */}
        {file && (
          <Text style={styles.fileInfo}>
            Size: {(file.size / 1024).toFixed(1)} KB
          </Text>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isResubmit ? "Replace Submission" : "Submit Assignment"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: "5%",
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginTop: "4%",
    marginBottom: "5%",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: "5%",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  info: {
    fontSize: 14,
    color: "#555",
    marginBottom: "5%",
    lineHeight: 22,
  },
  fileButton: {
    backgroundColor: "#e8f0fe",
    borderRadius: 8,
    padding: "4%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1a73e8",
    marginBottom: "3%",
  },
  fileButtonText: {
    color: "#1a73e8",
    fontWeight: "bold",
    fontSize: 14,
  },
  fileInfo: {
    color: "#999",
    fontSize: 12,
    marginBottom: "4%",
    textAlign: "center",
  },
  submitButton: {
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    padding: "4%",
    alignItems: "center",
    marginTop: "3%",
  },
  buttonDisabled: {
    backgroundColor: "#93b8f0",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default SubmitAssignmentScreen;