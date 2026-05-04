import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import api from "../../services/api";

const SubmissionsListScreen = ({ route }) => {
  const { assignmentId, assignmentTitle } = route.params;
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await api.get(`/assignments/${assignmentId}/submissions`);
      setSubmissions(response.data);
    } catch (error) {
      console.log("Error fetching submissions:", error.message);
    } finally {
      setLoading(false);
    }
  };

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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.screenTitle}>Submissions</Text>
      <Text style={styles.subTitle}>{assignmentTitle}</Text>
      <Text style={styles.count}>{submissions.length} submission(s)</Text>

      <FlatList
        data={submissions}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Student info */}
            <Text style={styles.studentName}>{item.studentId?.name}</Text>
            <Text style={styles.studentEmail}>{item.studentId?.email}</Text>
            {item.studentId?.studentId && (
              <Text style={styles.studentId}>ID: {item.studentId.studentId}</Text>
            )}

            {/* Submission details */}
            <View style={styles.row}>
              <Text style={styles.label}>Submitted:</Text>
              <Text style={styles.value}>{formatDate(item.submittedAt)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Status:</Text>
              <Text style={styles.value}>{item.status}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Timing:</Text>
              <Text
                style={[
                  styles.value,
                  item.isLate ? styles.lateText : styles.onTimeText,
                ]}
              >
                {item.isLate ? "Late ❌" : "On Time ✅"}
              </Text>
            </View>

            {/* Download file */}
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => openPDF(item.fileUrl)}
            >
              <Text style={styles.downloadText}>📥 Download: {item.fileName}</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No submissions yet</Text>
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
  screenTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: "1%",
  },
  subTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: "1%",
  },
  count: {
    fontSize: 13,
    color: "#1a73e8",
    marginBottom: "4%",
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: "4%",
    marginBottom: "3%",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  studentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: "1%",
  },
  studentEmail: {
    fontSize: 13,
    color: "#666",
    marginBottom: "1%",
  },
  studentId: {
    fontSize: 12,
    color: "#999",
    marginBottom: "3%",
  },
  row: {
    flexDirection: "row",
    marginBottom: "2%",
  },
  label: {
    fontSize: 13,
    color: "#999",
    width: "30%",
  },
  value: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
    flex: 1,
  },
  lateText: {
    color: "#e74c3c",
  },
  onTimeText: {
    color: "#27ae60",
  },
  downloadButton: {
    backgroundColor: "#e8f0fe",
    borderRadius: 8,
    padding: "3%",
    alignItems: "center",
    marginTop: "3%",
  },
  downloadText: {
    color: "#1a73e8",
    fontWeight: "bold",
    fontSize: 13,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: "10%",
    fontSize: 14,
  },
});

export default SubmissionsListScreen;