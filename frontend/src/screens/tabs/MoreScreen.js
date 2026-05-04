import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MoreScreen = ({ navigation, route }) => {
  const userRole = route?.params?.userRole;

  const items = [];

  items.push({ label: "Settings", route: "Settings", icon: "settings-outline" });

  if (userRole === "student" || userRole === "student_representative") {
    items.push({ label: "My Tickets", route: "MyTickets", icon: "ticket-outline" });
    items.push({ label: "My Enrollments", route: "MyEnrollments", icon: "checkmark-circle-outline" });
    items.push({ label: "My Results", route: "MyResults", icon: "ribbon-outline" });
    items.push({ label: "My Internship", route: "MyInternship", icon: "briefcase-outline" });
  }

  if (userRole === "lecturer") {
    items.push({ label: "My Courses", route: "MyCourses", icon: "library-outline" });
    items.push({ label: "Forwarded Tickets", route: "ForwardedTickets", icon: "mail-unread-outline" });
    items.push({ label: "Manage Results", route: "ManageResults", icon: "ribbon-outline" });
    items.push({ label: "Review Internships", route: "ReviewInternships", icon: "clipboard-outline" });
  }

  if (userRole === "admin") {
    items.push({ label: "Manage Enrollments", route: "ManageEnrollments", icon: "checkmark-circle-outline" });
    items.push({ label: "Manage Tickets", route: "ManageTickets", icon: "ticket-outline" });
    items.push({ label: "All Results", route: "AllResults", icon: "ribbon-outline" });
    items.push({ label: "Users", route: "Users", icon: "people-outline" });
    items.push({ label: "Review Internships", route: "ReviewInternships", icon: "clipboard-outline" });
  }

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");
          navigation.replace("Login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>More</Text>
          <Text style={styles.subtitle}>Quick access to extra tools</Text>
        </View>

        {items.length === 0 ? (
          <Text style={styles.emptyText}>No extra options for your role.</Text>
        ) : (
          items.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={styles.itemButton}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={styles.itemLeft}>
                <View style={styles.iconWrap}>
                  <Ionicons name={item.icon} size={20} color="#1a73e8" />
                </View>
                <Text style={styles.itemText}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>
          ))
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },
  content: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },
  itemButton: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#e8f0fe",
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 14,
    color: "#777",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e74c3c",
    backgroundColor: "#fff5f5",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e74c3c",
  },
});

export default MoreScreen;
