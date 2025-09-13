import * as Location from 'expo-location';
import { Platform } from 'react-native';

/**
 * Get address from coordinates using reverse geocoding
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<string|null>} - Formatted address string or null if failed
 */
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    // Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      console.warn('Invalid coordinates provided:', { latitude, longitude });
      return null;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      console.warn('Coordinates out of valid range:', { latitude, longitude });
      return null;
    }

    const addressResponse = await Location.reverseGeocodeAsync({
      latitude,
      longitude
    });

    if (addressResponse && addressResponse.length > 0) {
      const address = addressResponse[0];
      const addressParts = [];
      
      // Build address string from available components
      if (address.street) addressParts.push(address.street);
      if (address.district) addressParts.push(address.district);
      if (address.city) addressParts.push(address.city);
      if (address.region) addressParts.push(address.region);
      if (address.country) addressParts.push(address.country);
      
      // If we have any address components, return the formatted string
      if (addressParts.length > 0) {
        return addressParts.join(', ');
      }
    }
    
    // Fallback: return coordinates if no address found
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    
  } catch (error) {
    console.error("❌ Error getting address from coordinates:", error);
    
    // Fallback: return coordinates on error
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
};

/**
 * Get high-accuracy current location with multiple readings
 * @returns {Promise<Object>} - Location object with accuracy info
 */
export const getHighAccuracyLocation = async () => {
  try {
    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      const error = new Error('Location permission denied');
      error.code = 'PERMISSION_DENIED';
      throw error;
    }

    // Enable high accuracy location services
    await Location.enableNetworkProviderAsync();
    
    // Adjust accuracy threshold based on platform
    const isWeb = Platform.OS === 'web';
    const minAccuracy = isWeb ? 1000 : 10; // 1km for web, 10m for mobile
    const maxReadings = isWeb ? 2 : 3; // Fewer readings for web
    
    console.log(`🔍 Getting location on ${Platform.OS} platform...`);
    console.log(`📏 Minimum accuracy threshold: ${minAccuracy}m`);
    
    // Get multiple location readings for better accuracy
    const locationReadings = [];
    const maxWaitTime = 30000; // 30 seconds
    
    for (let i = 0; i < maxReadings; i++) {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: isWeb ? Location.Accuracy.Balanced : Location.Accuracy.BestForNavigation,
          timeout: 15000,
          maximumAge: isWeb ? 30000 : 0, // Allow older readings on web
          distanceInterval: isWeb ? 10 : 1, // 10m for web, 1m for mobile
        });
        
        console.log(`📍 Reading ${i + 1}: Lat: ${location.coords.latitude}, Lng: ${location.coords.longitude}, Accuracy: ${location.coords.accuracy}m`);
        
        // Accept readings based on platform-specific accuracy
        if (location.coords.accuracy <= minAccuracy) {
          locationReadings.push(location);
          console.log(`✅ Good accuracy reading: ${location.coords.accuracy}m`);
          
          // For web platform, if we get one decent reading, we can proceed
          if (isWeb && locationReadings.length > 0) {
            break;
          }
        } else {
          console.log(`⚠️ Poor accuracy reading: ${location.coords.accuracy}m (skipping)`);
        }
        
        // Wait a bit before next reading
        if (i < maxReadings - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.warn(`⚠️ Location reading ${i + 1} failed:`, error.message);
        if (i === maxReadings - 1) {
          // Add error code for timeout errors
          if (error.message.includes('timeout')) {
            error.code = 'LOCATION_TIMEOUT';
          }
          throw error;
        }
      }
    }
    
    // If no readings meet accuracy threshold, use the best one available
    if (locationReadings.length === 0) {
      console.log('⚠️ No readings met accuracy threshold, attempting to get any location...');
      
      try {
        const fallbackLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
          timeout: 10000,
          maximumAge: 60000, // Allow 1-minute old readings
        });
        
        console.log(`🔄 Fallback location: Lat: ${fallbackLocation.coords.latitude}, Lng: ${fallbackLocation.coords.longitude}, Accuracy: ${fallbackLocation.coords.accuracy}m`);
        
        // Add accuracy warning to the location object
        fallbackLocation.lowAccuracy = true;
        fallbackLocation.accuracyWarning = `Location accuracy is ${getAccuracyDescription(fallbackLocation.coords.accuracy)} (±${fallbackLocation.coords.accuracy.toFixed(1)}m). This may not be precise enough for exact work location tracking.`;
        
        return fallbackLocation;
        
      } catch (fallbackError) {
        console.error('❌ Fallback location also failed:', fallbackError);
        const error = new Error('Unable to get location. Please check your device GPS and try again.');
        error.code = 'LOCATION_UNAVAILABLE';
        throw error;
      }
    }
    
    // Use the most accurate reading, or average if multiple good readings
    let bestLocation;
    if (locationReadings.length === 1) {
      bestLocation = locationReadings[0];
    } else {
      // Average multiple readings for better accuracy
      const avgLat = locationReadings.reduce((sum, loc) => sum + loc.coords.latitude, 0) / locationReadings.length;
      const avgLng = locationReadings.reduce((sum, loc) => sum + loc.coords.longitude, 0) / locationReadings.length;
      const avgAccuracy = locationReadings.reduce((sum, loc) => sum + loc.coords.accuracy, 0) / locationReadings.length;
      
      bestLocation = {
        ...locationReadings[0],
        coords: {
          ...locationReadings[0].coords,
          latitude: avgLat,
          longitude: avgLng,
          accuracy: avgAccuracy
        }
      };
      
      console.log(`📊 Averaged ${locationReadings.length} readings: Lat: ${avgLat.toFixed(6)}, Lng: ${avgLng.toFixed(6)}, Accuracy: ${avgAccuracy.toFixed(1)}m`);
    }
    
    console.log(`🎯 Final location: Lat: ${bestLocation.coords.latitude.toFixed(6)}, Lng: ${bestLocation.coords.longitude.toFixed(6)}, Accuracy: ${bestLocation.coords.accuracy.toFixed(1)}m`);
    
    return bestLocation;
    
  } catch (error) {
    // Don't log permission denied errors to console to avoid spam
    if (error.code !== 'PERMISSION_DENIED') {
      console.error("❌ Error getting high-accuracy location:", error);
    }
    throw error;
  }
};

