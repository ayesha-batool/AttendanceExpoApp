import { getAllUsers } from "@/services/phoneAuth";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const VerifyPhone = () => {
  const router = useRouter();
  const { phone, code, sessionId, verificationId } = useLocalSearchParams();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fullPhoneNumber = `${code}${phone}`;

  const handleVerify = async () => {
    if (!otp || otp.length < 4) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const confirmationResult = global.confirmationResult;
      const result = await confirmationResult.confirm(otp);
      Alert.alert("OTP Verified", "You have successfully logged in!");
      console.log('Authentication successful:', result);
      router.replace("/");
    } catch (err) {
      setError("Verification failed.");
    }
    setLoading(false);
  };

  const handleExtractUsers = async () => {
    console.log('Extracting all users...');
    await getAllUsers();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Verify Phone Number</Text>
        <Text style={styles.subtitle}>Code sent to: {fullPhoneNumber}</Text>
        
        {/* Debug info - remove in production */}
        <Text style={styles.debugInfo}>
          Session ID: {sessionId?.substring(0, 20)}...
        </Text>
        <Text style={styles.debugInfo}>
          Verification ID: {verificationId?.substring(0, 20)}...
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleVerify}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Verifying..." : "Verify"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.extractButton]} 
          onPress={handleExtractUsers}
        >
          <Text style={styles.buttonText}>
            Extract All Users
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  subtitle: { fontSize: 16, marginBottom: 30 },
  debugInfo: { 
    fontSize: 10, 
    color: '#666', 
    marginBottom: 5,
    fontFamily: 'monospace'
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
 
    width: 200,
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    width: 200,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  error: { color: "red", marginBottom: 10 },
  extractButton: {
    backgroundColor: "#4CAF50", // A different color for extraction
    marginTop: 10,
  },
});

export default VerifyPhone;
