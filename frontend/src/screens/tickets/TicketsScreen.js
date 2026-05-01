import React, { useState, useEffect } from "react";
import {
  View, Text, FlatList, StyleSheet, TextInput,
  ActivityIndicator, TouchableOpacity, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMyTickets } from "../../services/api";

const FILTERS = ["all", "open", "forwarded", "in_progress", "resolved", "closed"];

const STATUS_STYLES = {
  open:        { badge: { backgroundColor: "#e8f0fe" }, text: { color: "#1a73e8" } },
  forwarded:   { badge: { backgroundColor: "#fff3e0" }, text: { color: "#e65100" } },
  in_progress: { badge: { backgroundColor: "#f3e5f5" }, text: { color: "#7b1fa2" } },
  resolved:    { badge: { backgroundColor: "#e6f4ea" }, text: { color: "#2e7d32" } },
  closed:      { badge: { backgroundColor: "#f0f0f0" }, text: { color: "#555"    } },
};

const PRIORITY_STYLES = {
  low:    { backgroundColor: "#e6f4ea", color: "#2e7d32" },
  medium: { backgroundColor: "#fff3e0", color: "#e65100" },
  high:   { backgroundColor: "#fce8e6", color: "#c62828" },
};

const TicketsScreen = ({ navigation }) => {
  const [tickets, setTickets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTickets(); }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => fetchTickets());
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const normalized = searchQuery.trim().toLowerCase();
    const byStatus = activeFilter === "all"
      ? tickets
      : tickets.filter((t) => t.status === activeFilter);
    const bySearch = normalized
      ? byStatus.filter((t) => t.title?.toLowerCase().includes(normalized))
      : byStatus;
    setFiltered(bySearch);
  }, [activeFilter, searchQuery, tickets]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await getMyTickets();
      setTickets(res.data);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Could not load tickets");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1a73e8" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.raiseBtn} onPress={() => navigation.navigate("RaiseTicket")}>
        <Text style={styles.raiseBtnText}>+ Raise a Ticket</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by title..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        style={styles.filterBar}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterBtn, activeFilter === item && styles.filterBtnActive]}
            onPress={() => setActiveFilter(item)}
          >
            <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>
              {item.replace("_", " ")}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("TicketDetail", { ticketId: item._id })}>
            <View style={styles.cardHeader}>
              <View style={[styles.priorityDot, { backgroundColor: PRIORITY_STYLES[item.priority]?.color || "#888" }]} />
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <View style={[styles.statusBadge, STATUS_STYLES[item.status]?.badge]}>
                <Text style={[styles.statusText, STATUS_STYLES[item.status]?.text]}>
                  {item.status.replace("_", " ")}
                </Text>
              </View>
            </View>

            <View style={styles.cardMeta}>
              <View style={[styles.categoryBadge]}>
                <Text style={styles.categoryText}>{item.category.replace("_", " ")}</Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_STYLES[item.priority]?.backgroundColor }]}>
                <Text style={[styles.priorityText, { color: PRIORITY_STYLES[item.priority]?.color }]}>{item.priority}</Text>
              </View>
            </View>

            {item.raisedFor && (
              <Text style={styles.onBehalfText}>On behalf of: {item.raisedFor.name}</Text>
            )}

            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery.trim() ? "No tickets match your search" : "No tickets raised yet"}
            </Text>
            {!searchQuery.trim() && (
              <Text style={styles.emptySubText}>Tap the button above to raise your first ticket</Text>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: "4%" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  raiseBtn: { backgroundColor: "#1a73e8", padding: "4%", borderRadius: 8, alignItems: "center", marginBottom: "4%" },
  raiseBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  searchInput: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 8, padding: 10, fontSize: 13, color: "#333", marginBottom: 10 },
  filterBar: { marginBottom: 10, flexGrow: 0 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "#ccc", backgroundColor: "#fff", marginRight: 8 },
  filterBtnActive: { backgroundColor: "#1a73e8", borderColor: "#1a73e8" },
  filterText: { fontSize: 12, color: "#555", textTransform: "capitalize" },
  filterTextActive: { color: "#fff", fontWeight: "bold" },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: "4%", marginBottom: "3%", borderWidth: 1, borderColor: "#e0e0e0" },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: "3%" },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: "bold", color: "#333" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: "bold", textTransform: "capitalize" },
  cardMeta: { flexDirection: "row", gap: 8, marginBottom: "2%" },
  categoryBadge: { backgroundColor: "#f0f0f0", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  categoryText: { fontSize: 11, color: "#555", textTransform: "capitalize" },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  priorityText: { fontSize: 11, fontWeight: "bold", textTransform: "capitalize" },
  onBehalfText: { fontSize: 12, color: "#7b1fa2", marginBottom: "1%" },
  dateText: { fontSize: 11, color: "#999" },
  emptyContainer: { alignItems: "center", marginTop: "20%" },
  emptyText: { fontSize: 15, fontWeight: "bold", color: "#555", marginBottom: "2%" },
  emptySubText: { fontSize: 13, color: "#999", textAlign: "center" },
});

export default TicketsScreen;