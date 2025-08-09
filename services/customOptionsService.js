import AsyncStorage from '@react-native-async-storage/async-storage';

// Default options for different fields
const DEFAULT_OPTIONS = {
  stations: [
    'Central Police Station',
    'North Police Station',
    'South Police Station',
    'East Police Station',
    'West Police Station'
  ],
  ranks: [
    'Constable',
    'Head Constable', 
    'ASI',
    'SI',
    'Inspector'
  ],
  shifts: [
    'Morning (6 AM - 2 PM)',
    'Evening (2 PM - 10 PM)',
    'Night (10 PM - 6 AM)'
  ],
  banks: [
    'HBL',
    'UBL',
    'MCB',
    'ABL',
    'JS Bank',
    'Bank Alfalah',
    'Askari Bank',
    'Soneri Bank',
    'Bank of Punjab',
    'Faysal Bank'
  ],
  vehicleTypes: [
    'Sedan',
    'SUV',
    'Pickup',
    'Van',
    'Motorcycle',
    'Bus',
    'Truck'
  ],
  expenseCategories: [
    'Equipment & Gear',
    'Vehicle Maintenance',
    'Training & Education',
    'Office Supplies',
    'Technology & IT',
    'Uniforms & Clothing',
    'Medical & Health',
    'Travel & Transport',
    'Food & Catering',
    'Utilities & Rent',
    'Legal & Compliance',
    'Emergency Response',
    'Investigation Tools',
    'Communication Devices'
  ],
  caseCategories: [
    'Theft',
    'Assault',
    'Fraud',
    'Drug Related',
    'Traffic Violation',
    'Domestic Violence',
    'Property Crime',
    'White Collar Crime',
    'Organized Crime',
    'Cyber Crime'
  ]
};

// Storage keys for different option types
const STORAGE_KEYS = {
  stations: 'custom_stations',
  ranks: 'custom_ranks',
  shifts: 'custom_shifts',
  banks: 'custom_banks',
  vehicleTypes: 'custom_vehicle_types',
  expenseCategories: 'custom_expense_categories',
  caseCategories: 'custom_case_categories'
};

class CustomOptionsService {
  // Load custom options for a specific field type
  static async loadCustomOptions(fieldType) {
    try {
      const storageKey = STORAGE_KEYS[fieldType];
      if (!storageKey) {
        console.error(`Unknown field type: ${fieldType}`);
        return [];
      }

      const savedOptions = await AsyncStorage.getItem(storageKey);
      if (savedOptions) {
        return JSON.parse(savedOptions);
      }
      return [];
    } catch (error) {
      console.error(`Error loading custom options for ${fieldType}:`, error);
      return [];
    }
  }

  // Save custom options for a specific field type
  static async saveCustomOptions(fieldType, options) {
    try {
      const storageKey = STORAGE_KEYS[fieldType];
      if (!storageKey) {
        console.error(`Unknown field type: ${fieldType}`);
        return false;
      }

      await AsyncStorage.setItem(storageKey, JSON.stringify(options));
      return true;
    } catch (error) {
      console.error(`Error saving custom options for ${fieldType}:`, error);
      return false;
    }
  }

  // Add a new custom option
  static async addCustomOption(fieldType, newOption) {
    try {
      const existingOptions = await this.loadCustomOptions(fieldType);
      
      // Check if option already exists
      if (existingOptions.includes(newOption)) {
        return { success: false, message: 'Option already exists' };
      }

      // Add new option
      const updatedOptions = [...existingOptions, newOption];
      const success = await this.saveCustomOptions(fieldType, updatedOptions);
      
      return { 
        success, 
        message: success ? 'Option added successfully' : 'Failed to add option',
        options: updatedOptions
      };
    } catch (error) {
      console.error(`Error adding custom option for ${fieldType}:`, error);
      return { success: false, message: 'Error adding option' };
    }
  }

