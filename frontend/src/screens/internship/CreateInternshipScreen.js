import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { createInternship } from "../../services/api";

const CreateInternshipScreen = ({ navigation }) => {
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorEmail, setSupervisorEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"] });
      if (!result.canceled) {
        const asset = result.assets?.[0] || result;
        setFile(asset);
      }
    } catch (error) {
      Alert.alert("Error", "Unable to select a file.");
    }
  };

  const handleSubmit = async () => {
    if (!companyName || !companyAddress || !supervisorName || !supervisorEmail || !startDate || !endDate) {
      return Alert.alert("Missing fields", "Please fill in all required fields.");
    }

    const formData = new FormData();
    formData.append("companyName", companyName);
    formData.append("companyAddress", companyAddress);
    formData.append("supervisorName", supervisorName);
    formData.append("supervisorEmail", supervisorEmail);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);

    if (file) {
      formData.append("companyLetter", {
        uri: file.uri,
        type: file.mimeType || "application/octet-stream",
        name: file.name || "company_letter",
      });
    }

    setSubmitting(true);
    try {
      await createInternship(formData);
      Alert.alert("Success", "Internship placement created successfully.", [
        { text: "OK", onPress: () => navigation.navigate("Internship") },
      ]);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Unable to create your internship placement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Create Internship Placement</Text>
      <Text style={styles.instructions}>
        Enter your company details and upload a company letter to begin your internship placement.
      </Text>

      <Text style={styles.label}>Company Name</Text>
      <TextInput style={styles.input} value={companyName} onChangeText={setCompanyName} placeholder="e.g. XYZ Ltd" />

      <Text style={styles.label}>Company Address</Text>
      <TextInput style={styles.input} value={companyAddress} onChangeText={setCompanyAddress} placeholder="Street, City, Country" />

      <Text style={styles.label}>Supervisor Name</Text>
      <TextInput style={styles.input} value={supervisorName} onChangeText={setSupervisorName} placeholder="Supervisor name" />

      <Text style={styles.label}>Supervisor Email</Text>
      <TextInput style={styles.input} value={supervisorEmail} onChangeText={setSupervisorEmail} placeholder="supervisor@example.com" keyboardType="email-address" />

      <Text style={styles.label}>Start Date</Text>
      <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />

      <Text style={styles.label}>End Date</Text>
      <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />

      <TouchableOpacity style={styles.fileButton} onPress={pickFile}>
        <Text style={styles.fileButtonText}>{file ? file.name || "Selected file" : "Upload company letter"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit Placement</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    color: "#111827",
  },
  instructions: {
    color: "#6b7280",
    marginBottom: 20,
    lineHeight: 20,
  },
  label: {
    marginTop: 12,
    color: "#374151",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  fileButton: {
    marginTop: 18,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#1a56db",
  },
  fileButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    textAlign: "center",
  },
  submitButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 10,
    backgroundColor: "#0f4cdd",
  },
  submitButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
  },
});

export default CreateInternshipScreen;
