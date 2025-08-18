# Appwrite Collection Schemas

This document provides the complete collection schemas for all data types used in the Shelfie application.

## 📋 EMPLOYEES Collection (ID: `689ca41b00061e94a51f`)

| Attribute Name | Type | Required | Description |
|----------------|------|----------|-------------|
| `badgeNumber` | String | ✅ | Employee badge number |
| `fullName` | String | ✅ | Full name of employee |
| `fatherName` | String | ❌ | Father's name |
| `cnic` | String | ✅ | CNIC number |
| `dateOfBirth` | String | ❌ | Date of birth |
| `gender` | String | ❌ | Gender (Male/Female) |
| `contactNumber` | String | ✅ | Contact phone number |
| `email` | String | ❌ | Email address |
| `address` | String | ❌ | Residential address |
| `joiningDate` | String | ❌ | Date of joining |
| `rank` | String | ❌ | Employee rank |
| `department` | String | ❌ | Department assignment |
| `postingStation` | String | ❌ | Current posting station |
| `shift` | String | ❌ | Work shift |
| `photoUrl` | String | ❌ | Profile photo URL |
| `isArmed` | Boolean | ❌ | Whether employee is armed |
| `bloodGroup` | String | ❌ | Blood group |
| `serviceYears` | String | ❌ | Years of service |
| `performanceRating` | String | ❌ | Performance rating |
| `lastPromotionDate` | String | ❌ | Last promotion date |
| `disciplinaryActions` | String | ❌ | Disciplinary actions history |
| `trainingCertifications` | String | ❌ | Training certifications |
| `salary` | Double | ❌ | Base salary |
| `overtimeRate` | Double | ❌ | Overtime rate per hour |
| `monthlyOvertimeHours` | Double | ❌ | Monthly overtime hours |
| `totalAdvances` | Double | ❌ | Total advances taken |
| `lastAdvanceDate` | String | ❌ | Last advance date |
| `benefits` | String | ❌ | Employee benefits |
| `allowances` | String | ❌ | Employee allowances |
| `status` | String | ❌ | Employment status (active/inactive) |
| `notes` | String | ❌ | Additional notes |
| `weaponLicenseNumber` | String | ❌ | Weapon license number |
| `drivingLicenseNumber` | String | ❌ | Driving license number |
| `equipmentAssigned` | String | ❌ | Assigned equipment |
| `vehicleAssigned` | String | ❌ | Assigned vehicle |
| `workLocation` | String | ❌ | Work location |
| `supervisor` | String | ❌ | Supervisor name |
| `emergencyContact` | String | ❌ | Emergency contact person |
| `emergencyContactPhone` | String | ❌ | Emergency contact phone |
| `dutyShift` | String | ❌ | Duty shift information |
| `education` | String | ❌ | Education level |
| `languages` | String | ❌ | Languages known |
| `maritalStatus` | String | ❌ | Marital status |
| `spouseName` | String | ❌ | Spouse name |
| `children` | String | ❌ | Number of children |
| `medicalConditions` | String | ❌ | Medical conditions |
| `allergies` | String | ❌ | Allergies information |
| `employeeId` | String | ❌ | Unique employee identifier |
| `policeId` | String | ❌ | Police department ID |
| `phone` | String | ❌ | Alternative phone number |
| `dateOfJoining` | String | ❌ | Alternative joining date field |
| `station` | String | ❌ | Police station assignment |
| `postingStation` | String | ❌ | Legacy police station field |
| `createdAt` | String | ✅ | Creation timestamp |
| `updatedAt` | String | ✅ | Last update timestamp |
| `createdBy` | String | ✅ | User who created the record |
| `synced` | Boolean | ❌ | Sync status with Appwrite |

### 📄 Document Fields (Optional)
| Attribute Name | Type | Required | Description |
|----------------|------|----------|-------------|
| `trainingCertificationsDoc` | String | ❌ | Training certificates document URL |
| `weaponLicenseDoc` | String | ❌ | Weapon license document URL |
| `drivingLicenseDoc` | String | ❌ | Driving license document URL |
| `medicalCertificateDoc` | String | ❌ | Medical certificate document URL |
| `performanceEvaluationDoc` | String | ❌ | Performance evaluation document URL |
| `disciplinaryRecordDoc` | String | ❌ | Disciplinary record document URL |
| `educationalCertificateDoc` | String | ❌ | Educational certificates document URL |
| `cnicDocumentDoc` | String | ❌ | CNIC document URL |
| `employmentContractDoc` | String | ❌ | Employment contract document URL |

