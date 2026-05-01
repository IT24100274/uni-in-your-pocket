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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import api from "../../services/api";

const ALL_ROLES       = ["student", "lecturer", "admin", "student_representative"];
const ALL_DEPARTMENTS = ["IT", "Engineering", "Business", "Science", "Arts"];

const CreateNoticeScreen = ({ route, navigation }) => {
  // If a notice is passed via params we are in edit mode
  const editingNotice = route.params?.notice || null;
  const isEditing     = !!editingNotice;

  const [title,             setTitle]             = useState(editingNotice?.title || "");
  const [content,           setContent]           = useState(editingNotice?.content || "");
  const [type,              setType]              = useState(editingNotice?.type || "notice");
  const [eventDate,         setEventDate]         = useState(
    editingNotice?.eventDate
      ? new Date(editingNotice.eventDate).toISOString().split("T")[0]
      : ""
  );
  const [eventLocation,     setEventLocation]     = useState(editingNotice?.eventLocation || "");
  const [targetRoles,       setTargetRoles]       = useState(editingNotice?.targetRoles || []);
  const [targetDepartments, setTargetDepartments] = useState(editingNotice?.targetDepartments || []);
  const [attachments,       setAttachments]       = useState([]); // new files to upload
  const [loading,           setLoading]           = useState(false);

  // ── Chip toggles ────────────────────────────────────────────
  const toggleRole = (role) =>
    setTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );

  const toggleDept = (dept) =>
    setTargetDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );

  // ── File pickers ─────────────────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return Alert.alert("Permission required", "Allow access to your photo library.");
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setAttachments((prev) => [
        ...prev,
        ...result.assets.map((a) => ({
          uri:  a.uri,
          name: a.fileName || `image_${Date.now()}.jpg`,
          type: "image/jpeg",
        })),
      ]);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type:     "application/pdf",
      multiple: true,
    });
    if (!result.canceled) {
      setAttachments((prev) => [
        ...prev,
        ...result.assets.map((a) => ({
          uri:  a.uri,
          name: a.name,
          type: "application/pdf",
        })),
      ]);
    }
  };

  const removeAttachment = (index) =>
    setAttachments((prev) => prev.filter((_, i) => i !== index));

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      return Alert.alert("Validation", "Title and content are required.");
    }
    if (type === "event" && !eventDate.trim()) {
      return Alert.alert("Validation", "Please enter the event date (YYYY-MM-DD).");
    }

    // Build FormData so files can be sent alongside text fields
    const formData = new FormData();
    formData.append("title",   title.trim());
    formData.append("content", content.trim());
    formData.append("type",    type);
    formData.append("targetRoles",       JSON.stringify(targetRoles));
    formData.append("targetDepartments", JSON.stringify(targetDepartments));
    if (type === "event") {
      formData.append("eventDate",     eventDate);
      formData.append("eventLocation", eventLocation);
    }
    attachments.forEach((file) => {
      formData.append("attachments", {
        uri:  file.uri,
        name: file.name,
        type: file.type,
      });
    });

    const config = { headers: { "Content-Type": "multipart/form-data" } };

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/notices/${editingNotice._id}`, formData, config);
        Alert.alert("Success", "Notice updated successfully.");
      } else {
        await api.post("/notices", formData, config);
        Alert.alert("Success", "Notice published successfully.");
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ── UI ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>
          {isEditing ? "Edit Notice" : "New Notice / Event"}
        </Text>

        {/* Type toggle */}
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeBtn, type === "notice" && styles.typeBtnActiveNotice]}
            onPress={() => setType("notice")}
          >
            <Ionicons name="megaphone-outline" size={16} color={type === "notice" ? "#fff" : "#555"} />
            <Text style={[styles.typeBtnText, type === "notice" && styles.typeBtnTextActive]}>
              Notice
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === "event" && styles.typeBtnActiveEvent]}
            onPress={() => setType("event")}
          >
            <Ionicons name="calendar-outline" size={16} color={type === "event" ? "#fff" : "#555"} />
            <Text style={[styles.typeBtnText, type === "event" && styles.typeBtnTextActive]}>
              Event
            </Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter title"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor="#aaa"
        />

        {/* Content */}
        <Text style={styles.label}>Content *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter notice content..."
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          placeholderTextColor="#aaa"
        />

        {/* Event-only fields */}
        {type === "event" && (
          <>
            <Text style={styles.label}>Event Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2025-08-15"
              value={eventDate}
              onChangeText={setEventDate}
              placeholderTextColor="#aaa"
            />
            <Text style={styles.label}>Event Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Main Auditorium"
              value={eventLocation}
              onChangeText={setEventLocation}
              placeholderTextColor="#aaa"
            />
          </>
        )}

        {/* Target Roles */}
        <Text style={styles.label}>Target Roles (leave empty for all)</Text>
        <View style={styles.chipRow}>
          {ALL_ROLES.map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.chip, targetRoles.includes(role) && styles.chipActive]}
              onPress={() => toggleRole(role)}
            >
              <Text style={[styles.chipText, targetRoles.includes(role) && styles.chipTextActive]}>
                {role}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Target Departments */}
        <Text style={styles.label}>Target Departments (leave empty for all)</Text>
        <View style={styles.chipRow}>
          {ALL_DEPARTMENTS.map((dept) => (
            <TouchableOpacity
              key={dept}
              style={[styles.chip, targetDepartments.includes(dept) && styles.chipActive]}
              onPress={() => toggleDept(dept)}
            >
              <Text style={[styles.chipText, targetDepartments.includes(dept) && styles.chipTextActive]}>
                {dept}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Attachments */}
        <Text style={styles.label}>Attachments (optional)</Text>
        <View style={styles.attachRow}>
          <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
            <Ionicons name="image-outline" size={18} color="#1a73e8" />
            <Text style={styles.attachBtnText}>Add Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachBtn} onPress={pickDocument}>
            <Ionicons name="document-outline" size={18} color="#1a73e8" />
            <Text style={styles.attachBtnText}>Add PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Preview selected attachments */}
        {attachments.map((file, index) => (
          <View key={index} style={styles.attachedFile}>
            {file.type === "image/jpeg" || file.type?.startsWith("image") ? (
              <Image source={{ uri: file.uri }} style={styles.thumbPreview} />
            ) : (
              <Ionicons name="document-text-outline" size={22} color="#e53935" />
            )}
            <Text style={styles.attachedFileName} numberOfLines={1}>{file.name}</Text>
            <TouchableOpacity onPress={() => removeAttachment(index)}>
              <Ionicons name="close-circle" size={20} color="#e53935" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name={isEditing ? "save-outline" : "send-outline"} size={18} color="#fff" />
              <Text style={styles.submitText}>{isEditing ? "Update" : "Publish"}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: "#f5f5f5" },
  content:             { padding: 16 },
  heading:             { fontSize: 22, fontWeight: "800", color: "#222", marginBottom: 20 },
  label:               { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6, marginTop: 14 },
  input:               { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1,
                         borderColor: "#ddd", paddingHorizontal: 14, paddingVertical: 11,
                         fontSize: 14, color: "#333" },
  textArea:            { minHeight: 110 },
  typeRow:             { flexDirection: "row", gap: 12 },
  typeBtn:             { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                         gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5,
                         borderColor: "#ddd", backgroundColor: "#fff" },
  typeBtnActiveNotice: { backgroundColor: "#1a73e8", borderColor: "#1a73e8" },
  typeBtnActiveEvent:  { backgroundColor: "#e67e22", borderColor: "#e67e22" },
  typeBtnText:         { fontSize: 14, fontWeight: "600", color: "#555" },
  typeBtnTextActive:   { color: "#fff" },
  chipRow:             { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip:                { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                         borderWidth: 1.5, borderColor: "#ccc", backgroundColor: "#fff" },
  chipActive:          { backgroundColor: "#1a73e8", borderColor: "#1a73e8" },
  chipText:            { fontSize: 13, color: "#555", fontWeight: "500" },
  chipTextActive:      { color: "#fff", fontWeight: "700" },
  attachRow:           { flexDirection: "row", gap: 12, marginTop: 4 },
  attachBtn:           { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
                         gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5,
                         borderColor: "#1a73e8", backgroundColor: "#e8f0fe" },
  attachBtnText:       { color: "#1a73e8", fontWeight: "600", fontSize: 13 },
  attachedFile:        { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff",
                         borderRadius: 8, padding: 10, marginTop: 8,
                         borderWidth: 1, borderColor: "#ddd" },
  thumbPreview:        { width: 36, height: 36, borderRadius: 6 },
  attachedFileName:    { flex: 1, fontSize: 13, color: "#333" },
  submitBtn:           { flexDirection: "row", alignItems: "center", justifyContent: "center",
                         gap: 8, backgroundColor: "#1a73e8", paddingVertical: 14,
                         borderRadius: 12, marginTop: 28 },
  submitText:          { color: "#fff", fontSize: 16, fontWeight: "700" },
});

export default CreateNoticeScreen;