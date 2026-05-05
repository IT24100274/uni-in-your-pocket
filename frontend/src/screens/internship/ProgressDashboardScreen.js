import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, Alert, TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../services/api";

/*
 * ProgressDashboardScreen — Student
 * Displays a full progress overview of the student's internship.
 * Fetches data from GET /api/internship/progress/my which returns progress stats,
 * log submission breakdown (approved, rejected, pending, missing weeks),
 * and milestone status for mid-term and final milestones.
 * The main progress bar shows percentage of internship weeks completed.
 * Log submission rate bar shows how many logs have been submitted vs total weeks done.
 * This screen refreshes automatically every time the student navigates to it.
 */

const ProgressDashboardScreen = ({ navigation }) => {
  const [progress, setProgress] = useState(null);
  const [logStats, setLogStats] = useState(null);
  const [milestones, setMilestones] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const res = await api.get("/internship/progress/my");
      setProgress(res.data.progress);
      setLogStats(res.data.logs);
      setMilestones(res.data.milestones);
    } catch (error) {
      Alert.alert("Error", "Could not load progress data");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchProgress(); }, []));

  const getMilestoneColor = (status) => {
    const colors = { completed: "#059669", in_progress: "#d97706", not_started: "#9ca3af" };
    return colors[status] || "#9ca3af";
  };

  const getMilestoneBg = (status) => {
    const colors = { completed: "#d1fae5", in_progress: "#fef3c7", not_started: "#f3f4f6" };
    return colors[status] || "#f3f4f6";
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1a56db" /></View>;
  }

  if (!progress) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No progress data available</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹ Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const logSubmissionRate = progress.weeksDone > 0
    ? Math.round((logStats.totalLogs / progress.weeksDone) * 100)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Main Progress Card */}
      <View style={styles.progressCard}>
        <View style={styles.progressCardHeader}>
          <View>
            <Text style={styles.progressCardTitle}>Internship Progress</Text>
            <Text style={styles.progressCardSub}>Overall completion based on weeks</Text>
          </View>
          <Text style={styles.progressPct}>{progress.progressPercent}%</Text>
        </View>
        <View style={styles.progressBarWrap}>
          <View style={[styles.progressBarFill, { width: `${progress.progressPercent}%` }]} />
        </View>
        <View style={styles.progressStatsRow}>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatNum}>{progress.totalWeeks}</Text>
            <Text style={styles.progressStatLabel}>Total Weeks</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatNum}>{progress.weeksDone}</Text>
            <Text style={styles.progressStatLabel}>Weeks Done</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatNum}>{progress.weeksLeft}</Text>
            <Text style={styles.progressStatLabel}>Weeks Left</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatNum}>{progress.totalDays}</Text>
            <Text style={styles.progressStatLabel}>Total Days</Text>
          </View>
        </View>
      </View>

      {/* Log Submission Rate */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 Log Submission Rate</Text>
        <View style={styles.rateRow}>
          <Text style={styles.rateLabel}>Logs submitted</Text>
          <Text style={styles.rateValue}>{logStats.totalLogs} of {progress.weeksDone} weeks</Text>
        </View>
        <View style={styles.rateBarWrap}>
          <View style={[styles.rateBarFill, { width: `${Math.min(logSubmissionRate, 100)}%` }]} />
        </View>
        <View style={styles.logStatsGrid}>
          <View style={[styles.logStatItem, { backgroundColor: "#d1fae5" }]}>
            <Text style={[styles.logStatNum, { color: "#059669" }]}>{logStats.approvedLogs}</Text>
            <Text style={[styles.logStatLabel, { color: "#059669" }]}>Approved</Text>
          </View>
          <View style={[styles.logStatItem, { backgroundColor: "#fef3c7" }]}>
            <Text style={[styles.logStatNum, { color: "#d97706" }]}>{logStats.pendingLogs}</Text>
            <Text style={[styles.logStatLabel, { color: "#d97706" }]}>Pending</Text>
          </View>
          <View style={[styles.logStatItem, { backgroundColor: "#fee2e2" }]}>
            <Text style={[styles.logStatNum, { color: "#dc2626" }]}>{logStats.rejectedLogs}</Text>
            <Text style={[styles.logStatLabel, { color: "#dc2626" }]}>Rejected</Text>
          </View>
          <View style={[styles.logStatItem, { backgroundColor: "#f3f4f6" }]}>
            <Text style={[styles.logStatNum, { color: "#6b7280" }]}>{logStats.missingWeeks.length}</Text>
            <Text style={[styles.logStatLabel, { color: "#6b7280" }]}>Missing</Text>
          </View>
        </View>

        {logStats.missingWeeks.length > 0 && (
          <View style={styles.missingBanner}>
            <Text style={styles.missingBannerTitle}>⚠️ Missing Weeks</Text>
            <Text style={styles.missingBannerText}>
              Weeks not submitted: {logStats.missingWeeks.join(", ")}
            </Text>
            <TouchableOpacity
              style={styles.missingBannerBtn}
              onPress={() => navigation.navigate("Log")}
            >
              <Text style={styles.missingBannerBtnText}>Submit Now →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Milestone Progress */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎯 Milestone Progress</Text>
        <View style={styles.milestoneRow}>
          <View style={[styles.milestoneDot, { backgroundColor: getMilestoneColor(milestones.midTermStatus) }]} />
          <Text style={styles.milestoneLabel}>Mid-term Milestone</Text>
          <View style={[styles.milestoneBadge, { backgroundColor: getMilestoneBg(milestones.midTermStatus) }]}>
            <Text style={[styles.milestoneBadgeText, { color: getMilestoneColor(milestones.midTermStatus) }]}>
              {milestones.midTermStatus.replace(/_/g, " ")}
            </Text>
          </View>
        </View>
        <View style={[styles.milestoneRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.milestoneDot, { backgroundColor: getMilestoneColor(milestones.finalStatus) }]} />
          <Text style={styles.milestoneLabel}>Final Milestone</Text>
          <View style={[styles.milestoneBadge, { backgroundColor: getMilestoneBg(milestones.finalStatus) }]}>
            <Text style={[styles.milestoneBadgeText, { color: getMilestoneColor(milestones.finalStatus) }]}>
              {milestones.finalStatus.replace(/_/g, " ")}
            </Text>
          </View>
        </View>
      </View>

      {/* Duration Summary */}
      <View style={styles.durationCard}>
        <Text style={styles.durationTitle}>📅 Duration Summary</Text>
        <View style={styles.durationRow}>
          <View style={styles.durationItem}>
            <Text style={styles.durationNum}>{progress.totalWeeks}</Text>
            <Text style={styles.durationLabel}>Total Weeks</Text>
          </View>
          <View style={styles.durationItem}>
            <Text style={styles.durationNum}>{Math.round(progress.totalDays / 30)}</Text>
            <Text style={styles.durationLabel}>Months</Text>
          </View>
          <View style={styles.durationItem}>
            <Text style={styles.durationNum}>{progress.totalDays}</Text>
            <Text style={styles.durationLabel}>Total Days</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.backToPlacementBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backToPlacementBtnText}>‹ Back to My Placement</Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4ff" },
  content: { padding: "5%" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  emptyText: { fontSize: 14, color: "#6b7280", marginBottom: 16 },
  backBtn: { padding: 10 },
  backBtnText: { color: "#1a56db", fontSize: 14, fontWeight: "500" },
  progressCard: { backgroundColor: "#1a56db", borderRadius: 14, padding: 18, marginBottom: 14 },
  progressCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  progressCardTitle: { fontSize: 14, fontWeight: "600", color: "#fff" },
  progressCardSub: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  progressPct: { fontSize: 30, fontWeight: "700", color: "#fff" },
  progressBarWrap: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, height: 10, overflow: "hidden", marginBottom: 16 },
  progressBarFill: { backgroundColor: "#fff", height: "100%", borderRadius: 20 },
  progressStatsRow: { flexDirection: "row", justifyContent: "space-around" },
  progressStat: { alignItems: "center" },
  progressStatNum: { fontSize: 18, fontWeight: "700", color: "#fff" },
  progressStatLabel: { fontSize: 10, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#e5e7eb" },
  cardTitle: { fontSize: 13, fontWeight: "600", color: "#1f2937", marginBottom: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  rateRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  rateLabel: { fontSize: 12, color: "#6b7280" },
  rateValue: { fontSize: 12, fontWeight: "600", color: "#1f2937" },
  rateBarWrap: { backgroundColor: "#f3f4f6", borderRadius: 20, height: 8, overflow: "hidden", marginBottom: 14 },
  rateBarFill: { backgroundColor: "#1a56db", height: "100%", borderRadius: 20 },
  logStatsGrid: { flexDirection: "row", gap: 8, marginBottom: 12 },
  logStatItem: { flex: 1, borderRadius: 8, padding: 10, alignItems: "center" },
  logStatNum: { fontSize: 18, fontWeight: "700" },
  logStatLabel: { fontSize: 10, marginTop: 2 },
  missingBanner: { backgroundColor: "#fff7ed", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#fed7aa" },
  missingBannerTitle: { fontSize: 12, fontWeight: "600", color: "#92400e", marginBottom: 4 },
  missingBannerText: { fontSize: 12, color: "#b45309", marginBottom: 8 },
  missingBannerBtn: { alignSelf: "flex-start" },
  missingBannerBtnText: { fontSize: 12, color: "#1a56db", fontWeight: "600" },
  milestoneRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  milestoneDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  milestoneLabel: { flex: 1, fontSize: 13, color: "#374151" },
  milestoneBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  milestoneBadgeText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  durationCard: { backgroundColor: "#ede9fe", borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#c4b5fd" },
  durationTitle: { fontSize: 12, fontWeight: "600", color: "#7c3aed", marginBottom: 12 },
  durationRow: { flexDirection: "row", justifyContent: "space-around" },
  durationItem: { alignItems: "center" },
  durationNum: { fontSize: 22, fontWeight: "700", color: "#7c3aed" },
  durationLabel: { fontSize: 10, color: "#6d28d9", marginTop: 2 },
  backToPlacementBtn: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#1a56db", borderRadius: 10, padding: 14, alignItems: "center", marginBottom: 30 },
  backToPlacementBtnText: { color: "#1a56db", fontSize: 14, fontWeight: "500" },
});

export default ProgressDashboardScreen;