### 🔄 Legacy Fields (for backward compatibility)
| Attribute Name | Type | Required | Description |
|----------------|------|----------|-------------|
| `employeeId` | String | ❌ | Legacy employee ID |
| `postingStation` | String | ❌ | Legacy police station field |
| `phone` | String | ❌ | Legacy phone field |
| `dateOfJoining` | String | ❌ | Legacy joining date field |

## 📊 EXPENSES Collection

| Attribute Name | Type | Required | Description |
|----------------|------|----------|-------------|
| `title` | String | ✅ | Expense title |
| `amount` | Double | ✅ | Expense amount |
| `category` | String | ✅ | Expense category |
| `date` | String | ✅ | Expense date |
| `description` | String | ❌ | Expense description |
| `receiptUrl` | String | ❌ | Receipt image URL |
| `approvedBy` | String | ❌ | Approval officer |
| `status` | String | ✅ | Status (pending/approved/rejected) |
| `createdAt` | String | ✅ | Creation timestamp |
| `updatedAt` | String | ✅ | Last update timestamp |
| `createdBy` | String | ✅ | User who created the record |
| `synced` | Boolean | ❌ | Sync status with Appwrite |

## 🚨 CASES Collection

| Attribute Name | Type | Required | Description |
|----------------|------|----------|-------------|
| `caseNumber` | String | ✅ | Unique case number |
| `title` | String | ✅ | Case title |
| `description` | String | ❌ | Case description |
| `status` | String | ✅ | Case status |
| `priority` | String | ✅ | Case priority |
| `assignedTo` | String | ❌ | Assigned officer |
| `reportedBy` | String | ✅ | Person who reported |
| `reportedDate` | String | ✅ | Date reported |
| `location` | String | ❌ | Incident location |
| `evidence` | String | ❌ | Evidence description |
| `witnesses` | String | ❌ | Witness information |
| `createdAt` | String | ✅ | Creation timestamp |
| `updatedAt` | String | ✅ | Last update timestamp |
| `createdBy` | String | ✅ | User who created the record |
| `synced` | Boolean | ❌ | Sync status with Appwrite |

## 📅 ATTENDANCE Collection

| Attribute Name | Type | Required | Description |
|----------------|------|----------|-------------|
| `employeeId` | String | ✅ | Employee ID |
| `date` | String | ✅ | Attendance date |
| `checkIn` | String | ❌ | Check-in time |
| `checkOut` | String | ❌ | Check-out time |
| `status` | String | ✅ | Attendance status |
| `notes` | String | ❌ | Additional notes |
| `createdAt` | String | ✅ | Creation timestamp |
| `updatedAt` | String | ✅ | Last update timestamp |
| `createdBy` | String | ✅ | User who created the record |
| `synced` | Boolean | ❌ | Sync status with Appwrite |

## 🏖️ LEAVES Collection

| Attribute Name | Type | Required | Description |
|----------------|------|----------|-------------|
| `employeeId` | String | ✅ | Employee ID |
| `leaveType` | String | ✅ | Type of leave |
| `startDate` | String | ✅ | Leave start date |
| `endDate` | String | ✅ | Leave end date |
| `reason` | String | ❌ | Leave reason |
| `status` | String | ✅ | Leave status |
| `approvedBy` | String | ❌ | Approval officer |
| `createdAt` | String | ✅ | Creation timestamp |
| `updatedAt` | String | ✅ | Last update timestamp |
| `createdBy` | String | ✅ | User who created the record |
| `synced` | Boolean | ❌ | Sync status with Appwrite |

## 🎉 HOLIDAYS Collection

| Attribute Name | Type | Required | Description |
|----------------|------|----------|-------------|
| `title` | String | ✅ | Holiday title |
| `date` | String | ✅ | Holiday date |
| `description` | String | ❌ | Holiday description |
| `type` | String | ✅ | Holiday type |
| `createdAt` | String | ✅ | Creation timestamp |
| `updatedAt` | String | ✅ | Last update timestamp |
| `createdBy` | String | ✅ | User who created the record |
| `synced` | Boolean | ❌ | Sync status with Appwrite |