  // Remove a custom option
  static async removeCustomOption(fieldType, optionToRemove) {
    try {
      const existingOptions = await this.loadCustomOptions(fieldType);
      const updatedOptions = existingOptions.filter(option => option !== optionToRemove);
      
      const success = await this.saveCustomOptions(fieldType, updatedOptions);
      
      return { 
        success, 
        message: success ? 'Option removed successfully' : 'Failed to remove option',
        options: updatedOptions
      };
    } catch (error) {
      console.error(`Error removing custom option for ${fieldType}:`, error);
      return { success: false, message: 'Error removing option' };
    }
  }

  // Get all options (default + custom) for a field type
  static async getAllOptions(fieldType) {
    try {
      const defaultOptions = DEFAULT_OPTIONS[fieldType] || [];
      const customOptions = await this.loadCustomOptions(fieldType);
      
      // Combine default and custom options, removing duplicates
      const allOptions = [...defaultOptions];
      customOptions.forEach(option => {
        if (!allOptions.includes(option)) {
          allOptions.push(option);
        }
      });
      
      return allOptions;
    } catch (error) {
      console.error(`Error getting all options for ${fieldType}:`, error);
      return DEFAULT_OPTIONS[fieldType] || [];
    }
  }

  // Get options with "Add New" option included
  static async getOptionsWithAddNew(fieldType) {
    try {
      const allOptions = await this.getAllOptions(fieldType);
      return [...allOptions, 'Add New'];
    } catch (error) {
      console.error(`Error getting options with Add New for ${fieldType}:`, error);
      return [...(DEFAULT_OPTIONS[fieldType] || []), 'Add New'];
    }
  }

  // Clear all custom options for a field type
  static async clearCustomOptions(fieldType) {
    try {
      const storageKey = STORAGE_KEYS[fieldType];
      if (!storageKey) {
        console.error(`Unknown field type: ${fieldType}`);
        return false;
      }

      await AsyncStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error(`Error clearing custom options for ${fieldType}:`, error);
      return false;
    }
  }

  // Get all custom options across all field types
  static async getAllCustomOptions() {
    try {
      const allCustomOptions = {};
      
      for (const fieldType of Object.keys(STORAGE_KEYS)) {
        allCustomOptions[fieldType] = await this.loadCustomOptions(fieldType);
      }
      
      return allCustomOptions;
    } catch (error) {
      console.error('Error getting all custom options:', error);
      return {};
    }
  }

  // Export custom options (for backup purposes)
  static async exportCustomOptions() {
    try {
      const allCustomOptions = await this.getAllCustomOptions();
      return {
        timestamp: new Date().toISOString(),
        version: '1.0',
        customOptions: allCustomOptions
      };
    } catch (error) {
      console.error('Error exporting custom options:', error);
      return null;
    }
  }

  // Import custom options (for restore purposes)
  static async importCustomOptions(exportData) {
    try {
      if (!exportData || !exportData.customOptions) {
        return { success: false, message: 'Invalid export data' };
      }

      let successCount = 0;
      const totalFields = Object.keys(exportData.customOptions).length;

      for (const [fieldType, options] of Object.entries(exportData.customOptions)) {
        if (STORAGE_KEYS[fieldType]) {
          const success = await this.saveCustomOptions(fieldType, options);
          if (success) successCount++;
        }
      }

      return {
        success: successCount === totalFields,
        message: `Imported ${successCount}/${totalFields} field types successfully`
      };
    } catch (error) {
      console.error('Error importing custom options:', error);
      return { success: false, message: 'Error importing options' };
    }
  }
}

export default CustomOptionsService;

// Export the commonly used functions for easier imports
export const getCustomOptions = async () => {
  return await CustomOptionsService.getAllCustomOptions();
};

export const addCustomOption = async (fieldType, newOption) => {
  const result = await CustomOptionsService.addCustomOption(fieldType, newOption);
  return result.success ? newOption : null;
}; 