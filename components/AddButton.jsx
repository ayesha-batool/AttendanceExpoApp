import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const AddButton = ({ onPress, text, icon = "add-circle", colors = ['#667eea', '#764ba2'] }) => {
  return (
    <TouchableOpacity 
      style={styles.addButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={colors}
        style={styles.addButtonGradient}
      >
        <Icon name={icon} size={24} color="#fff" />
        <Text style={styles.addButtonText}>{String(text)}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  addButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    boxShadowColor: '#000',
    boxShadowOffset: { width: 0, height: 4 },
    boxShadowOpacity: 0.15,
    boxShadowRadius: 8,
    elevation: 8,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default AddButton; 