## ⚙️ CUSTOM_OPTIONS Collection

| Attribute Name | Type | Required | Description |
|----------------|------|----------|-------------|
| `fieldName` | String | ✅ | Field name |
| `fieldLabel` | String | ✅ | Field label |
| `options` | String | ✅ | JSON string of options |
| `createdAt` | String | ✅ | Creation timestamp |
| `updatedAt` | String | ✅ | Last update timestamp |
| `createdBy` | String | ✅ | User who created the record |
| `synced` | Boolean | ❌ | Sync status with Appwrite |

## 💰 ADVANCES Collection

| Attribute Name | Type | Required | Description |
|----------------|------|----------|-------------|
| `employeeId` | String | ✅ | Employee ID |
| `amount` | Double | ✅ | Advance amount |
| `reason` | String | ❌ | Advance reason |
| `status` | String | ✅ | Advance status |
| `approvedBy` | String | ❌ | Approval officer |
| `createdAt` | String | ✅ | Creation timestamp |
| `updatedAt` | String | ✅ | Last update timestamp |
| `createdBy` | String | ✅ | User who created the record |
| `synced` | Boolean | ❌ | Sync status with Appwrite |

## 📊 ATTENDANCE_DATA Collection

| Attribute Name | Type | Required | Description |
|----------------|------|----------|-------------|
| `employeeId` | String | ✅ | Employee ID |
| `month` | String | ✅ | Month (YYYY-MM) |
| `totalDays` | Integer | ✅ | Total working days |
| `presentDays` | Integer | ✅ | Days present |
| `absentDays` | Integer | ✅ | Days absent |
| `lateDays` | Integer | ✅ | Days late |
| `overtimeHours` | Double | ✅ | Total overtime hours |
| `createdAt` | String | ✅ | Creation timestamp |
| `updatedAt` | String | ✅ | Last update timestamp |
| `createdBy` | String | ✅ | User who created the record |
| `synced` | Boolean | ❌ | Sync status with Appwrite |

## 📋 EMPLOYEE_LEAVE_DATA Collection

| Attribute Name | Type | Required | Description |
|----------------|------|----------|-------------|
| `employeeId` | String | ✅ | Employee ID |
| `year` | String | ✅ | Year (YYYY) |
| `leaveType` | String | ✅ | Type of leave |
| `totalDays` | Integer | ✅ | Total days allocated |
| `usedDays` | Integer | ✅ | Days used |
| `remainingDays` | Integer | ✅ | Days remaining |
| `createdAt` | String | ✅ | Creation timestamp |
| `updatedAt` | String | ✅ | Last update timestamp |
| `createdBy` | String | ✅ | User who created the record |
| `synced` | Boolean | ❌ | Sync status with Appwrite |

## 🚀 Setup Instructions

### 1. Create Collections in Appwrite Console

1. Go to your Appwrite Console
2. Navigate to Databases → Your Database
3. Create each collection with the exact ID and attributes listed above
4. Set appropriate permissions for each collection

### 2. Environment Variables

Make sure these environment variables are set in your `.env` file:

```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
EXPO_PUBLIC_APPWRITE_DB_ID=shelfie_database
EXPO_PUBLIC_APPWRITE_BUNDLE_ID=your_bundle_id
```

### 3. Collection IDs

Use these exact collection IDs in your application:

- **Employees**: `689ca41b00061e94a51f`
- **Expenses**: `expenses_collection`
- **Cases**: `cases_collection`
- **Attendance**: `attendance_collection`
- **Leaves**: `leaves_collection`
- **Holidays**: `holidays_collection`
- **Custom Options**: `custom_options_collection`
- **Advances**: `advances_collection`
- **Attendance Data**: `attendance_data_collection`
- **Employee Leave Data**: `employee_leave_data_collection`

### 4. Permissions

Set appropriate permissions for each collection:
- **Read**: Authenticated users
- **Write**: Authenticated users
- **Update**: Authenticated users
- **Delete**: Authenticated users (or restrict as needed)

## 📝 Notes

- All date fields should be stored as ISO strings
- Boolean fields should be true/false values
- Double fields should be numeric values
- String fields can be empty but should not be null
- The `synced` field helps track local vs remote data synchronization
- Document URLs should be stored as strings pointing to Appwrite Storage
