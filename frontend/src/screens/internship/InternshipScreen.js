import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";

const InternshipScreen = ({ navigation }) => {
  const [placement, setPlacement] = useState(null);
  const [duration, setDuration] = useState(null);
  const [reminder, setReminder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasPlacement, setHasPlacement] = useState(true);
  const [userRole, setUserRole] = useState(null);

  const fetchPlacement = async () => {
    try {
      setLoading(true);
      const res = await api.get("/internship/my");
      setPlacement(res.data.internship);
      setDuration(res.data.duration);
      setHasPlacement(true);
    } catch (error) {
      if (error.response?.status === 404) {
        setHasPlacement(false);
      } else {
        Alert.alert("Error", "Could not load internship placement");
      }
    } finally {
      try {
        const logsRes = await api.get("/internship/logs/my");
        setReminder(logsRes.data.reminder);
      } catch {
        setReminder(null);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        const user = userData ? JSON.parse(userData) : null;
        setUserRole(user?.role || null);
      } catch {
        setUserRole(null);
      }
    };

    loadUser();
  }, []);

  useFocusEffect(useCallback(() => {
    fetchPlacement();
  }, []));

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a56db" />
      </View>
    );
  }

  if (!hasPlacement) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No internship placement found.</Text>
        <Text style={styles.emptySubText}>
          Create your internship placement now so you can start tracking weekly logs.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("CreateInternship")}>        
          <Text style={styles.buttonText}>Create Internship</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>My Internship Placement</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Company</Text>
        <Text style={styles.value}>{placement.companyName || "N/A"}</Text>
        <Text style={styles.label}>Supervisor</Text>
        <Text style={styles.value}>{placement.supervisorName || "N/A"}</Text>
        <Text style={styles.label}>Start Date</Text>
        <Text style={styles.value}>{placement.startDate ? new Date(placement.startDate).toDateString() : "N/A"}</Text>
        <Text style={styles.label}>End Date</Text>
        <Text style={styles.value}>{placement.endDate ? new Date(placement.endDate).toDateString() : "N/A"}</Text>
      </View>

      {duration && (
        <View style={styles.card}>
          <Text style={styles.label}>Duration</Text>
          <Text style={styles.value}>{duration.totalWeeks} weeks ({duration.totalDays} days)</Text>
          <Text style={styles.label}>Progress</Text>
          <Text style={styles.value}>{duration.progressPercent}% complete</Text>
          <Text style={styles.label}>Weeks Left</Text>
          <Text style={styles.value}>{duration.weeksLeft}</Text>
        </View>
      )}

      {reminder && (
        <View style={styles.card}>
          <Text style={styles.label}>Weekly Log Reminder</Text>
          <Text style={styles.value}>{reminder.hasReminder ? `Next due: week ${reminder.nextDueWeek}` : "All caught up"}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Log")}>          
        <Text style={styles.buttonText}>View Weekly Logs</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("ProgressDashboard")}>          
        <Text style={styles.buttonText}>View Progress Dashboard</Text>
      </TouchableOpacity>
      {(userRole === "lecturer" || userRole === "admin") && (
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Review")}>          
          <Text style={styles.buttonText}>Review & Approvals</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    color: "#111827",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  label: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 12,
  },
  value: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111827",
    textAlign: "center",
  },
  emptySubText: {
    color: "#6b7280",
    fontSize: 15,
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#1a56db",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default InternshipScreen;
