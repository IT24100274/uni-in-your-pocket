import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, FlatList, Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

/*
 * ReviewScreen — Lecturer + Admin
 * This screen serves two roles in the Internship Tracker module.
 * Lecturers can view all student weekly logs, filter by status, approve or reject
 * individual logs, and leave comments that students can see in their log history.
 * Admins can view all placements, verify them, view company letters, and see
 * a risk flag summary showing students with missing logs or missing company letters.
 * Admins can also search all lecturers and assign/remove them as supervisors.
 * The screen automatically switches view based on the logged-in user's role.
 */

const ReviewScreen = ({ navigation, route }) => {
  const [userRole, setUserRole] = useState(null);
  const [logs, setLogs] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [risks, setRisks] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [activeTab, setActiveTab] = useState("logs");
  const [filterStatus, setFilterStatus] = useState("all");

  // ── NEW STATES ──────────────────────────────────────────────────────────────
  const [lecturers, setLecturers] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [assigningId, setAssigningId] = useState(null);
  // ────────────────────────────────────────────────────────────────────────────

  const fetchData = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem("user");
      const user = JSON.parse(userData);
      const role = user.role;
      setUserRole(role);

      if (role === "lecturer" || role === "admin") {
        const logsRes = await api.get("/internship/logs/all");
        setLogs(logsRes.data.logs);
      }

      if (role === "admin") {
        const placementsRes = await api.get("/internship/admin/all");
        setPlacements(placementsRes.data.internships || []);
        const risksRes = await api.get("/internship/admin/risks");
        setRisks(risksRes.data.riskList);

        // ── NEW: fetch lecturers & supervisors ────────────────────────────────
        const lecsRes = await api.get("/internship/lecturers");
        setLecturers(lecsRes.data.lecturers || []);
        const supsRes = await api.get("/internship/supervisors");
        setSupervisors(supsRes.data.supervisors || []);
        // ─────────────────────────────────────────────────────────────────────
      }

      if (route?.params?.logId && route?.params?.mode === "detail") {
        const logRes = await api.get(`/internship/logs/${route.params.logId}`);
        setSelectedLog(logRes.data.log);
      } else {
        setSelectedLog(null);
      }
    } catch (error) {
      Alert.alert("Error", "Could not load data");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const handleReview = async (logId, status) => {
    setReviewing(true);
    try {
      await api.patch(`/internship/logs/${logId}/review`, { status, lecturerComment: comment });
      Alert.alert("Success", `Log ${status} successfully`);
      setSelectedLog(null);
      setComment("");
      fetchData();
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Something went wrong");
    } finally {
      setReviewing(false);
    }
  };

  const handleVerify = async (placementId) => {
    try {
      await api.patch(`/internship/${placementId}/verify`);
      Alert.alert("Success", "Placement verified successfully");
      fetchData();
    } catch (error) {
      Alert.alert("Error", "Could not verify placement");
    }
  };

  const handleDeletePlacement = async (placementId) => {
    Alert.alert(
      "Confirm delete",
      "Delete this placement and all related internship data?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/internship/${placementId}`);
              Alert.alert("Deleted", "Placement has been removed.");
              fetchData();
            } catch (error) {
              Alert.alert("Error", error.response?.data?.message || "Could not delete placement");
            }
          },
        },
      ]
    );
  };

  const handleAssignSupervisor = async (lecturerId) => {
    setAssigningId(lecturerId);
    try {
      await api.post(`/internship/supervisors/${lecturerId}`);
      const supsRes = await api.get("/internship/supervisors");
      setSupervisors(supsRes.data.supervisors || []);
      Alert.alert("Success", "Supervisor assigned successfully");
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Could not assign supervisor");
    } finally {
      setAssigningId(null);
    }
  };

  const handleRemoveSupervisor = async (lecturerId) => {
    setAssigningId(lecturerId);
    try {
      await api.delete(`/internship/supervisors/${lecturerId}`);
      const supsRes = await api.get("/internship/supervisors");
      setSupervisors(supsRes.data.supervisors || []);
      Alert.alert("Success", "Supervisor removed");
    } catch (error) {
      Alert.alert("Error", "Could not remove supervisor");
    } finally {
      setAssigningId(null);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────────

  const getStatusColor = (status) => {
    const colors = { approved: "#059669", rejected: "#dc2626", pending: "#d97706", active: "#059669" };
    return colors[status] || "#6b7280";
  };

  const getStatusBg = (status) => {
    const colors = { approved: "#d1fae5", rejected: "#fee2e2", pending: "#fef3c7", active: "#d1fae5" };
    return colors[status] || "#f3f4f6";
  };

  const isPdfUrl = (url) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith(".pdf") || lower.includes("/raw/upload/");
  };

  const getPdfViewUrl = (url) => {
    if (!url) return url;
    return `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(url)}`;
  };

  const openAttachment = async (url) => {
    if (!url) return;
    try {
      const target = isPdfUrl(url) ? getPdfViewUrl(url) : url;
      const canOpen = await Linking.canOpenURL(target);
      if (canOpen) {
        await Linking.openURL(target);
      } else {
        Alert.alert("Unable to open file", "Your device cannot open this attachment.");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to open attachment.");
    }
  };

  const filteredLogs = filterStatus === "all" ? logs : logs.filter(l => l.status === filterStatus);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1a56db" /></View>;
  }

  // ── Log detail view ──────────────────────────────────────────────────────────
  if (selectedLog) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedLog(null)}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Log Detail</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Week {selectedLog.weekNumber}</Text>
          <Text style={styles.fieldLabel}>Date</Text>
          <Text style={styles.fieldValue}>{new Date(selectedLog.logDate).toDateString()}</Text>
          <Text style={styles.fieldLabel}>Category</Text>
          <Text style={[styles.fieldValue, { textTransform: "capitalize" }]}>{selectedLog.category}</Text>
          <Text style={styles.fieldLabel}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusBg(selectedLog.status) }]}>
            <Text style={[styles.statusText, { color: getStatusColor(selectedLog.status) }]}>
              {selectedLog.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Log Description</Text>
          <Text style={styles.fieldValue}>{selectedLog.logDescription}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tasks Completed</Text>
          <Text style={styles.fieldValue}>{selectedLog.tasksCompleted}</Text>
        </View>

        {selectedLog.evidenceUrl ? (
          <TouchableOpacity style={styles.evidenceBtn} onPress={() => openAttachment(selectedLog.evidenceUrl)}>
            <Text style={styles.evidenceBtnText}>📎 View Uploaded Evidence</Text>
          </TouchableOpacity>
        ) : null}

        {selectedLog.lecturerComment ? (
          <View style={styles.commentCard}>
            <Text style={styles.commentLabel}>💬 Lecturer Comment</Text>
            <Text style={styles.commentText}>{selectedLog.lecturerComment}</Text>
            {selectedLog.reviewedAt && (
              <Text style={styles.commentDate}>
                Reviewed: {new Date(selectedLog.reviewedAt).toDateString()}
              </Text>
            )}
          </View>
        ) : null}

        {(userRole === "lecturer" || userRole === "admin") && selectedLog.status === "pending" ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Review This Log</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Add a comment for the student (optional)..."
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: "#059669", flex: 1, marginRight: 8 }]}
                onPress={() => handleReview(selectedLog._id, "approved")}
                disabled={reviewing}
              >
                {reviewing ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>✓ Approve</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: "#dc2626", flex: 1 }]}
                onPress={() => handleReview(selectedLog._id, "rejected")}
                disabled={reviewing}
              >
                {reviewing ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>✕ Reject</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>
    );
  }

  // ── Lecturer view ────────────────────────────────────────────────────────────
  if (userRole === "lecturer") {
    return (
      <View style={styles.container}>
        <View style={styles.filterBar}>
          {["all", "pending", "approved", "rejected"].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filterStatus === f && styles.filterChipActive]}
              onPress={() => setFilterStatus(f)}
            >
              <Text style={[styles.filterChipText, filterStatus === f && styles.filterChipTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No logs found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewName}>{item.studentId?.name} — Week {item.weekNumber}</Text>
                  <Text style={styles.reviewMeta}>{item.studentId?.studentId} · {new Date(item.logDate).toDateString()}</Text>
                  <Text style={styles.reviewCompany}>{item.internshipId?.companyName}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.reviewBody} numberOfLines={3}>{item.logDescription}</Text>

              {item.evidenceUrl ? (
                <TouchableOpacity onPress={() => openAttachment(item.evidenceUrl)}>
                  <Text style={styles.evidenceLink}>📎 View Evidence</Text>
                </TouchableOpacity>
              ) : null}

              {item.status === "pending" ? (
                <>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Add a comment (optional)..."
                    onChangeText={setComment}
                    multiline
                  />
                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: "#059669", flex: 1, marginRight: 6 }]}
                      onPress={() => handleReview(item._id, "approved")}
                    >
                      <Text style={styles.btnText}>✓ Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: "#dc2626", flex: 1 }]}
                      onPress={() => handleReview(item._id, "rejected")}
                    >
                      <Text style={styles.btnText}>✕ Reject</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}
            </View>
          )}
        />
      </View>
    );
  }

  // ── Admin view ───────────────────────────────────────────────────────────────
  if (userRole === "admin") {
    return (
      <View style={styles.container}>
        {/* Tab Bar — now includes Supervisors tab */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "logs" && styles.tabActive]}
            onPress={() => setActiveTab("logs")}
          >
            <Text style={[styles.tabText, activeTab === "logs" && styles.tabTextActive]}>All Logs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "placements" && styles.tabActive]}
            onPress={() => setActiveTab("placements")}
          >
            <Text style={[styles.tabText, activeTab === "placements" && styles.tabTextActive]}>Placements</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "risks" && styles.tabActive]}
            onPress={() => setActiveTab("risks")}
          >
            <Text style={[styles.tabText, activeTab === "risks" && styles.tabTextActive]}>
              Risk Flags {risks.length > 0 ? `(${risks.length})` : ""}
            </Text>
          </TouchableOpacity>
          {/* ── NEW TAB ── */}
          <TouchableOpacity
            style={[styles.tab, activeTab === "supervisors" && styles.tabActive]}
            onPress={() => setActiveTab("supervisors")}
          >
            <Text style={[styles.tabText, activeTab === "supervisors" && styles.tabTextActive]}>
              Supervisors
            </Text>
          </TouchableOpacity>
        </View>

        {/* All Logs Tab */}
        {activeTab === "logs" && (
          <FlatList
            data={logs}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<View style={styles.emptyBox}><Text style={styles.emptyText}>No logs found</Text></View>}
            renderItem={({ item }) => (
              <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewName}>{item.studentId?.name} — Week {item.weekNumber}</Text>
                    <Text style={styles.reviewMeta}>{item.studentId?.studentId} · {new Date(item.logDate).toDateString()}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.reviewBody} numberOfLines={2}>{item.logDescription}</Text>
              </View>
            )}
          />
        )}

        {/* Placements Tab */}
        {activeTab === "placements" && (
          <FlatList
            data={placements}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<View style={styles.emptyBox}><Text style={styles.emptyText}>No placements found</Text></View>}
            renderItem={({ item }) => (
              <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewName}>{item.studentId?.name}</Text>
                    <Text style={styles.reviewMeta}>{item.studentId?.studentId}</Text>
                    <Text style={styles.reviewCompany}>{item.companyName}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: item.verifiedByAdmin ? "#d1fae5" : "#fef3c7" }]}>
                    <Text style={[styles.statusText, { color: item.verifiedByAdmin ? "#059669" : "#d97706" }]}>
                      {item.verifiedByAdmin ? "Verified" : "Unverified"}
                    </Text>
                  </View>
                </View>
                <View style={styles.btnRow}>
                  {!item.verifiedByAdmin && (
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: "#1a56db", flex: 1, marginRight: 6 }]}
                      onPress={() => handleVerify(item._id)}
                    >
                      <Text style={styles.btnText}>✓ Verify</Text>
                    </TouchableOpacity>
                  )}
                  {item.companyLetterUrl ? (
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: "#6b7280", flex: 1, marginRight: 6 }]}
                      onPress={() => openAttachment(item.companyLetterUrl)}
                    >
                      <Text style={styles.btnText}>📄 View Letter</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.btn, styles.deleteBtn, { flex: 1 }]}
                    onPress={() => handleDeletePlacement(item._id)}
                  >
                    <Text style={styles.btnText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}

        {/* Risk Flags Tab */}
        {activeTab === "risks" && (
          <FlatList
            data={risks}
            keyExtractor={(item) => item.internship._id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              risks.length > 0 ? (
                <View style={styles.riskSummary}>
                  <Text style={styles.riskSummaryTitle}>⚠️ {risks.length} student(s) need attention</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyText}>No risk flags found</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.reviewCard, { borderLeftWidth: 3, borderLeftColor: "#dc2626" }]}>
                <Text style={styles.reviewName}>{item.internship.studentId?.name}</Text>
                <Text style={styles.reviewMeta}>{item.internship.studentId?.studentId}</Text>
                <Text style={styles.reviewCompany}>{item.internship.companyName}</Text>
                {item.risks.missingCompanyLetter && (
                  <Text style={styles.riskFlag}>⚠ Company letter not uploaded</Text>
                )}
                {item.risks.consecutiveLogsMissing >= 3 && (
                  <Text style={styles.riskFlag}>⚠ {item.risks.consecutiveLogsMissing} consecutive logs missing</Text>
                )}
                <View style={[styles.btnRow, { marginTop: 10 }]}> 
                  <TouchableOpacity
                    style={[styles.btn, styles.deleteBtn, { flex: 1 }]}
                    onPress={() => handleDeletePlacement(item.internship._id)}
                  >
                    <Text style={styles.btnText}>🗑️ Delete Placement</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}

        {/* ── NEW: Supervisors Tab ──────────────────────────────────────────── */}
        {activeTab === "supervisors" && (
          <ScrollView contentContainerStyle={styles.listContent}>

            {/* Currently Assigned Supervisors */}
            <Text style={styles.sectionTitle}>✅ Assigned Supervisors ({supervisors.length})</Text>
            {supervisors.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No supervisors assigned yet</Text>
              </View>
            ) : (
              supervisors.map((sup) => (
                <View key={sup._id} style={styles.supervisorCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewName}>{sup.name}</Text>
                    <Text style={styles.reviewMeta}>{sup.department} · {sup.email}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemoveSupervisor(sup._id)}
                    disabled={assigningId === sup._id}
                  >
                    {assigningId === sup._id
                      ? <ActivityIndicator size="small" color="#dc2626" />
                      : <Text style={styles.removeBtnText}>Remove</Text>
                    }
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Search & Assign Lecturers */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>🔍 Search & Assign Lecturers</Text>
            <TextInput
              style={styles.searchBox}
              placeholder="Search by name or department..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {lecturers
              .filter((lec) => {
                const q = searchQuery.toLowerCase();
                return (
                  lec.name.toLowerCase().includes(q) ||
                  (lec.department && lec.department.toLowerCase().includes(q))
                );
              })
              .map((lec) => {
                const isAssigned = supervisors.some((s) => s._id === lec._id);
                return (
                  <View key={lec._id} style={styles.supervisorCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewName}>{lec.name}</Text>
                      <Text style={styles.reviewMeta}>{lec.department} · {lec.email}</Text>
                    </View>
                    {isAssigned ? (
                      <View style={styles.assignedBadge}>
                        <Text style={styles.assignedBadgeText}>Assigned ✓</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.assignBtn}
                        onPress={() => handleAssignSupervisor(lec._id)}
                        disabled={assigningId === lec._id}
                      >
                        {assigningId === lec._id
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={styles.assignBtnText}>Assign</Text>
                        }
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            }
          </ScrollView>
        )}
        {/* ─────────────────────────────────────────────────────────────────── */}

      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <Text style={{ color: "#6b7280" }}>You are not authorized to view this screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4ff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: "5%" },
  title: { fontSize: 20, fontWeight: "600", color: "#1a56db", marginBottom: 16 },
  backBtn: { marginBottom: 12 },
  backBtnText: { fontSize: 16, color: "#1a56db", fontWeight: "500" },
  tabBar: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  tab: { flex: 1, paddingVertical: 13, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#1a56db" },
  tabText: { fontSize: 12, fontWeight: "500", color: "#9ca3af" },
  tabTextActive: { color: "#1a56db", fontWeight: "600" },
  filterBar: { flexDirection: "row", padding: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  filterChipActive: { backgroundColor: "#1a56db", borderColor: "#1a56db" },
  filterChipText: { fontSize: 12, color: "#6b7280" },
  filterChipTextActive: { color: "#fff", fontWeight: "500" },
  listContent: { padding: "5%" },
  reviewCard: { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  reviewName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  reviewMeta: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  reviewCompany: { fontSize: 11, color: "#1a56db", marginTop: 2 },
  reviewBody: { fontSize: 13, color: "#4b5563", lineHeight: 20, marginBottom: 10 },
  evidenceLink: { fontSize: 12, color: "#1a56db", marginBottom: 10 },
  commentInput: { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 10, fontSize: 12, marginBottom: 10, minHeight: 60, textAlignVertical: "top" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#e5e7eb" },
  cardTitle: { fontSize: 13, fontWeight: "600", color: "#1a56db", marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  fieldLabel: { fontSize: 11, fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 },
  fieldValue: { fontSize: 14, color: "#111827", marginBottom: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start" },
  statusText: { fontSize: 10, fontWeight: "600" },
  evidenceBtn: { backgroundColor: "#e8f0fe", borderRadius: 8, padding: 12, alignItems: "center", marginBottom: 14 },
  evidenceBtnText: { color: "#1a56db", fontSize: 13, fontWeight: "500" },
  commentCard: { backgroundColor: "#f0f4ff", borderRadius: 10, padding: 14, marginBottom: 14, borderLeftWidth: 3, borderLeftColor: "#1a56db" },
  commentLabel: { fontSize: 11, fontWeight: "600", color: "#1a56db", marginBottom: 6 },
  commentText: { fontSize: 13, color: "#374151", lineHeight: 20 },
  commentDate: { fontSize: 10, color: "#9ca3af", marginTop: 6 },
  textArea: { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 10, fontSize: 13, minHeight: 80, textAlignVertical: "top", marginBottom: 12 },
  btnRow: { flexDirection: "row" },
  btn: { padding: 12, borderRadius: 8, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  emptyBox: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, color: "#6b7280" },
  riskSummary: { backgroundColor: "#fee2e2", borderRadius: 8, padding: 12, marginBottom: 12 },
  riskSummaryTitle: { fontSize: 13, fontWeight: "600", color: "#dc2626" },
  riskFlag: { fontSize: 12, color: "#dc2626", marginTop: 4 },

  // ── NEW STYLES ───────────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 10,
  },
  supervisorCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  assignBtn: {
    backgroundColor: "#1a56db",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteBtn: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  assignBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  removeBtn: {
    borderWidth: 1,
    borderColor: "#dc2626",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  removeBtnText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "600",
  },
  assignedBadge: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  assignedBadgeText: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default ReviewScreen;
