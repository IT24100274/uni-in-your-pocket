import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import api from "../../services/api";

const AdminScreen = () => {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  // Create user form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("lecturer");
  const [newDepartment, setNewDepartment] = useState("");
  const [creating, setCreating] = useState(false);
  const [newEmailError, setNewEmailError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pendingRes, allRes] = await Promise.all([
        api.get("/auth/admin/pending"),
        api.get("/auth/admin/users"),
      ]);
      setPendingUsers(pendingRes.data);
      setUsers(allRes.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load user data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const validateNewEmail = (text) => {
    setNewEmail(text);
    if (text.length === 0) {
      setNewEmailError("");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(text)) {
        setNewEmailError("Please enter a valid email address");
      } else {
        setNewEmailError("");
      }
    }
  };

  const handleApprove = (userId, userName) => {
    Alert.alert("Approve User", `Approve ${userName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        onPress: async () => {
          try {
            await api.put(`/auth/admin/approve/${userId}`);
            Alert.alert("Success", `${userName} has been approved`);
            fetchData();
          } catch (error) {
            Alert.alert("Error", "Failed to approve user");
          }
        },
      },
    ]);
  };

  const handleDecline = (userId, userName) => {
    Alert.alert("Decline User", `Decline ${userName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Decline",
        style: "destructive",
        onPress: async () => {
          try {
            await api.put(`/auth/admin/decline/${userId}`);
            Alert.alert("Success", `${userName} has been declined`);
            fetchData();
          } catch (error) {
            Alert.alert("Error", "Failed to decline user");
          }
        },
      },
    ]);
  };

  const handleDelete = (userId, userName) => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to delete ${userName}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/auth/admin/delete-user/${userId}`);
              Alert.alert("Success", `${userName} has been deleted`);
              fetchData();
            } catch (error) {
              Alert.alert("Error", "Failed to delete user");
            }
          },
        },
      ]
    );
  };

  const handleUpgrade = (userId, userName) => {
    Alert.alert(
      "Upgrade User",
      `Make ${userName} a Student Representative?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Upgrade",
          onPress: async () => {
            try {
              await api.put(`/auth/admin/upgrade/${userId}`);
              Alert.alert("Success", `${userName} is now a Student Representative`);
              fetchData();
            } catch (error) {
              const message =
                error.response?.data?.message || "Failed to upgrade user";
              Alert.alert("Error", message);
            }
          },
        },
      ]
    );
  };

  const handleCreateUser = async () => {
    if (!newName || !newEmail || !newPassword) {
      Alert.alert("Error", "Please fill in name, email and password");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setCreating(true);

    try {
      const response = await api.post("/auth/admin/create-user", {
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        department: newDepartment || undefined,
      });

      Alert.alert("Success", response.data.message);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewDepartment("");
      setShowCreateForm(false);
      fetchData();
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to create user";
      Alert.alert("Error", message);
    } finally {
      setCreating(false);
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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true);
          fetchData();
        }} />
      }
    >
      <Text style={styles.screenTitle}>User Management</Text>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.tabActive]}
          onPress={() => setActiveTab("pending")}
        >
          <Text style={[styles.tabText, activeTab === "pending" && styles.tabTextActive]}>
            Pending ({pendingUsers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.tabActive]}
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.tabTextActive]}>
            All Users ({users.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "create" && styles.tabActive]}
          onPress={() => setActiveTab("create")}
        >
          <Text style={[styles.tabText, activeTab === "create" && styles.tabTextActive]}>
            Create
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pending Users Tab */}
      {activeTab === "pending" && (
        <View>
          {pendingUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No pending registrations</Text>
            </View>
          ) : (
            pendingUsers.map((user) => (
              <View key={user._id} style={styles.userCard}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userDetail}>{user.email}</Text>
                {user.studentId && (
                  <Text style={styles.userDetail}>ID: {user.studentId}</Text>
                )}
                {user.department && (
                  <Text style={styles.userDetail}>Dept: {user.department}</Text>
                )}
                <Text style={styles.userDetail}>Role: {user.role}</Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => handleApprove(user._id, user.name)}
                  >
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineButton}
                    onPress={() => handleDecline(user._id, user.name)}
                  >
                    <Text style={styles.actionButtonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* All Users Tab */}
      {activeTab === "all" && (
        <View>
          {users.map((user) => (
            <View key={user._id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <Text style={styles.userName}>{user.name}</Text>
                <View style={[styles.statusBadge,
                  user.status === "approved" && styles.statusApproved,
                  user.status === "pending" && styles.statusPending,
                  user.status === "declined" && styles.statusDeclined,
                ]}>
                  <Text style={styles.statusText}>{user.status}</Text>
                </View>
              </View>
              <Text style={styles.userDetail}>{user.email}</Text>
              <Text style={styles.userDetail}>Role: {user.role}</Text>
              {user.studentId && (
                <Text style={styles.userDetail}>ID: {user.studentId}</Text>
              )}
              {user.department && (
                <Text style={styles.userDetail}>Dept: {user.department}</Text>
              )}

              {user.role !== "admin" && (
                <View style={styles.actionRow}>
                  {user.role === "student" && user.status === "approved" && (
                    <TouchableOpacity
                      style={styles.upgradeButton}
                      onPress={() => handleUpgrade(user._id, user.name)}
                    >
                      <Text style={styles.actionButtonText}>Make Rep</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.deleteSmallButton}
                    onPress={() => handleDelete(user._id, user.name)}
                  >
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Create User Tab */}
      {activeTab === "create" && (
        <View style={styles.createSection}>
          <Text style={styles.sectionTitle}>Create Lecturer / Admin</Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter full name"
            value={newName}
            onChangeText={setNewName}
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={[styles.input, newEmailError ? styles.inputError : null]}
            placeholder="Enter email"
            value={newEmail}
            onChangeText={validateNewEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {newEmailError ? (
            <Text style={styles.errorText}>{newEmailError}</Text>
          ) : null}

          <Text style={styles.label}>Temporary Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="Minimum 6 characters"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={true}
          />

          <Text style={styles.label}>Role</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleButton, newRole === "lecturer" && styles.roleButtonActive]}
              onPress={() => setNewRole("lecturer")}
            >
              <Text style={[styles.roleButtonText, newRole === "lecturer" && styles.roleButtonTextActive]}>
                Lecturer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, newRole === "admin" && styles.roleButtonActive]}
              onPress={() => setNewRole("admin")}
            >
              <Text style={[styles.roleButtonText, newRole === "admin" && styles.roleButtonTextActive]}>
                Admin
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Department</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Software Engineering"
            value={newDepartment}
            onChangeText={setNewDepartment}
          />

          <TouchableOpacity
            style={[styles.createButton, creating && styles.buttonDisabled]}
            onPress={handleCreateUser}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  screenTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    marginTop: "5%",
    marginBottom: "4%",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 4,
    marginBottom: "4%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: "#1a73e8",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  emptyContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: "8%",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  userCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: "5%",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  userDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusApproved: {
    backgroundColor: "#e8f5e9",
  },
  statusPending: {
    backgroundColor: "#fff3e0",
  },
  statusDeclined: {
    backgroundColor: "#ffebee",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  approveButton: {
    flex: 1,
    backgroundColor: "#27ae60",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  declineButton: {
    flex: 1,
    backgroundColor: "#e74c3c",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  upgradeButton: {
    flex: 1,
    backgroundColor: "#8e44ad",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  deleteSmallButton: {
    flex: 1,
    backgroundColor: "#e74c3c",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  createSection: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: "6%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  inputError: {
    borderColor: "#e74c3c",
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 12,
    marginTop: 4,
  },
  roleContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  roleButtonActive: {
    backgroundColor: "#1a73e8",
    borderColor: "#1a73e8",
  },
  roleButtonText: {
    fontSize: 14,
    color: "#666",
  },
  roleButtonTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  createButton: {
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: "#93b8f0",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AdminScreen;
