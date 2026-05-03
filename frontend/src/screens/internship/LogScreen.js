import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, FlatList,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import api from "../../services/api";

/*
 * LogScreen — Student
 * Handles two functions viia tab switching:
 * 1. Log History — shows all submitted logs with status badges.
 *    Rejected logs show lecturer comment inline.
 *    Missing weeks are highlighted in amber.
 *    Pending logs show a delete button — student can delete before lecturer reviews.
 *    Tapping a log navigates to detail view in ReviewScreen.
 * 2. Submit Log — form to submit a new weekly log with week number, date,
 *    description, tasks, category tag, and optional evidence file upload.
 */

const CATEGORIES = ["technical", "meeting", "training", "research", "other"];

const LogScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState("history");
  const [logs, setLogs] = useState([]);
  const [reminder, setReminder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [weekNumber, setWeekNumber] = useState("");
  const [logDate, setLogDate] = useState("");
  const [logDescription, setLogDescription] = useState("");
  const [tasksCompleted, setTasksCompleted] = useState("");
  const [category, setCategory] = useState("technical");
  const [file, setFile] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/internship/logs/my");
      setLogs(res.data.logs);
      setReminder(res.data.reminder);
    } catch (error) {
      Alert.alert("Error", "Could not load logs");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchLogs(); }, []));

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"] });
      if (!result.canceled) setFile(result.assets[0]);
    } catch (error) {
      Alert.alert("Error", "Could not pick file");
    }
  };

  const handleSubmitLog = async () => {
    if (!weekNumber || !logDate || !logDescription || !tasksCompleted) {
      return Alert.alert("Error", "Please fill in all required fields");
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("weekNumber", weekNumber);
      formData.append("logDate", logDate);
      formData.append("logDescription", logDescription);
      formData.append("tasksCompleted", tasksCompleted);
      formData.append("category", category);
      if (file) {
        formData.append("evidence", {
          uri: file.uri,
          type: file.mimeType || "application/octet-stream",
          name: file.name,
        });
      }
      await api.post("/internship/logs", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("Success", "Weekly log submitted successfully!");
      setWeekNumber("");
      setLogDate("");
      setLogDescription("");
      setTasksCompleted("");
      setCategory("technical");
      setFile(null);
      setActiveTab("history");
      fetchLogs();
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = (logId) => {
    Alert.alert(
      "Delete Log",
      "Are you sure you want to delete this weekly log? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/internship/logs/${logId}`);
              Alert.alert("Deleted", "Log deleted successfully");
              fetchLogs();
            } catch (error) {
              Alert.alert("Error", error.response?.data?.message || "Could not delete log");
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    const colors = { approved: "#059669", rejected: "#dc2626", pending: "#d97706" };
    return colors[status] || "#6b7280";
  };

  const getStatusBg = (status) => {
    const colors = { approved: "#d1fae5", rejected: "#fee2e2", pending: "#fef3c7" };
    return colors[status] || "#f3f4f6";
  };

  const renderLog = ({ item }) => (
    <TouchableOpacity
      style={styles.logRow}
      onPress={() => navigation.navigate("Review", { logId: item._id, mode: "detail" })}
    >
      <View style={styles.logLeft}>
        <Text style={styles.logWeek}>Week {item.weekNumber}</Text>
        <Text style={styles.logDate}>{new Date(item.logDate).toDateString()}</Text>
        <Text style={styles.logCategory}>{item.category}</Text>
        {item.status === "rejected" && item.lecturerComment ? (
          <View style={styles.commentBox}>
            <Text style={styles.commentLabel}>💬 Lecturer Comment</Text>
            <Text style={styles.commentText}>{item.lecturerComment}</Text>
          </View>
        ) : null}
        {item.status === "pending" && (
          <TouchableOpacity
            style={styles.deleteLogBtn}
            onPress={() => handleDeleteLog(item._id)}
          >
            <Text style={styles.deleteLogBtnText}>🗑 Delete</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.tabActive]}
          onPress={() => setActiveTab("history")}
        >
          <Text style={[styles.tabText, activeTab === "history" && styles.tabTextActive]}>Log History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "submit" && styles.tabActive]}
          onPress={() => setActiveTab("submit")}
        >
          <Text style={[styles.tabText, activeTab === "submit" && styles.tabTextActive]}>Submit Log</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "history" ? (
        loading ? (
          <View style={styles.centered}><ActivityIndicator size="large" color="#1a56db" /></View>
        ) : (
          <FlatList
            data={logs}
            keyExtractor={(item) => item._id}
            renderItem={renderLog}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              reminder?.hasReminder ? (
                <TouchableOpacity style={styles.reminderBanner} onPress={() => setActiveTab("submit")}>
                  <Text style={styles.reminderIcon}>⚠️</Text>
                  <View>
                    <Text style={styles.reminderTitle}>Missing Logs Detected</Text>
                    <Text style={styles.reminderSub}>Missing weeks: {reminder.missingWeeks.join(", ")}</Text>
                  </View>
                </TouchableOpacity>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>No logs submitted yet</Text>
                <TouchableOpacity onPress={() => setActiveTab("submit")}>
                  <Text style={styles.emptyLink}>Submit your first log →</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          <Text style={styles.label}>Week Number *</Text>
          <TextInput style={styles.input} placeholder="e.g. 9" value={weekNumber} onChangeText={setWeekNumber} keyboardType="numeric" />

          <Text style={styles.label}>Log Date (YYYY-MM-DD) *</Text>
          <TextInput style={styles.input} placeholder="e.g. 2026-04-28" value={logDate} onChangeText={setLogDate} />

          <Text style={styles.label}>Log Description *</Text>
          <TextInput style={styles.textArea} placeholder="Describe what you did this week..." value={logDescription} onChangeText={setLogDescription} multiline />

          <Text style={styles.label}>Tasks Completed *</Text>
          <TextInput style={styles.textArea} placeholder="List the main tasks you completed..." value={tasksCompleted} onChangeText={setTasksCompleted} multiline />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Upload Evidence (Optional)</Text>
          <TouchableOpacity style={styles.uploadBox} onPress={pickFile}>
            <Text style={styles.uploadIcon}>📤</Text>
            <Text style={styles.uploadText}>{file ? file.name : "Tap to upload timesheet / photo / PDF"}</Text>
            <Text style={styles.uploadSub}>Max 5MB — PDF, JPG, PNG</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn} onPress={handleSubmitLog} disabled={submitting}>
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Submit Weekly Log</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4ff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabBar: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#1a56db" },
  tabText: { fontSize: 14, fontWeight: "500", color: "#9ca3af" },
  tabTextActive: { color: "#1a56db", fontWeight: "600" },
  listContent: { padding: "5%" },
  reminderBanner: { backgroundColor: "#fff7ed", borderWidth: 1, borderColor: "#fed7aa", borderRadius: 10, padding: 14, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  reminderIcon: { fontSize: 20 },
  reminderTitle: { fontSize: 13, fontWeight: "600", color: "#92400e" },
  reminderSub: { fontSize: 11, color: "#b45309", marginTop: 2 },
  logRow: { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#e5e7eb", flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  logLeft: { flex: 1, marginRight: 10 },
  logWeek: { fontSize: 14, fontWeight: "600", color: "#111827" },
  logDate: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  logCategory: { fontSize: 11, color: "#1a56db", marginTop: 3, textTransform: "capitalize" },
  commentBox: { backgroundColor: "#f0f4ff", borderRadius: 6, padding: 8, marginTop: 8, borderLeftWidth: 3, borderLeftColor: "#1a56db" },
  commentLabel: { fontSize: 10, fontWeight: "600", color: "#1a56db", marginBottom: 3 },
  commentText: { fontSize: 12, color: "#374151" },
  deleteLogBtn: { marginTop: 8, backgroundColor: "#fee2e2", borderRadius: 6, padding: 6, alignSelf: "flex-start" },
  deleteLogBtnText: { fontSize: 11, color: "#dc2626", fontWeight: "500" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start" },
  statusText: { fontSize: 10, fontWeight: "600" },
  emptyBox: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, color: "#6b7280", marginBottom: 8 },
  emptyLink: { fontSize: 13, color: "#1a56db", fontWeight: "500" },
  label: { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 14, color: "#111827" },
  textArea: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 14, color: "#111827", minHeight: 90, textAlignVertical: "top" },
  categoryScroll: { marginBottom: 14 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff", marginRight: 8 },
  categoryChipActive: { backgroundColor: "#1a56db", borderColor: "#1a56db" },
  categoryChipText: { fontSize: 12, color: "#6b7280", textTransform: "capitalize" },
  categoryChipTextActive: { color: "#fff", fontWeight: "500" },
  uploadBox: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#e5e7eb", borderStyle: "dashed", borderRadius: 10, padding: 20, alignItems: "center", marginBottom: 20 },
  uploadIcon: { fontSize: 28, marginBottom: 6 },
  uploadText: { fontSize: 13, fontWeight: "500", color: "#4b5563" },
  uploadSub: { fontSize: 11, color: "#9ca3af", marginTop: 3 },
  btn: { backgroundColor: "#1a56db", padding: 15, borderRadius: 10, alignItems: "center", marginBottom: 30 },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});

export default LogScreen;