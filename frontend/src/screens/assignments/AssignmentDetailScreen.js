import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import api from "../../services/api";

const AssignmentDetailScreen = ({ route, navigation }) => {
  const { assignmentId, userRole } = route.params;
  const [assignment, setAssignment] = useState(null);
  const [mySubmission, setMySubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignment();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchAssignment();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchAssignment = async () => {
    try {
      const response = await api.get(`/assignments/${assignmentId}`);
      setAssignment(response.data);

      // If student, also fetch their submission
      if (userRole === "student" || userRole === "student_representative") {
        try {
          const subRes = await api.get(`/assignments/${assignmentId}/my-submission`);
          setMySubmission(subRes.data);
        } catch {
          setMySubmission(null); // No submission yet
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async () => {
    try {
      const response = await api.put(`/assignments/${assignmentId}/publish`);
      Alert.alert("Success", response.data.message);
      fetchAssignment();
    } catch (error) {
      Alert.alert("Error", "Failed to update publish status");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Assignment",
      "Are you sure? This will also delete all submissions.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/assignments/${assignmentId}`);
              Alert.alert("Deleted", "Assignment deleted successfully");
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Failed to delete assignment");
            }
          },
        },
      ]
    );
  };
// Open PDF or download file to phone storage
const openPDF = async (pdfUrl) => {
  if (!pdfUrl) {
    Alert.alert("Error", "No file available");
    return;
  }

  try {
    Alert.alert(
      "File Options",
      "What would you like to do?",
      [
        {
          text: "View Online",
          onPress: () => {
            const viewerUrl =
              "https://drive.google.com/viewerng/viewer?embedded=true&url=" +
              encodeURIComponent(pdfUrl);
            Linking.openURL(viewerUrl);
          },
        },
        {
          text: "Download to Phone",
          onPress: async () => {
            try {
              Alert.alert("Downloading...", "Please wait");

              // Extract filename from URL
              const urlParts = pdfUrl.split("/");
              let fileName = urlParts[urlParts.length - 1];
              fileName = fileName.split("?")[0] || "document.pdf";
              
              // Ensure it has a proper extension
              if (!fileName.includes(".")) {
                fileName = fileName + ".pdf";
              }

              // Download to cache directory first
              const cacheDir = FileSystem.cacheDirectory;
              const fileUri = cacheDir + fileName;

              const downloadResult = await FileSystem.downloadAsync(
                pdfUrl,
                fileUri
              );

              if (downloadResult.status === 200) {
                // Try to share the file - this allows user to save to their phone
                const canShare = await Sharing.isAvailableAsync();
                if (canShare) {
                  await Sharing.shareAsync(downloadResult.uri, {
                    mimeType: "application/pdf",
                    dialogTitle: "Save File",
                    UTI: "com.adobe.pdf"
                  });
                } else {
                  // If sharing not available, copy to document directory
                  const docDir = FileSystem.documentDirectory;
                  const newUri = docDir + fileName;
                  await FileSystem.copyAsync({
                    from: downloadResult.uri,
                    to: newUri
                  });
                  Alert.alert("Success", "File saved! You can access it from the app's files.");
                }
              } else {
                Alert.alert("Error", "Download failed with status: " + downloadResult.status);
              }
            } catch (error) {
              console.error("Download error:", error);
              Alert.alert("Error", "Could not download file: " + error.message);
            }
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  } catch (error) {
    Alert.alert("Error", "Something went wrong: " + error.message);
  }
};




  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isPastDeadline = (deadline) => {
    return new Date() > new Date(deadline);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  if (!assignment) {
    return (
      <View style={styles.centered}>
        <Text>Assignment not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Course info */}
      <Text style={styles.courseLabel}>
        {assignment.courseId?.courseCode} — {assignment.courseId?.title}
      </Text>

      {/* Title */}
      <Text style={styles.title}>{assignment.title}</Text>

      {/* Published status */}
      <View
        style={[
          styles.statusBadge,
          assignment.isPublished ? styles.publishedBadge : styles.draftBadge,
        ]}
      >
        <Text style={styles.statusText}>
          {assignment.isPublished ? "Published" : "Draft"}
        </Text>
      </View>

      {/* Details card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Details</Text>
        <Text style={styles.description}>{assignment.description}</Text>

        <Text style={styles.label}>Created by</Text>
        <Text style={styles.value}>{assignment.createdBy?.name}</Text>

        <Text style={styles.label}>Deadline</Text>
        <Text
          style={[
            styles.value,
            isPastDeadline(assignment.deadline) && styles.pastDeadline,
          ]}
        >
          {formatDate(assignment.deadline)}
          {isPastDeadline(assignment.deadline) ? " — CLOSED" : ""}
        </Text>

        {/* Brief file download */}
        {assignment.briefUrl && (
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => openPDF(assignment.briefUrl)}
          >
            <Text style={styles.downloadText}>📎 Download Brief / Rubric</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* STUDENT VIEW — Submission status */}
      {(userRole === "student" || userRole === "student_representative") && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>My Submission</Text>

          {mySubmission ? (
            <>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.value}>{mySubmission.status}</Text>

              <Text style={styles.label}>Submitted At</Text>
              <Text style={styles.value}>{formatDate(mySubmission.submittedAt)}</Text>

              <Text style={styles.label}>On Time</Text>
              <Text
                style={[
                  styles.value,
                  mySubmission.isLate ? styles.lateText : styles.onTimeText,
                ]}
              >
                {mySubmission.isLate ? "Late ❌" : "On Time ✅"}
              </Text>

              <Text style={styles.label}>File</Text>
              <TouchableOpacity
                onPress={() => openPDF(mySubmission.fileUrl)}>
                <Text style={styles.fileLink}>📄 {mySubmission.fileName}</Text>
              </TouchableOpacity>

              {/* Resubmit button — only before deadline */}
              {!isPastDeadline(assignment.deadline) && (
                <TouchableOpacity
                  style={styles.resubmitButton}
                  onPress={() =>
                    navigation.navigate("SubmitAssignment", {
                      assignmentId,
                      isResubmit: true,
                    })
                  }
                >
                  <Text style={styles.buttonText}>Replace Submission</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Text style={styles.noSubmission}>You haven't submitted yet</Text>
              {!isPastDeadline(assignment.deadline) && (
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() =>
                    navigation.navigate("SubmitAssignment", {
                      assignmentId,
                      isResubmit: false,
                    })
                  }
                >
                  <Text style={styles.buttonText}>Submit Assignment</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}

      {/* LECTURER VIEW — Actions */}
      {(userRole === "lecturer" || userRole === "admin") && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Actions</Text>

          {/* View submissions */}
          <TouchableOpacity
            style={styles.viewSubmissionsButton}
            onPress={() =>
              navigation.navigate("SubmissionsList", { assignmentId, assignmentTitle: assignment.title })
            }
          >
            <Text style={styles.buttonText}>📋 View All Submissions</Text>
          </TouchableOpacity>

          {/* Publish / Unpublish */}
          <TouchableOpacity
            style={[
              styles.publishButton,
              assignment.isPublished && styles.unpublishButton,
            ]}
            onPress={handleTogglePublish}
          >
            <Text style={styles.buttonText}>
              {assignment.isPublished ? "Unpublish" : "Publish"}
            </Text>
          </TouchableOpacity>

          {/* Delete */}
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.buttonText}>🗑 Delete Assignment</Text>
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
    padding: "4%",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  courseLabel: {
    fontSize: 13,
    color: "#1a73e8",
    fontWeight: "bold",
    marginTop: "4%",
    marginBottom: "2%",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: "3%",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: "3%",
    paddingVertical: "1%",
    borderRadius: 6,
    marginBottom: "4%",
  },
  publishedBadge: {
    backgroundColor: "#e6f4ea",
  },
  draftBadge: {
    backgroundColor: "#fff3e0",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: "5%",
    marginBottom: "4%",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: "3%",
  },
  description: {
    fontSize: 14,
    color: "#555",
    marginBottom: "4%",
    lineHeight: 22,
  },
  label: {
    fontSize: 12,
    color: "#999",
    marginTop: "3%",
  },
  value: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    marginTop: "1%",
  },
  pastDeadline: {
    color: "#e74c3c",
  },
  downloadButton: {
    marginTop: "4%",
    backgroundColor: "#e8f0fe",
    padding: "3%",
    borderRadius: 8,
    alignItems: "center",
  },
  downloadText: {
    color: "#1a73e8",
    fontWeight: "bold",
    fontSize: 14,
  },
  noSubmission: {
    color: "#999",
    fontSize: 14,
    marginBottom: "3%",
  },
  submitButton: {
    backgroundColor: "#1a73e8",
    padding: "4%",
    borderRadius: 8,
    alignItems: "center",
    marginTop: "2%",
  },
  resubmitButton: {
    backgroundColor: "#f39c12",
    padding: "4%",
    borderRadius: 8,
    alignItems: "center",
    marginTop: "3%",
  },
  viewSubmissionsButton: {
    backgroundColor: "#1a73e8",
    padding: "4%",
    borderRadius: 8,
    alignItems: "center",
    marginBottom: "3%",
  },
  publishButton: {
    backgroundColor: "#27ae60",
    padding: "4%",
    borderRadius: 8,
    alignItems: "center",
    marginBottom: "3%",
  },
  unpublishButton: {
    backgroundColor: "#f39c12",
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    padding: "4%",
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  lateText: {
    color: "#e74c3c",
  },
  onTimeText: {
    color: "#27ae60",
  },
  fileLink: {
    color: "#1a73e8",
    fontSize: 14,
    marginTop: "1%",
    textDecorationLine: "underline",
  },
});

export default AssignmentDetailScreen;