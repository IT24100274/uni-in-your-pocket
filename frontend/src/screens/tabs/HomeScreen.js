import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { getMe } from "../../services/api";
import Ionicons from "@expo/vector-icons/Ionicons";

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await getMe();
      setUser(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const quickActions = [
    { label: "Courses", icon: "book-outline", route: "Courses" },
    { label: "Assignments", icon: "document-text-outline", route: "Assignments" },
    { label: "Notices", icon: "megaphone-outline", route: "Notices" },
  ];

 if (user?.role === "student" || user?.role === "student_representative") {
    quickActions.push({ label: "My Tickets", icon: "ticket-outline", route: "MyTickets" });
    quickActions.push({ label: "Internship", icon: "briefcase-outline", route: "MyInternship" });
  }

  if (user?.role === "lecturer") {
    quickActions.push({ label: "My Courses", icon: "library-outline", route: "MyCourses" });
    quickActions.push({ label: "Review Internships", icon: "clipboard-outline", route: "ReviewInternships" });
  }

  if (user?.role === "admin") {
    quickActions.push({ label: "Review Internships", icon: "clipboard-outline", route: "ReviewInternships" });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerContainer}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.nameText}>{user?.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role}</Text>
        </View>
      </View>

      <View style={styles.quickActionsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionHint}>Jump into common tasks</Text>
        </View>
        <View style={styles.quickGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.route}
              style={styles.quickCard}
              onPress={() => navigation.navigate(action.route)}
            >
              <View style={styles.quickIconWrap}>
                <Ionicons name={action.icon} size={20} color="#1a73e8" />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.sectionTitle}>Profile Information</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>

        {user?.studentId && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Student ID</Text>
            <Text style={styles.infoValue}>{user?.studentId}</Text>
          </View>
        )}

        {user?.department && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>{user?.department}</Text>
          </View>
        )}

        {user?.role === "student" && user?.academicYear && user?.academicSemester && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Academic Progress</Text>
            <Text style={styles.infoValue}>Year {user.academicYear} - Semester {user.academicSemester}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Account Status</Text>
          <Text style={[styles.infoValue, styles.statusApproved]}>
            {user?.status}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: "5%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  headerContainer: {
    alignItems: "center",
    marginTop: "5%",
    marginBottom: "6%",
  },
  welcomeText: {
    fontSize: 18,
    color: "#666",
  },
  nameText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: "#1a73e8",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
  },
  roleText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  infoContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: "6%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionsContainer: {
    marginBottom: "6%",
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  sectionHint: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  quickIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#e8f0fe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 13,
    color: "#999",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  statusApproved: {
    color: "#27ae60",
    textTransform: "capitalize",
  },
});

export default HomeScreen;