/**
 * Get current location with address using high accuracy
 * @returns {Promise<{location: Object, address: string|null}>} - Location object and address
 */
export const getCurrentLocationWithAddress = async () => {
  try {
    const location = await getHighAccuracyLocation();
    
    // Get address from coordinates
    const address = await getAddressFromCoordinates(
      location.coords.latitude,
      location.coords.longitude
    );

    return {
      location,
      address
    };
    
  } catch (error) {
    // Don't log permission denied errors to console to avoid spam
    if (error.code !== 'PERMISSION_DENIED') {
      console.error("❌ Error getting current location with address:", error);
    }
    throw error;
  }
};

/**
 * Format location data for storage
 * @param {Object} location - Location object from expo-location
 * @param {string} address - Address string
 * @returns {string} - Formatted location string for storage
 */
export const formatLocationForStorage = (location, address = null) => {
  const now = new Date().toISOString();
  const coords = `${location.coords.latitude.toFixed(6)},${location.coords.longitude.toFixed(6)}`;
  
  if (address) {
    return `${coords},${now},${address}`;
  }
  
  return `${coords},${now}`;
};

/**
 * Parse stored location data
 * @param {string} locationString - Stored location string
 * @returns {Object} - Parsed location data
 */
export const parseStoredLocation = (locationString) => {
  try {
    const parts = locationString.split(',');
    
    if (parts.length >= 3) {
      const latitude = parseFloat(parts[0]);
      const longitude = parseFloat(parts[1]);
      const timestamp = parts[2];
      const address = parts.length > 3 ? parts.slice(3).join(',') : null;
      
      return {
        latitude,
        longitude,
        timestamp,
        address,
        isValid: !isNaN(latitude) && !isNaN(longitude)
      };
    }
    
    return { isValid: false };
  } catch (error) {
    console.error("❌ Error parsing stored location:", error);
    return { isValid: false };
  }
};

/**
 * Check if location accuracy is acceptable
 * @param {number} accuracy - Location accuracy in meters
 * @returns {boolean} - Whether accuracy is acceptable
 */
export const isLocationAccuracyAcceptable = (accuracy) => {
  const isWeb = Platform.OS === 'web';
  return isWeb ? accuracy <= 1000 : accuracy <= 10; // 1km for web, 10m for mobile
};

/**
 * Get location accuracy description
 * @param {number} accuracy - Location accuracy in meters
 * @returns {string} - Human-readable accuracy description
 */
export const getAccuracyDescription = (accuracy) => {
  if (accuracy <= 3) return "Excellent";
  if (accuracy <= 5) return "Very Good";
  if (accuracy <= 10) return "Good";
  if (accuracy <= 20) return "Fair";
  if (accuracy <= 50) return "Poor";
  if (accuracy <= 100) return "Very Poor";
  if (accuracy <= 500) return "Rough";
  if (accuracy <= 1000) return "Approximate";
  return "Very Approximate";
};

/**
 * Get platform-specific location advice
 * @returns {string} - Advice for the current platform
 */
export const getPlatformLocationAdvice = () => {
  const isWeb = Platform.OS === 'web';
  
  if (isWeb) {
    return "Web browsers have limited GPS accuracy. For best results, use the mobile app on your phone.";
  }
  
  return "Mobile devices provide better GPS accuracy. Ensure GPS is enabled and you're outdoors for best results.";
};

/**
 * Check if location permissions are granted
 * @returns {Promise<{granted: boolean, status: string}>} - Permission status
 */
export const checkLocationPermissions = async () => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return {
      granted: status === 'granted',
      status: status
    };
  } catch (error) {
    console.error("❌ Error checking location permissions:", error);
    return {
      granted: false,
      status: 'unknown'
    };
  }
};

/**
 * Request location permissions with better error handling
 * @returns {Promise<{granted: boolean, status: string}>} - Permission status
 */
export const requestLocationPermissions = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return {
      granted: status === 'granted',
      status: status
    };
  } catch (error) {
    console.error("❌ Error requesting location permissions:", error);
    return {
      granted: false,
      status: 'error'
    };
  }
};
