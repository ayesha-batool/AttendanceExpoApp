import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import AddOfficerModal from "../../components/AddOfficerModal";
import CaseDetailsModal from "../../components/CaseDetailsModal";
import EmployeeCard from "../../components/EmployeeCard";
import EmployeeDetailsModal from "../../components/EmployeeDetailsModal";

import OfflineStatus from "../../components/OfflineStatus";

import { hybridDataService } from "../../services/hybridDataService";
import { formatLocationForStorage, getAccuracyDescription, getCurrentLocationWithAddress, parseStoredLocation } from "../../utils/geocoding";

const DeviceEmployeeRegistration = () => {
  const router = useRouter();
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [deviceEmployee, setDeviceEmployee] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddOfficerModal, setShowAddOfficerModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCaseDetailsModal, setShowCaseDetailsModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [assignedCases, setAssignedCases] = useState([]);
  const [customToast, setCustomToast] = useState(null);


  const [isSyncing, setIsSyncing] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    initializePage();
  }, []);

  const showCustomToast = (type, title, message) => {
    setCustomToast({ type, title, message });
    setTimeout(() => setCustomToast(null), 3000);
  };

  const getStatusColor = (status) => ({
    active: '#10b981',
    pending: '#f59e0b',
    closed: '#6b7280',
    archived: '#9ca3af'
  }[status] || '#6b7280');

  const getPriorityColor = (priority) => ({
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626'
  }[priority] || '#6b7280');

  const setCurrentLocationAsWorkLocation = async () => {
    try {
      setIsGettingLocation(true);
      showCustomToast("info", "Getting Location", "Getting high-accuracy location...");
      
      const { location, address } = await getCurrentLocationWithAddress();
      
      // Automatically set as work location
      if (!deviceEmployee) {
        showCustomToast('error', 'Error', 'No employee found to update');
        return;
      }

      // Prepare location data with datetime and address
      const workLocation = formatLocationForStorage(location, address);
      
      // Update employee with new work location and address
      const updatedEmployee = {
        ...deviceEmployee,
        workLocation: workLocation,
        workLocationAddress: address, // Store the address
        updatedAt: new Date().toISOString()
      };
      
      const key = `employees_${deviceEmployee.id}`;
      await hybridDataService.updateData(key, deviceEmployee.id, updatedEmployee, "employees");
      
      const accuracyDesc = getAccuracyDescription(location.coords.accuracy);
      const accuracyInfo = `Accuracy: ${accuracyDesc}, ±${location.coords.accuracy.toFixed(1)}m`;
      
      let successMessage;
      if (location.lowAccuracy) {
        successMessage = address 
          ? `Work location set: ${address}\n⚠️ ${location.accuracyWarning}`
          : `Work location set\n⚠️ ${location.accuracyWarning}`;
      } else {
        successMessage = address 
          ? `Work location set: ${address}\n✅ ${accuracyInfo}`
          : `Work location set\n✅ ${accuracyInfo}`;
      }
      
      showCustomToast("success", "Location Set", successMessage);
      
      // Refresh the page to show updated data
      await initializePage();
      
    } catch (error) {
      console.error("❌ Error setting work location:", error);
      
      if (error.message === 'Location permission denied') {
        showCustomToast('error', 'Permission Denied', 'Location permission is required to set your work location');
      } else {
        showCustomToast("error", "Location Error", "Failed to set work location. Please try again.");
      }
    } finally {
      setIsGettingLocation(false);
    }
  };



  const initializePage = async () => {
    try {
    
      // Get device ID from storage
      const deviceId = await AsyncStorage.getItem('deviceId');
      console.log("deviceId", deviceId);
      const device = { deviceId };
      setDeviceInfo(device);

      // Fetch all employees and filter by device ID and registration type
      const allEmployeesData = await hybridDataService.getItems("employees");
      setAllEmployees(allEmployeesData);

      // Get hostname for filtering
      const hostname = hybridDataService.getHostname();
      const expectedDeviceEmployeeId = `device_${hostname}_${device.deviceId}`;
      
      console.log("🔍 [DEVICE EMPLOYEE FILTER] Base device ID:", device.deviceId);
      console.log("🔍 [DEVICE EMPLOYEE FILTER] Hostname:", hostname);
      console.log("🔍 [DEVICE EMPLOYEE FILTER] Expected device employee ID:", expectedDeviceEmployeeId);
      
      // First try to find with new hostname format and registrationType
      let employeeForThisDevice = allEmployeesData.find(
        (emp) => emp.deviceId === expectedDeviceEmployeeId && emp.registrationType === "device"
      );
      
      // If not found, try to find with old format (for backward compatibility)
      if (!employeeForThisDevice) {
        employeeForThisDevice = allEmployeesData.find(
          (emp) => (emp.deviceId === device.deviceId || emp.deviceId === `DEVICE_${device.deviceId}`) && emp.registrationType === "device"
        );
      }
      
      // Additional fallback: check for any employee that might be associated with this device
      if (!employeeForThisDevice) {
        employeeForThisDevice = allEmployeesData.find(
          (emp) => emp && emp.deviceId && emp.registrationType === "device" && (
            emp.deviceId === device.deviceId || 
            emp.deviceId === `DEVICE_${device.deviceId}` ||
            emp.deviceId.includes(device.deviceId) ||
            device.deviceId.includes(emp.deviceId)
          )
        );
      }
      
     
      if (employeeForThisDevice) {
        setDeviceEmployee(employeeForThisDevice);
        
        // Fetch assigned cases for this device employee
        try {
          const casesData = await hybridDataService.getItems("cases");
          const employeeCases = casesData.filter(caseItem => 
            caseItem && 
            caseItem.assignedOfficer && 
            (caseItem.assignedOfficer === employeeForThisDevice.name || 
             caseItem.assignedOfficer === employeeForThisDevice.fullName)
          );
          setAssignedCases(employeeCases);
        } catch (caseError) {
          console.error("❌ Error loading assigned cases:", caseError);
          setAssignedCases([]);
        }
      } else {
        setDeviceEmployee(null);
        setAssignedCases([]);
      }

      setLoading(false);
    } catch (error) {
      console.error("❌ Error initializing page:", error);
      showCustomToast('error', 'Error', 'Failed to initialize page');
      setLoading(false);
    }
  };

  const handleAddOfficerSuccess = async (officerData) => {
    try {
      const isEditing = deviceEmployee && deviceEmployee.id;
      
      if (isEditing) {
        const message = `Employee ${officerData.fullName} has been successfully updated. The employee data has been synced with the main system.`;
        showCustomToast("success", "Update Successful", message);
      } else {
        // Check if device employee already exists (for new registration)
        if (deviceEmployee) {
          showCustomToast(
            "error",
            "Error",
            "Only one device employee can be registered per device. Please remove the existing device employee first."
          );
          return;
        }
        
        const hostname = hybridDataService.getHostname();
        const deviceEmployeeId = `device_${hostname}_${deviceInfo?.deviceId}`;
        const message = `Employee ${officerData.fullName} has been successfully registered as a device employee for this device (${deviceEmployeeId}). This device is now locked to this employee. Only this employee can mark attendance on this device. The employee data has been synced with the main system for online/offline access.`;
        showCustomToast("success", "Registration Successful", message);
      }

      // Wait a moment for the data to be fully saved
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh the page to get the updated data
      await initializePage();
      
    } catch (error) {
      console.error("❌ Error handling officer success:", error);
      showCustomToast("error", "Error", "Failed to complete employee registration");
    }
  };

  const handleAddOfficer = () => {
    if (deviceEmployee) {
      showCustomToast(
        "error",
        "Error",
        "Only one device employee can be registered per device. Please remove the existing device employee first."
      );
      return;
    }
    setShowAddOfficerModal(true);
  };

  const handleEditEmployee = (employee) => {
    // For device employee, we can edit the existing employee
       setShowAddOfficerModal(true);
  };

  const handleShowEmployeeDetails = (employee) => {
       setShowDetailsModal(true);
  };

  const handleShowCaseDetails = (caseItem) => {
    setSelectedCase(caseItem);
    setShowCaseDetailsModal(true);
  };

  const handleDeleteEmployee = async (employee) => {
    try {
         
      // Check for different possible ID field names
      const employeeId = employee.id || employee.$id || employee.documentId;
      
      if (!employeeId) {
        console.error("❌ Employee ID is missing! Available fields:", Object.keys(employee));
        showCustomToast("error", "Error", "Employee ID is missing");
        return;
      }
      
      const key = `employees_${employeeId}`;
      
      await hybridDataService.deleteData(key, employeeId, "employees");
      showCustomToast("success", "Success", "Employee deleted successfully");
      initializePage();
    } catch (error) {
      console.error("❌ Error deleting employee:", error);
      showCustomToast("error", "Error", "Failed to delete employee");
    }
  };

  const handleToggleStatus = async (employee) => {
    try {
      const newStatus = employee.status === "active" ? "inactive" : "active";
      const key = `employees_${employee.id}`;
      await hybridDataService.updateData(key, employee.id, { ...employee, status: newStatus }, "employees");
      showCustomToast("success", "Success", `Employee status updated to ${newStatus}`);
      initializePage();
    } catch (error) {
      console.error("❌ Error toggling employee status:", error);
      showCustomToast("error", "Error", "Failed to update employee status");
    }
  };

  const toggleMapView = () => {
    setShowMap(!showMap);
  };



  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      showCustomToast("info", "Syncing", "Syncing data with server...");
      
              const result = await hybridDataService.syncWithMongoDB("employees");
      if (result.success) {
        showCustomToast("success", "Sync Complete", result.message);
        // Refresh the page to show updated data
        await initializePage();
      } else {
        showCustomToast("error", "Sync Failed", result.message || "Failed to sync data");
      }
    } catch (error) {
      console.error("❌ Manual sync failed:", error);
      showCustomToast("error", "Sync Error", "Failed to sync data. Please check your connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Offline Status */}
      <OfflineStatus />
      
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
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Ionicons name="shield" size={40} color="#fff" />
          <Text style={styles.headerTitle}>Police Shield</Text>
          <Text style={styles.headerSubtitle}>
            Device-Based Employee System
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
         {/* Device ID Card */}
         <View style={styles.deviceCard}>
          <View style={styles.deviceHeader}>
            <Ionicons name="phone-portrait" size={24} color="#3b82f6" />
            <Text style={styles.deviceTitle}>Device Information</Text>
           </View>
          
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceLabel}>Device ID:</Text>
            <Text style={styles.deviceValue} numberOfLines={1} ellipsizeMode="middle">
              {deviceInfo?.deviceId}
            </Text>
          </View>
          
          
         
        </View>

        {deviceEmployee ? (
          /* Existing Employee View - Using EmployeeCard Component */
          <View style={styles.employeeContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Device-Registered Employee</Text>
            </View>

        
            <EmployeeCard
              employee={deviceEmployee}
              onPress={handleShowEmployeeDetails}
              onEdit={handleEditEmployee}
              onDelete={handleDeleteEmployee}
              onToggleStatus={handleToggleStatus}
            />
          
            {/* Work Location Section */}
            <View style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <Text style={styles.cardTitle}>Work Location</Text>
              </View>
              
            
              
              {deviceEmployee.workLocation ? (
                <View style={styles.locationInfo}>
                  <Ionicons name="location" size={20} color="#10b981" />
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationText}>
                      Work location is set
                    </Text>
                    <Text style={styles.locationAddress}>
                      {(() => {
                        const locationData = parseStoredLocation(deviceEmployee.workLocation);
                        if (locationData.isValid) {
                          const datetime = new Date(locationData.timestamp).toLocaleString();
                          
                          // Try to get address from stored data or show coordinates
                          const storedAddress = deviceEmployee.workLocationAddress || locationData.address;
                          if (storedAddress) {
                            return `${storedAddress}\nCoordinates: ${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}\nSet on: ${datetime}`;
                          } else {
                            return `${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}\nSet on: ${datetime}`;
                          }
                        }
                        return deviceEmployee.workLocation;
                      })()}
                    </Text>
                  </View>
                
                </View>
              ) : (
                <View style={styles.locationInfo}>
                  <Ionicons name="location-outline" size={20} color="#6b7280" />
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationText}>
                      No work location set
                    </Text>
                    <Text style={styles.locationDescription}>
                      Set your current location as work location for attendance tracking
                    </Text>
                  </View>
                </View>
              )}
              

              
              <TouchableOpacity 
                style={[styles.locationButton, isGettingLocation && styles.locationButtonDisabled]}
                onPress={setCurrentLocationAsWorkLocation}
                disabled={isGettingLocation}
                activeOpacity={0.8}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <LinearGradient
                  colors={['#3b82f6', '#1d4ed8']}
                  style={styles.buttonGradient}
                >
                  {isGettingLocation ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="location" size={20} color="#fff" />
                  )}
                  <Text style={styles.buttonText}>
                    {isGettingLocation ? 'Getting Accurate Location...' : 'Set Current Location as Work Location'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              
              {/* <GPSAccuracyInfo /> */}
            </View>

            {/* Assigned Cases Section */}
            {assignedCases.length > 0 && (
              <View style={styles.casesCard}>
                <View style={styles.casesHeader}>
                  <Text style={styles.cardTitle}>Assigned Cases</Text>
                  <Text style={styles.casesCount}>{assignedCases.length} case{assignedCases.length !== 1 ? 's' : ''}</Text>
                </View>
                
                {assignedCases.map((caseItem, index) => (
                  <TouchableOpacity
                    key={caseItem.id || caseItem.$id || index}
                    style={styles.caseItem}
                    onPress={() => handleShowCaseDetails(caseItem)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.caseInfo}>
                      <Text style={styles.caseTitle} numberOfLines={1}>
                        {caseItem.title || 'Untitled Case'}
                      </Text>
                      <Text style={styles.caseDescription} numberOfLines={2}>
                        {caseItem.description || 'No description available'}
                      </Text>
                      <View style={styles.caseMeta}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(caseItem.status) }]}>
                          <Text style={styles.statusText}>{caseItem.status || 'Unknown'}</Text>
                        </View>
                        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(caseItem.priority) }]}>
                          <Text style={styles.priorityText}>{caseItem.priority || 'Unknown'}</Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : (
          /* Registration Button */
          <View style={styles.emptyContainer}>
            <Ionicons name="person-add-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No Device Employee Registered</Text>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleAddOfficer}
              activeOpacity={0.8}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <LinearGradient
                colors={["#3b82f6", "#1d4ed8"]}
                style={styles.buttonGradient}
              >
                <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.buttonText}>Register as Device Employee</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Add Officer Modal */}
      <AddOfficerModal
        visible={showAddOfficerModal}
        onClose={() => setShowAddOfficerModal(false)}
        onSuccess={handleAddOfficerSuccess}
        editingOfficer={deviceEmployee}
        deviceInfo={deviceInfo}
        workLocation={null}
      />

      {/* Employee Details Modal */}
      <EmployeeDetailsModal
        visible={showDetailsModal}
        employee={deviceEmployee}
        onClose={() => setShowDetailsModal(false)}
        onEmployeeUpdate={() => {
          initializePage();
          setTimeout(() => {
            initializePage();
          }, 1000);
        }}
      />

      {/* Case Details Modal */}
      <CaseDetailsModal
        visible={showCaseDetailsModal}
        caseData={selectedCase}
        onClose={() => {
          setShowCaseDetailsModal(false);
          setSelectedCase(null);
        }}
      />


    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#64748b",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#cbd5e1",
    marginTop: 5,
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  employeeContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 20,
    marginBottom: 30,
    textAlign: "center",
  },
  registerButton: {
    width: "100%",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },

  locationSummary: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  summaryText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },

  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  locationDetails: {
    flex: 1,
    marginLeft: 10,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 5,
  },
  locationDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  locationAddress: {
    fontSize: 14,
    color: '#047857',
    marginBottom: 5,
    lineHeight: 20,
  },


  locationButton: {
    marginTop: 10,
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },


  // Toast Styles
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
  toastTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  deviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 10,
    flex: 1,
  },
  syncButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  deviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  deviceLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  deviceValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 8,
  },
  infoButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  toastMessage: {
    fontSize: 14,
    color: "#fff",
    marginTop: 2,
  },
  // Cases Section Styles
  casesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  casesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  casesCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  caseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  caseInfo: {
    flex: 1,
    marginRight: 10,
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 5,
  },
  caseDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  caseMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default DeviceEmployeeRegistration;
 