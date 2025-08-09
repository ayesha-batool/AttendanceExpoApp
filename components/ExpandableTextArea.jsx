import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const ExpandableTextArea = ({
  text,
  maxLines = 2,
  showButtonThreshold = 20,
  style,
  textStyle,
  buttonStyle,
  buttonTextStyle,
  containerStyle,
  showIcon = true,
  iconSize = 16,
  iconColor = '#007AFF',
  expandedIconColor = '#007AFF',
  collapsedIconColor = '#007AFF',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // If no text or text is too short, just show the text
  if (!text || text.length <= showButtonThreshold) {
    return (
      <View style={[styles.container, containerStyle]}>
        <Text style={[styles.text, textStyle]}>
          {text}
        </Text>
      </View>
    );
  }

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text 
        style={[styles.text, textStyle]} 
        numberOfLines={isExpanded ? undefined : maxLines}
      >
        {text}
      </Text>
      
      <TouchableOpacity 
        style={[styles.seeMoreButton, buttonStyle]}
        onPress={toggleExpansion}
        activeOpacity={0.7}
      >
        {showIcon && (
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={iconSize} 
            color={isExpanded ? expandedIconColor : collapsedIconColor} 
            style={styles.icon}
          />
        )}
        <Text style={[styles.seeMoreText, buttonTextStyle]}>
          {isExpanded ? 'See less' : 'See more'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  text: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  seeMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    marginLeft: 4,
  },
  icon: {
    marginRight: 2,
  },
});

export default ExpandableTextArea; 