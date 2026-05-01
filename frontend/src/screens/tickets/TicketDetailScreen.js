import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Alert, TextInput, Linking, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getTicketById, respondToTicket, forwardTicket,
  closeTicket, deleteTicket, getStaffList,
} from "../../services/api";

const STATUS_STYLES = {
  open:        { backgroundColor: "#e8f0fe", color: "#1a73e8" },
  forwarded:   { backgroundColor: "#fff3e0", color: "#e65100" },
  in_progress: { backgroundColor: "#f3e5f5", color: "#7b1fa2" },
  resolved:    { backgroundColor: "#e6f4ea", color: "#2e7d32" },
  closed:      { backgroundColor: "#f0f0f0", color: "#555"    },
};

const PRIORITY_STYLES = {
  low:    { backgroundColor: "#e6f4ea", color: "#2e7d32" },
  medium: { backgroundColor: "#fff3e0", color: "#e65100" },
  high:   { backgroundColor: "#fce8e6", color: "#c62828" },
};

// Handles all Cloudinary URL cases:
// /raw/upload/  → PDF button
// /image/upload/...pdf → PDF button (old broken ticket before fix)
// /image/upload/...png → inline image
// /image/upload/no-ext → inline image
const isImageUrl = (url) => {
  if (!url) return false;
  if (url.includes("/image/upload/")) {
    const filename = url.split("/").pop().toLowerCase();
    if (filename.endsWith(".pdf")) return false;
    return true;
  }
  return false;
};

const getPdfDownloadUrl = (url) => {
  if (!url) return url;
  if (url.includes("/raw/upload/")) {
    return url.replace("/raw/upload/", "/raw/upload/fl_attachment/");
  }
  return url;
};

