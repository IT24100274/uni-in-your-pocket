import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";

const NoticeListScreen = ({ navigation }) => {
  const [notices, setNotices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'notice' | 'event'
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchNotices);
    return unsubscribe;
  }, [navigation]);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem("user");
    const user = JSON.parse(userData);
    setUserRole(user.role);
  };

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await api.get("/notices");
      setNotices(response.data);
      applyFilters(response.data, searchText, activeTab);
    } catch (error) {
      console.log("Error fetching notices:", error.message);
      Alert.alert("Error", "Could not load notices.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (data, text, tab) => {
    let result = data;
    if (tab !== "all") {
      result = result.filter((n) => n.type === tab);
    }
    if (text.trim()) {
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(text.toLowerCase()) ||
          n.content.toLowerCase().includes(text.toLowerCase())
      );
    }
    setFiltered(result);
  };

  const handleSearch = (text) => {
    setSearchText(text);
    applyFilters(notices, text, activeTab);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    applyFilters(notices, searchText, tab);
  };

  const handleDelete = (id) => {
    Alert.alert("Delete", "Are you sure you want to delete this notice?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/notices/${id}`);
            const updated = notices.filter((n) => n._id !== id);
            setNotices(updated);
            applyFilters(updated, searchText, activeTab);
          } catch (error) {
            Alert.alert("Error", "Could not delete notice.");
          }
        },
      },
    ]);
  };

  const canCreate = ["admin", "lecturer", "student_representative"].includes(userRole);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("NoticeDetail", { noticeId: item._id })}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.badge, item.type === "event" ? styles.badgeEvent : styles.badgeNotice]}>
          <Ionicons
            name={item.type === "event" ? "calendar-outline" : "megaphone-outline"}
            size={12}
            color="#fff"
          />
          <Text style={styles.badgeText}>
            {item.type === "event" ? "Event" : "Notice"}
          </Text>
        </View>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.preview} numberOfLines={2}>{item.content}</Text>

      {/* Event date + location */}
      {item.type === "event" && item.eventDate && (
        <View style={styles.eventInfo}>
          <Ionicons name="time-outline" size={13} color="#e67e22" />
          <Text style={styles.eventText}>
            {new Date(item.eventDate).toLocaleDateString("en-US", {
              weekday: "short", year: "numeric", month: "short", day: "numeric",
            })}
          </Text>
          {item.eventLocation ? (
            <>
              <Ionicons name="location-outline" size={13} color="#e67e22" style={{ marginLeft: 8 }} />
              <Text style={styles.eventText}>{item.eventLocation}</Text>
            </>
          ) : null}
        </View>
      )}

      {/* Attachment indicator */}
      {item.attachments && item.attachments.length > 0 && (
        <View style={styles.attachIndicator}>
          <Ionicons name="attach-outline" size={13} color="#888" />
          <Text style={styles.attachIndicatorText}>
            {item.attachments.length} attachment{item.attachments.length > 1 ? "s" : ""}
          </Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.postedBy}>
          Posted by {item.createdBy?.name || "Unknown"}
        </Text>
        {canCreate && (
          <TouchableOpacity
            onPress={() => handleDelete(item._id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color="#e53935" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notices & Events</Text>
        {canCreate && (
          <TouchableOpacity onPress={() => navigation.navigate("CreateNotice")}>
            <Ionicons name="add-circle" size={30} color="#1a73e8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search notices..."
        value={searchText}
        onChangeText={handleSearch}
        placeholderTextColor="#999"
      />

      {/* Tab filter */}
      <View style={styles.tabs}>
        {["all", "notice", "event"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => handleTabChange(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "all" ? "All" : tab === "notice" ? "Notices" : "Events"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={filtered.length === 0 ? styles.centered : { padding: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchNotices(); }}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No notices found.</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: "#f5f5f5" },
  centered:            { flex: 1, justifyContent: "center", alignItems: "center" },
  header:              { flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                         paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff",
                         borderBottomWidth: 1, borderBottomColor: "#e0e0e0" },
  headerTitle:         { fontSize: 20, fontWeight: "700", color: "#333" },
  searchInput:         { margin: 12, paddingHorizontal: 14, paddingVertical: 10,
                         backgroundColor: "#fff", borderRadius: 10, borderWidth: 1,
                         borderColor: "#ddd", fontSize: 14, color: "#333" },
  tabs:                { flexDirection: "row", marginHorizontal: 12, marginBottom: 8,
                         backgroundColor: "#e8edf5", borderRadius: 10, padding: 3 },
  tab:                 { flex: 1, paddingVertical: 7, alignItems: "center", borderRadius: 8 },
  tabActive:           { backgroundColor: "#1a73e8" },
  tabText:             { fontSize: 13, color: "#555", fontWeight: "500" },
  tabTextActive:       { color: "#fff", fontWeight: "700" },
  card:                { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 12,
                         shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6,
                         shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardHeader:          { flexDirection: "row", justifyContent: "space-between",
                         alignItems: "center", marginBottom: 6 },
  badge:               { flexDirection: "row", alignItems: "center", paddingHorizontal: 8,
                         paddingVertical: 3, borderRadius: 20, gap: 4 },
  badgeNotice:         { backgroundColor: "#1a73e8" },
  badgeEvent:          { backgroundColor: "#e67e22" },
  badgeText:           { color: "#fff", fontSize: 11, fontWeight: "600" },
  date:                { fontSize: 11, color: "#999" },
  title:               { fontSize: 16, fontWeight: "700", color: "#222", marginBottom: 4 },
  preview:             { fontSize: 13, color: "#666", lineHeight: 18 },
  eventInfo:           { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 4 },
  eventText:           { fontSize: 12, color: "#e67e22", fontWeight: "500" },
  attachIndicator:     { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  attachIndicatorText: { fontSize: 12, color: "#888" },
  cardFooter:          { flexDirection: "row", justifyContent: "space-between",
                         alignItems: "center", marginTop: 10, paddingTop: 8,
                         borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  postedBy:            { fontSize: 12, color: "#999" },
  emptyText:           { textAlign: "center", color: "#999", fontSize: 15, marginTop: 40 },
});

export default NoticeListScreen;