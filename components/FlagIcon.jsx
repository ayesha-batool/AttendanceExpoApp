import React from 'react';
import { StyleSheet, View } from 'react-native';

const FlagIcon = ({ countryCode, size = 24 }) => {
  // Simple flag colors based on country codes
  const getFlagColors = (code) => {
    const flagColors = {
      'US': ['#B22234', '#FFFFFF', '#3C3B6E'], // Red, White, Blue
      'GB': ['#012169', '#FFFFFF', '#C8102E'], // Blue, White, Red
      'IN': ['#FF9933', '#FFFFFF', '#138808'], // Orange, White, Green
      'PK': ['#01411C', '#FFFFFF', '#01411C'], // Green, White, Green
      'AU': ['#012169', '#FFFFFF', '#C8102E'], // Blue, White, Red
      'DE': ['#000000', '#DD0000', '#FFCE00'], // Black, Red, Gold
      'FR': ['#002395', '#FFFFFF', '#ED2939'], // Blue, White, Red
      'JP': ['#FFFFFF', '#BC002D'], // White, Red
      'CN': ['#DE2910', '#FFDE00'], // Red, Yellow
      'BR': ['#009C3B', '#FFDF00', '#002776'], // Green, Yellow, Blue
      'MX': ['#006847', '#FFFFFF', '#CE1126'], // Green, White, Red
      'ES': ['#AA151B', '#F1BF00'], // Red, Yellow
      'IT': ['#009246', '#FFFFFF', '#CE2B37'], // Green, White, Red
      'NL': ['#AE1C28', '#FFFFFF', '#21468B'], // Red, White, Blue
      'SE': ['#006AA7', '#FECC00'], // Blue, Yellow
      'NO': ['#EF2B2D', '#FFFFFF', '#002868'], // Red, White, Blue
      'DK': ['#C8102E', '#FFFFFF'], // Red, White
      'FI': ['#FFFFFF', '#003580'], // White, Blue
      'CH': ['#FF0000', '#FFFFFF'], // Red, White
      'AT': ['#ED2939', '#FFFFFF'], // Red, White
      'BE': ['#000000', '#FDDA24', '#AE1C28'], // Black, Yellow, Red
      'IE': ['#169B62', '#FFFFFF', '#FF883E'], // Green, White, Orange
      'PT': ['#006600', '#FF0000'], // Green, Red
      'GR': ['#0D5EAF', '#FFFFFF'], // Blue, White
      'PL': ['#FFFFFF', '#DC143C'], // White, Red
      'CZ': ['#FFFFFF', '#D7141A'], // White, Red
      'HU': ['#CE1126', '#FFFFFF', '#008751'], // Red, White, Green
      'SK': ['#FFFFFF', '#0B4EA2', '#EE1C25'], // White, Blue, Red
      'SI': ['#FFFFFF', '#005DA4', '#FF0000'], // White, Blue, Red
      'HR': ['#FF0000', '#FFFFFF', '#0093DD'], // Red, White, Blue
      'BG': ['#FFFFFF', '#00966E', '#D62612'], // White, Green, Red
      'RO': ['#002B7F', '#FCD116', '#CE1126'], // Blue, Yellow, Red
      'EE': ['#4891D9', '#000000', '#FFFFFF'], // Blue, Black, White
      'LV': ['#9E3039', '#FFFFFF'], // Red, White
      'LT': ['#FDB913', '#006A44', '#C1272D'], // Yellow, Green, Red
      'LU': ['#ED2939', '#FFFFFF', '#00A1DE'], // Red, White, Blue
      'MT': ['#FFFFFF', '#CF142B'], // White, Red
      'CY': ['#FFFFFF', '#D57800'], // White, Orange
      'IS': ['#02529C', '#FFFFFF', '#DC1E35'], // Blue, White, Red
      'LI': ['#FF0000', '#FFD700'], // Red, Gold
      'MC': ['#FFFFFF', '#CE1126'], // White, Red
      'SM': ['#FFFFFF', '#5C8C3B'], // White, Green
      'VA': ['#FFFFFF', '#FFD700'], // White, Gold
      'AD': ['#FF0000', '#FFD700', '#0000FF'], // Red, Gold, Blue
      'AL': ['#E41E20', '#000000'], // Red, Black
      'AM': ['#D90012', '#0033A0', '#F2A800'], // Red, Blue, Orange
      'AZ': ['#3F9C35', '#ED2939', '#00B9E4'], // Green, Red, Blue
      'BY': ['#FF0000', '#FFFFFF', '#0066CC'], // Red, White, Blue
      'BA': ['#002395', '#FFFFFF', '#FF0000'], // Blue, White, Red
      'GE': ['#FF0000', '#FFFFFF'], // Red, White
      'KZ': ['#00AFCA', '#FFEF00'], // Blue, Yellow
      'KG': ['#FF0000', '#FFD700'], // Red, Gold
      'MD': ['#00319C', '#FFD700', '#FF0000'], // Blue, Gold, Red
      'ME': ['#C40308', '#D4AF37'], // Red, Gold
      'MK': ['#FF0000', '#FFD700'], // Red, Gold
      'RU': ['#FFFFFF', '#0039A6', '#D52B1E'], // White, Blue, Red
      'RS': ['#C6363C', '#FFFFFF', '#0C4076'], // Red, White, Blue
      'TJ': ['#FFFFFF', '#CC0000', '#0066CC'], // White, Red, Blue
      'TM': ['#00843D', '#FFD700', '#FF0000'], // Green, Gold, Red
      'UA': ['#005BBB', '#FFD700'], // Blue, Gold
      'UZ': ['#1EB53A', '#FFFFFF', '#CE1126'], // Green, White, Red
    };
    
    return flagColors[code] || ['#CCCCCC', '#FFFFFF']; // Default gray and white
  };

  const colors = getFlagColors(countryCode);
  
  // Create a simple flag design with horizontal stripes
  return (
    <View style={[styles.flag, { width: size, height: size * 0.6 }]}>
      {colors.map((color, index) => (
        <View
          key={index}
          style={[
            styles.stripe,
            {
              backgroundColor: color,
              height: (size * 0.6) / colors.length,
            }
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  flag: {
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  stripe: {
    width: '100%',
  },
});

export default FlagIcon; 