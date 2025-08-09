// components/DashboardHeader.js
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";

const DashboardHeader = () => {
  const { currentUser } = useAuth();
  console.log(currentUser?.username);
  const initials = currentUser?.username
    ? currentUser.username
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <View style={styles.header}>
      <Text>{currentUser?.username}</Text>
      <Ionicons name="business-outline" size={24} color="#34495e" />
      <Text style={styles.title}>Polic Dashboard</Text>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingRight: 10,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#34495e",
  },
  avatar: {
    backgroundColor: "#34495e",
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default DashboardHeader;
