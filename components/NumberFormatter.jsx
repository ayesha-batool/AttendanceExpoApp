import React from 'react';
import { Text } from 'react-native';

const NumberFormatter = ({ value, type = 'currency', style }) => {
  const formatNumber = (num) => {
    if (num === 0) return '0';
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
    return (num / 1000000000000).toFixed(1) + 'T';
  };

  const formatCurrency = (num) => {
    if (num === 0) return '$0';
    if (num < 1000) return '$' + num.toString();
    if (num < 1000000) return '$' + (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return '$' + (num / 1000000).toFixed(1) + 'M';
    if (num < 1000000000000) return '$' + (num / 1000000000).toFixed(1) + 'B';
    return '$' + (num / 1000000000000).toFixed(1) + 'T';
  };

  const formatHours = (num) => {
    if (num === 0) return '0h';
    if (num < 1000) return num.toString() + 'h';
    if (num < 1000000) return (num / 1000).toFixed(1) + 'Kh';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'Mh';
    if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'Bh';
    return (num / 1000000000000).toFixed(1) + 'Th';
  };

  const getFormattedValue = () => {
    const numValue = parseFloat(value) || 0;
    
    // Check if the value exceeds 9999B (9999000000000)
    if (numValue > 9999000000000) {
      return type === 'currency' ? '$9,999B' : '9,999B';
    }
    
    switch (type) {
      case 'currency': return formatCurrency(numValue);
      case 'hours': return formatHours(numValue);
      case 'number': return formatNumber(numValue);
      default: return formatCurrency(numValue);
    }
  };

  return (
    <Text style={style}>
      {getFormattedValue()}
    </Text>
  );
};

export default NumberFormatter; 