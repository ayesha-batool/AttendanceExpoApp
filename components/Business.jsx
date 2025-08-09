// components/BusinessAndEmployee.jsx
import { useRouter } from "expo-router";
import React from "react";
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../context/AuthContext";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const Card = ({ title, image, onPress, iconColor, gradientColors }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.cardGradient}>
    <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
          <Image source={image} style={styles.icon} resizeMode="contain" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {title === "Police Officers" ? "Manage police officers and duty assignments" : "Manage your team members"}
          </Text>
        </View>
        <View style={styles.arrowContainer}>
          <Text style={styles.arrowText}>→</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const BusinessAndEmployee = () => {
  const router = useRouter();
  const { currentUser, loading } = useAuth();

  const handleNavigate = (type) => {
    if (loading) return;
    if (currentUser) {
      router.push(`/Dashboard?role=${type}`);
    } else {
      router.push("/auth");
    }
  };

  return (
    <View style={styles.container}>
     
      
    <View style={styles.row}>
      <Card
        title="Police Officers"
        image={require("../assets/images/Employee.png")}
        onPress={() => handleNavigate("employee")}
          iconColor="#F3E5F5"
          gradientColors={["#f093fb", "#f5576c"]}
      />
     
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: screenWidth > 768 ? 24 : 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: screenWidth > 768 ? 16 : 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: '100%',
    gap: 24,
  },
  card: {
    flex: 1,
    aspectRatio: 1.1,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: "#f8f9fa",
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    // padding: screenWidth > 768 ? 28 : 24,
    position: 'relative',
  },
  iconContainer: {
    width: screenWidth > 768 ? 100 : 90,
    height: screenWidth > 768 ? 100 : 90,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 6 },
    // shadowOpacity: 0.12,
    // shadowRadius: 12,
    elevation: 6,
    // borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  icon: {
   
    width: "100%",
    height: "100%",
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: screenWidth < 360 ? 18 : screenWidth > 768 ? 22 : 20,
    fontWeight: "800",
    color: "#1a1a1a",
    textAlign: "center",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: screenWidth < 360 ? 13 : screenWidth > 768 ? 15 : 14,
    fontWeight: "400",
    color: "#666666",
    textAlign: "center",
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  arrowContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007bff',
  },
});

export default BusinessAndEmployee;
