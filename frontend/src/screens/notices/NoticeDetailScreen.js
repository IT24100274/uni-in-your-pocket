import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  Linking,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import api from "../../services/api";

const NoticeDetailScreen = ({ route, navigation }) => {
  const { noticeId } = route.params;
  const [notice, setNotice]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId]     = useState(null);
  const [pdfUrl, setPdfUrl]     = useState(null); // controls PDF modal

  useEffect(() => {
    loadUserAndNotice();
  }, []);

  const loadUserAndNotice = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      const user = JSON.parse(userData);
      setUserRole(user.role);
      setUserId(user._id);

      const response = await api.get(`/notices/${noticeId}`);
      setNotice(response.data);
    } catch (error) {
      Alert.alert("Error", "Could not load notice.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete", "Are you sure you want to delete this notice?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/notices/${noticeId}`);
            Alert.alert("Success", "Notice deleted.");
            navigation.goBack();
          } catch (error) {
            Alert.alert("Error", "Could not delete notice.");
          }
        },
      },
    ]);
  };

  // PDFs open inside the app via WebView + Google Docs viewer
  // Images open directly in browser via Linking
  const openAttachment = (url, fileType) => {
    if (!url) {
      Alert.alert("Error", "No file available.");
      return;
    }
    if (fileType === "pdf") {
      // Wrap with Google Docs viewer so WebView can render it
      const viewerUrl =
        "https://docs.google.com/gview?embedded=true&url=" +
        encodeURIComponent(url);
      setPdfUrl(viewerUrl);
    } else {
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  if (!notice) return null;

  const isCreator = notice.createdBy?._id === userId;
  const canEdit   = userRole === "admin" || isCreator;
  const isEvent   = notice.type === "event";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Type badge */}
        <View style={[styles.badge, isEvent ? styles.badgeEvent : styles.badgeNotice]}>
          <Ionicons
            name={isEvent ? "calendar-outline" : "megaphone-outline"}
            size={14}
            color="#fff"
          />
          <Text style={styles.badgeText}>{isEvent ? "Event" : "Notice"}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{notice.title}</Text>

        {/* Meta */}
        <View style={styles.metaRow}>
          <Ionicons name="person-outline" size={14} color="#888" />
          <Text style={styles.metaText}>
            {notice.createdBy?.name || "Unknown"} ({notice.createdBy?.role})
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color="#888" />
          <Text style={styles.metaText}>
            {new Date(notice.createdAt).toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </Text>
        </View>

        {/* Event details */}
        {isEvent && (
          <View style={styles.eventBox}>
            <Text style={styles.eventBoxTitle}>Event Details</Text>
            {notice.eventDate && (
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={14} color="#e67e22" />
                <Text style={styles.metaText}>
                  {new Date(notice.eventDate).toLocaleDateString("en-US", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                  })}
                </Text>
              </View>
            )}
            {notice.eventLocation && (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color="#e67e22" />
                <Text style={styles.metaText}>{notice.eventLocation}</Text>
              </View>
            )}
          </View>
        )}

        {/* Audience */}
        <View style={styles.audienceBox}>
          <Text style={styles.audienceTitle}>Audience</Text>
          <Text style={styles.audienceText}>
            Roles:{" "}
            {notice.targetRoles?.length > 0
              ? notice.targetRoles.join(", ")
              : "All roles"}
          </Text>
          <Text style={styles.audienceText}>
            Departments:{" "}
            {notice.targetDepartments?.length > 0
              ? notice.targetDepartments.join(", ")
              : "All departments"}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.contentBox}>
          <Text style={styles.contentText}>{notice.content}</Text>
        </View>

        {/* Attachments */}
        {notice.attachments && notice.attachments.length > 0 && (
          <View style={styles.attachmentsBox}>
            <Text style={styles.attachmentsTitle}>Attachments</Text>

            {notice.attachments.map((file, index) => (
              <View key={index}>
                {file.fileType === "image" ? (
                  // Show image inline, tap to open full size
                  <TouchableOpacity onPress={() => openAttachment(file.url, "image")}>
                    <Image
                      source={{ uri: file.url }}
                      style={styles.attachedImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.attachedImageLabel}>{file.originalName}</Text>
                  </TouchableOpacity>
                ) : (
                  // Show PDF as tappable row — opens inside WebView
                  <TouchableOpacity
                    style={styles.pdfRow}
                    onPress={() => openAttachment(file.url, "pdf")}
                  >
                    <Ionicons name="document-text-outline" size={22} color="#e53935" />
                    <Text style={styles.pdfName} numberOfLines={1}>
                      {file.originalName}
                    </Text>
                    <Ionicons name="open-outline" size={18} color="#1a73e8" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Edit / Delete actions */}
        {canEdit && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate("CreateNotice", { notice })}
            >
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── PDF Viewer Modal ── */}
      <Modal
        visible={!!pdfUrl}
        animationType="slide"
        onRequestClose={() => setPdfUrl(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          {/* Close bar */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setPdfUrl(null)}
          >
            <Ionicons name="close" size={24} color="#333" />
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>

          {/* Google Docs viewer renders the PDF inside WebView */}
          <WebView
            source={{ uri: pdfUrl }}
            style={{ flex: 1 }}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#1a73e8" />
                <Text style={{ marginTop: 10, color: "#666" }}>Loading PDF...</Text>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: "#f5f5f5" },
  centered:           { flex: 1, justifyContent: "center", alignItems: "center" },
  content:            { padding: 16 },
  badge:              { flexDirection: "row", alignItems: "center", alignSelf: "flex-start",
                        paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
                        gap: 6, marginBottom: 12 },
  badgeNotice:        { backgroundColor: "#1a73e8" },
  badgeEvent:         { backgroundColor: "#e67e22" },
  badgeText:          { color: "#fff", fontWeight: "700", fontSize: 13 },
  title:              { fontSize: 22, fontWeight: "800", color: "#222",
                        marginBottom: 14, lineHeight: 30 },
  metaRow:            { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  metaText:           { fontSize: 13, color: "#666" },
  eventBox:           { backgroundColor: "#fff8f0", borderLeftWidth: 4,
                        borderLeftColor: "#e67e22", borderRadius: 8, padding: 12,
                        marginTop: 14, marginBottom: 4 },
  eventBoxTitle:      { fontSize: 13, fontWeight: "700", color: "#e67e22", marginBottom: 8 },
  audienceBox:        { backgroundColor: "#e8f0fe", borderRadius: 8, padding: 12, marginTop: 14 },
  audienceTitle:      { fontSize: 13, fontWeight: "700", color: "#1a73e8", marginBottom: 6 },
  audienceText:       { fontSize: 13, color: "#444", marginBottom: 2 },
  contentBox:         { backgroundColor: "#fff", borderRadius: 10, padding: 16, marginTop: 14,
                        shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  contentText:        { fontSize: 15, color: "#333", lineHeight: 24 },
  attachmentsBox:     { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginTop: 14,
                        shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  attachmentsTitle:   { fontSize: 14, fontWeight: "700", color: "#333", marginBottom: 12 },
  attachedImage:      { width: "100%", height: 200, borderRadius: 8, marginBottom: 4 },
  attachedImageLabel: { fontSize: 12, color: "#888", marginBottom: 12, textAlign: "center" },
  pdfRow:             { flexDirection: "row", alignItems: "center", gap: 10, padding: 12,
                        backgroundColor: "#fef2f2", borderRadius: 8, marginBottom: 8,
                        borderWidth: 1, borderColor: "#fecaca" },
  pdfName:            { flex: 1, fontSize: 13, color: "#333", fontWeight: "500" },
  actions:            { flexDirection: "row", gap: 12, marginTop: 24 },
  editBtn:            { flex: 1, flexDirection: "row", alignItems: "center",
                        justifyContent: "center", backgroundColor: "#1a73e8",
                        paddingVertical: 12, borderRadius: 10, gap: 6 },
  deleteBtn:          { flex: 1, flexDirection: "row", alignItems: "center",
                        justifyContent: "center", backgroundColor: "#e53935",
                        paddingVertical: 12, borderRadius: 10, gap: 6 },
  btnText:            { color: "#fff", fontWeight: "700", fontSize: 15 },
  closeBtn:           { flexDirection: "row", alignItems: "center", gap: 8,
                        padding: 14, borderBottomWidth: 1, borderBottomColor: "#eee" },
  closeBtnText:       { fontSize: 16, fontWeight: "600", color: "#333" },
});

export default NoticeDetailScreen;