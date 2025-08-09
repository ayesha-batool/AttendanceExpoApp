import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const LoadingOverlay = () => (
  <View style={StyleSheet.absoluteFill}>
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color="#ffffff" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 18,
    marginTop: 10,
    fontWeight: "bold",
  },
});

export default LoadingOverlay; // ✅ required