const TicketDetailScreen = ({ route, navigation }) => {
  const { ticketId } = route.params;
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");

  const [responseText, setResponseText] = useState("");
  const [responseStatus, setResponseStatus] = useState("in_progress");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [submittingForward, setSubmittingForward] = useState(false);

  useEffect(() => { loadUserAndTicket(); }, []);

  const loadUserAndTicket = async () => {
    const userData = await AsyncStorage.getItem("user");
    const user = JSON.parse(userData);
    // DEBUG_START
    console.log("[TicketDetail] Logged in as:", user.name, "| role:", user.role);
    // DEBUG_END
    setUserRole(user.role);
    setUserId(user._id);
    fetchTicket();
    if (user.role === "student_representative") fetchStaff();
  };

  const fetchTicket = async () => {
    try {
      // DEBUG_START
      console.log("[TicketDetail] Fetching ticket ID:", ticketId);
      // DEBUG_END
      const res = await getTicketById(ticketId);
      setTicket(res.data);
      // DEBUG_START
      console.log("[TicketDetail] Ticket loaded:", res.data.title, "| status:", res.data.status);
      console.log("[TicketDetail] attachmentUrl:", res.data.attachmentUrl);
      console.log("[TicketDetail] isImageUrl result:", isImageUrl(res.data.attachmentUrl));
      // DEBUG_END
      if (res.data.response) setResponseText(res.data.response);
    } catch (error) {
      // DEBUG_START
      console.log("[TicketDetail] ERROR fetching ticket:", error.response?.data?.message || error.message);
      // DEBUG_END
      Alert.alert("Error", error.response?.data?.message || "Could not load ticket");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await getStaffList();
      setStaffList(res.data);
      // DEBUG_START
      console.log("[TicketDetail] Staff list loaded:", res.data.length, "members");
      // DEBUG_END
    } catch (error) {
      // DEBUG_START
      console.log("[TicketDetail] ERROR fetching staff:", error.message);
      // DEBUG_END
    }
  };

  const handleRespond = async () => {
    if (!responseText.trim()) return Alert.alert("Missing field", "Please enter a response");
    try {
      setSubmittingResponse(true);
      // DEBUG_START
      console.log("[TicketDetail] Submitting response:", responseText.trim(), "| status:", responseStatus);
      // DEBUG_END
      await respondToTicket(ticketId, { response: responseText.trim(), status: responseStatus });
      Alert.alert("Success", "Response submitted");
      fetchTicket();
    } catch (error) {
      // DEBUG_START
      console.log("[TicketDetail] ERROR responding:", error.response?.data?.message || error.message);
      // DEBUG_END
      Alert.alert("Error", error.response?.data?.message || "Failed to submit response");
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleForward = async () => {
    if (!selectedStaff) return Alert.alert("Missing field", "Please select who to forward to");
    try {
      setSubmittingForward(true);
      // DEBUG_START
      console.log("[TicketDetail] Forwarding to:", selectedStaff.name, "| role:", selectedStaff.role);
      // DEBUG_END
      const res = await forwardTicket(ticketId, { forwardedTo: selectedStaff._id });
      Alert.alert("Success", res.data.message);
      setShowStaffPicker(false);
      fetchTicket();
    } catch (error) {
      // DEBUG_START
      console.log("[TicketDetail] ERROR forwarding:", error.response?.data?.message || error.message);
      // DEBUG_END
      Alert.alert("Error", error.response?.data?.message || "Failed to forward ticket");
    } finally {
      setSubmittingForward(false);
    }
  };

  const handleClose = () => {
    Alert.alert("Close Ticket", "Are you sure you want to close this ticket?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Close", style: "destructive", onPress: async () => {
          try {
            // DEBUG_START
            console.log("[TicketDetail] Closing ticket:", ticketId);
            // DEBUG_END
            await closeTicket(ticketId);
            Alert.alert("Closed", "Ticket has been closed", [
              { text: "OK", onPress: () => navigation.goBack() },
            ]);
          } catch (error) {
            // DEBUG_START
            console.log("[TicketDetail] ERROR closing:", error.response?.data?.message || error.message);
            // DEBUG_END
            Alert.alert("Error", error.response?.data?.message || "Failed to close ticket");
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert("Delete Ticket", "This cannot be undone. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            // DEBUG_START
            console.log("[TicketDetail] Deleting ticket:", ticketId);
            // DEBUG_END
            await deleteTicket(ticketId);
            Alert.alert("Deleted", "Ticket has been deleted", [
              { text: "OK", onPress: () => navigation.goBack() },
            ]);
          } catch (error) {
            // DEBUG_START
            console.log("[TicketDetail] ERROR deleting:", error.response?.data?.message || error.message);
            // DEBUG_END
            Alert.alert("Error", error.response?.data?.message || "Failed to delete ticket");
          }
        },
      },
    ]);
  };

  const isPrivileged = ["admin", "student_representative", "lecturer"].includes(userRole);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1a73e8" /></View>;
  }
  if (!ticket) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: "#555" }}>Ticket not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Title + badges */}
        <View style={styles.card}>
          <Text style={styles.title}>{ticket.title}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, STATUS_STYLES[ticket.status]]}>
              <Text style={[styles.badgeText, { color: STATUS_STYLES[ticket.status]?.color }]}>
                {ticket.status.replace("_", " ")}
              </Text>
            </View>
            <View style={[styles.badge, PRIORITY_STYLES[ticket.priority]]}>
              <Text style={[styles.badgeText, { color: PRIORITY_STYLES[ticket.priority]?.color }]}>
                {ticket.priority} priority
              </Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{ticket.category.replace("_", " ")}</Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Details</Text>
          <Text style={styles.description}>{ticket.description}</Text>
          <Text style={styles.meta}>Raised by: <Text style={styles.metaVal}>{ticket.raisedBy?.name}</Text></Text>
          {ticket.raisedFor && (
            <Text style={styles.meta}>On behalf of: <Text style={[styles.metaVal, { color: "#7b1fa2" }]}>{ticket.raisedFor.name}</Text></Text>
          )}
          <Text style={styles.meta}>Date: <Text style={styles.metaVal}>{new Date(ticket.createdAt).toLocaleString()}</Text></Text>
          {ticket.forwardedTo && (
            <Text style={styles.meta}>Forwarded to: <Text style={[styles.metaVal, { color: "#e65100" }]}>{ticket.forwardedTo.name} ({ticket.forwardedTo.role})</Text></Text>
          )}
        </View>

        {/* Attachment — image shown inline, PDF opens in browser */}
        {ticket.attachmentUrl && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Attachment</Text>
            {isImageUrl(ticket.attachmentUrl) ? (
              <Image
                source={{ uri: ticket.attachmentUrl }}
                style={styles.inlineImage}
                resizeMode="contain"
              />
            ) : (
              <TouchableOpacity
                style={styles.pdfBtn}
                onPress={() => {
                  // DEBUG_START
                  console.log("[TicketDetail] Opening PDF URL:", getPdfDownloadUrl(ticket.attachmentUrl));
                  // DEBUG_END
                  Linking.openURL(getPdfDownloadUrl(ticket.attachmentUrl));
                }}
              >
                <Text style={styles.pdfBtnIcon}>📄</Text>
                <Text style={styles.pdfBtnText}>View PDF attachment</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Response card */}
        {ticket.response && (
          <View style={styles.responseCard}>
            <Text style={styles.sectionTitle}>Response</Text>
            <Text style={styles.responseText}>{ticket.response}</Text>
            <Text style={styles.meta}>By: <Text style={styles.metaVal}>{ticket.respondedBy?.name} ({ticket.respondedBy?.role})</Text></Text>
            <Text style={styles.meta}>At: <Text style={styles.metaVal}>{new Date(ticket.respondedAt).toLocaleString()}</Text></Text>
          </View>
        )}

        {/* Respond form — admin, rep, lecturer */}
        {isPrivileged && ticket.status !== "closed" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{ticket.response ? "Update Response" : "Add Response"}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Type your response here..."
              value={responseText}
              onChangeText={setResponseText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.label}>Set status</Text>
            <View style={styles.statusRow}>
              {["in_progress", "resolved"].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusBtn, responseStatus === s && styles.statusBtnActive]}
                  onPress={() => setResponseStatus(s)}
                >
                  <Text style={[styles.statusBtnText, responseStatus === s && styles.statusBtnTextActive]}>
                    {s.replace("_", " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, styles.respondBtn, submittingResponse && styles.btnDisabled]}
              onPress={handleRespond}
              disabled={submittingResponse}
            >
              {submittingResponse
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.actionBtnText}>Submit Response</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Forward form — rep only */}
        {userRole === "student_representative" && ticket.status !== "closed" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Forward Ticket</Text>
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setShowStaffPicker(!showStaffPicker)}
            >
              <Text style={styles.pickerBtnText}>
                {selectedStaff ? `${selectedStaff.name} (${selectedStaff.role})` : "Select lecturer or admin"}
              </Text>
            </TouchableOpacity>
            {showStaffPicker && (
              <View style={styles.dropdownList}>
                {staffList.map((s) => (
                  <TouchableOpacity
                    key={s._id}
                    style={styles.dropdownItem}
                    onPress={() => { setSelectedStaff(s); setShowStaffPicker(false); }}
                  >
                    <Text style={styles.dropdownItemText}>{s.name}</Text>
                    <Text style={styles.dropdownItemSub}>{s.role}{s.department ? ` · ${s.department}` : ""}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, styles.forwardBtn, submittingForward && styles.btnDisabled]}
              onPress={handleForward}
              disabled={submittingForward}
            >
              {submittingForward
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.actionBtnText}>Forward Ticket</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Close button */}
        {ticket.status !== "closed" && (
          <TouchableOpacity style={[styles.actionBtn, styles.closeBtn]} onPress={handleClose}>
            <Text style={styles.actionBtnText}>Close Ticket</Text>
          </TouchableOpacity>
        )}

        {/* Delete button — admin only */}
        {userRole === "admin" && (
          <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDelete}>
            <Text style={styles.actionBtnText}>Delete Ticket</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: "4%" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  backBtn: { marginTop: 16, backgroundColor: "#1a73e8", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  backBtnText: { color: "#fff", fontWeight: "bold" },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: "4%", marginBottom: "3%", borderWidth: 1, borderColor: "#e0e0e0" },
  responseCard: { backgroundColor: "#f0f7ff", borderRadius: 10, padding: "4%", marginBottom: "3%", borderWidth: 1, borderColor: "#b3d1f7" },
  title: { fontSize: 17, fontWeight: "bold", color: "#333", marginBottom: 10 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: "bold", textTransform: "capitalize" },
  categoryBadge: { backgroundColor: "#f0f0f0", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  categoryText: { fontSize: 12, color: "#555", textTransform: "capitalize" },
  sectionTitle: { fontSize: 13, fontWeight: "bold", color: "#555", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  description: { fontSize: 14, color: "#333", lineHeight: 22, marginBottom: 12 },
  meta: { fontSize: 13, color: "#888", marginBottom: 4 },
  metaVal: { color: "#333", fontWeight: "bold" },
  inlineImage: { width: "100%", height: 220, borderRadius: 8, backgroundColor: "#f0f0f0" },
  pdfBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#fce8e6", padding: 14, borderRadius: 8, gap: 10 },
  pdfBtnIcon: { fontSize: 20 },
  pdfBtnText: { color: "#c62828", fontWeight: "bold", fontSize: 13 },
  responseText: { fontSize: 14, color: "#333", lineHeight: 22, marginBottom: 10 },
  input: { backgroundColor: "#f9f9f9", borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 8, padding: 12, fontSize: 14, color: "#333" },
  textArea: { height: 100, textAlignVertical: "top" },
  label: { fontSize: 13, fontWeight: "bold", color: "#555", marginTop: 12, marginBottom: 6 },
  statusRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  statusBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "#ccc", backgroundColor: "#fff", alignItems: "center" },
  statusBtnActive: { backgroundColor: "#1a73e8", borderColor: "#1a73e8" },
  statusBtnText: { fontSize: 13, color: "#555", textTransform: "capitalize" },
  statusBtnTextActive: { color: "#fff", fontWeight: "bold" },
  pickerBtn: { backgroundColor: "#f9f9f9", borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 8, padding: 12, marginBottom: 6 },
  pickerBtnText: { fontSize: 14, color: "#555" },
  dropdownList: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 8, marginBottom: 10 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  dropdownItemText: { fontSize: 14, color: "#333" },
  dropdownItemSub: { fontSize: 11, color: "#999", marginTop: 2, textTransform: "capitalize" },
  actionBtn: { padding: 14, borderRadius: 8, alignItems: "center", marginBottom: 10 },
  respondBtn: { backgroundColor: "#1a73e8" },
  forwardBtn: { backgroundColor: "#e65100" },
  closeBtn: { backgroundColor: "#7b1fa2" },
  deleteBtn: { backgroundColor: "#c62828" },
  btnDisabled: { backgroundColor: "#aaa" },
  actionBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});

export default TicketDetailScreen;