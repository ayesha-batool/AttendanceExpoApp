import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
// import { useCasesContext } from '../../context/CasesContext';

import LocationMap from "../../components/LocationMap";
import dataCache from "../../services/dataCache";
import { hybridDataService } from "../../services/hybridDataService";

const DashboardScreen = () => {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const [employees, setEmployees] = useState([]);
  const spinValue = useRef(new Animated.Value(0)).current;
  const [cases, setCases] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState({ local: null, appwrite: null });

  // Animation effect for loading spinner
  useEffect(() => {
    if (loading) {
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
      return () => spinAnimation.stop();
    }
  }, [loading, spinValue]);
  const [customToast, setCustomToast] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [stats, setStats] = useState({
    employees: 0,
    cases: 0,
    expenses: 0,
  });
  const [appwriteHealth, setAppwriteHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  const showCustomToast = (type, title, message) => {
    setCustomToast({ type, title, message });
    setTimeout(() => setCustomToast(null), 3000);
  };

  useEffect(() => {
    fetchData();
    checkAppwriteHealth();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      setLoading(true);

      // Add a small delay to allow authentication session to be established
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log("🔍 [DASHBOARD] Starting to fetch cached data...");

      const [employeesData, casesData, expensesData] = await Promise.all([
        dataCache.getData("employees"),
        dataCache.getData("cases"),
        dataCache.getData("expenses"),
      ]);

      console.log("🔍 [DASHBOARD] Raw data received:");
      console.log("  - Employees raw:", employeesData);
      console.log("  - Cases raw:", casesData);
      console.log("  - Expenses raw:", expensesData);

      // More robust data validation - check for actual valid data objects
      const validEmployees = employeesData.filter((item) => {
        const isValid =
          item &&
          typeof item === "object" &&
          (item.name || item.fullName || item.employeeName) &&
          !item.deleted;
        if (!isValid && item) {
          console.log("🔍 [DASHBOARD] Invalid employee filtered out:", item);
        }
        return isValid;
      });

      const validCases = casesData.filter((item) => {
        const isValid =
          item &&
          typeof item === "object" &&
          (item.caseTitle || item.title || item.caseName) &&
          !item.deleted;
        if (!isValid && item) {
          console.log("🔍 [DASHBOARD] Invalid case filtered out:", item);
        }
        return isValid;
      });

      const validExpenses = expensesData.filter((item) => {
        const isValid =
          item &&
          typeof item === "object" &&
          (item.title || item.description || item.expenseTitle) &&
          !item.deleted;
        if (!isValid && item) {
          console.log("🔍 [DASHBOARD] Invalid expense filtered out:", item);
        }
        return isValid;
      });

      console.log("🔍 [DASHBOARD] After filtering:");
      console.log(
        "  - Valid employees:",
        validEmployees.length,
        validEmployees
      );
      console.log("  - Valid cases:", validCases.length, validCases);
      console.log("  - Valid expenses:", validExpenses.length, validExpenses);

      setEmployees(validEmployees);
      setCases(validCases);
      setExpenses(validExpenses);

      // Set the stats for display
      const newStats = {
        employees: validEmployees.length,
        cases: validCases.length,
        expenses: validExpenses.length,
      };

      console.log("✅ [DASHBOARD] Final stats being set:", newStats);
      setStats(newStats);

      // Check device IDs
      await checkDeviceIds();
    } catch (error) {
      console.error("❌ [DASHBOARD] Error fetching dashboard data:", error);
      // Set empty stats on error
      setStats({
        employees: 0,
        cases: 0,
        expenses: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [employeesData, casesData, expensesData] = await Promise.all([
        dataCache.getData("employees"),
        dataCache.getData("cases"),
        dataCache.getData("expenses"),
      ]);

      // Set the actual data arrays
      setEmployees(employeesData);
      setCases(casesData);
      setExpenses(expensesData);

      setStats({
        employees: employeesData.length,
        cases: casesData.length,
        expenses: expensesData.length,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkAppwriteHealth = async () => {
    try {
      setHealthLoading(true);
      const health = await hybridDataService.getAppwriteHealth();
      setAppwriteHealth(health);
    } catch (error) {
      console.error("Error forcing health check:", error);
    } finally {
      setHealthLoading(false);
    }
  };

  const checkDeviceIds = async () => {
    try {
      // Get local device ID from storage
      const localDeviceId = await AsyncStorage.getItem("deviceId");

      // Get device ID from Appwrite if online
      let appwriteDeviceId = null;
      try {
        const appwriteData = await dataCache.getData("employees");
        if (appwriteData.length > 0) {
          // Get the first employee's deviceId from Appwrite
          const firstEmployee = appwriteData[0];
          appwriteDeviceId = firstEmployee.deviceId;
        }
      } catch (error) {}

      setDeviceInfo({
        local: localDeviceId,
        appwrite: appwriteDeviceId,
      });
    } catch (error) {
      console.error("Error checking device IDs:", error);
    }
  };

  const getMonthlyExpenses = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter expenses for current month and year
    const monthlyExpenses = expenses.filter((expense) => {
      if (!expense.date) return false;

      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    });

    // Calculate total with proper error handling
    const total = monthlyExpenses.reduce((sum, expense) => {
      const amount = parseFloat(expense.amount) || 0;
      return sum + amount;
    }, 0);

    return total;
  };

  const getCurrentMonthExpensesBreakdown = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter expenses for current month and year
    const monthlyExpenses = expenses.filter((expense) => {
      if (!expense.date) return false;

      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    });

    // Group by category
    const breakdown = {};
    monthlyExpenses.forEach((expense) => {
      const category = expense.category || "Other";
      const amount = parseFloat(expense.amount) || 0;

      if (!breakdown[category]) {
        breakdown[category] = 0;
      }
      breakdown[category] += amount;
    });

    return breakdown;
  };

  const getUserInitials = () => {
    if (!currentUser) return "PMS"; // Police Management System initials
    if (currentUser.name) {
      return currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 3);
    }
    if (currentUser.email) {
      return currentUser.email.split("@")[0].toUpperCase().slice(0, 3);
    }
    return "U";
  };

  const handleLogout = async () => {
    try {
      await logout(); // Use the proper logout function from AuthContext
      setShowUserModal(false);
      router.replace("/auth"); // Navigate directly to auth page
    } catch (error) {
      console.error("❌ Logout failed:", error);
      showCustomToast("error", "Logout Failed", error.message);
    }
  };

 

  if (loading) {
    const spin = spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    });

    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons name="refresh" size={48} color="#1e40af" />
        </Animated.View>
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Custom Toast */}
      {customToast && (
        <View
          style={[
            styles.customToastContainer,
            customToast.type === "error"
              ? styles.errorToast
              : customToast.type === "success"
              ? styles.successToast
              : customToast.type === "warning"
              ? styles.warningToast
              : styles.infoToast,
          ]}
        >
          <Ionicons
            name={
              customToast.type === "error"
                ? "close-circle"
                : customToast.type === "success"
                ? "checkmark-circle"
                : customToast.type === "warning"
                ? "warning"
                : "information-circle"
            }
            size={20}
            color="#fff"
          />
          <View style={styles.toastContent}>
            <Text style={styles.toastTitle}>{customToast.title}</Text>
            <Text style={styles.toastMessage}>{customToast.message}</Text>
          </View>
        </View>
      )}

      <LinearGradient
        colors={["#1e40af", "#1e3a8a", "#1e293b"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <PageHeader
          title="Police Management System"
          subtitle="Department Overview & Analytics"
          icon="shield"
          gradientColors={["#1e40af", "#1e3a8a"]}
          showBackButton={false}
        />
      </LinearGradient>

      {/* Statistics Cards */}
      <View style={styles.statsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Statistics</Text>
          <TouchableOpacity
            onPress={fetchData}
            style={styles.refreshButton}
            disabled={loading}
          >
            <Ionicons
              name={loading ? "hourglass" : "refresh"}
              size={20}
              color="#64748b"
            />
          </TouchableOpacity>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={["#3b82f6", "#1d4ed8"]}
              style={styles.statGradient}
            >
              <View style={styles.statIconContainer}>
                <Ionicons name="people" size={28} color="#fff" />
              </View>
              <Text style={styles.statNumber}>{stats.employees}</Text>
              <Text style={styles.statLabel}>Employees</Text>
              <View style={styles.statTrend}>
                <Ionicons name="trending-up" size={16} color="#fff" />
                <Text style={styles.statTrendText}>Active</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={["#ef4444", "#dc2626"]}
              style={styles.statGradient}
            >
              <View style={styles.statIconContainer}>
                <Ionicons name="document-text" size={28} color="#fff" />
              </View>
              <Text style={styles.statNumber}>{stats.cases}</Text>
              <Text style={styles.statLabel}>Cases</Text>
              <View style={styles.statTrend}>
                <Ionicons name="trending-up" size={16} color="#fff" />
                <Text style={styles.statTrendText}>Ongoing</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={["#10b981", "#059669"]}
              style={styles.statGradient}
            >
              <View style={styles.statIconContainer}>
                <Ionicons name="card" size={28} color="#fff" />
              </View>
              <Text style={styles.statNumber}>{stats.expenses}</Text>
              <Text style={styles.statLabel}>Expenses</Text>
              <View style={styles.statTrend}>
                <Ionicons name="trending-up" size={16} color="#fff" />
                <Text style={styles.statTrendText}>Tracked</Text>
              </View>
            </LinearGradient>
          </View>
        </View>
      </View>

      {/* Action Cards */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/Employee")}
          >
            <LinearGradient
              colors={["#3b82f6", "#1d4ed8"]}
              style={styles.actionGradient}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="people" size={28} color="#fff" />
              </View>
              <Text style={styles.actionTitle}>Manage Employees</Text>
              <Text style={styles.actionSubtitle}>
                Add, edit, and manage personnel
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/Cases")}
          >
            <LinearGradient
              colors={["#ef4444", "#dc2626"]}
              style={styles.actionGradient}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="document-text" size={28} color="#fff" />
              </View>
              <Text style={styles.actionTitle}>Manage Cases</Text>
              <Text style={styles.actionSubtitle}>
                Track investigations and cases
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/ExpensesManagement")}
          >
            <LinearGradient
              colors={["#10b981", "#059669"]}
              style={styles.actionGradient}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="card" size={28} color="#fff" />
              </View>
              <Text style={styles.actionTitle}>Manage Expenses</Text>
              <Text style={styles.actionSubtitle}>Track and manage costs</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/DataTransfer")}
          >
            <LinearGradient
              colors={["#f97316", "#ea580c"]}
              style={styles.actionGradient}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="swap-horizontal" size={28} color="#fff" />
              </View>
              <Text style={styles.actionTitle}>Data Transfer</Text>
              <Text style={styles.actionSubtitle}>Export and import data</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

       <View style={styles.logoutSection}>
         <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
           <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.logoutGradient}>
             <Ionicons name="log-out" size={20} color="#fff" />
             <Text style={styles.logoutButtonText}>Logout</Text>
           </LinearGradient>
         </TouchableOpacity>
       </View>

      {/* Employee Map Section */}
      {showMap && (
        <View style={styles.mapSection}>
          <View style={styles.mapHeader}>
            <Text style={styles.sectionTitle}>Employee Locations</Text>
            <TouchableOpacity
              onPress={() => setShowMap(false)}
              style={styles.closeMapButton}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <View style={styles.mapContainer}>
            <LocationMap
              employees={employees}
              showMap={true}
              embedded={true}
              onMarkerClick={(employee) => {
                // Check if employee is already selected
                const isSelected = selectedEmployees.some(
                  (emp) => emp.id === employee.id
                );
                if (isSelected) {
                  // Remove from selection
                  setSelectedEmployees((prev) =>
                    prev.filter((emp) => emp.id !== employee.id)
                  );
                } else {
                  // Add to selection
                  setSelectedEmployees((prev) => [...prev, employee]);
                }
              }}
            />
          </View>

          {/* Employee Info Containers - Compact Grid */}
          {selectedEmployees.length > 0 && (
            <View style={styles.employeeContainersSection}>
              <View style={styles.employeesHeader}>
                <Text style={styles.employeesTitle}>
                  Selected ({selectedEmployees.length})
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedEmployees([])}
                  style={styles.clearAllButton}
                >
                  <Text style={styles.clearAllText}>Clear</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.employeeGrid}>
                {selectedEmployees.map((employee, index) => (
                  <View
                    key={employee.id || index}
                    style={styles.compactEmployeeCard}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        setSelectedEmployees((prev) =>
                          prev.filter((emp) => emp.id !== employee.id)
                        )
                      }
                      style={styles.compactCloseButton}
                    >
                      <Ionicons name="close" size={12} color="#64748b" />
                    </TouchableOpacity>
                    <View style={styles.compactAvatar}>
                      <Text style={styles.compactAvatarText}>
                        {(employee.fullName || employee.name || "N")
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.compactName} numberOfLines={1}>
                      {employee.fullName || employee.name}
                    </Text>
                    <Text style={styles.compactRank} numberOfLines={1}>
                      {employee.rank}
                    </Text>
                    <Text style={styles.compactBadge} numberOfLines={1}>
                      #{employee.badgeNumber || "N/A"}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Login Section - Show only if user is not logged in */}
      {!currentUser && (
        <View style={styles.loginSection}>
          <Text style={styles.sectionTitle}>Authentication</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/auth")}
          >
            <LinearGradient
              colors={["#10b981", "#059669"]}
              style={styles.loginGradient}
            >
              <Ionicons name="log-in" size={24} color="#fff" />
              <Text style={styles.loginButtonText}>
                Login to Police Management System
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* User Profile Modal */}
      <Modal
        visible={showUserModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Profile</Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {currentUser ? (
              <View style={styles.userProfileContent}>
                <View style={styles.userAvatarContainer}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {getUserInitials()}
                    </Text>
                  </View>
                </View>

                <View style={styles.userInfoSection}>
                  <Text style={styles.userName}>
                    {currentUser.name || "Police Officer"}
                  </Text>
                  <Text style={styles.userEmail}>{currentUser.email}</Text>
                </View>

                <View style={styles.modalActions}>
                  {/* Test button to verify TouchableOpacity works */}

                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={() => {
                      handleLogout();
                    }}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={["#dc2626", "#b91c1c"]}
                      style={styles.modalActionGradient}
                    >
                      <Ionicons name="log-out" size={20} color="#fff" />
                      <Text style={styles.modalActionText}>Logout</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.noUserContent}>
                <Ionicons name="person-circle" size={64} color="#64748b" />
                <Text style={styles.noUserText}>No user logged in</Text>
                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={() => {
                    setShowUserModal(false);
                    router.push("/auth");
                  }}
                >
                  <LinearGradient
                    colors={["#10b981", "#059669"]}
                    style={styles.modalActionGradient}
                  >
                    <Ionicons name="log-in" size={20} color="#fff" />
                    <Text style={styles.modalActionText}>Login</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  contentContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    fontSize: 18,
    color: "#64748b",
    marginTop: 16,
    fontWeight: "600",
  },
  header: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  headerStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  headerStat: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 80,
  },
  headerStatNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  headerStatLabel: {
    fontSize: 12,
    color: "#e5e7eb",
    textAlign: "center",
    opacity: 0.9,
  },
  kpiSection: {
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  kpiGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadowColor: "#000",
    boxShadowOffset: { width: 0, height: 4 },
    boxShadowOpacity: 0.1,
    boxShadowRadius: 12,
    elevation: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  kpiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  kpiContent: {
    flex: 1,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 3,
  },
  kpiLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 2,
  },
  kpiSubtext: {
    fontSize: 13,
    color: "#64748b",
  },
  actionsSection: {
    padding: 24,
    backgroundColor: "#fff",
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
    flex: 1,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    marginLeft: 12,
  },
  actionsGrid: {
    gap: 16,
  },
  actionCard: {
    borderRadius: 20,
    boxShadowColor: "#000",
    boxShadowOffset: { width: 0, height: 6 },
    boxShadowOpacity: 0.15,
    boxShadowRadius: 16,
    elevation: 6,
    marginBottom: 8,
  },
  actionGradient: {
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginTop: 12,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
  },
  loginSection: {
    padding: 16,
    marginTop: 16,
  },
  loginButton: {
    borderRadius: 16,
    boxShadowColor: "#000",
    boxShadowOffset: { width: 0, height: 4 },
    boxShadowOpacity: 0.1,
    boxShadowRadius: 12,
    elevation: 4,
  },
  loginGradient: {
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    margin: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
  },
  userProfileContent: {
    alignItems: "center",
  },
  userAvatarContainer: {
    marginBottom: 20,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1e40af",
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  userInfoSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 12,
  },

  modalActions: {
    width: "100%",
    gap: 12,
  },
  modalActionButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  modalActionGradient: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  modalActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
  noUserContent: {
    alignItems: "center",
    padding: 20,
  },
  noUserText: {
    fontSize: 18,
    color: "#64748b",
    marginTop: 12,
    marginBottom: 20,
  },
  debugSection: {
    padding: 16,
    marginTop: 16,
  },
  debugButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  debugButton: {
    flex: 1,
    borderRadius: 12,
    boxShadowColor: "#000",
    boxShadowOffset: { width: 0, height: 2 },
    boxShadowOpacity: 0.1,
    boxShadowRadius: 8,
    elevation: 3,
  },
  debugGradient: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  debugButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
  deviceInfoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    boxShadowColor: "#000",
    boxShadowOffset: { width: 0, height: 2 },
    boxShadowOpacity: 0.1,
    boxShadowRadius: 8,
    elevation: 3,
  },
  deviceInfoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
  },
  deviceInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  deviceInfoLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    flex: 1,
  },
  deviceInfoValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  customToastContainer: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: "#333",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    zIndex: 9999,
    elevation: 9999,
  },
  errorToast: {
    backgroundColor: "#dc2626",
  },
  successToast: {
    backgroundColor: "#10b981",
  },
  warningToast: {
    backgroundColor: "#f59e0b",
  },
  infoToast: {
    backgroundColor: "#3b82f6",
  },
  toastContent: {
    marginLeft: 10,
    flex: 1,
  },
  logoutGradient: {
    padding: 10,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: "auto",
    justifyContent: "center",
    width: "50%",
  },
   logoutSection: {
     padding: 20,
     backgroundColor: "#fff",
     marginTop: 8,
     alignItems: "center",
   },
   logoutButton: {
     width: "100%",
     maxWidth: 200,
     borderRadius: 16,
     shadowColor: "#000",
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.15,
     shadowRadius: 12,
     elevation: 4,
     overflow: "hidden",
   },
   logoutGradient: {
     padding: 16,
     flexDirection: "row",
     alignItems: "center",
     justifyContent: "center",
     gap: 8,
     flex: 1,
   },
   logoutButtonText: {
     fontSize: 16,
     fontWeight: "600",
     color: "#fff",
   },
  toastTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  toastMessage: {
    fontSize: 14,
    color: "#fff",
    marginTop: 2,
  },
  healthSection: {
    padding: 20,
  },
  healthCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  healthStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  healthDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  healthText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  healthMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontStyle: "italic",
  },
  dataOperationStatus: {
    fontSize: 14,
    color: "#10b981",
    marginBottom: 8,
    fontWeight: "500",
    textAlign: "center",
    paddingVertical: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  debugInfo: {
    backgroundColor: "#f3f4f6",
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  debugText: {
    fontSize: 12,
    color: "#6b7280",
    fontFamily: "monospace",
    marginBottom: 2,
  },
  healthActions: {
    flexDirection: "row",
    gap: 12,
  },
  healthButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    gap: 6,
  },
  healthButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#007AFF",
  },
  statsSection: {
    padding: 20,
    paddingBottom: 10,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  statGradient: {
    padding: 20,
    alignItems: "center",
    minHeight: 140,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#fff",
    marginTop: 8,
    opacity: 0.9,
    fontWeight: "600",
  },
  statTrend: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  statTrendText: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.9,
  },
  mapSection: {
    padding: 20,
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  closeMapButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  employeeContainersSection: {
    marginTop: 16,
  },
  employeesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  employeesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  clearAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#ef4444",
    borderRadius: 4,
  },
  clearAllText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#fff",
  },
  employeeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  compactEmployeeCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    width: "48%",
    marginBottom: 8,
    alignItems: "center",
    position: "relative",
    minHeight: 80,
  },
  compactCloseButton: {
    position: "absolute",
    top: 4,
    right: 4,
    padding: 4,
    borderRadius: 4,
    backgroundColor: "#e2e8f0",
    zIndex: 1,
  },
  compactAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  compactAvatarText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  compactName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 2,
  },
  compactRank: {
    fontSize: 10,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 2,
  },
  compactBadge: {
    fontSize: 9,
    color: "#94a3b8",
    textAlign: "center",
  },
});

export default DashboardScreen;
