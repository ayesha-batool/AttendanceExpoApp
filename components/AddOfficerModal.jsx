// Components
import DatePickerField from "./DatePickerField";

import InputField from "./InputField";
import SelectDropdown from "./SelectDropdown";
// External Libraries
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";


// Contexts & Services
import { useAuth } from "../context/AuthContext";
import { hybridDataService } from "../services/hybridDataService";
import { CUSTOM_VALIDATORS, formatErrorMessage, validateForm, VALIDATION_SCHEMAS } from "../utils/validation";


// Constants - Only keep gender options as they are static
// Constants - Only keep gender options as they are static
const GENDER_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Rather not say", value: "Rather not say" }
];

const PAYMENT_TYPE_OPTIONS = [
  { label: "Hourly", value: "hourly" },
  { label: "Daily", value: "daily" },
  { label: "Monthly", value: "monthly" }
];

const DAYS_OF_WEEK = [
  { label: "Monday", value: "Monday" },
  { label: "Tuesday", value: "Tuesday" },
  { label: "Wednesday", value: "Wednesday" },
  { label: "Thursday", value: "Thursday" },
  { label: "Friday", value: "Friday" },
  { label: "Saturday", value: "Saturday" },
  { label: "Sunday", value: "Sunday" }
];





const AddOfficerModal = ({ visible, onClose, onSuccess, editingOfficer = null, deviceInfo = null, workLocation = null }) => {
  const { currentUser } = useAuth();
  const [form, setForm] = useState({
    badgeNumber: "", fullName: "", fatherName: "", cnic: "", dateOfBirth: new Date("2000-01-01"), gender: "",
    contactNumber: "", email: "", address: "", joiningDate: new Date("2020-01-01"), rank: "", department: "", 
    postingStation: "", shift: "", status: "active", isArmed: false, 
    serviceYears: "", lastPromotionDate: new Date(),
    disciplinaryActions: "", trainingCertifications: "", salary: "", overtimeRate: "", 
    monthlyOvertimeHours: "", totalAdvances: "", lastAdvanceDate: new Date(), 
    weaponLicenseNumber: "", drivingLicenseNumber: "", equipmentAssigned: "",
    vehicleAssigned: "", workLocation: "", supervisor: "", notes: "",
    // Payroll fields
    paymentType: "monthly", // hourly, daily, monthly
    salary: "", // This will be used for hourly rate, daily rate, or monthly salary based on payment type
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], // default weekdays
    checkInTime: "09:00", // default 9 AM
    checkOutTime: "17:00", // default 5 PM
    overtimeRate: "", // multiplier for overtime (e.g., 1.5x)
    bonus: "" // bonus amount to add to total pay
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [errors, setErrors] = useState({});
  const [existingEmployees, setExistingEmployees] = useState([]);
  const [supervisorOptions, setSupervisorOptions] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({
    departments: [],
    ranks: [],
    employment_status: []
  });
  const [customToast, setCustomToast] = useState(null);

  useEffect(() => {
    if (editingOfficer) {
      loadOfficerData();
    } else {
      resetForm();
    }
    loadExistingEmployees();
  }, [editingOfficer]);

  // Separate useEffect for loading dropdown options only when modal first opens
  useEffect(() => {
    if (visible) {
      loadInitialDropdownOptions();
    }
  }, [visible]);

  const loadInitialDropdownOptions = async () => {
    try {
      const [departments, ranks, status] = await Promise.all([
        hybridDataService.getOptions('departments'),
        hybridDataService.getOptions('ranks'),
        hybridDataService.getOptions('employment_status')
      ]);

      setDropdownOptions({
        departments: departments.map(option => ({ label: option, value: option })),
        ranks: ranks.map(option => ({ label: option, value: option })),
        employment_status: status.map(option => ({ label: option, value: option }))
      });
    } catch (error) {
      console.error('Error loading initial dropdown options:', error);
    }
  };

  // Auto-calculate service years when joining date changes
  useEffect(() => {
    if (form.joiningDate) {
      const joiningDate = new Date(form.joiningDate);
      const currentDate = new Date();
      const yearsDiff = currentDate.getFullYear() - joiningDate.getFullYear();
      const monthDiff = currentDate.getMonth() - joiningDate.getMonth();
      const dayDiff = currentDate.getDate() - joiningDate.getDate();

      let serviceYears = yearsDiff;
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        serviceYears = yearsDiff - 1;
      }
      serviceYears = Math.max(0, serviceYears);

      if (serviceYears.toString() !== form.serviceYears) {
        updateForm("serviceYears", serviceYears.toString());
      }
    }
  }, [form.joiningDate]);

  const resetForm = () => {
    setForm({
      badgeNumber: "", fullName: "", fatherName: "", cnic: "", dateOfBirth: new Date("2000-01-01"), gender: "",
      contactNumber: "", email: "", address: "", joiningDate: new Date("2020-01-01"), rank: "", department: "", 
      postingStation: "", shift: "", status: "active", isArmed: false, 
      serviceYears: "", lastPromotionDate: new Date(),
      disciplinaryActions: "", trainingCertifications: "", salary: "", overtimeRate: "", 
      monthlyOvertimeHours: "", totalAdvances: "", lastAdvanceDate: new Date(), 
      weaponLicenseNumber: "", drivingLicenseNumber: "", equipmentAssigned: "",
      vehicleAssigned: "", workLocation: "", supervisor: "", notes: "",
      // Payroll fields
      paymentType: "monthly",
      salary: "",
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      checkInTime: "09:00",
      checkOutTime: "17:00",
      overtimeRate: "",
      bonus: ""
    });
    setActiveTab("basic");
  };

  const loadOfficerData = async () => {
    if (!editingOfficer) return;
    try {
      setForm({
        badgeNumber: editingOfficer.badgeNumber || editingOfficer.employeeId || "",
        fullName: editingOfficer.fullName || "", fatherName: editingOfficer.fatherName || "",
        cnic: editingOfficer.cnic || "", dateOfBirth: editingOfficer.dateOfBirth ? new Date(editingOfficer.dateOfBirth) : new Date(),
        gender: editingOfficer.gender || "", contactNumber: editingOfficer.contactNumber || editingOfficer.phone || "",
        email: editingOfficer.email || "", address: editingOfficer.address || "",
        joiningDate: editingOfficer.joiningDate ? new Date(editingOfficer.joiningDate) : new Date(),
        rank: editingOfficer.rank || "", department: editingOfficer.department || "",
        postingStation: editingOfficer.postingStation || "",
        shift: editingOfficer.shift || editingOfficer.dutyShift || "",
        status: editingOfficer.status || editingOfficer.status || "active",
        isArmed: editingOfficer.isArmed || false,
        serviceYears: editingOfficer.serviceYears || "",
        lastPromotionDate: editingOfficer.lastPromotionDate ? new Date(editingOfficer.lastPromotionDate) : new Date(),
        disciplinaryActions: editingOfficer.disciplinaryActions || "",
        trainingCertifications: editingOfficer.trainingCertifications || "",
        salary: editingOfficer.salary || "", overtimeRate: editingOfficer.overtimeRate || "",
        monthlyOvertimeHours: editingOfficer.monthlyOvertimeHours || "",
        totalAdvances: editingOfficer.totalAdvances || "",
        lastAdvanceDate: editingOfficer.lastAdvanceDate ? new Date(editingOfficer.lastAdvanceDate) : new Date(),
        benefits: editingOfficer.benefits || "", allowances: editingOfficer.allowances || "",
        weaponLicenseNumber: editingOfficer.weaponLicenseNumber || "",
        drivingLicenseNumber: editingOfficer.drivingLicenseNumber || "",
        equipmentAssigned: editingOfficer.equipmentAssigned || "",
        vehicleAssigned: editingOfficer.vehicleAssigned || "",
        workLocation: editingOfficer.workLocation || "", supervisor: editingOfficer.supervisor || "",
        notes: editingOfficer.notes || "",
        // Payroll fields
        paymentType: editingOfficer.paymentType || "monthly",
        salary: editingOfficer.salary || "",
        workingDays: editingOfficer.workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        checkInTime: editingOfficer.checkInTime || "09:00",
        checkOutTime: editingOfficer.checkOutTime || "17:00",
        overtimeRate: editingOfficer.overtimeRate || "",
        bonus: editingOfficer.bonus || ""
      });
    } catch (error) {
      console.error('Failed to load officer data:', error);
    }
  };

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const refreshDropdownOptions = async (fieldName) => {
    try {
      const allOptions = await hybridDataService.getOptions(fieldName);
      const formattedOptions = allOptions.map(option => ({ label: option, value: option }));
      
      setDropdownOptions(prev => ({
        ...prev,
        [fieldName]: formattedOptions
      }));
    } catch (error) {
      console.error('Error refreshing dropdown options:', error);
    }
  };



  const handleOptionRemoved = async (removedOption, fieldName) => {
    setCustomToast({
      type: 'success',
      title: 'Success',
      message: `${fieldName.replace('_', ' ')} removed successfully`
    });
    setTimeout(() => setCustomToast(null), 3000);
    
    // Update dropdown options locally without triggering full refresh
    setDropdownOptions(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter(option => option.value !== removedOption)
    }));
    
    // Clear the form field if the removed option was selected
    if (form[fieldName] === removedOption) {
      updateForm(fieldName, '');
    }
  };

  const handleOptionAdded = async (newOption, fieldName) => {
    setCustomToast({
      type: 'success',
      title: 'Success',
      message: `New ${fieldName.replace('_', ' ')} added successfully`
    });
    setTimeout(() => setCustomToast(null), 3000);
    
    // Update dropdown options locally without triggering full refresh
    setDropdownOptions(prev => ({
      ...prev,
      [fieldName]: [...prev[fieldName], { label: newOption, value: newOption }]
    }));
    
    // Set the new option as the selected value for the current field
    updateForm(fieldName, newOption);
  };

  // Test function to debug Appwrite setup (v2.0)
  const testAppwriteSetup = async () => {
    try {
      
      // Force cache refresh by adding timestamp
      const cacheBuster = Date.now();
      
      const result = await hybridDataService.getAppwriteHealth();
      
      if (result.success) {
        setCustomToast({
          type: 'success',
          title: 'Appwrite Test Success',
          message: `Storage service is working! Version: ${result.version}, Constructor: ${result.constructor}`
        });
      } else {
        setCustomToast({
          type: 'error',
          title: 'Appwrite Test Failed',
          message: `Error: ${result.error}. Version: ${result.version}. Try refreshing the page or clearing browser cache.`
        });
      }
    } catch (error) {
      console.error('❌ Test failed:', error);
      setCustomToast({
        type: 'error',
        title: 'Test Error',
        message: 'Test failed. Try refreshing the page or clearing browser cache.'
      });
    }
    setTimeout(() => setCustomToast(null), 5000);
  };

  const loadExistingEmployees = async () => {
    try {
      const employeesData = await hybridDataService.getItems("employees");
      const validEmployees = employeesData.filter(item => item && typeof item === 'object');
      const uniqueEmployees = validEmployees.filter((employee, index, self) => {
        const badgeNumber = employee.badgeNumber || employee.employeeId || "";
        const isDuplicate = index !== self.findIndex(emp => (emp.badgeNumber || emp.employeeId || "") === badgeNumber);
        return !isDuplicate;
      });
      setExistingEmployees(uniqueEmployees);

      // Filter out the current employee being edited from supervisor options
      const currentEmployeeId = editingOfficer?.id || editingOfficer?.$id;
      const currentEmployeeName = editingOfficer?.fullName;
      
      const supervisorOpts = uniqueEmployees
        .filter(emp => {
          // Exclude the current employee being edited
          if (currentEmployeeId && (emp.id === currentEmployeeId || emp.$id === currentEmployeeId)) {
            return false;
          }
          // Also exclude by name if ID is not available
          if (currentEmployeeName && emp.fullName === currentEmployeeName) {
            return false;
          }
          return true;
        })
        .map(emp => ({
        label: `${emp.fullName} (${emp.rank || "N/A"})`,
        value: emp.fullName,
          id: emp.id || emp.$id
      }));
      
      setSupervisorOptions(supervisorOpts);
    } catch (error) {
      // Error loading existing employees
    }
  };

  const validateFormData = () => {
    try {
      const formToValidate = {
        badgeNumber: form.badgeNumber || "", fullName: form.fullName || "", cnic: form.cnic || "",
        contactNumber: form.contactNumber || "", email: form.email || "", address: form.address || "",
        department: form.department || "", rank: form.rank || "", shift: form.shift || "",
        status: form.status || "", salary: form.salary || "",
        dateOfBirth: form.dateOfBirth || "", joiningDate: form.joiningDate || ""
      };

      const validation = validateForm(formToValidate, VALIDATION_SCHEMAS.officer);

      // Custom validations
      if (form.dateOfBirth) {
        const ageError = CUSTOM_VALIDATORS.minimumAge(form.dateOfBirth, 18);
        if (ageError) { validation.errors.dateOfBirth = ageError; validation.isValid = false; }
      }

      if (form.salary) {
        const salaryError = CUSTOM_VALIDATORS.salaryRange(form.salary, 0, 1000000);
        if (salaryError) { validation.errors.salary = salaryError; validation.isValid = false; }
      }

      if (form.lastPromotionDate && form.joiningDate) {
        const promotionError = CUSTOM_VALIDATORS.promotionAfterJoining(form.lastPromotionDate, form.joiningDate);
        if (promotionError) { validation.errors.lastPromotionDate = promotionError; validation.isValid = false; }
      }

      

    
      if (form.badgeNumber?.trim()) {
        const badgeError = CUSTOM_VALIDATORS.uniqueBadgeNumber(
          form.badgeNumber, existingEmployees, editingOfficer?.id || editingOfficer?.$id
        );
        if (badgeError) { validation.errors.badgeNumber = badgeError; validation.isValid = false; }
      }

      // Validate time format (HH:MM)
      if (form.checkInTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(form.checkInTime)) {
        validation.errors.checkInTime = "Time must be in HH:MM format (e.g., 09:00)";
          validation.isValid = false;
      }

      if (form.checkOutTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(form.checkOutTime)) {
        validation.errors.checkOutTime = "Time must be in HH:MM format (e.g., 17:00)";
            validation.isValid = false;
          }

      // Validate bonus amount (must be positive number)
      if (form.bonus && (isNaN(form.bonus) || parseFloat(form.bonus) < 0)) {
        validation.errors.bonus = "Bonus must be a positive number";
        validation.isValid = false;
      }

      // Validate overtime rate (must be positive number)
      if (form.overtimeRate && (isNaN(form.overtimeRate) || parseFloat(form.overtimeRate) <= 0)) {
        validation.errors.overtimeRate = "Overtime rate must be a positive number";
        validation.isValid = false;
      }

      // Validate phone number format (Pakistani format: +923260764834)
      if (form.contactNumber) {
        const phoneRegex = /^\+923\d{9}$/;
        if (!phoneRegex.test(form.contactNumber)) {
          validation.errors.contactNumber = "Phone number must be in format +923XXXXXXXXX";
          validation.isValid = false;
        }
      }

      setErrors(validation.errors);
      return validation;
    } catch (error) {
      setErrors({ general: "Validation failed due to an unexpected error" });
      return false;
    }
  };

  const onSubmit = async () => {
    try {
      console.log("onSubmit called");
      const validationResult = validateFormData();
      console.log("Validation result:", validationResult);
      if (!validationResult.isValid) {
        const errorMessages = Object.values(validationResult.errors).filter(error => error && error.trim() !== "");
        const firstError = errorMessages.length > 0 ? errorMessages[0] : "Please fix the errors in the form";
        setCustomToast({
          type: 'error',
          title: 'Validation Error',
          message: firstError
        });
        setTimeout(() => setCustomToast(null), 4000);
        console.log("Validation failed, first error:", firstError);
        return;
      }

      setLoading(true);
      const officerData = {
        ...form,
        dateOfBirth: form.dateOfBirth.toISOString(),
        joiningDate: form.joiningDate.toISOString(),
        lastPromotionDate: form.lastPromotionDate.toISOString(),
        lastAdvanceDate: form.lastAdvanceDate.toISOString(),
        employeeId: form.badgeNumber,
        phone: form.contactNumber,
        postingStation: form.postingStation,
        dateOfJoining: form.joiningDate.toISOString(),
        dutyShift: form.shift,
        status: form.status,
        // photoUrl removed to prevent sync errors
      };

      console.log("Officer data before device/admin logic:", officerData);
      console.log("Current work location in form:", form.workLocation);
      console.log("Work location prop:", workLocation);
      console.log("Editing officer:", editingOfficer ? "Yes" : "No");

      // Set device-specific information if available (only for new employees)
      if (!editingOfficer) {
        console.log("🔍 [DEVICE ID LOGIC] deviceInfo:", deviceInfo);
        console.log("🔍 [DEVICE ID LOGIC] currentUser:", currentUser);
        
        if (deviceInfo && deviceInfo.deviceId) {
          // For new device employees, use device-specific device ID
          console.log("🔍 [DEVICE ID LOGIC] Using DEVICE employee logic");
          officerData.deviceId = await hybridDataService.getDeviceEmployeeDeviceId();
          officerData.registrationType = "device"; // Device-registered employee
          officerData.registeredBy = "device";
          officerData.registrationDate = new Date().toISOString();
          console.log("🔍 [DEVICE ID LOGIC] Device employee deviceId:", officerData.deviceId);
        } else {
          // For new admin employees, use admin-specific device ID
          console.log("🔍 [DEVICE ID LOGIC] Using ADMIN employee logic");
          officerData.deviceId = await hybridDataService.getAdminDeviceId();
          officerData.registrationType = "admin"; // Admin-created employee
          officerData.registeredBy = currentUser?.email || "admin";
          officerData.registrationDate = new Date().toISOString();
          console.log("🔍 [DEVICE ID LOGIC] Admin employee deviceId:", officerData.deviceId);
        }
      } else {
        // For existing employees, preserve their original device and registration info
        console.log("Preserving existing employee device and registration info:", {
          deviceId: editingOfficer.deviceId,
          registrationType: editingOfficer.registrationType,
          registeredBy: editingOfficer.registeredBy
        });
      }

      // Add work location if provided (only for new officers or if explicitly provided)
      if (workLocation && !editingOfficer) {
        // For new officers, use the provided work location
        officerData.workLocation = workLocation;
        console.log("Work location added for new officer:", workLocation);
      } else if (editingOfficer && workLocation) {
        // For existing officers, only update if a new work location is explicitly provided
        officerData.workLocation = workLocation;
        console.log("Work location updated for existing officer:", workLocation);
      }
      // If editing existing officer and no new work location provided, keep the existing one
      
      console.log("Final work location in officerData:", officerData.workLocation);

      let finalOfficerData = officerData;
      
      if (editingOfficer) {
        const key = `employees_${editingOfficer.id}`;
        console.log("Updating existing officer, key:", key, "officerData:", officerData);
        
        // Preserve critical fields that identify the employee
        finalOfficerData = {
          ...officerData,
          id: editingOfficer.id, // Preserve the original ID
          deviceId: editingOfficer.deviceId, // Preserve device ID
          registrationType: editingOfficer.registrationType, // Preserve registration type
          registeredBy: editingOfficer.registeredBy, // Preserve who registered them
          registrationDate: editingOfficer.registrationDate, // Preserve registration date
          createdAt: editingOfficer.createdAt, // Preserve creation date
          updatedAt: new Date().toISOString() // Update the updated timestamp
        };
        
        const result = await hybridDataService.updateData(key, editingOfficer.id, finalOfficerData, "employees");
        console.log("Updated existing officer, result:", result);
      } else {
        console.log("Saving new officer, officerData:", officerData);
        await hybridDataService.saveData(officerData, "employees");
      }

      setCustomToast({
        type: 'success',
        title: 'Success',
        message: editingOfficer ? 'Officer updated successfully' : 'Officer added successfully'
      });
      setTimeout(() => {
        setCustomToast(null);
        if (onSuccess) {
          onSuccess(finalOfficerData);
        }
        onClose();
      }, 2000);
      console.log("Officer saved successfully");
    } catch (error) {
      console.error("Error in onSubmit:", error);
      setCustomToast({
        type: 'error',
        title: 'Error',
        message: formatErrorMessage(error)
      });
      setTimeout(() => setCustomToast(null), 4000);
    } finally {
      setLoading(false);
      console.log("onSubmit finished, loading set to false");
    }
  };

   const renderBasicInfoTab = () => (
    <View style={styles.tabContent}>
      <InputField
        label="Badge Number"
        value={form.badgeNumber}
        onChangeText={(text) => updateForm("badgeNumber", text)}
        placeholder="Enter official badge number"
        required
        error={errors.badgeNumber}
      />

      <InputField
        label="Full Name"
        value={form.fullName}
        onChangeText={(text) => updateForm("fullName", text)}
        placeholder="Enter officer's full legal name"
        required
        error={errors.fullName}
      />

      <InputField
        label="Father's Name"
        value={form.fatherName}
        onChangeText={(text) => updateForm("fatherName", text)}
        placeholder="Enter father's name for background checks"
      />

      <InputField
        label="CNIC"
        value={form.cnic}
        onChangeText={(text) => updateForm("cnic", text)}
        placeholder="Enter CNIC number (00000-0000000-0)"
        error={errors.cnic}
      />

      <DatePickerField
        label="Date of Birth"
        value={form.dateOfBirth}
        onChange={(date) => updateForm("dateOfBirth", date)}
        placeholder="Select date of birth"
        required
        error={errors.dateOfBirth}
      />

      {/* Gender */}
      <SelectDropdown
        label="Gender"
        selectedValue={form.gender}
        onValueChange={(value) => updateForm("gender", value)}
        options={GENDER_OPTIONS}
        error={errors.gender}
        required
      />

      {/* Department */}
      <SelectDropdown
        label="Department"
        selectedValue={form.department}
        onValueChange={(value) => updateForm("department", value)}
        options={dropdownOptions.departments}
        fieldName="departments"
        fieldLabel="Department"
        onOptionRemoved={(removedOption) => handleOptionRemoved(removedOption, 'departments')}
        onOptionAdded={(newOption) => handleOptionAdded(newOption, 'departments')}
        showAddNewOption={true}
        showRemoveOption={true}
        error={errors.department}
      />
  
      {/* Rank */}
      <SelectDropdown
        label="Rank"
        selectedValue={form.rank}
        onValueChange={(value) => updateForm("rank", value)}
        options={dropdownOptions.ranks}
        fieldName="ranks"
        fieldLabel="Rank"
        onOptionRemoved={(removedOption) => handleOptionRemoved(removedOption, 'ranks')}
        onOptionAdded={(newOption) => handleOptionAdded(newOption, 'ranks')}
        showAddNewOption={true}
        showRemoveOption={true}
        error={errors.rank}
      />

      <InputField
        label="Posting Station"
        value={form.postingStation}
        onChangeText={(text) => updateForm("postingStation", text)}
        placeholder="Enter current police station or region"
      />

      <InputField
        label="Shift"
        value={form.shift}
        onChangeText={(value) => updateForm("shift", value)}
        placeholder="e.g., Morning Shift (6 AM - 2 PM)"
        error={errors.shift}
      />
  
      {/* Employment Status */}
      <SelectDropdown
        label="Employment Status"
        selectedValue={form.status}
        onValueChange={(value) => updateForm("status", value)}
        options={dropdownOptions.employment_status}
        fieldName="employment_status"
        fieldLabel="Employment Status"
        onOptionAdded={(newOption) =>
          handleOptionAdded(newOption, "employment_status")
        }
        onOptionRemoved={(removed) =>
          handleOptionRemoved(removed, "employment_status")
        }
        showAddNewOption={true}
        showRemoveOption={true}
        error={errors.status}
        required
      />
    </View>
  );

  const renderContactTab = () => (
    <View style={styles.tabContent}>
      <InputField 
        label="Contact Number (+92)" 
        value={form.contactNumber} 
        onChangeText={(text) => updateForm("contactNumber", text)} 
        placeholder="Enter phone number (e.g., 3001234567)" 
        keyboardType="phone-pad"
        required 
        error={errors.contactNumber} 
      />
      <InputField label="Email" value={form.email} onChangeText={(text) => updateForm("email", text)} 
        placeholder="Enter official/internal email" keyboardType="email-address" error={errors.email} />
      <InputField label="Address" value={form.address} onChangeText={(text) => updateForm("address", text)} 
        placeholder="Enter residential address" multiline numberOfLines={3} error={errors.address} />
      <DatePickerField label="Joining Date" value={form.joiningDate} onChange={(date) => updateForm("joiningDate", date)} 
        placeholder="Select date of entry into force" required error={errors.joiningDate} />
      <InputField label="Service Years (Auto-calculated)" disabled value={form.serviceYears} onChangeText={(text) => updateForm("serviceYears", text)} 
        placeholder="Automatically calculated from joining date" keyboardType="numeric" editable={false} />
      <DatePickerField label="Last Promotion Date" value={form.lastPromotionDate} onChange={(date) => updateForm("lastPromotionDate", date)} 
        placeholder="Select last promotion date" error={errors.lastPromotionDate} />
    </View>
  );

  const renderProfessionalTab = () => (
    <View style={styles.tabContent}>
      <InputField label="Weapon License Number" value={form.weaponLicenseNumber} onChangeText={(text) => updateForm("weaponLicenseNumber", text)} 
        placeholder="Enter weapon license number" />
      <InputField label="Driving License Number" value={form.drivingLicenseNumber} onChangeText={(text) => updateForm("drivingLicenseNumber", text)} 
        placeholder="Enter driving license number" />
      <InputField label="Training Certifications" value={form.trainingCertifications} onChangeText={(text) => updateForm("trainingCertifications", text)} 
        placeholder="Enter training certifications" multiline numberOfLines={2} />
      <InputField label="Vehicle Assigned" value={form.vehicleAssigned} onChangeText={(text) => updateForm("vehicleAssigned", text)} 
        placeholder="Enter assigned vehicle details" />
      <InputField label="Equipment Assigned" value={form.equipmentAssigned} onChangeText={(text) => updateForm("equipmentAssigned", text)} 
        placeholder="Enter assigned equipment" />
      <SelectDropdown
        label="Supervisor"
        selectedValue={form.supervisor}
        onValueChange={(value) => updateForm("supervisor", value)}
        options={[{ label: "No Supervisor", value: "" }, ...supervisorOptions]}
        placeholder="Select supervisor (excludes current employee)" 
        showRemoveOption={false} 
      />
      <InputField label="Work Location" value={form.workLocation} onChangeText={(text) => updateForm("workLocation", text)} 
        placeholder="Enter work location/beat" />
    </View>
  );

  const renderPayrollTab = () => {
    return (
    <View style={styles.tabContent}>
       
        <SelectDropdown
          label="Payment Type"
          selectedValue={form.paymentType}
          onValueChange={(value) => updateForm("paymentType", value)}
          options={PAYMENT_TYPE_OPTIONS}
          error={errors.paymentType}
          showAddNewOption={false}
          showRemoveOption={false}
        />

     
      <InputField
        label={`${form.paymentType === 'hourly' ? 'Hourly' : form.paymentType === 'daily' ? 'Daily' : 'Monthly'} Rate *`}
        value={form.salary}
        onChangeText={(text) => updateForm("salary", text)}
        placeholder={`Enter ${form.paymentType} rate`}
        keyboardType="numeric"
        error={errors.salary}
      />

      {/* Working Days Configuration */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Working Days Configuration</Text>
      </View>

      <View style={styles.workingDaysContainer}>
        <Text style={styles.fieldLabel}>Working Days *</Text>
        <View style={styles.workingDaysGrid}>
          {DAYS_OF_WEEK.map((day) => (
            <TouchableOpacity
              key={day.value}
              style={[
                styles.dayButton,
                form.workingDays && form.workingDays.includes(day.value) && styles.selectedDayButton
              ]}
              onPress={() => {
                const currentDays = form.workingDays || [];
                const updatedDays = currentDays.includes(day.value)
                  ? currentDays.filter(d => d !== day.value)
                  : [...currentDays, day.value];
                updateForm("workingDays", updatedDays);
              }}
            >
              <Text style={[
                styles.dayButtonText,
                form.workingDays && form.workingDays.includes(day.value) && styles.selectedDayButtonText
              ]}>
                {day.label.slice(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

 
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Working Hours Configuration</Text>
      </View>

      <InputField
        label="Check-in Time" 
        value={form.checkInTime} 
        onChangeText={(text) => updateForm("checkInTime", text)} 
        placeholder="HH:MM (e.g., 09:00)" 
        error={errors.checkInTime}
      />

      <InputField
        label="Check-out Time" 
        value={form.checkOutTime} 
        onChangeText={(text) => updateForm("checkOutTime", text)} 
        placeholder="HH:MM (e.g., 17:00)" 
        error={errors.checkOutTime}
      />

      {/* Overtime Configuration */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Overtime Configuration</Text>
      </View>

      <InputField
        label="Overtime Rate Multiplier" 
        value={form.overtimeRate} 
        onChangeText={(text) => updateForm("overtimeRate", text)} 
        placeholder="e.g., 1.5 for 1.5x regular rate" 
        keyboardType="numeric" 
        error={errors.overtimeRate}
      />

      {/* Bonus Configuration */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Bonus Configuration</Text>
      </View>

      <InputField
        label="Bonus Amount" 
        value={form.bonus} 
        onChangeText={(text) => updateForm("bonus", text)} 
        placeholder="Enter bonus amount to add to total pay" 
        keyboardType="numeric" 
      />


    </View>
  );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Custom Toast Container - Absolutely positioned */}
        {customToast && (
          <View style={[
            styles.customToastContainer,
            customToast.type === 'error' ? styles.errorToast : styles.successToast
          ]}>
            <Ionicons 
              name={customToast.type === 'error' ? 'alert-circle' : 'checkmark-circle'} 
              size={20} 
              color="#fff" 
            />
            <View style={styles.toastContent}>
              <Text style={styles.toastTitle}>{customToast.title}</Text>
              <Text style={styles.toastMessage}>{customToast.message}</Text>
            </View>
          </View>
        )}
        
        <View style={styles.modalContent}>
          <LinearGradient colors={["#007AFF", "#0056CC"]} style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {editingOfficer ? "Edit Officer" : "Add New Officer"}
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.tabContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContainer}>
              {[
                { key: "basic", icon: "person", label: "Basic Info" },
                { key: "contact", icon: "call", label: "Contact" },
                { key: "professional", icon: "shield", label: "Professional" },
                { key: "payroll", icon: "cash", label: "Payroll" }
              ].map(tab => (
                <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.activeTab]} 
                  onPress={() => setActiveTab(tab.key)}>
                  <Ionicons name={tab.icon} size={16} color={activeTab === tab.key ? "#007AFF" : "#8E8E93"} />
                  <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
              </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" 
            keyboardDismissMode="none" contentContainerStyle={styles.scrollViewContent}>
            {activeTab === "basic" && renderBasicInfoTab()}
            {activeTab === "contact" && renderContactTab()}
            {activeTab === "professional" && renderProfessionalTab()}
            {activeTab === "payroll" && renderPayrollTab()}
          </ScrollView>

          <View style={styles.submitContainer}>
            <TouchableOpacity style={styles.submitButton} onPress={onSubmit} disabled={loading}>
              <LinearGradient colors={["#007AFF", "#0056CC"]} style={styles.submitGradient}>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>
                  {loading ? "Saving..." : editingOfficer ? "Update Officer" : "Add Oficer"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#f8f9fa",
    zIndex: 1000,
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sampleDataButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  sampleDataButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  clearFormButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 59, 48, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.3)",
  },
  clearFormButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  tabScrollContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    minWidth: 100,
  },
  activeTab: {
    backgroundColor: "#F2F8FF",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#8E8E93",
    marginLeft: 4,
  },
  activeTabText: {
    color: "#007AFF",
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  workingDaysContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  workingDaysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#F9F9F9",
    minWidth: 60,
    alignItems: "center",
  },
  selectedDayButton: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#8E8E93",
  },
  selectedDayButtonText: {
    color: "#fff",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  tabContent: {
    gap: 16,
  },
  submitContainer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  submitButton: {
    borderRadius: 12,
    boxShadowColor: "#007AFF",
    boxShadowOffset: { width: 0, height: 4 },
    boxShadowOpacity: 0.3,
    boxShadowRadius: 8,
    elevation: 6,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#e2e8f0",
    padding: 2,
  },
  switchActive: {
    backgroundColor: "#3b82f6",
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  // Section title styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  // Modal Toast Styles
  modalToastContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  modalToast: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    boxShadowColor: "#000",
    boxShadowOffset: { width: 0, height: 4 },
    boxShadowOpacity: 0.3,
    boxShadowRadius: 8,
    elevation: 8,
  },
  modalToastError: {
    backgroundColor: "#FF3B30",
  },
  modalToastSuccess: {
    backgroundColor: "#34C759",
  },
  modalToastContent: {
    flex: 1,
    marginLeft: 12,
  },
  modalToastTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  modalToastMessage: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  // Custom toast styles
  customToastContainer: {
    position: 'absolute',
    top: 60, // Position below status bar
    left: 20,
    right: 20,
    zIndex: 9999, // Very high z-index to appear above everything
    elevation: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 4 },
    boxShadowOpacity: 0.15,
    boxShadowRadius: 8,
  },
  errorToast: {
    backgroundColor: '#ef4444',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  successToast: {
    backgroundColor: '#22c55e',
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  toastContent: {
    flex: 1,
    marginLeft: 12,
  },
  toastTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  toastMessage: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.95,
    lineHeight: 20,
  },
  testButton: {
    backgroundColor: '#4CAF50', // A green color for testing
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddOfficerModal;
