// Validation utility for all modals
export const VALIDATION_RULES = {
  // Text validations
  required: (value, fieldName) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  minLength: (value, fieldName, min) => {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters long`;
    }
    return null;
  },

  maxLength: (value, fieldName, max) => {
    if (value && value.length > max) {
      return `${fieldName} must be no more than ${max} characters long`;
    }
    return null;
  },

  // Email validation
  email: (value, fieldName) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return `${fieldName} must be a valid email address`;
    }
    return null;
  },

  // Phone validation
  phone: (value, fieldName) => {
    if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/\s/g, ''))) {
      return `${fieldName} must be a valid phone number`;
    }
    return null;
  },

  // CNIC validation (Pakistani format)
  cnic: (value, fieldName) => {
    if (value && !/^\d{5}-\d{7}-\d{1}$/.test(value)) {
      return `${fieldName} must be in format: 00000-0000000-0`;
    }
    return null;
  },

  // Number validations
  number: (value, fieldName) => {
    if (value && isNaN(parseFloat(value))) {
      return `${fieldName} must be a valid number`;
    }
    return null;
  },

  positiveNumber: (value, fieldName) => {
    if (value && (isNaN(parseFloat(value)) || parseFloat(value) <= 0)) {
      return `${fieldName} must be a positive number`;
    }
    return null;
  },

  // Date validations
  date: (value, fieldName) => {
    if (value && isNaN(Date.parse(value))) {
      return `${fieldName} must be a valid date`;
    }
    return null;
  },

  futureDate: (value, fieldName) => {
    if (value && new Date(value) <= new Date()) {
      return `${fieldName} must be a future date`;
    }
    return null;
  },

  pastDate: (value, fieldName) => {
    if (value && new Date(value) >= new Date()) {
      return `${fieldName} must be a past date`;
    }
    return null;
  },

  // URL validation
  url: (value, fieldName) => {
    if (value && !/^https?:\/\/.+/.test(value)) {
      return `${fieldName} must be a valid URL`;
    }
    return null;
  },

  // Custom validation
  custom: (value, fieldName, validator) => {
    return validator(value, fieldName);
  }
};

// Validation schemas for different forms
export const VALIDATION_SCHEMAS = {
  // Officer/Employee validation schema
  officer: {
    badgeNumber: [
      (value) => VALIDATION_RULES.required(value, 'Badge Number'),
      (value) => VALIDATION_RULES.minLength(value, 'Badge Number', 3),
      (value) => VALIDATION_RULES.maxLength(value, 'Badge Number', 20)
    ],
    fullName: [
      (value) => VALIDATION_RULES.required(value, 'Full Name'),
      (value) => VALIDATION_RULES.minLength(value, 'Full Name', 2),
      (value) => VALIDATION_RULES.maxLength(value, 'Full Name', 100)
    ],
    cnic: [
      (value) => VALIDATION_RULES.required(value, 'CNIC'),
      (value) => VALIDATION_RULES.cnic(value, 'CNIC')
    ],
    contactNumber: [
      (value) => VALIDATION_RULES.required(value, 'Contact Number'),
      (value) => VALIDATION_RULES.phone(value, 'Contact Number')
    ],
    email: [
      (value) => VALIDATION_RULES.email(value, 'Email')
    ],
    address: [
      (value) => VALIDATION_RULES.required(value, 'Address'),
      (value) => VALIDATION_RULES.minLength(value, 'Address', 10)
    ],
    department: [
      (value) => VALIDATION_RULES.required(value, 'Department')
    ],
    rank: [
      (value) => VALIDATION_RULES.required(value, 'Rank')
    ],
    shift: [
      (value) => VALIDATION_RULES.required(value, 'Shift')
    ],
    employmentStatus: [
      (value) => VALIDATION_RULES.required(value, 'Employment Status')
    ],
    salary: [
      (value) => VALIDATION_RULES.positiveNumber(value, 'Salary')
    ],
    dateOfBirth: [
      (value) => VALIDATION_RULES.required(value, 'Date of Birth'),
      (value) => VALIDATION_RULES.pastDate(value, 'Date of Birth')
    ],
    joiningDate: [
      (value) => VALIDATION_RULES.required(value, 'Joining Date'),
      (value) => VALIDATION_RULES.pastDate(value, 'Joining Date')
    ]
  },

  // Expense validation schema
  expense: {
    title: [
      (value) => VALIDATION_RULES.required(value, 'Title'),
      (value) => VALIDATION_RULES.minLength(value, 'Title', 3),
      (value) => VALIDATION_RULES.maxLength(value, 'Title', 100)
    ],
    amount: [
      (value) => VALIDATION_RULES.required(value, 'Amount'),
      (value) => VALIDATION_RULES.positiveNumber(value, 'Amount')
    ],
    category: [
      (value) => VALIDATION_RULES.required(value, 'Category')
    ],
    department: [
      (value) => VALIDATION_RULES.required(value, 'Department')
    ],
    date: [
      (value) => VALIDATION_RULES.required(value, 'Date'),
      (value) => VALIDATION_RULES.date(value, 'Date')
    ],
    description: [
      (value) => VALIDATION_RULES.maxLength(value, 'Description', 500)
    ]
  },

  // Business validation schema
  business: {
    name: [
      (value) => VALIDATION_RULES.required(value, 'Business Name'),
      (value) => VALIDATION_RULES.minLength(value, 'Business Name', 2),
      (value) => VALIDATION_RULES.maxLength(value, 'Business Name', 100)
    ],
    contactPerson: [
      (value) => VALIDATION_RULES.required(value, 'Contact Person'),
      (value) => VALIDATION_RULES.minLength(value, 'Contact Person', 2)
    ],
    phone: [
      (value) => VALIDATION_RULES.required(value, 'Phone Number'),
      (value) => VALIDATION_RULES.phone(value, 'Phone Number')
    ],
    email: [
      (value) => VALIDATION_RULES.email(value, 'Email')
    ],
    address: [
      (value) => VALIDATION_RULES.required(value, 'Address'),
      (value) => VALIDATION_RULES.minLength(value, 'Address', 10)
    ]
  },

  // Note validation schema
  note: {
    title: [
      (value) => VALIDATION_RULES.required(value, 'Title'),
      (value) => VALIDATION_RULES.minLength(value, 'Title', 3),
      (value) => VALIDATION_RULES.maxLength(value, 'Title', 100)
    ],
    content: [
      (value) => VALIDATION_RULES.required(value, 'Content'),
      (value) => VALIDATION_RULES.minLength(value, 'Content', 10)
    ],
    priority: [
      (value) => VALIDATION_RULES.required(value, 'Priority')
    ]
  },

  // Attendance validation schema
  attendance: {
    employeeId: [
      (value) => VALIDATION_RULES.required(value, 'Employee')
    ],
    date: [
      (value) => VALIDATION_RULES.required(value, 'Date'),
      (value) => VALIDATION_RULES.date(value, 'Date')
    ],
    checkInTime: [
      (value) => VALIDATION_RULES.required(value, 'Check-in Time')
    ],
    checkOutTime: [
      (value) => VALIDATION_RULES.required(value, 'Check-out Time')
    ]
  }
};

// Main validation function
export const validateField = (value, fieldName, validators) => {
  if (!Array.isArray(validators)) {
    return null;
  }
  
  for (const validator of validators) {
    if (typeof validator !== 'function') {
      continue;
    }
    
    const error = validator(value, fieldName);
    if (error) {
      return error;
    }
  }
  return null;
};

// Validate entire form
export const validateForm = (formData, schema) => {
  const errors = {};
  
  if (!formData || !schema) {
    return {
      isValid: false,
      errors: { general: 'Invalid form data or schema' }
    };
  }
  
  for (const [fieldName, validators] of Object.entries(schema)) {
    if (!Array.isArray(validators)) {
      continue;
    }
    
    const value = formData[fieldName];
    const error = validateField(value, fieldName, validators);
    if (error) {
      errors[fieldName] = error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Custom validators for specific business rules
export const CUSTOM_VALIDATORS = {
  // Check if checkout time is after checkin time
  checkOutAfterCheckIn: (checkInTime, checkOutTime) => {
    if (checkInTime && checkOutTime) {
      const checkIn = new Date(`2000-01-01 ${checkInTime}`);
      const checkOut = new Date(`2000-01-01 ${checkOutTime}`);
      if (checkOut <= checkIn) {
        return 'Check-out time must be after check-in time';
      }
    }
    return null;
  },

  // Validate age (must be 18+ for employment)
  minimumAge: (dateOfBirth, minAge = 18) => {
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < minAge) {
        return `Employee must be at least ${minAge} years old`;
      }
    }
    return null;
  },

  // Validate salary range
  salaryRange: (salary, min = 0, max = 1000000) => {
    if (salary) {
      const numSalary = parseFloat(salary);
      if (numSalary < min) {
        return `Salary must be at least ${min}`;
      }
      if (numSalary > max) {
        return `Salary must be no more than ${max}`;
      }
    }
    return null;
  },

  // Validate expense amount range
  expenseAmountRange: (amount, min = 0, max = 100000) => {
    if (amount) {
      const numAmount = parseFloat(amount);
      if (numAmount < min) {
        return `Amount must be at least ${min}`;
      }
      if (numAmount > max) {
        return `Amount must be no more than ${max}`;
      }
    }
    return null;
  }
};

// Error message formatting
export const formatErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  if (error && error.message) {
    return error.message;
  }
  return 'An unknown error occurred';
};

// Success message formatting
export const formatSuccessMessage = (action, item) => {
  return `${item} ${action} successfully`;
};

// Validation helper for async operations
export const validateAsync = async (validationFn, data) => {
  try {
    return await validationFn(data);
  } catch (error) {
    console.error('Validation error:', error);
    return {
      isValid: false,
      errors: { general: 'Validation failed due to an unexpected error' }
    };
  }
};
