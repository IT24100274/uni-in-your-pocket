import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createTicket, getStudentsList } from "../../services/api";

const CATEGORIES = ["academic", "administrative", "course_related", "facility", "it_support", "other"];
const PRIORITIES = ["low", "medium", "high"];

const RaiseTicketScreen = ({ navigation }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [attachment, setAttachment] = useState(null);
  const [raisedFor, setRaisedFor] = useState(null);
  const [students, setStudents] = useState([]);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    const userData = await AsyncStorage.getItem("user");
    const user = JSON.parse(userData);
    setUserRole(user.role);
    if (user.role === "student_representative") {
      fetchStudents();
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await getStudentsList();
      setStudents(res.data);
    } catch (error) {
      console.log("Could not load students list");
    }
  };

  const pickAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setAttachment(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Could not open file picker");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert("Missing field", "Please enter a title");
    if (!description.trim()) return Alert.alert("Missing field", "Please enter a description");
    if (!category) return Alert.alert("Missing field", "Please select a category");

    try {
      setSubmitting(true);

      // Always use FormData so multer can handle the optional file
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("category", category);
      formData.append("priority", priority);
      if (raisedFor) formData.append("raisedFor", raisedFor._id);
      if (attachment) {
        formData.append("attachment", {
          uri: attachment.uri,
          name: attachment.name,
          type: attachment.mimeType || "application/octet-stream",
        });
      }

      await createTicket(formData);
      Alert.alert("Success", "Your ticket has been raised successfully", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to raise ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Title */}
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Short summary of the issue"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        {/* Description */}
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the issue in detail..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        {/* Category picker */}
        <Text style={styles.label}>Category *</Text>
        <View style={styles.optionRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.optionBtn, category === cat && styles.optionBtnActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.optionText, category === cat && styles.optionTextActive]}>
                {cat.replace("_", " ")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Priority picker */}
        <Text style={styles.label}>Priority</Text>
        <View style={styles.priorityRow}>
          {PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.priorityBtn, priority === p && styles[`priority_${p}`]]}
              onPress={() => setPriority(p)}
            >
              <Text style={[styles.priorityBtnText, priority === p && styles.priorityBtnTextActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Attachment */}
        <Text style={styles.label}>Attachment (optional)</Text>
        <TouchableOpacity style={styles.attachBtn} onPress={pickAttachment}>
          <Text style={styles.attachBtnText}>
            {attachment ? `Attached: ${attachment.name}` : "Tap to attach image or PDF"}
          </Text>
        </TouchableOpacity>
        {attachment && (
          <TouchableOpacity onPress={() => setAttachment(null)}>
            <Text style={styles.removeText}>Remove attachment</Text>
          </TouchableOpacity>
        )}

        {/* Raise on behalf of — rep only */}
        {userRole === "student_representative" && (
          <>
            <Text style={styles.label}>Raise on behalf of (optional)</Text>
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setShowStudentPicker(!showStudentPicker)}
            >
              <Text style={styles.pickerBtnText}>
                {raisedFor ? raisedFor.name : "Select a student"}
              </Text>
            </TouchableOpacity>
            {showStudentPicker && (
              <View style={styles.dropdownList}>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => { setRaisedFor(null); setShowStudentPicker(false); }}>
                  <Text style={styles.dropdownItemText}>None (raising for myself)</Text>
                </TouchableOpacity>
                {students.map((s) => (
                  <TouchableOpacity
                    key={s._id}
                    style={styles.dropdownItem}
                    onPress={() => { setRaisedFor(s); setShowStudentPicker(false); }}
                  >
                    <Text style={styles.dropdownItemText}>{s.name}</Text>
                    <Text style={styles.dropdownItemSub}>{s.studentId || s.email}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>Submit Ticket</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: "4%" },
  label: { fontSize: 13, fontWeight: "bold", color: "#333", marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 8, padding: 12, fontSize: 14, color: "#333" },
  textArea: { height: 110, textAlignVertical: "top" },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6, borderWidth: 1, borderColor: "#ccc", backgroundColor: "#fff" },
  optionBtnActive: { backgroundColor: "#1a73e8", borderColor: "#1a73e8" },
  optionText: { fontSize: 12, color: "#555", textTransform: "capitalize" },
  optionTextActive: { color: "#fff", fontWeight: "bold" },
  priorityRow: { flexDirection: "row", gap: 10 },
  priorityBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#ccc", backgroundColor: "#fff", alignItems: "center" },
  priority_low: { backgroundColor: "#e6f4ea", borderColor: "#2e7d32" },
  priority_medium: { backgroundColor: "#fff3e0", borderColor: "#e65100" },
  priority_high: { backgroundColor: "#fce8e6", borderColor: "#c62828" },
  priorityBtnText: { fontSize: 13, color: "#555" },
  priorityBtnTextActive: { fontWeight: "bold" },
  attachBtn: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#1a73e8", borderStyle: "dashed", borderRadius: 8, padding: 14, alignItems: "center" },
  attachBtnText: { color: "#1a73e8", fontSize: 13 },
  removeText: { color: "#c62828", fontSize: 12, marginTop: 6, textAlign: "right" },
  pickerBtn: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 8, padding: 12 },
  pickerBtnText: { fontSize: 14, color: "#555" },
  dropdownList: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 8, marginTop: 4, maxHeight: 200 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  dropdownItemText: { fontSize: 14, color: "#333" },
  dropdownItemSub: { fontSize: 11, color: "#999", marginTop: 2 },
  submitBtn: { backgroundColor: "#1a73e8", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 24, marginBottom: 30 },
  submitBtnDisabled: { backgroundColor: "#aaa" },
  submitBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});

export default RaiseTicketScreen;