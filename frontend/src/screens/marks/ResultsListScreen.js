import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
import { getMyResults } from "../../services/api";

const ResultsListScreen = ({ navigation }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await getMyResults();
      setResults(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchResults();
    setRefreshing(false);
  };

  const getGradeColor = (grade) => {
    if (grade === "A") return "#27ae60";
    if (grade === "B") return "#2980b9";
    if (grade === "C") return "#f39c12";
    if (grade === "D") return "#e67e22";
    return "#e74c3c";
  };

  const getGradeBg = (grade) => {
    if (grade === "A") return "#d5f5e3";
    if (grade === "B") return "#d6eaf8";
    if (grade === "C") return "#fef9e7";
    if (grade === "D") return "#fdebd0";
    return "#fdecea";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text style={styles.loadingText}>Loading your results...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>My Results</Text>

      {results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Results Yet</Text>
          <Text style={styles.emptyText}>
            Your published results will appear here
          </Text>
        </View>
      ) : (
        results.map((result) => (
          <TouchableOpacity
            key={result._id}
            style={styles.resultCard}
            onPress={() =>
              navigation.navigate("ResultDetail", { result })
            }
          >
            <View style={styles.cardLeft}>
              <Text style={styles.courseTitle}>
                {result.course?.title}
              </Text>
              <Text style={styles.courseCode}>
                {result.course?.courseCode}
              </Text>
              {result.remarks ? (
                <Text style={styles.remarks} numberOfLines={1}>
                  📝 {result.remarks}
                </Text>
              ) : null}
            </View>

            <View
              style={[
                styles.gradeBox,
                { backgroundColor: getGradeBg(result.grade) },
              ]}
            >
              <Text
                style={[
                  styles.grade,
                  { color: getGradeColor(result.grade) },
                ]}
              >
                {result.grade}
              </Text>
              <Text style={styles.marks}>{result.marks}/100</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={styles.bottomSpacing} />
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: "6%",
    marginTop: "2%",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: "20%",
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
  },
  resultCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardLeft: {
    flex: 1,
    marginRight: 12,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 13,
    color: "#999",
    marginBottom: 6,
  },
  remarks: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
  },
  gradeBox: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    padding: 12,
    minWidth: 70,
  },
  grade: {
    fontSize: 28,
    fontWeight: "bold",
  },
  marks: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default ResultsListScreen;