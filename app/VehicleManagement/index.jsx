import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import InputField from '../../components/InputField';
import LoadingOverlay from '../../components/LoadingOverlay';
import SelectDropdown from '../../components/SelectDropdown';
import { useAuth } from '../../context/AuthContext';
import { getItems, handleDataDelete, handleDataSubmit, useNetworkStatus } from '../../services/dataHandler';

const PoliceFleetManagementScreen = () => {
  const [vehicles, setVehicles] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [fuel, setFuel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [activeTab, setActiveTab] = useState('fleet');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const [newVehicle, setNewVehicle] = useState({
    plateNumber: '',
    vehicleType: '',
    make: '',
    model: '',
    year: '',
    color: '',
    engineNumber: '',
    chassisNumber: '',
    fuelType: '',
    transmission: '',
    assignedOfficer: '',
    assignedOfficerName: '',
    status: 'available',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: '',
    insuranceExpiry: '',
    registrationExpiry: '',
    lastServiceDate: '',
    nextServiceDate: '',
    mileage: '',
    fuelEfficiency: '',
    notes: ''
  });

  const VEHICLE_TYPES = [
    { id: 'patrol', name: 'Patrol Car', color: '#007AFF', icon: 'car-outline' },
    { id: 'suv', name: 'SUV', color: '#34C759', icon: 'car-sport-outline' },
    { id: 'motorcycle', name: 'Motorcycle', color: '#FF9500', icon: 'bicycle-outline' },
    { id: 'van', name: 'Van', color: '#AF52DE', icon: 'car-outline' },
    { id: 'truck', name: 'Truck', color: '#5856D6', icon: 'car-outline' },
    { id: 'ambulance', name: 'Ambulance', color: '#FF3B30', icon: 'medical-outline' }
  ];

  const VEHICLE_STATUS = [
    { id: 'available', name: 'Available', color: '#34C759', icon: 'checkmark-circle-outline' },
    { id: 'in_use', name: 'In Use', color: '#FF9500', icon: 'time-outline' },
    { id: 'maintenance', name: 'Maintenance', color: '#FF3B30', icon: 'construct-outline' },
    { id: 'out_of_service', name: 'Out of Service', color: '#8E8E93', icon: 'close-circle-outline' }
  ];

  const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'];
  const TRANSMISSION_TYPES = ['Manual', 'Automatic', 'CVT'];

  const { currentUser } = useAuth();
  const isConnected = useNetworkStatus();
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vehicleData, officerData, maintenanceData, fuelData] = await Promise.all([
        getItems('vehicles'),
        getItems('employees'),
        getItems('maintenance'),
        getItems('fuel')
      ]);
      
      // Filter out null values and sort vehicles by plate number
      const validVehicles = vehicleData.filter(v => v && v !== null).sort((a, b) => 
        (a.plateNumber || '').localeCompare(b.plateNumber || '')
      );
      const validOfficers = officerData.filter(o => o && o !== null);
      
      setVehicles(validVehicles);
      setOfficers(validOfficers);
      setMaintenance(maintenanceData.filter(m => m && m !== null));
      setFuel(fuelData.filter(f => f && f !== null));
    } catch (error) {
      console.error('Error fetching fleet data:', error);
      Alert.alert('Error', 'Failed to fetch fleet data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const saveVehicle = async () => {
    if (!newVehicle.plateNumber.trim()) {
      Alert.alert('Error', 'Please enter plate number');
      return;
    }

    if (!newVehicle.vehicleType) {
      Alert.alert('Error', 'Please select vehicle type');
      return;
    }

    if (!newVehicle.make.trim()) {
      Alert.alert('Error', 'Please enter vehicle make');
      return;
    }

    if (!newVehicle.model.trim()) {
      Alert.alert('Error', 'Please enter vehicle model');
      return;
    }

    try {
      const vehicleData = {
        ...newVehicle,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.$id
      };

      if (selectedVehicle) {
        await handleDataUpdate('vehicles', selectedVehicle.$id, vehicleData, 'vehicles');
        // Removed success toast
      } else {
        await handleDataSubmit('vehicles', vehicleData);
        // Removed success toast
      }

      setShowAddModal(false);
      setSelectedVehicle(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save vehicle'
      });
    }
  };

  const resetForm = () => {
    setNewVehicle({
      plateNumber: '',
      vehicleType: '',
      make: '',
      model: '',
      year: '',
      color: '',
      engineNumber: '',
      chassisNumber: '',
      fuelType: '',
      transmission: '',
      assignedOfficer: '',
      assignedOfficerName: '',
      status: 'available',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: '',
      insuranceExpiry: '',
      registrationExpiry: '',
      lastServiceDate: '',
      nextServiceDate: '',
      mileage: '',
      fuelEfficiency: '',
      notes: ''
    });
  };

  const handleVehiclePress = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailsModal(true);
  };

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setNewVehicle({
      plateNumber: vehicle.plateNumber || '',
      vehicleType: vehicle.vehicleType || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      color: vehicle.color || '',
      engineNumber: vehicle.engineNumber || '',
      chassisNumber: vehicle.chassisNumber || '',
      fuelType: vehicle.fuelType || '',
      transmission: vehicle.transmission || '',
      assignedOfficer: vehicle.assignedOfficer || '',
      assignedOfficerName: vehicle.assignedOfficerName || '',
      status: vehicle.status || 'available',
      purchaseDate: vehicle.purchaseDate || new Date().toISOString().split('T')[0],
      purchasePrice: vehicle.purchasePrice || '',
      insuranceExpiry: vehicle.insuranceExpiry || '',
      registrationExpiry: vehicle.registrationExpiry || '',
      lastServiceDate: vehicle.lastServiceDate || '',
      nextServiceDate: vehicle.nextServiceDate || '',
      mileage: vehicle.mileage || '',
      fuelEfficiency: vehicle.fuelEfficiency || '',
      notes: vehicle.notes || ''
    });
    setShowAddModal(true);
  };

  const deleteVehicle = async (vehicleId) => {
    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete this vehicle? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await handleDataDelete('vehicles', vehicleId);
              // Removed success toast
              fetchData();
            } catch (error) {
              console.error('Error deleting vehicle:', error);
              Alert.alert('Error', 'Failed to delete vehicle');
            }
          }
        }
      ]
    );
  };

  const filterVehicles = () => {
    let filtered = vehicles.filter(vehicle => vehicle !== null && vehicle !== undefined);

    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(vehicle => 
        (vehicle.plateNumber && vehicle.plateNumber.toLowerCase().includes(query)) ||
        (vehicle.make && vehicle.make.toLowerCase().includes(query)) ||
        (vehicle.model && vehicle.model.toLowerCase().includes(query)) ||
        (vehicle.assignedOfficerName && vehicle.assignedOfficerName.toLowerCase().includes(query))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.vehicleType === typeFilter);
    }

    return filtered;
  };

  const getFleetStats = () => {
    const stats = {
      total: vehicles.length,
      available: vehicles.filter(v => v && v.status === 'available').length,
      inUse: vehicles.filter(v => v && v.status === 'in_use').length,
      maintenance: vehicles.filter(v => v && v.status === 'maintenance').length,
      outOfService: vehicles.filter(v => v && v.status === 'out_of_service').length
    };
    return stats;
  };

  const getStatusColor = (status) => {
    const statusObj = VEHICLE_STATUS.find(s => s.id === status);
    return statusObj ? statusObj.color : '#8E8E93';
  };

  const getTypeColor = (type) => {
    const typeObj = VEHICLE_TYPES.find(t => t.id === type);
    return typeObj ? typeObj.color : '#8E8E93';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const stats = getFleetStats();
  const filteredVehicles = filterVehicles();

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#007AFF', '#0056CC']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fleet Management</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <LinearGradient colors={['#007AFF', '#0056CC']} style={styles.summaryGradient}>
                <Ionicons name="car" size={24} color="#fff" />
                <Text style={styles.summaryValue}>{stats.total}</Text>
                <Text style={styles.summaryLabel}>Total Vehicles</Text>
              </LinearGradient>
            </View>
            <View style={styles.summaryCard}>
              <LinearGradient colors={['#34C759', '#28A745']} style={styles.summaryGradient}>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.summaryValue}>{stats.available}</Text>
                <Text style={styles.summaryLabel}>Available</Text>
              </LinearGradient>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <LinearGradient colors={['#FF9500', '#FF6B00']} style={styles.summaryGradient}>
                <Ionicons name="time" size={24} color="#fff" />
                <Text style={styles.summaryValue}>{stats.inUse}</Text>
                <Text style={styles.summaryLabel}>In Use</Text>
              </LinearGradient>
            </View>
            <View style={styles.summaryCard}>
              <LinearGradient colors={['#FF3B30', '#DC143C']} style={styles.summaryGradient}>
                <Ionicons name="construct" size={24} color="#fff" />
                <Text style={styles.summaryValue}>{stats.maintenance}</Text>
                <Text style={styles.summaryLabel}>Maintenance</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <InputField
            placeholder="Search by plate number, make, model, or officer..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            icon="search-outline"
          />
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={20} color="#007AFF" />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Options */}
        {showFilters && (
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.filterChip, statusFilter === 'all' && styles.activeFilterChip]}
                onPress={() => setStatusFilter('all')}
              >
                <Text style={[styles.filterChipText, statusFilter === 'all' && styles.activeFilterChipText]}>
                  All Status
                </Text>
              </TouchableOpacity>
              {VEHICLE_STATUS.map(status => (
                <TouchableOpacity
                  key={status.id}
                  style={[styles.filterChip, statusFilter === status.id && styles.activeFilterChip]}
                  onPress={() => setStatusFilter(status.id)}
                >
                  <Ionicons name={status.icon} size={16} color={statusFilter === status.id ? '#fff' : status.color} />
                  <Text style={[styles.filterChipText, statusFilter === status.id && styles.activeFilterChipText]}>
                    {status.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Vehicles List */}
        <View style={styles.vehiclesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              🚗 Police Fleet ({filteredVehicles.length})
            </Text>
          </View>

          {filteredVehicles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="car-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>
                {searchQuery || statusFilter !== 'all' ? 'No Vehicles Found' : 'No Vehicles Added'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Add your first police vehicle to get started'
                }
              </Text>
              {!searchQuery && statusFilter === 'all' && (
                <TouchableOpacity 
                  style={styles.addFirstButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addFirstButtonText}>Add First Vehicle</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredVehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.$id}
                style={styles.vehicleCard}
                onPress={() => handleVehiclePress(vehicle)}
                activeOpacity={0.7}
              >
                <View style={styles.vehicleHeader}>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.plateNumber}>{vehicle.plateNumber || 'No Plate'}</Text>
                    <Text style={styles.vehicleMakeModel}>
                      {vehicle.make} {vehicle.model} {vehicle.year}
                    </Text>
                    <View style={styles.vehicleTypeContainer}>
                      <View style={[styles.typeBadge, { backgroundColor: getTypeColor(vehicle.vehicleType) }]}>
                        <Ionicons name={VEHICLE_TYPES.find(t => t.id === vehicle.vehicleType)?.icon || 'car'} size={12} color="#fff" />
                        <Text style={styles.typeText}>{VEHICLE_TYPES.find(t => t.id === vehicle.vehicleType)?.name || vehicle.vehicleType}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(vehicle.status) }]}>
                        <Text style={styles.statusText}>{VEHICLE_STATUS.find(s => s.id === vehicle.status)?.name || vehicle.status}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.vehicleActions}>
                    <TouchableOpacity onPress={() => handleEditVehicle(vehicle)}>
                      <Ionicons name="pencil-outline" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteVehicle(vehicle.$id)}>
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.vehicleDetails}>
                  {vehicle.assignedOfficerName && (
                    <View style={styles.detailRow}>
                      <Ionicons name="person" size={16} color="#666" />
                      <Text style={styles.detailText}>
                        Assigned: {vehicle.assignedOfficerName}
                      </Text>
                    </View>
                  )}
                  
                  {vehicle.mileage && (
                    <View style={styles.detailRow}>
                      <Ionicons name="speedometer" size={16} color="#666" />
                      <Text style={styles.detailText}>
                        Mileage: {vehicle.mileage} km
                      </Text>
                    </View>
                  )}
                  
                  {vehicle.fuelType && (
                    <View style={styles.detailRow}>
                      <Ionicons name="water" size={16} color="#666" />
                      <Text style={styles.detailText}>
                        Fuel: {vehicle.fuelType}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Vehicle Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                setSelectedVehicle(null);
                resetForm();
              }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.formContainer}>
                {/* Basic Information */}
                <Text style={styles.formSectionTitle}>🚗 Basic Information</Text>
                
                <InputField
                  label="Plate Number *"
                  value={newVehicle.plateNumber}
                  onChangeText={(text) => setNewVehicle(prev => ({ ...prev, plateNumber: text.toUpperCase() }))}
                  placeholder="Enter plate number"
                />

                <SelectDropdown
                  label="Vehicle Type *"
                  value={newVehicle.vehicleType}
                  onValueChange={(value) => setNewVehicle(prev => ({ ...prev, vehicleType: value }))}
                  items={VEHICLE_TYPES.map(type => ({
                    label: type.name,
                    value: type.id
                  }))}
                  placeholder="Select vehicle type"
                />

                <InputField
                  label="Make *"
                  value={newVehicle.make}
                  onChangeText={(text) => setNewVehicle(prev => ({ ...prev, make: text }))}
                  placeholder="Enter vehicle make"
                />

                <InputField
                  label="Model *"
                  value={newVehicle.model}
                  onChangeText={(text) => setNewVehicle(prev => ({ ...prev, model: text }))}
                  placeholder="Enter vehicle model"
                />

                <InputField
                  label="Year"
                  value={newVehicle.year}
                  onChangeText={(text) => setNewVehicle(prev => ({ ...prev, year: text }))}
                  placeholder="Enter year"
                  keyboardType="numeric"
                />

                <InputField
                  label="Color"
                  value={newVehicle.color}
                  onChangeText={(text) => setNewVehicle(prev => ({ ...prev, color: text }))}
                  placeholder="Enter color"
                />

                {/* Technical Information */}
                <Text style={styles.formSectionTitle}>🔧 Technical Information</Text>
                
                <InputField
                  label="Engine Number"
                  value={newVehicle.engineNumber}
                  onChangeText={(text) => setNewVehicle(prev => ({ ...prev, engineNumber: text }))}
                  placeholder="Enter engine number"
                />

                <InputField
                  label="Chassis Number"
                  value={newVehicle.chassisNumber}
                  onChangeText={(text) => setNewVehicle(prev => ({ ...prev, chassisNumber: text }))}
                  placeholder="Enter chassis number"
                />

                <SelectDropdown
                  label="Fuel Type"
                  value={newVehicle.fuelType}
                  onValueChange={(value) => setNewVehicle(prev => ({ ...prev, fuelType: value }))}
                  items={FUEL_TYPES.map(type => ({
                    label: type,
                    value: type
                  }))}
                  placeholder="Select fuel type"
                />

                <SelectDropdown
                  label="Transmission"
                  value={newVehicle.transmission}
                  onValueChange={(value) => setNewVehicle(prev => ({ ...prev, transmission: value }))}
                  items={TRANSMISSION_TYPES.map(type => ({
                    label: type,
                    value: type
                  }))}
                  placeholder="Select transmission"
                />

                {/* Assignment Information */}
                <Text style={styles.formSectionTitle}>👮 Assignment Information</Text>
                
                <SelectDropdown
                  label="Assigned Officer"
                  value={newVehicle.assignedOfficer}
                  onValueChange={(value) => {
                    const officer = officers.find(o => o.$id === value);
                    setNewVehicle(prev => ({
                      ...prev,
                      assignedOfficer: value,
                      assignedOfficerName: officer ? (officer.fullName || officer.name) : ''
                    }));
                  }}
                  items={officers.map(officer => ({
                    label: officer.fullName || officer.name || 'Unknown',
                    value: officer.$id
                  }))}
                  placeholder="Select assigned officer"
                />

                <SelectDropdown
                  label="Status"
                  value={newVehicle.status}
                  onValueChange={(value) => setNewVehicle(prev => ({ ...prev, status: value }))}
                  items={VEHICLE_STATUS.map(status => ({
                    label: status.name,
                    value: status.id
                  }))}
                  placeholder="Select status"
                />

                {/* Financial Information */}
                <Text style={styles.formSectionTitle}>💰 Financial Information</Text>
                
                <InputField
                  label="Purchase Price"
                  value={newVehicle.purchasePrice}
                  onChangeText={(text) => setNewVehicle(prev => ({ ...prev, purchasePrice: text }))}
                  placeholder="Enter purchase price"
                  keyboardType="numeric"
                />

                <InputField
                  label="Mileage (km)"
                  value={newVehicle.mileage}
                  onChangeText={(text) => setNewVehicle(prev => ({ ...prev, mileage: text }))}
                  placeholder="Enter current mileage"
                  keyboardType="numeric"
                />

                <InputField
                  label="Fuel Efficiency (km/l)"
                  value={newVehicle.fuelEfficiency}
                  onChangeText={(text) => setNewVehicle(prev => ({ ...prev, fuelEfficiency: text }))}
                  placeholder="Enter fuel efficiency"
                  keyboardType="numeric"
                />

                {/* Important Dates */}
                <Text style={styles.formSectionTitle}>📅 Important Dates</Text>
                
                <InputField
                  label="Purchase Date"
                  value={newVehicle.purchaseDate}
                  onChangeText={(text) => setNewVehicle(prev => ({ ...prev, purchaseDate: text }))}
                  placeholder="YYYY-MM-DD"
                />

                <InputField
                  label="Insurance Expiry"
                  value={newVehicle.insuranceExpiry}
                  onChangeText={(text) => setNewVehicle(prev => ({ ...prev, insuranceExpiry: text }))}
                  placeholder="YYYY-MM-DD"
                />

                <InputField
                  label="Registration Expiry"
                  value={newVehicle.registrationExpiry}
                  onChangeText={(text) => setNewVehicle(prev => ({ ...prev, registrationExpiry: text }))}
                  placeholder="YYYY-MM-DD"
                />

                <InputField
                  label="Last Service Date"
                  value={newVehicle.lastServiceDate}
                  onChangeText={(text) => setNewVehicle(prev => ({ ...prev, lastServiceDate: text }))}
                  placeholder="YYYY-MM-DD"
                />

                <InputField
                  label="Next Service Date"
                  value={newVehicle.nextServiceDate}
                  onChangeText={(text) => setNewVehicle(prev => ({ ...prev, nextServiceDate: text }))}
                  placeholder="YYYY-MM-DD"
                />

                {/* Additional Information */}
                <Text style={styles.formSectionTitle}>📝 Additional Information</Text>
                
                <InputField
                  label="Notes"
                  value={newVehicle.notes}
                  onChangeText={(text) => setNewVehicle(prev => ({ ...prev, notes: text }))}
                  placeholder="Enter any additional notes"
                  multiline={true}
                  numberOfLines={4}
                />

                {/* Submit Button */}
                <TouchableOpacity style={styles.submitButton} onPress={saveVehicle}>
                  <LinearGradient colors={['#007AFF', '#0056CC']} style={styles.submitGradient}>
                    <Text style={styles.submitButtonText}>
                      {selectedVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Vehicle Details Modal */}
      <Modal visible={showDetailsModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedVehicle ? (
              <ScrollView style={styles.modalScroll}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Vehicle Details</Text>
                  <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.detailsContainer}>
                  <View style={styles.vehicleHeader}>
                    <View style={styles.vehicleIcon}>
                      <Ionicons name="car" size={40} color="#007AFF" />
                    </View>
                    <Text style={styles.vehicleTitle}>{selectedVehicle.plateNumber}</Text>
                    <Text style={styles.vehicleSubtitle}>
                      {selectedVehicle.make} {selectedVehicle.model} {selectedVehicle.year}
                    </Text>
                    <View style={styles.vehicleTypeContainer}>
                      <View style={[styles.typeBadge, { backgroundColor: getTypeColor(selectedVehicle.vehicleType) }]}>
                        <Ionicons name={VEHICLE_TYPES.find(t => t.id === selectedVehicle.vehicleType)?.icon || 'car'} size={16} color="#fff" />
                        <Text style={styles.typeText}>{VEHICLE_TYPES.find(t => t.id === selectedVehicle.vehicleType)?.name || selectedVehicle.vehicleType}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedVehicle.status) }]}>
                        <Text style={styles.statusText}>{VEHICLE_STATUS.find(s => s.id === selectedVehicle.status)?.name || selectedVehicle.status}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>🚗 Vehicle Information</Text>
                    
                    {selectedVehicle.color && (
                      <View style={styles.detailRow}>
                        <Ionicons name="color-palette" size={16} color="#007AFF" />
                        <Text style={styles.detailLabel}>Color:</Text>
                        <Text style={styles.detailValue}>{selectedVehicle.color}</Text>
                      </View>
                    )}
                    
                    {selectedVehicle.fuelType && (
                      <View style={styles.detailRow}>
                        <Ionicons name="water" size={16} color="#007AFF" />
                        <Text style={styles.detailLabel}>Fuel Type:</Text>
                        <Text style={styles.detailValue}>{selectedVehicle.fuelType}</Text>
                      </View>
                    )}
                    
                    {selectedVehicle.transmission && (
                      <View style={styles.detailRow}>
                        <Ionicons name="settings" size={16} color="#007AFF" />
                        <Text style={styles.detailLabel}>Transmission:</Text>
                        <Text style={styles.detailValue}>{selectedVehicle.transmission}</Text>
                      </View>
                    )}
                    
                    {selectedVehicle.mileage && (
                      <View style={styles.detailRow}>
                        <Ionicons name="speedometer" size={16} color="#007AFF" />
                        <Text style={styles.detailLabel}>Mileage:</Text>
                        <Text style={styles.detailValue}>{selectedVehicle.mileage} km</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>👮 Assignment</Text>
                    
                    {selectedVehicle.assignedOfficerName ? (
                      <View style={styles.detailRow}>
                        <Ionicons name="person" size={16} color="#007AFF" />
                        <Text style={styles.detailLabel}>Assigned Officer:</Text>
                        <Text style={styles.detailValue}>{selectedVehicle.assignedOfficerName}</Text>
                      </View>
                    ) : (
                      <View style={styles.detailRow}>
                        <Ionicons name="person-outline" size={16} color="#007AFF" />
                        <Text style={styles.detailLabel}>Assigned Officer:</Text>
                        <Text style={styles.detailValue}>Not Assigned</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>📅 Important Dates</Text>
                    
                    {selectedVehicle.purchaseDate && (
                      <View style={styles.detailRow}>
                        <Ionicons name="calendar" size={16} color="#007AFF" />
                        <Text style={styles.detailLabel}>Purchase Date:</Text>
                        <Text style={styles.detailValue}>{formatDate(selectedVehicle.purchaseDate)}</Text>
                      </View>
                    )}
                    
                    {selectedVehicle.insuranceExpiry && (
                      <View style={styles.detailRow}>
                        <Ionicons name="shield" size={16} color="#007AFF" />
                        <Text style={styles.detailLabel}>Insurance Expiry:</Text>
                        <Text style={styles.detailValue}>{formatDate(selectedVehicle.insuranceExpiry)}</Text>
                      </View>
                    )}
                    
                    {selectedVehicle.registrationExpiry && (
                      <View style={styles.detailRow}>
                        <Ionicons name="document-text" size={16} color="#007AFF" />
                        <Text style={styles.detailLabel}>Registration Expiry:</Text>
                        <Text style={styles.detailValue}>{formatDate(selectedVehicle.registrationExpiry)}</Text>
                      </View>
                    )}
                    
                    {selectedVehicle.nextServiceDate && (
                      <View style={styles.detailRow}>
                        <Ionicons name="construct" size={16} color="#007AFF" />
                        <Text style={styles.detailLabel}>Next Service:</Text>
                        <Text style={styles.detailValue}>{formatDate(selectedVehicle.nextServiceDate)}</Text>
                      </View>
                    )}
                  </View>
                  
                  {selectedVehicle.notes && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>📝 Notes</Text>
                      <Text style={styles.notesText}>{selectedVehicle.notes}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                      setShowDetailsModal(false);
                      handleEditVehicle(selectedVehicle);
                    }}
                  >
                    <Ionicons name="create" size={20} color="#007AFF" />
                    <Text style={styles.actionButtonText}>Edit Vehicle</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteActionButton]}
                    onPress={() => {
                      setShowDetailsModal(false);
                      deleteVehicle(selectedVehicle.$id);
                    }}
                  >
                    <Ionicons name="trash" size={20} color="#FF3B30" />
                    <Text style={[styles.actionButtonText, styles.deleteActionText]}>Delete Vehicle</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>No Vehicle Selected</Text>
                <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  summaryGradient: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  summaryLabel: {
    fontSize: 12,
    color: '#fff',
    marginTop: 8,
    fontWeight: '600'
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  itemAmount: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  formContainer: {
    padding: 20
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16
  },
  vehicleSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9'
  },
  selectedVehicle: {
    fontSize: 16,
    color: '#333'
  },
  placeholderText: {
    fontSize: 16,
    color: '#999'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9'
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    gap: 8
  },
  filterButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600'
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 8
  },
  activeFilterChip: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600'
  },
  activeFilterChipText: {
    color: '#fff',
  },
  vehiclesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  vehicleCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  plateNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  vehicleMakeModel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  vehicleTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
    gap: 4
  },
  typeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
    gap: 4
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600'
  },
  vehicleActions: {
    flexDirection: 'row',
    gap: 12,
  },
  vehicleDetails: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalScroll: {
    flex: 1,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  submitGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsContainer: {
    padding: 20,
  },
  vehicleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  vehicleSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  detailSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  deleteActionButton: {
    backgroundColor: '#FF3B30',
  },
  deleteActionText: {
    color: '#fff',
  },
});

export default PoliceFleetManagementScreen; 